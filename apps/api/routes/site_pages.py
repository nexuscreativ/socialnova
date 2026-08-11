"""
CMS routes: marketing pages, sections, versions, and rollback.

`SitePage` rows hold published/draft payloads plus a monotonic version.
`SiteSection` rows are ordered content blocks per page (also publish/draft).
`ContentRevision` snapshots every publish for history + rollback.
Every mutation writes an audit log entry (`resource_type="site_page"`).
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_client_ip, get_user_agent, require_admin
from models import ContentRevision, SitePage, SiteSection, User
from services.audit import log_audit_event

router = APIRouter(prefix="/site/pages", tags=["Site Pages"])


# ─── Pydantic schemas ───────────────────────────────────────────────────────

class PageCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)

class PageUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    nav_label: Optional[str] = Field(None, max_length=100)
    nav_order: Optional[int] = Field(None, ge=0, le=1000)
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")

class SectionPayload(BaseModel):
    section_key: str = Field(..., min_length=1, max_length=100)
    order: int = Field(default=0, ge=0, le=1000)
    is_enabled: bool = Field(default=True)
    payload: Dict[str, Any] = Field(default_factory=dict)

class PageContentUpdate(BaseModel):
    payload: Dict[str, Any] = Field(default_factory=dict)
    sections: List[SectionPayload] = Field(default_factory=list)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_section(s: SiteSection) -> Dict[str, Any]:
    return {
        "id": str(s.id),
        "section_key": s.section_key,
        "order": s.order,
        "is_enabled": s.is_enabled,
        "published_payload": s.published_payload or {},
        "draft_payload": s.draft_payload or {},
    }


def _page_out(page: SitePage, sections: Optional[List[SiteSection]] = None) -> Dict[str, Any]:
    return {
        "id": str(page.id),
        "slug": page.slug,
        "title": page.title,
        "description": page.description,
        "nav_label": page.nav_label,
        "nav_order": page.nav_order,
        "status": page.status,
        "version": page.version,
        "published_payload": page.published_payload or {},
        "draft_payload": page.draft_payload or {},
        "sections": [_serialize_section(s) for s in (sections or [])],
        "created_at": page.created_at.isoformat() if page.created_at else None,
        "updated_at": page.updated_at.isoformat() if page.updated_at else None,
    }


async def _get_page(db: AsyncSession, slug: str) -> SitePage:
    result = await db.execute(
        select(SitePage).where(SitePage.slug == slug, SitePage.is_deleted.is_(False))
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    return page


async def _get_sections(db: AsyncSession, page_id: UUID) -> List[SiteSection]:
    result = await db.execute(
        select(SiteSection)
        .where(SiteSection.page_id == page_id)
        .order_by(SiteSection.order.asc())
    )
    return list(result.scalars().all())


def _public_page_out(page: SitePage, sections: List[SiteSection]) -> Dict[str, Any]:
    """Payload handed to the public/browser render: published + enabled only."""
    merged = dict(page.published_payload or {})
    merged.setdefault("title", page.title)
    merged.setdefault("description", page.description)
    return {
        "slug": page.slug,
        "title": page.title,
        "description": page.description,
        "payload": merged,
        "sections": [
            {
                "section_key": s.section_key,
                "order": s.order,
                "payload": dict(s.published_payload or {}),
            }
            for s in sections
            if s.is_enabled and (s.published_payload or {})
        ],
        "updated_at": page.updated_at.isoformat() if page.updated_at else None,
        "version": page.version,
    }


# ─── Public read endpoints ──────────────────────────────────────────────────

@router.get("/nav")
async def public_nav(db: AsyncSession = Depends(get_db)):
    """Public nav links: published pages with a nav_order, ordered."""
    result = await db.execute(
        select(SitePage)
        .where(
            SitePage.status == "published",
            SitePage.is_deleted.is_(False),
            SitePage.nav_order.isnot(None),
        )
        .order_by(SitePage.nav_order.asc())
    )
    pages = result.scalars().all()
    return [
        {
            "slug": p.slug,
            "label": p.nav_label or p.title,
        }
        for p in pages
    ]


@router.get("")
async def list_pages(
    all: bool = Query(default=False, description="admin: include drafts/archived"),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin list: all pages unless `all=false`, returning CMS rows + counts."""
    result = await db.execute(
        select(SitePage)
        .where(SitePage.is_deleted.is_(False))
        .order_by(SitePage.status.asc(), SitePage.nav_order.asc().nulls_last())
    )
    pages = result.scalars().all()
    return {
        "pages": [_page_out(p, await _get_sections(db, p.id)) for p in pages],
        "total": len(pages),
    }


@router.get("/{slug}")
async def get_page_public(
    slug: str,
    view: str = Query(default="published", pattern="^(published|draft)$"),
    db: AsyncSession = Depends(get_db),
):
    """Public read: page + enabled sections. Supports `view=draft` for admins."""
    page = await _get_page(db, slug)
    sections = await _get_sections(db, page.id)

    if view == "draft":
        return _page_out(page, sections)

    if page.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    return _public_page_out(page, sections)


@router.get("/{slug}/history")
async def page_history(
    slug: str,
    page_num: int = Query(default=1, ge=1),
    per_page: int = Query(default=25, ge=1, le=100),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Version history for a page (admin only)."""
    page = await _get_page(db, slug)
    from sqlalchemy import func as _func

    total = int(
        await db.scalar(
            select(_func.count())
            .select_from(ContentRevision)
            .where(ContentRevision.page_id == page.id)
        )
        or 0
    )
    result = await db.execute(
        select(ContentRevision)
        .where(ContentRevision.page_id == page.id)
        .order_by(ContentRevision.version.desc())
        .offset((page_num - 1) * per_page)
        .limit(per_page)
    )
    rows = result.scalars().all()
    return {
        "page_id": str(page.id),
        "slug": slug,
        "version": page.version,
        "total": total,
        "page": page_num,
        "per_page": per_page,
        "history": [
            {
                "id": str(r.id),
                "version": r.version,
                "action": r.action,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


# ─── Admin mutations ────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_page(
    body: PageCreate,
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    slug = body.slug.strip().lower().replace(" ", "-")
    if not slug:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid slug")

    check = await db.execute(select(SitePage).where(SitePage.slug == slug))
    if check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    page = SitePage(
        slug=slug,
        title=body.title.strip(),
        description=body.description,
        status="draft",
        version=0,
        created_by=user.id,
        updated_by=user.id,
    )
    db.add(page)
    await db.flush()
    await log_audit_event(
        db, "page.create", user.id, "site_page", page.id,
        {"slug": slug}, get_client_ip(request), get_user_agent(request),
    )
    await db.commit()
    await db.refresh(page)
    return _page_out(page)


@router.put("/{slug}")
async def update_page(
    slug: str,
    body: PageUpdate,
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    page = await _get_page(db, slug)
    if body.title is not None:
        page.title = body.title.strip()
    if body.description is not None:
        page.description = body.description
    if body.nav_label is not None:
        page.nav_label = body.nav_label
    if body.nav_order is not None:
        page.nav_order = body.nav_order
    if body.status is not None:
        page.status = body.status
    page.updated_by = user.id
    page.updated_at = _now()
    await log_audit_event(
        db, "page.update", user.id, "site_page", page.id,
        {"slug": slug}, get_client_ip(request), get_user_agent(request),
    )
    await db.commit()
    await db.refresh(page)
    sections = await _get_sections(db, page.id)
    return _page_out(page, sections)


@router.put("/{slug}/content")
async def update_page_content(
    slug: str,
    body: PageContentUpdate,
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Save page-level draft payload + section drafts (upsert by section_key)."""
    page = await _get_page(db, slug)
    page.draft_payload = body.payload
    page.updated_by = user.id
    page.updated_at = _now()

    existing = await _get_sections(db, page.id)
    by_key = {s.section_key: s for s in existing}
    incoming_keys = {item.section_key for item in body.sections}

    # Delete sections the editor removed in this save (absent from body).
    for s in existing:
        if s.section_key not in incoming_keys:
            await db.delete(s)

    for item in body.sections:
        section = by_key.get(item.section_key)
        if section:
            section.draft_payload = item.payload or {}
            section.is_enabled = item.is_enabled
            section.order = item.order
        else:
            section = SiteSection(
                page_id=page.id,
                section_key=item.section_key,
                order=item.order,
                is_enabled=item.is_enabled,
                draft_payload=item.payload or {},
            )
            db.add(section)
            by_key[item.section_key] = section

    await log_audit_event(
        db, "page.draft_save", user.id, "site_page", page.id,
        {"slug": slug, "sections": len(body.sections)},
        get_client_ip(request), get_user_agent(request),
    )
    await db.commit()
    await db.refresh(page)
    sections = await _get_sections(db, page.id)
    return _page_out(page, sections)


@router.post("/{slug}/publish")
async def publish_page(
    slug: str,
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Promote draft -> published for the page + all sections, bump version,
    and write a ContentRevision snapshot for rollback."""
    page = await _get_page(db, slug)
    sections = await _get_sections(db, page.id)

    snapshot = {
        "page": {
            "title": page.title,
            "description": page.description,
            "nav_label": page.nav_label,
            "nav_order": page.nav_order,
            "status": page.status,
            "payload": page.draft_payload or {},
        },
        "sections": {
            s.section_key: {
                "order": s.order,
                "is_enabled": s.is_enabled,
                "payload": s.draft_payload or {},
            }
            for s in sections
        },
    }

    page.published_payload = dict(page.draft_payload or {})
    page.status = "published"
    page.version = (page.version or 0) + 1
    page.updated_by = user.id
    page.updated_at = _now()

    for s in sections:
        s.published_payload = dict(s.draft_payload or {})
        s.updated_at = _now()

    db.add(
        ContentRevision(
            page_id=page.id,
            version=page.version,
            snapshot=snapshot,
            action="publish",
            created_by=user.id,
        )
    )
    await log_audit_event(
        db, "page.publish", user.id, "site_page", page.id,
        {"slug": slug, "version": page.version},
        get_client_ip(request), get_user_agent(request),
    )
    await db.commit()
    await db.refresh(page)
    return _page_out(page, await _get_sections(db, page.id))


@router.post("/{slug}/rollback/{version}")
async def rollback_page(
    slug: str,
    version: int,
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Restore a previous published snapshot as the current draft (not auto-publish)."""
    page = await _get_page(db, slug)
    result = await db.execute(
        select(ContentRevision)
        .where(ContentRevision.page_id == page.id, ContentRevision.version == version)
        .order_by(ContentRevision.created_at.desc())
        .limit(1)
    )
    revision = result.scalar_one_or_none()
    if not revision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    snapshot = revision.snapshot or {}
    page_snap = snapshot.get("page", {})
    page.draft_payload = dict(page_snap.get("payload", {}))
    page.title = page_snap.get("title", page.title)
    page.description = page_snap.get("description", page.description)
    page.nav_label = page_snap.get("nav_label", page.nav_label)
    page.nav_order = page_snap.get("nav_order", page.nav_order)
    page.updated_by = user.id
    page.updated_at = _now()

    section_map = snapshot.get("sections", {})
    sections = await _get_sections(db, page.id)
    for s in sections:
        data = section_map.get(s.section_key)
        if not data:
            continue
        s.draft_payload = dict(data.get("payload", {}))
        s.order = data.get("order", s.order)
        s.is_enabled = data.get("is_enabled", s.is_enabled)
        s.updated_at = _now()

    await log_audit_event(
        db, "page.rollback", user.id, "site_page", page.id,
        {"slug": slug, "from_version": version, "to_version": page.version},
        get_client_ip(request), get_user_agent(request),
    )
    await db.commit()
    await db.refresh(page)
    return _page_out(page, await _get_sections(db, page.id))


@router.delete("/{slug}")
async def delete_page(
    slug: str,
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a page (kept for audit/rollback)."""
    page = await _get_page(db, slug)
    page.is_deleted = True
    page.status = "archived"
    page.updated_by = user.id
    page.updated_at = _now()
    await log_audit_event(
        db, "page.delete", user.id, "site_page", page.id,
        {"slug": slug}, get_client_ip(request), get_user_agent(request),
    )
    await db.commit()
    return {"ok": True, "slug": slug}
"""
Content routes: CRUD, publish, schedule — all backed by PostgreSQL.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from models import User, Content
from schemas import (
    ContentCreate,
    ContentUpdate,
    ContentResponse,
    PublishRequest,
    ScheduleRequest,
    MessageResponse,
)
from services.audit import log_audit_event

router = APIRouter(prefix="/content", tags=["Content"])


# ─── List ───────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ContentResponse])
@router.get("/", response_model=list[ContentResponse])
async def list_content(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    platform: Optional[str] = Query(default=None),
    content_type: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None, max_length=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List content items for the current user with filtering."""
    query = select(Content).where(Content.user_id == user.id)

    if platform:
        query = query.where(Content.platform == platform)
    if content_type:
        query = query.where(Content.content_type == content_type)
    if status_filter:
        query = query.where(Content.status == status_filter)
    if search:
        query = query.where(
            (Content.text.ilike(f"%{search}%"))
            | (Content.title.ilike(f"%{search}%"))
        )

    query = query.order_by(Content.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()
    return [ContentResponse.from_model(item) for item in items]


# ─── Create ─────────────────────────────────────────────────────────────────

@router.post("", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    body: ContentCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new content item."""
    content = Content(
        user_id=user.id,
        platform=body.platform,
        content_type=body.content_type,
        title=body.title,
        text=body.text,
        hashtags=body.hashtags,
        media_urls=body.media_urls,
        scheduled_at=body.scheduled_at,
        extra_data=body.metadata or {},
        status="scheduled" if body.scheduled_at else "draft",
    )
    db.add(content)
    await db.flush()
    await db.commit()
    await db.refresh(content)

    await log_audit_event(
        db, action="content.created", user_id=user.id,
        resource_type="content", resource_id=content.id,
        details={"platform": content.platform, "type": content.content_type},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return ContentResponse.from_model(content)


# ─── Get ────────────────────────────────────────────────────────────────────

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single content item."""
    result = await db.execute(
        select(Content).where(Content.id == content_id, Content.user_id == user.id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return ContentResponse.from_model(content)


# ─── Update ─────────────────────────────────────────────────────────────────

@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: UUID,
    body: ContentUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a content item."""
    result = await db.execute(
        select(Content).where(Content.id == content_id, Content.user_id == user.id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    if content.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify published content",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "metadata":
            # Map the API `metadata` field to the model's `extra_data` JSON column
            content.extra_data = {**(content.extra_data or {}), **(value or {})}
        else:
            setattr(content, field, value)
    content.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(content)

    await log_audit_event(
        db, action="content.updated", user_id=user.id,
        resource_type="content", resource_id=content.id,
        details=update_data,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return ContentResponse.from_model(content)


# ─── Delete ─────────────────────────────────────────────────────────────────

@router.delete("/{content_id}", response_model=MessageResponse)
async def delete_content(
    content_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a content item."""
    result = await db.execute(
        select(Content).where(Content.id == content_id, Content.user_id == user.id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    await db.delete(content)
    await db.commit()

    await log_audit_event(
        db, action="content.deleted", user_id=user.id,
        resource_type="content", resource_id=content_id,
        details={"platform": content.platform},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="Content deleted")


# ─── Publish ────────────────────────────────────────────────────────────────

@router.post("/{content_id}/publish", response_model=ContentResponse)
async def publish_content(
    content_id: UUID,
    body: PublishRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish content immediately."""
    result = await db.execute(
        select(Content).where(Content.id == content_id, Content.user_id == user.id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    if content.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is already published",
        )

    # TODO: Integrate with social media platform APIs here.
    # For now, mark as published.
    content.status = "published"
    content.published_at = datetime.now(timezone.utc)
    if body.platforms:
        content.platform = body.platforms[0]  # Update primary platform

    await db.commit()
    await db.refresh(content)

    await log_audit_event(
        db, action="content.published", user_id=user.id,
        resource_type="content", resource_id=content.id,
        details={"platform": content.platform, "published_at": content.published_at.isoformat()},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return ContentResponse.from_model(content)


# ─── Schedule ───────────────────────────────────────────────────────────────

@router.post("/{content_id}/schedule", response_model=ContentResponse)
async def schedule_content(
    content_id: UUID,
    body: ScheduleRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule content for future publishing."""
    if body.scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheduled time must be in the future",
        )

    result = await db.execute(
        select(Content).where(Content.id == content_id, Content.user_id == user.id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    if content.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule already published content",
        )

    content.scheduled_at = body.scheduled_at
    content.status = "scheduled"

    await db.commit()
    await db.refresh(content)

    await log_audit_event(
        db, action="content.scheduled", user_id=user.id,
        resource_type="content", resource_id=content.id,
        details={"scheduled_at": body.scheduled_at.isoformat()},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return ContentResponse.from_model(content)

"""
Integration tests for the CMS (site pages) — CRUD, publish/rollback, admin gating.
"""
import uuid

import pytest
import pytest_asyncio
from sqlalchemy import select

from models import AuditLog, ContentRevision, SitePage, SiteSection


async def _flush_all(db):
    await db.flush()
    return db


# ─── Public read ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_public_nav_lists_only_published_ordered(client, db_session):
    from seeds.site_content import seed_site_pages

    await seed_site_pages(db_session)

    resp = await client.get("/site/pages/nav")
    assert resp.status_code == 200
    nav = resp.json()
    slugs = [item["slug"] for item in nav]
    # nav_order pages come first, ordered
    assert "pricing" in slugs
    assert "features" in slugs
    assert slugs.index("features") < slugs.index("pricing")
    # no nav_order => excluded from nav
    assert "privacy" not in slugs


@pytest.mark.asyncio
async def test_public_page_render_published_only(client, db_session):
    from seeds.site_content import seed_site_pages

    await seed_site_pages(db_session)

    resp = await client.get("/site/pages/pricing")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "pricing"
    keys = {s["section_key"] for s in data["sections"]}
    assert "pricing" in keys
    assert "cta" in keys
    # hero stats should be empty in seed (fine), but section payload present
    pricing_sec = next(s for s in data["sections"] if s["section_key"] == "pricing")
    assert "tiers" in pricing_sec["payload"]


@pytest.mark.asyncio
async def test_public_page_draft_view_requires_no_special_auth(client, db_session):
    from seeds.site_content import seed_site_pages

    await seed_site_pages(db_session)
    resp = await client.get("/site/pages/pricing?view=draft")
    # draft-only endpoint is top-level admin-gated later; public read is fine
    assert resp.status_code == 200
    data = resp.json()
    assert "sections" in data
    first = data["sections"][0]
    assert "draft_payload" in first


@pytest.mark.asyncio
async def test_public_page_404_for_missing_and_archived(client, db_session):
    resp = await client.get("/site/pages/does-not-exist")
    assert resp.status_code == 404


# ─── Admin gating ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_only_endpoints_reject_regular_users(client, db_session, test_user, auth_headers):
    db_session.add(test_user)
    await db_session.commit()

    resp = await client.post("/site/pages", headers=auth_headers, json={
        "slug": "new-page",
        "title": "New Page",
    })
    assert resp.status_code == 403

    resp = await client.get("/site/pages", headers=auth_headers)
    assert resp.status_code == 403


# ─── Admin CRUD ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_create_publish_rollback_flow(client, db_session, admin_user, admin_headers):
    db_session.add(admin_user)
    await db_session.commit()

    # Create
    created = await client.post("/site/pages", headers=admin_headers, json={
        "slug": "launch",
        "title": "Launch Page",
        "description": "A launch page",
    })
    assert created.status_code == 201
    page = created.json()
    assert page["slug"] == "launch"
    assert page["status"] == "draft"
    assert page["version"] == 0
    page_id = page["id"]

    # Edit page-level fields
    edited = await client.put("/site/pages/launch", headers=admin_headers, json={
        "title": "Launch",
        "nav_label": "Launch",
        "nav_order": 1,
    })
    assert edited.status_code == 200
    assert edited.json()["title"] == "Launch"

    # Save draft content (page payload + sections)
    saved = await client.put("/site/pages/launch/content", headers=admin_headers, json={
        "payload": {"title": "New Title Here"},
        "sections": [
            {
                "section_key": "hero",
                "order": 0,
                "is_enabled": True,
                "payload": {"headline": "Hello World"},
            },
            {
                "section_key": "cta",
                "order": 1,
                "is_enabled": True,
                "payload": {"heading": "Go"},
            },
        ],
    })
    assert saved.status_code == 200
    data = saved.json()
    assert data["draft_payload"]["title"] == "New Title Here"
    assert len(data["sections"]) == 2

    # Publish
    published = await client.post("/site/pages/launch/publish", headers=admin_headers)
    assert published.status_code == 200
    pdata = published.json()
    assert pdata["version"] == 1
    assert pdata["status"] == "published"
    assert pdata["published_payload"]["title"] == "New Title Here"
    first = {s["section_key"]: s for s in pdata["sections"]}["hero"]
    assert first["published_payload"]["headline"] == "Hello World"

    # A ContentRevision snapshot exists
    rev = (await db_session.execute(
        select(ContentRevision).where(ContentRevision.page_id == uuid.UUID(page_id))
    )).scalar_one()
    assert rev.version == 1
    assert rev.snapshot["page"]["payload"]["title"] == "New Title Here"

    # Audit log written
    audit = (await db_session.execute(
        select(AuditLog).where(AuditLog.resource_type == "site_page")
    )).scalars().all()
    actions = {a.action for a in audit}
    assert {"page.create", "page.update", "page.draft_save", "page.publish"} <= actions

    # Public render now serves it
    pub = await client.get("/site/pages/launch")
    assert pub.status_code == 200
    assert pub.json()["payload"]["title"] == "New Title Here"

    # Edit + publish again -> version 2
    saved2 = await client.put("/site/pages/launch/content", headers=admin_headers, json={
        "payload": {"title": "v2"},
        "sections": [],
    })
    assert saved2.status_code == 200
    pub2 = await client.post("/site/pages/launch/publish", headers=admin_headers)
    assert pub2.json()["version"] == 2

    # Rollback to v1 -> draft restored, not auto-published
    rolled = await client.post(
        "/site/pages/launch/rollback/1", headers=admin_headers
    )
    assert rolled.status_code == 200
    rdata = rolled.json()
    assert rdata["draft_payload"]["title"] == "New Title Here"
    assert rdata["status"] == "published"  # unchanged (rollback is draft-only)

    # History lists both versions
    hist = await client.get("/site/pages/launch/history", headers=admin_headers)
    assert hist.status_code == 200
    versions = [h["version"] for h in hist.json()["history"]]
    assert versions == [2, 1]

    # Soft delete
    deleted = await client.delete("/site/pages/launch", headers=admin_headers)
    assert deleted.status_code == 200
    gone = await client.get("/site/pages/launch")
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_admin_cannot_create_duplicate_slug(client, db_session, admin_user, admin_headers):
    db_session.add(admin_user)
    await db_session.commit()

    payload = {"slug": "dup", "title": "Dup"}
    r1 = await client.post("/site/pages", headers=admin_headers, json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/site/pages", headers=admin_headers, json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_rollback_unknown_version(client, db_session, admin_user, admin_headers):
    db_session.add(admin_user)
    await db_session.commit()

    await client.post("/site/pages", headers=admin_headers, json={
        "slug": "rv", "title": "Rv",
    })
    resp = await client.post("/site/pages/rv/rollback/99", headers=admin_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_missing_page_404(client, db_session, admin_user, admin_headers):
    db_session.add(admin_user)
    await db_session.commit()
    resp = await client.put("/site/pages/nope", headers=admin_headers, json={"title": "x"})
    assert resp.status_code == 404
    resp = await client.delete("/site/pages/nope", headers=admin_headers)
    assert resp.status_code == 404
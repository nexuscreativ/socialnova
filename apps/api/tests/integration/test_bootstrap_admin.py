"""
Integration tests for the superadmin bootstrap mechanism.
Covers promotion-from-ADMIN_EMAILS and create-from-ADMIN_EMAIL/PASSWORD,
using direct provisioned sessions against the test DB.
"""
import uuid
from datetime import datetime, timezone

import pytest
from unittest.mock import patch

from database import ensure_admin_bootstrap
from models import User
from services.auth import hash_password, verify_password
from sqlalchemy import select


def _mk(db, email, role="user"):
    u = User(
        id=uuid.uuid4(),
        email=email,
        name="Bootstrap Tester",
        password_hash=hash_password("TestPass123"),
        is_verified=True,
        is_active=True,
        tier="free",
        role=role,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(u)
    return u


@pytest.mark.asyncio
class TestBootstrapPromotion:
    async def test_promotes_listed_email(self, db_session):
        u = _mk(db_session, "admin@example.com", role="user")
        db_session.add(u)
        await db_session.commit()
        with patch("config.settings.ADMIN_EMAILS", ["admin@example.com"]), patch(
            "config.settings.ADMIN_EMAIL", None
        ), patch("config.settings.ADMIN_PASSWORD", None):
            await ensure_admin_bootstrap(db_session)
        await db_session.refresh(u)
        assert u.role == "superadmin"

    async def test_promotion_is_idempotent(self, db_session):
        u = _mk(db_session, "admin@example.com", role="superadmin")
        db_session.add(u)
        await db_session.commit()
        with patch("config.settings.ADMIN_EMAILS", ["admin@example.com"]), patch(
            "config.settings.ADMIN_EMAIL", None
        ), patch("config.settings.ADMIN_PASSWORD", None):
            await ensure_admin_bootstrap(db_session)
        await db_session.refresh(u)
        assert u.role == "superadmin"

    async def test_does_not_touch_unlisted(self, db_session):
        kept = _mk(db_session, "user@example.com", role="user")
        db_session.add(kept)
        await db_session.commit()
        with patch("config.settings.ADMIN_EMAILS", ["admin@example.com"]), patch(
            "config.settings.ADMIN_EMAIL", None
        ), patch("config.settings.ADMIN_PASSWORD", None):
            await ensure_admin_bootstrap(db_session)
        await db_session.refresh(kept)
        assert kept.role == "user"


@pytest.mark.asyncio
class TestBootstrapCreation:
    async def test_creates_admin_when_absent(self, db_session):
        with patch("config.settings.ADMIN_EMAILS", []), patch(
            "config.settings.ADMIN_EMAIL", "root@example.com"
        ), patch("config.settings.ADMIN_PASSWORD", "Str0ngPass1"):
            await ensure_admin_bootstrap(db_session)
        row = await db_session.scalar(
            select(User).where(User.email == "root@example.com")
        )
        assert row is not None
        assert row.role == "superadmin"
        assert row.tier == "enterprise"
        assert row.is_verified is True
        assert verify_password("Str0ngPass1", row.password_hash)

    async def test_noop_when_admin_exists(self, db_session):
        u = _mk(db_session, "root@example.com", role="admin")
        db_session.add(u)
        await db_session.commit()
        with patch("config.settings.ADMIN_EMAILS", []), patch(
            "config.settings.ADMIN_EMAIL", "root@example.com"
        ), patch("config.settings.ADMIN_PASSWORD", "Str0ngPass1"):
            await ensure_admin_bootstrap(db_session)
        await db_session.refresh(u)
        # Existing account untouched (role not upgraded, password unchanged).
        assert u.role == "admin"
        assert verify_password("TestPass123", u.password_hash)

    async def test_noop_without_config(self, db_session):
        with patch("config.settings.ADMIN_EMAILS", []), patch(
            "config.settings.ADMIN_EMAIL", None
        ), patch("config.settings.ADMIN_PASSWORD", None):
            await ensure_admin_bootstrap(db_session)
        total = await db_session.scalar(select(User.id))
        assert total is None
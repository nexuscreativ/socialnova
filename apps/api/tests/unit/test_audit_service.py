"""
Unit tests for the audit logging service.
"""
import uuid
from datetime import datetime, timezone

import pytest

from services.audit import log_audit_event
from models import AuditLog


@pytest.mark.asyncio
class TestAuditLogging:
    """Tests for audit log creation."""

    async def test_log_audit_event_creates_entry(self, db_session):
        """Should create an audit log entry with required fields."""
        entry = await log_audit_event(
            db_session,
            action="user.login",
            user_id=uuid.uuid4(),
            resource_type="user",
            resource_id=uuid.uuid4(),
            details={"method": "password"},
            ip_address="127.0.0.1",
            user_agent="test-agent",
        )
        await db_session.flush()

        assert entry is not None
        assert entry.action == "user.login"
        assert entry.resource_type == "user"
        assert entry.ip_address == "127.0.0.1"
        assert entry.user_agent == "test-agent"
        assert entry.details == {"method": "password"}

    async def test_log_audit_event_minimal_fields(self, db_session):
        """Should work with only the required action field."""
        entry = await log_audit_event(db_session, action="system.startup")
        await db_session.flush()

        assert entry.action == "system.startup"
        assert entry.user_id is None
        assert entry.resource_type is None
        assert entry.resource_id is None
        assert entry.details == {}
        assert entry.ip_address is None

    async def test_log_audit_event_empty_details_becomes_dict(self, db_session):
        """None details should be stored as empty dict."""
        entry = await log_audit_event(db_session, action="test.action")
        await db_session.flush()

        assert entry.details == {}

    async def test_log_audit_event_resource_id_stringified(self, db_session):
        """UUID resource_id should be stored as string."""
        rid = uuid.uuid4()
        entry = await log_audit_event(
            db_session,
            action="test.resource",
            resource_id=rid,
        )
        await db_session.flush()

        assert entry.resource_id == str(rid)

    async def test_log_audit_event_created_at_set(self, db_session):
        """Entry should have a created_at timestamp."""
        entry = await log_audit_event(db_session, action="test.timestamp")
        await db_session.flush()

        assert entry.created_at is not None
        assert entry.created_at <= datetime.now(timezone.utc)

    async def test_log_audit_event_complex_details(self, db_session):
        """Should handle complex nested detail dictionaries."""
        details = {
            "changes": {"name": "old -> new"},
            "metadata": {"source": "api", "version": 2},
            "tags": ["important", "review"],
        }
        entry = await log_audit_event(
            db_session,
            action="user.profile_updated",
            details=details,
        )
        await db_session.flush()

        assert entry.details == details
        assert entry.details["changes"]["name"] == "old -> new"

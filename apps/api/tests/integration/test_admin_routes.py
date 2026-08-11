"""
Integration tests for admin routes.
Covers: stats, users, endpoints, api-usage, api-keys, and role gating.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from models import APIKey, APIRequest, User
from services.auth import hash_password, create_access_token


def _mk_user(db_session, role="admin", email=None):
    user = User(
        id=uuid.uuid4(),
        email=email or f"admin_{uuid.uuid4().hex[:8]}@example.com",
        name="Admin Tester",
        password_hash=hash_password("TestPass123"),
        is_verified=True,
        is_active=True,
        tier="pro",
        role=role,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    return user


def _mk_regular_user(db_session):
    return _mk_user(db_session, role="user", email=f"reg_{uuid.uuid4().hex[:8]}@example.com")


@pytest.mark.asyncio
class TestStats:
    async def test_admin_stats(self, client, db_session):
        admin = _mk_user(db_session)
        db_session.add(admin)
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "api_requests" in data

    async def test_stats_denied_for_user(self, client, db_session):
        user = _mk_regular_user(db_session)
        db_session.add(user)
        await db_session.commit()
        token = create_access_token(user.id, user.role)
        response = await client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403

    async def test_stats_requires_auth(self, client):
        response = await client.get("/admin/stats")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestApiUsage:
    async def test_api_usage_empty(self, client, db_session):
        admin = _mk_user(db_session)
        db_session.add(admin)
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.get(
            "/admin/api-usage?days=30",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["totals"]["total_requests"] == 0
        assert data["top_keys"] == []

    async def test_api_usage_with_data(self, client, db_session):
        admin = _mk_user(db_session)
        owner = _mk_user(db_session, role="user", email=f"owner_{uuid.uuid4().hex[:8]}@example.com")
        db_session.add(admin)
        db_session.add(owner)
        await db_session.flush()

        key = APIKey(
            id=uuid.uuid4(),
            user_id=owner.id,
            name="Prod Key",
            key_hash="hash",
            key_prefix="abcd1234",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(key)
        await db_session.flush()

        now = datetime.now(timezone.utc)
        for i in range(3):
            db_session.add(
                APIRequest(
                    id=uuid.uuid4(),
                    request_id=f"req-{i}-{uuid.uuid4().hex[:6]}",
                    user_id=owner.id,
                    api_key_id=key.id,
                    status="completed",
                    total_tokens=100,
                    cost_cents=50,
                    latency_ms=200 + i,
                    created_at=now,
                )
            )
        await db_session.commit()

        token = create_access_token(admin.id, admin.role)
        response = await client.get(
            "/admin/api-usage?days=30",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["totals"]["total_requests"] == 3
        assert data["totals"]["total_tokens"] == 300
        assert data["totals"]["total_cost_cents"] == 150.0
        assert len(data["top_keys"]) == 1
        assert data["top_keys"][0]["key_prefix"] == "abcd1234"
        assert data["top_keys"][0]["owner_email"] == owner.email
        assert data["top_keys"][0]["requests"] == 3


@pytest.mark.asyncio
class TestApiKeys:
    async def test_list_empty(self, client, db_session):
        admin = _mk_user(db_session)
        db_session.add(admin)
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.get("/admin/api-keys", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["keys"] == []

    async def test_list_with_keys(self, client, db_session):
        admin = _mk_user(db_session)
        owner = _mk_user(db_session, role="user", email=f"owner_{uuid.uuid4().hex[:8]}@example.com")
        db_session.add(admin)
        db_session.add(owner)
        await db_session.flush()

        key = APIKey(
            id=uuid.uuid4(),
            user_id=owner.id,
            name="Staging Key",
            key_hash="hash",
            key_prefix="stagin01",
            daily_budget_cents=5000,
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(key)
        await db_session.commit()

        token = create_access_token(admin.id, admin.role)
        response = await client.get("/admin/api-keys", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["keys"][0]["name"] == "Staging Key"
        assert data["keys"][0]["owner_email"] == owner.email
        assert data["keys"][0]["daily_budget_cents"] == 5000

    async def test_keys_denied_for_user(self, client, db_session):
        user = _mk_regular_user(db_session)
        db_session.add(user)
        await db_session.commit()
        token = create_access_token(user.id, user.role)
        response = await client.get("/admin/api-keys", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403


@pytest.mark.asyncio
class TestEndpoints:
    async def test_endpoint_listing(self, client, db_session):
        admin = _mk_user(db_session)
        db_session.add(admin)
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.get("/admin/endpoints", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        paths = {r["path"] for r in data["routes"]}
        assert "/admin/api-usage" in paths
        assert "/admin/api-keys" in paths


@pytest.mark.asyncio
class TestRoleManagement:
    async def test_promote_user_to_admin(self, client, db_session):
        super = _mk_user(db_session, role="superadmin")
        target = _mk_user(db_session, role="user", email=f"promo_{uuid.uuid4().hex[:8]}@example.com")
        db_session.add(super)
        db_session.add(target)
        await db_session.commit()
        token = create_access_token(super.id, super.role)
        response = await client.put(
            f"/admin/users/{target.id}/role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "admin"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    async def test_admin_cannot_change_roles(self, client, db_session):
        admin = _mk_user(db_session, role="admin")
        target = _mk_regular_user(db_session)
        db_session.add(admin)
        db_session.add(target)
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.put(
            f"/admin/users/{target.id}/role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "admin"},
        )
        assert response.status_code == 403

    async def test_invalid_role_rejected(self, client, db_session):
        super = _mk_user(db_session, role="superadmin")
        target = _mk_regular_user(db_session)
        db_session.add(super)
        db_session.add(target)
        await db_session.commit()
        token = create_access_token(super.id, super.role)
        response = await client.put(
            f"/admin/users/{target.id}/role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "root"},
        )
        assert response.status_code == 422

    async def test_cannot_demote_self(self, client, db_session):
        super = _mk_user(db_session, role="superadmin")
        db_session.add(super)
        await db_session.commit()
        token = create_access_token(super.id, super.role)
        response = await client.put(
            f"/admin/users/{super.id}/role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "user"},
        )
        assert response.status_code == 400

    async def test_cannot_demote_last_superadmin(self, client, db_session):
        super = _mk_user(db_session, role="superadmin")
        other = _mk_regular_user(db_session)
        db_session.add(super)
        db_session.add(other)
        await db_session.commit()
        token = create_access_token(super.id, super.role)
        response = await client.put(
            f"/admin/users/{super.id}/role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "admin"},
        )
        assert response.status_code == 400

    async def test_can_demote_superadmin_when_another_exists(self, client, db_session):
        super_a = _mk_user(db_session, role="superadmin", email=f"sa1_{uuid.uuid4().hex[:8]}@example.com")
        super_b = _mk_user(db_session, role="superadmin", email=f"sa2_{uuid.uuid4().hex[:8]}@example.com")
        db_session.add(super_a)
        db_session.add(super_b)
        await db_session.commit()
        token = create_access_token(super_a.id, super_a.role)
        response = await client.put(
            f"/admin/users/{super_b.id}/role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "admin"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"


@pytest.mark.asyncio
class TestAuditLogs:
    async def test_audit_logs_empty(self, client, db_session):
        admin = _mk_user(db_session, role="superadmin")
        db_session.add(admin)
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["logs"] == []

    async def test_audit_logs_denied_for_user(self, client, db_session):
        user = _mk_regular_user(db_session)
        db_session.add(user)
        await db_session.commit()
        token = create_access_token(user.id, user.role)
        response = await client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403

    async def test_audit_logs_with_data(self, client, db_session):
        from models import AuditLog

        admin = _mk_user(db_session, role="superadmin")
        actor = _mk_regular_user(db_session)
        db_session.add(admin)
        db_session.add(actor)
        await db_session.flush()
        db_session.add(
            AuditLog(
                id=uuid.uuid4(),
                user_id=actor.id,
                action="user.login",
                resource_type="user",
                resource_id=str(actor.id),
                details={"k": "v"},
                ip_address="127.0.0.1",
                user_agent="test",
                created_at=datetime.now(timezone.utc),
            )
        )
        await db_session.commit()
        token = create_access_token(admin.id, admin.role)
        response = await client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["logs"][0]["action"] == "user.login"
        assert data["logs"][0]["user_email"] == actor.email
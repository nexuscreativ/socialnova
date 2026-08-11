"""
Integration tests for content routes.
Covers: CRUD, publish, schedule.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from models import Content, User
from services.auth import hash_password


@pytest.mark.asyncio
class TestListContentEndpoint:
    """Tests for GET /api/v1/content."""

    async def test_list_content_empty(self, client, db_session, test_user, auth_headers):
        """Should return empty list."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.get("/content", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_content_with_data(self, client, db_session, test_user, auth_headers):
        """Should return user's content."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Hello world",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()

        response = await client.get("/content", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    async def test_list_content_filter_platform(self, client, db_session, test_user, auth_headers):
        """Should filter by platform."""
        db_session.add(test_user)
        await db_session.flush()

        for platform in ["instagram", "twitter", "instagram"]:
            db_session.add(Content(
                user_id=test_user.id,
                platform=platform,
                content_type="post",
                text="Post",
                status="draft",
            ))
        await db_session.commit()

        response = await client.get(
            "/content?platform=instagram",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(c["platform"] == "instagram" for c in data)


@pytest.mark.asyncio
class TestCreateContentEndpoint:
    """Tests for POST /api/v1/content."""

    async def test_create_content_success(self, client, db_session, test_user, auth_headers):
        """Should create content."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/content",
            json={
                "platform": "instagram",
                "content_type": "post",
                "text": "Great content!",
                "hashtags": ["social", "media"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["text"] == "Great content!"
        assert data["platform"] == "instagram"
        assert data["status"] == "draft"

    async def test_create_scheduled_content(self, client, db_session, test_user, auth_headers):
        """Should set status to 'scheduled' when scheduled_at is provided."""
        db_session.add(test_user)
        await db_session.commit()

        future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        response = await client.post(
            "/content",
            json={
                "platform": "twitter",
                "content_type": "tweet",
                "text": "Scheduled tweet",
                "scheduled_at": future,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["status"] == "scheduled"

    async def test_create_content_empty_text(self, client, db_session, test_user, auth_headers):
        """Should return 422 for empty text."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/content",
            json={
                "platform": "instagram",
                "content_type": "post",
                "text": "",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_content_unauthenticated(self, client):
        """Should return 401."""
        response = await client.post(
            "/content",
            json={"platform": "instagram", "content_type": "post", "text": "Test"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetContentEndpoint:
    """Tests for GET /api/v1/content/{content_id}."""

    async def test_get_content_success(self, client, db_session, test_user, auth_headers):
        """Should return content details."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Test content",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        response = await client.get(
            f"/content/{content.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["text"] == "Test content"

    async def test_get_content_not_found(self, client, db_session, test_user, auth_headers):
        """Should return 404 for non-existent content."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.get(
            f"/content/{uuid.uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestUpdateContentEndpoint:
    """Tests for PUT /api/v1/content/{content_id}."""

    async def test_update_content_success(self, client, db_session, test_user, auth_headers):
        """Should update content fields."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Old text",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        response = await client.put(
            f"/content/{content.id}",
            json={"text": "Updated text"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["text"] == "Updated text"

    async def test_update_published_content_forbidden(self, client, db_session, test_user, auth_headers):
        """Should return 400 when modifying published content."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Published",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        response = await client.put(
            f"/content/{content.id}",
            json={"text": "Cannot change"},
            headers=auth_headers,
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestDeleteContentEndpoint:
    """Tests for DELETE /api/v1/content/{content_id}."""

    async def test_delete_content_success(self, client, db_session, test_user, auth_headers):
        """Should delete content."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="To delete",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        response = await client.delete(
            f"/content/{content.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()


@pytest.mark.asyncio
class TestPublishContentEndpoint:
    """Tests for POST /api/v1/content/{content_id}/publish."""

    async def test_publish_content_success(self, client, db_session, test_user, auth_headers):
        """Should mark content as published."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Ready to publish",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        response = await client.post(
            f"/content/{content.id}/publish",
            json={"platforms": ["instagram"], "publish_now": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "published"
        assert response.json()["published_at"] is not None

    async def test_publish_already_published(self, client, db_session, test_user, auth_headers):
        """Should return 400 for already published content."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Already published",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        response = await client.post(
            f"/content/{content.id}/publish",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestScheduleContentEndpoint:
    """Tests for POST /api/v1/content/{content_id}/schedule."""

    async def test_schedule_content_success(self, client, db_session, test_user, auth_headers):
        """Should schedule content for future publishing."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="To schedule",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        response = await client.post(
            f"/content/{content.id}/schedule",
            json={"scheduled_at": future},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "scheduled"

    async def test_schedule_past_date_rejected(self, client, db_session, test_user, auth_headers):
        """Should reject scheduling in the past."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Past schedule",
            status="draft",
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        response = await client.post(
            f"/content/{content.id}/schedule",
            json={"scheduled_at": past},
            headers=auth_headers,
        )
        assert response.status_code == 400

    async def test_schedule_published_content_rejected(self, client, db_session, test_user, auth_headers):
        """Should reject scheduling already published content."""
        db_session.add(test_user)
        await db_session.flush()

        content = Content(
            user_id=test_user.id,
            platform="instagram",
            content_type="post",
            text="Published",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        db_session.add(content)
        await db_session.commit()
        await db_session.refresh(content)

        future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        response = await client.post(
            f"/content/{content.id}/schedule",
            json={"scheduled_at": future},
            headers=auth_headers,
        )
        assert response.status_code == 400


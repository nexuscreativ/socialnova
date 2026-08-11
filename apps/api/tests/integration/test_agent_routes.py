"""
Integration tests for agent routes.
Covers: CRUD, execute, history.
"""
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from models import Agent, AgentSession, AgentAction, APIRequest
from services.auth import create_access_token


@pytest.mark.asyncio
class TestListAgentsEndpoint:
    """Tests for GET /api/v1/agents."""

    async def test_list_agents_empty(self, client, db_session, test_user, auth_headers):
        """Should return empty list when no agents exist."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.get(
            "/agents",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_agents_with_data(self, client, db_session, test_user, auth_headers):
        """Should return user's agents."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="My Creator",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()

        response = await client.get(
            "/agents",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    async def test_list_agents_unauthenticated(self, client):
        """Should return 401 without auth."""
        response = await client.get("/agents")
        assert response.status_code == 401

    async def test_list_agents_filter_by_type(self, client, db_session, test_user, auth_headers):
        """Should filter agents by type."""
        db_session.add(test_user)
        await db_session.flush()

        for agent_type in ["creator", "timing", "creator"]:
            agent = Agent(
                user_id=test_user.id,
                agent_type=agent_type,
                name=f"Agent {agent_type}",
                status="active",
                model_tier="free",
            )
            db_session.add(agent)
        await db_session.commit()

        response = await client.get(
            "/agents?agent_type=creator",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(a["agent_type"] == "creator" for a in data)


@pytest.mark.asyncio
class TestCreateAgentEndpoint:
    """Tests for POST /api/v1/agents."""

    async def test_create_agent_success(self, client, db_session, test_user, auth_headers):
        """Should create a new agent."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/agents",
            json={
                "agent_type": "creator",
                "name": "My Creator Agent",
                "description": "Creates social media content",
                "model_tier": "free",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My Creator Agent"
        assert data["agent_type"] == "creator"
        assert data["status"] == "active"

    async def test_create_agent_unverified_user(self, client, db_session, unverified_user):
        """Should return 403 for unverified user."""
        db_session.add(unverified_user)
        await db_session.commit()

        token = create_access_token(unverified_user.id, unverified_user.role)
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.post(
            "/agents",
            json={"agent_type": "creator", "name": "Agent"},
            headers=headers,
        )
        assert response.status_code == 403

    async def test_create_agent_missing_fields(self, client, db_session, test_user, auth_headers):
        """Should return 422 for missing required fields."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/agents",
            json={"name": "Agent"},
            headers=auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestGetAgentEndpoint:
    """Tests for GET /api/v1/agents/{agent_id}."""

    async def test_get_agent_success(self, client, db_session, test_user, auth_headers):
        """Should return agent details."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="My Agent",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.get(
            f"/agents/{agent.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "My Agent"

    async def test_get_agent_not_found(self, client, db_session, test_user, auth_headers):
        """Should return 404 for non-existent agent."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.get(
            f"/agents/{uuid.uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_agent_other_users(self, client, db_session, test_user, create_user, auth_headers):
        """Should return 404 when accessing another user's agent."""
        other_user = create_user(email=f"other_{uuid.uuid4().hex[:8]}@example.com")
        db_session.add_all([test_user, other_user])
        await db_session.flush()

        agent = Agent(
            user_id=other_user.id,
            agent_type="creator",
            name="Other Agent",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.get(
            f"/agents/{agent.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestUpdateAgentEndpoint:
    """Tests for PUT /api/v1/agents/{agent_id}."""

    async def test_update_agent_success(self, client, db_session, test_user, auth_headers):
        """Should update agent fields."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="Old Name",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.put(
            f"/agents/{agent.id}",
            json={"name": "New Name", "status": "paused"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"
        assert response.json()["status"] == "paused"

    async def test_update_agent_not_found(self, client, db_session, test_user, auth_headers):
        """Should return 404 for non-existent agent."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.put(
            f"/agents/{uuid.uuid4()}",
            json={"name": "Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_update_builtin_agent_forbidden(self, client, db_session, test_user, auth_headers):
        """Should return 403 when trying to update built-in agent."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="Built-in Agent",
            status="active",
            model_tier="free",
            is_builtin=True,
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.put(
            f"/agents/{agent.id}",
            json={"name": "Hacked"},
            headers=auth_headers,
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteAgentEndpoint:
    """Tests for DELETE /api/v1/agents/{agent_id}."""

    async def test_delete_agent_success(self, client, db_session, test_user, auth_headers):
        """Should delete a custom agent."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="To Delete",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.delete(
            f"/agents/{agent.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    async def test_delete_agent_not_found(self, client, db_session, test_user, auth_headers):
        """Should return 404 for non-existent agent."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.delete(
            f"/agents/{uuid.uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_delete_builtin_agent_forbidden(self, client, db_session, test_user, auth_headers):
        """Should return 403 for built-in agents."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="Built-in",
            status="active",
            model_tier="free",
            is_builtin=True,
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.delete(
            f"/agents/{agent.id}",
            headers=auth_headers,
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestExecuteAgentEndpoint:
    """Tests for POST /api/v1/agents/{agent_id}/execute."""

    @patch("agents.creator.CreatorAgent")
    async def test_execute_agent_success(self, MockCreatorAgent, client, db_session, test_user, auth_headers):
        """Should execute agent and return session results."""
        mock_instance = AsyncMock()
        mock_instance.execute = AsyncMock(return_value={
            "content": "Generated content",
            "tokens_used": 100,
        })
        MockCreatorAgent.return_value = mock_instance

        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="Creator",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.post(
            f"/agents/{agent.id}/execute",
            json={"input_data": {"description": "Create a tweet"}},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["status"] in ("completed", "failed")
        assert "tokens_used" in data
        assert "duration_ms" in data

    async def test_execute_agent_not_found(self, client, db_session, test_user, auth_headers):
        """Should return 404 for non-existent agent."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            f"/agents/{uuid.uuid4()}/execute",
            json={"input_data": {"description": "Test"}},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_execute_agent_inactive(self, client, db_session, test_user, auth_headers):
        """Should return 404 for inactive agent."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="Inactive Agent",
            status="archived",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.post(
            f"/agents/{agent.id}/execute",
            json={"input_data": {"description": "Test"}},
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestAgentHistoryEndpoint:
    """Tests for GET /api/v1/agents/{agent_id}/history."""

    async def test_get_history_empty(self, client, db_session, test_user, auth_headers):
        """Should return empty list when no history."""
        db_session.add(test_user)
        await db_session.flush()

        agent = Agent(
            user_id=test_user.id,
            agent_type="creator",
            name="Agent",
            status="active",
            model_tier="free",
        )
        db_session.add(agent)
        await db_session.commit()
        await db_session.refresh(agent)

        response = await client.get(
            f"/agents/{agent.id}/history",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_get_history_not_found(self, client, db_session, test_user, auth_headers):
        """Should return 404 for non-existent agent."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.get(
            f"/agents/{uuid.uuid4()}/history",
            headers=auth_headers,
        )
        assert response.status_code == 404


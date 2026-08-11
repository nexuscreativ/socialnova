"""
Unit tests for Pydantic schemas validation.
Covers: RegisterRequest, LoginRequest, ContentCreate, AgentCreate, CampaignCreate, etc.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserUpdateRequest,
    APIKeyCreate,
    AgentCreate,
    AgentUpdate,
    AgentExecuteRequest,
    ContentCreate,
    ContentUpdate,
    PublishRequest,
    ScheduleRequest,
    CampaignCreate,
    CampaignUpdate,
    PaginationParams,
)


# ─── RegisterRequest ───────────────────────────────────────────────────────

class TestRegisterRequest:
    """Tests for registration schema validation."""

    def test_valid_registration(self):
        """Valid data should pass."""
        req = RegisterRequest(email="test@example.com", password="StrongPass1")
        assert req.email == "test@example.com"
        assert req.name is None

    def test_valid_registration_with_name(self):
        """Name should be optional."""
        req = RegisterRequest(email="test@example.com", password="StrongPass1", name="Test User")
        assert req.name == "Test User"

    def test_password_too_short(self):
        """Password must be at least 8 characters."""
        with pytest.raises(ValidationError):
            RegisterRequest(email="test@example.com", password="Short1")

    def test_password_too_long(self):
        """Password must be at most 128 characters."""
        with pytest.raises(ValidationError):
            RegisterRequest(email="test@example.com", password="A" * 129 + "1a")

    def test_password_no_uppercase(self):
        """Password must contain uppercase letter."""
        with pytest.raises(ValidationError, match="uppercase"):
            RegisterRequest(email="test@example.com", password="lowercase1")

    def test_password_no_lowercase(self):
        """Password must contain lowercase letter."""
        with pytest.raises(ValidationError, match="lowercase"):
            RegisterRequest(email="test@example.com", password="UPPERCASE1")

    def test_password_no_digit(self):
        """Password must contain a digit."""
        with pytest.raises(ValidationError, match="digit"):
            RegisterRequest(email="test@example.com", password="NoDigitHere")

    def test_invalid_email(self):
        """Invalid email format should fail."""
        with pytest.raises(ValidationError):
            RegisterRequest(email="not-an-email", password="StrongPass1")

    def test_email_max_length(self):
        """Name field should respect max_length."""
        req = RegisterRequest(
            email="test@example.com",
            password="StrongPass1",
            name="A" * 255,
        )
        assert len(req.name) == 255

    def test_name_too_long(self):
        """Name exceeding max length should fail."""
        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@example.com",
                password="StrongPass1",
                name="A" * 256,
            )


# ─── LoginRequest ──────────────────────────────────────────────────────────

class TestLoginRequest:
    """Tests for login schema validation."""

    def test_valid_login(self):
        """Valid credentials should pass."""
        req = LoginRequest(email="user@example.com", password="pass123")
        assert req.email == "user@example.com"

    def test_empty_password_fails(self):
        """Password must not be empty."""
        with pytest.raises(ValidationError):
            LoginRequest(email="user@example.com", password="")

    def test_invalid_email_fails(self):
        """Invalid email should fail."""
        with pytest.raises(ValidationError):
            LoginRequest(email="bad", password="pass123")


# ─── TokenResponse ─────────────────────────────────────────────────────────

class TestTokenResponse:
    """Tests for token response schema."""

    def test_token_response_defaults(self):
        """Default token_type should be 'bearer'."""
        resp = TokenResponse(
            access_token="abc",
            refresh_token="xyz",
            expires_in=1800,
        )
        assert resp.token_type == "bearer"


# ─── Agent Schemas ─────────────────────────────────────────────────────────

class TestAgentCreate:
    """Tests for agent creation schema."""

    def test_valid_agent_create(self):
        """Valid agent data should pass."""
        agent = AgentCreate(
            agent_type="creator",
            name="My Agent",
            description="Creates content",
            model_tier="free",
        )
        assert agent.agent_type == "creator"
        assert agent.config == {}

    def test_agent_type_required(self):
        """Agent type must not be empty."""
        with pytest.raises(ValidationError):
            AgentCreate(agent_type="", name="My Agent")

    def test_agent_name_required(self):
        """Agent name must not be empty."""
        with pytest.raises(ValidationError):
            AgentCreate(agent_type="creator", name="")

    def test_agent_name_too_long(self):
        """Agent name must be <= 100 characters."""
        with pytest.raises(ValidationError):
            AgentCreate(agent_type="creator", name="A" * 101)

    def test_agent_description_too_long(self):
        """Description must be <= 500 characters."""
        with pytest.raises(ValidationError):
            AgentCreate(
                agent_type="creator",
                name="Agent",
                description="D" * 501,
            )

    def test_invalid_model_tier(self):
        """Invalid model tier pattern should fail."""
        with pytest.raises(ValidationError):
            AgentCreate(agent_type="creator", name="Agent", model_tier="invalid")

    def test_valid_model_tiers(self):
        """All valid model tiers should pass."""
        for tier in ("free", "mid", "frontier"):
            agent = AgentCreate(agent_type="creator", name="Agent", model_tier=tier)
            assert agent.model_tier == tier


class TestAgentUpdate:
    """Tests for agent update schema."""

    def test_partial_update(self):
        """Partial updates should work."""
        update = AgentUpdate(name="New Name")
        data = update.model_dump(exclude_unset=True)
        assert "name" in data
        assert "status" not in data

    def test_invalid_status_pattern(self):
        """Invalid status pattern should fail."""
        with pytest.raises(ValidationError):
            AgentUpdate(status="invalid")


class TestAgentExecuteRequest:
    """Tests for agent execution request schema."""

    def test_valid_execute(self):
        """Valid execute request should pass."""
        req = AgentExecuteRequest(input_data={"prompt": "hello"})
        assert req.timeout_seconds == 120  # default

    def test_empty_input_data_fails(self):
        """Input data must not be empty."""
        with pytest.raises(ValidationError):
            AgentExecuteRequest(input_data={})

    def test_timeout_too_low(self):
        """Timeout must be >= 5 seconds."""
        with pytest.raises(ValidationError):
            AgentExecuteRequest(input_data={"prompt": "hi"}, timeout_seconds=3)

    def test_timeout_too_high(self):
        """Timeout must be <= 600 seconds."""
        with pytest.raises(ValidationError):
            AgentExecuteRequest(input_data={"prompt": "hi"}, timeout_seconds=601)


# ─── Content Schemas ──────────────────────────────────────────────────────

class TestContentCreate:
    """Tests for content creation schema."""

    def test_valid_content(self):
        """Valid content data should pass."""
        content = ContentCreate(
            platform="instagram",
            content_type="post",
            text="Hello world!",
        )
        assert content.hashtags == []
        assert content.media_urls == []

    def test_text_required(self):
        """Text must not be empty."""
        with pytest.raises(ValidationError):
            ContentCreate(platform="instagram", content_type="post", text="")

    def test_text_too_long(self):
        """Text must be <= 5000 characters."""
        with pytest.raises(ValidationError):
            ContentCreate(
                platform="instagram",
                content_type="post",
                text="T" * 5001,
            )

    def test_hashtags_max_length(self):
        """Hashtags list must have <= 30 items."""
        with pytest.raises(ValidationError):
            ContentCreate(
                platform="instagram",
                content_type="post",
                text="Post",
                hashtags=[f"tag{i}" for i in range(31)],
            )

    def test_media_urls_max_length(self):
        """Media URLs list must have <= 10 items."""
        with pytest.raises(ValidationError):
            ContentCreate(
                platform="instagram",
                content_type="post",
                text="Post",
                media_urls=[f"http://img.com/{i}.jpg" for i in range(11)],
            )


class TestContentUpdate:
    """Tests for content update schema."""

    def test_all_fields_optional(self):
        """All fields should be optional in updates."""
        update = ContentUpdate()
        data = update.model_dump(exclude_unset=True)
        assert len(data) == 0

    def test_partial_update(self):
        """Partial update should only include set fields."""
        update = ContentUpdate(text="Updated text")
        data = update.model_dump(exclude_unset=True)
        assert "text" in data
        assert "platform" not in data


# ─── Campaign Schemas ─────────────────────────────────────────────────────

class TestCampaignCreate:
    """Tests for campaign creation schema."""

    def test_valid_campaign(self):
        """Valid campaign data should pass."""
        campaign = CampaignCreate(
            name="Product Launch",
            campaign_type="product_launch",
        )
        assert campaign.budget_cents is None

    def test_name_required(self):
        """Name must not be empty."""
        with pytest.raises(ValidationError):
            CampaignCreate(name="", campaign_type="product_launch")

    def test_campaign_type_required(self):
        """Campaign type must not be empty."""
        with pytest.raises(ValidationError):
            CampaignCreate(name="Campaign", campaign_type="")

    def test_negative_budget_fails(self):
        """Budget must be >= 0."""
        with pytest.raises(ValidationError):
            CampaignCreate(
                name="Campaign",
                campaign_type="product_launch",
                budget_cents=-100,
            )


class TestCampaignUpdate:
    """Tests for campaign update schema."""

    def test_valid_status_patterns(self):
        """All valid status values should pass."""
        for status in ("draft", "active", "paused", "completed", "archived"):
            update = CampaignUpdate(status=status)
            assert update.status == status

    def test_invalid_status_pattern(self):
        """Invalid status should fail pattern validation."""
        with pytest.raises(ValidationError):
            CampaignUpdate(status="running")


# ─── ScheduleRequest ──────────────────────────────────────────────────────

class TestScheduleRequest:
    """Tests for schedule request schema."""

    def test_valid_schedule(self):
        """Valid future date should pass."""
        future = datetime.now(timezone.utc) + timedelta(days=1)
        req = ScheduleRequest(scheduled_at=future)
        assert req.platforms == []


# ─── PaginationParams ─────────────────────────────────────────────────────

class TestPaginationParams:
    """Tests for pagination schema."""

    def test_defaults(self):
        """Default page=1, per_page=20."""
        params = PaginationParams()
        assert params.page == 1
        assert params.per_page == 20

    def test_page_must_be_positive(self):
        """Page must be >= 1."""
        with pytest.raises(ValidationError):
            PaginationParams(page=0)

    def test_per_page_max_100(self):
        """per_page must be <= 100."""
        with pytest.raises(ValidationError):
            PaginationParams(per_page=101)

    def test_per_page_min_1(self):
        """per_page must be >= 1."""
        with pytest.raises(ValidationError):
            PaginationParams(per_page=0)


# ─── APIKeyCreate ─────────────────────────────────────────────────────────

class TestAPIKeyCreate:
    """Tests for API key creation schema."""

    def test_valid_api_key_create(self):
        """Valid API key data should pass."""
        key = APIKeyCreate(name="Production Key")
        assert key.daily_budget_cents == 1000

    def test_name_required(self):
        """Name must not be empty."""
        with pytest.raises(ValidationError):
            APIKeyCreate(name="")

    def test_budget_negative_fails(self):
        """Budget must be >= 0."""
        with pytest.raises(ValidationError):
            APIKeyCreate(name="Key", daily_budget_cents=-1)

    def test_budget_exceeds_max(self):
        """Budget must be <= 100000."""
        with pytest.raises(ValidationError):
            APIKeyCreate(name="Key", daily_budget_cents=100001)

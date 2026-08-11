"""
Shared test fixtures for the SocialNova API test suite.
Provides mock database sessions, test users, and authenticated test clients.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import StaticPool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from database import Base, get_db
from main import app
from models import User, Agent, Content, Campaign, RefreshToken, APIKey, AgentSession, AuditLog
from services.auth import hash_password, create_access_token, create_refresh_token, hash_token


# ─── Test Database Engine ──────────────────────────────────────────────────

# In-memory SQLite with a static pool: one shared in-process connection so the
# create_all / drop_all per test is nearly free (no per-test file or pool reset).
TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine with fresh tables per test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean database session for each test."""
    session_factory = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


# ─── Mock Database Dependency ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def mock_db(db_session):
    """Override the get_db dependency with our test session."""
    async def _get_db():
        yield db_session
    app.dependency_overrides[get_db] = _get_db
    yield db_session
    app.dependency_overrides.clear()


# ─── Test Data Factories ───────────────────────────────────────────────────

def _create_user(**overrides) -> User:
    """Factory for creating test User objects."""
    defaults = {
        "id": uuid.uuid4(),
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "name": "Test User",
        "password_hash": hash_password("TestPass123"),
        "is_verified": True,
        "is_active": True,
        "tier": "free",
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    return User(**defaults)


def _create_agent(user_id: uuid.UUID, **overrides) -> Agent:
    """Factory for creating test Agent objects."""
    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id,
        "agent_type": "creator",
        "name": "Test Agent",
        "description": "A test agent",
        "status": "active",
        "model_tier": "free",
        "is_builtin": False,
        "config": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    return Agent(**defaults)


def _create_content(user_id: uuid.UUID, **overrides) -> Content:
    """Factory for creating test Content objects."""
    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id,
        "platform": "instagram",
        "content_type": "post",
        "title": "Test Post",
        "text": "This is a test post content.",
        "hashtags": ["test", "social"],
        "media_urls": [],
        "status": "draft",
        "metadata": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    return Content(**defaults)


def _create_campaign(user_id: uuid.UUID, **overrides) -> Campaign:
    """Factory for creating test Campaign objects."""
    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id,
        "name": "Test Campaign",
        "description": "A test campaign",
        "campaign_type": "product_launch",
        "status": "draft",
        "budget_cents": 50000,
        "spent_cents": 0,
        "goals": {},
        "platforms": ["instagram", "twitter"],
        "analytics": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    return Campaign(**defaults)


@pytest.fixture
def create_user():
    """Fixture returning the user factory function."""
    return _create_user


@pytest.fixture
def create_agent():
    """Fixture returning the agent factory function."""
    return _create_agent


@pytest.fixture
def create_content():
    """Fixture returning the content factory function."""
    return _create_content


@pytest.fixture
def create_campaign():
    """Fixture returning the campaign factory function."""
    return _create_campaign


# ─── Pre-built Test Users ──────────────────────────────────────────────────

@pytest.fixture
def test_user(create_user):
    """A standard active, verified test user."""
    return create_user()


@pytest.fixture
def admin_user(create_user):
    """An admin role test user."""
    return create_user(role="admin", email=f"admin_{uuid.uuid4().hex[:8]}@example.com")


@pytest.fixture
def superadmin_user(create_user):
    """A superadmin role test user."""
    return create_user(role="superadmin", email=f"super_{uuid.uuid4().hex[:8]}@example.com")


@pytest.fixture
def unverified_user(create_user):
    """An unverified test user."""
    return create_user(is_verified=False, email=f"unverified_{uuid.uuid4().hex[:8]}@example.com")


@pytest.fixture
def inactive_user(create_user):
    """A deactivated test user."""
    return create_user(is_active=False, email=f"inactive_{uuid.uuid4().hex[:8]}@example.com")


@pytest.fixture
def free_user(create_user):
    """A free-tier user."""
    return create_user(tier="free")


@pytest.fixture
def pro_user(create_user):
    """A pro-tier user."""
    return create_user(tier="pro")


@pytest.fixture
def enterprise_user(create_user):
    """An enterprise-tier user."""
    return create_user(tier="enterprise")


# ─── Auth Helpers ──────────────────────────────────────────────────────────

@pytest.fixture
def auth_headers(test_user):
    """Generate valid auth headers for the test user."""
    token = create_access_token(test_user.id, test_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(admin_user):
    """Generate valid auth headers for the admin user."""
    token = create_access_token(admin_user.id, admin_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def superadmin_headers(superadmin_user):
    """Generate valid auth headers for the superadmin user."""
    token = create_access_token(superadmin_user.id, superadmin_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def expired_headers():
    """Generate expired auth headers."""
    from jose import jwt
    from config import settings
    payload = {
        "sub": str(uuid.uuid4()),
        "role": "user",
        "type": "access",
        "exp": datetime(2020, 1, 1, tzinfo=timezone.utc),
        "iat": datetime(2019, 1, 1, tzinfo=timezone.utc),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def invalid_headers():
    """Generate invalid auth headers."""
    return {"Authorization": "Bearer invalid.token.here"}


# ─── Async HTTP Client ────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(mock_db):
    """Async HTTP test client wired to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def unauthenticated_client():
    """Async HTTP test client without DB override (for auth failure tests)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


# ─── Mock OpenRouter ──────────────────────────────────────────────────────

@pytest.fixture
def mock_openrouter_response():
    """Mock successful OpenRouter API response."""
    return {
        "id": "test-completion-id",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": '{"result": "test output", "status": "completed"}',
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 100,
            "total_tokens": 150,
        },
    }


@pytest.fixture
def mock_openrouter_client(mock_openrouter_response):
    """Mock the OpenRouter client to avoid real API calls."""
    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value=mock_openrouter_response)
    mock_client.get_model = MagicMock(return_value="meta-llama/llama-3.3-70b-instruct:free")
    mock_client.close = AsyncMock()
    return mock_client


# ─── Mock Request ─────────────────────────────────────────────────────────

@pytest.fixture
def mock_request():
    """Create a mock FastAPI Request object."""
    request = MagicMock()
    request.client.host = "127.0.0.1"
    request.headers = {
        "User-Agent": "test-agent",
        "X-Forwarded-For": "192.168.1.1",
    }
    return request

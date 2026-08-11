"""
SocialNova API - Database configuration.
"""
import os
import secrets

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

_raw_db_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/socialnova"
)


_SSLMODE = None


def _normalize_db_url(url: str) -> str:
    """Adapt a driver-agnostic DATABASE_URL to asyncpg.

    Fly.io's `postgres attach` sets `postgres://...?sslmode=disable`, which
    SQLAlchemy maps to the sync psycopg2 dialect. Rewrite the scheme to
    `postgresql+asyncpg://` and translate the libpq sslmode option into an
    asyncpg-compatible setting:

    * `sslmode=disable` is consumed here and turned into `ssl=False`, so
      asyncpg skips the TLS handshake against Fly's pg_tls-proxied .flycast
      route (which otherwise resets the connection).
    * Any other query params are preserved as-is.
    """
    global _SSLMODE
    url = url.strip()
    for scheme in ("postgresql+asyncpg://", "postgres://", "postgresql://"):
        if url.startswith(scheme):
            rest = url[len(scheme):]
            break
    else:
        return url
    query = ""
    if "?" in rest:
        rest, query = rest.split("?", 1)
    params = []
    for part in query.split("&"):
        if not part:
            continue
        if "=" in part:
            key, value = part.split("=", 1)
        else:
            key, value = part, ""
        if key.lower() == "sslmode":
            _SSLMODE = value.lower()
            continue
        params.append(f"{key}={value}")
    new_url = "postgresql+asyncpg://" + rest
    if params:
        new_url += "?" + "&".join(params)
    return new_url


DATABASE_URL = _normalize_db_url(_raw_db_url)

_connect_args = {}
if _SSLMODE == "disable":
    _connect_args["ssl"] = False

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_builtin_agents()
    await seed_site_pages()
    await ensure_admin_bootstrap()


async def ensure_admin_bootstrap(session=None):
    """Idempotently provision superadmin accounts from settings.

    1. Promotes any existing user whose email is in `ADMIN_EMAILS` to
       `superadmin` (durable source of truth, re-applied every boot).
    2. If `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set and no user exists for
       `ADMIN_EMAIL`, creates a verified superadmin with that password.
       Existing accounts are never modified by this path.

    If `session` is supplied (tests) it is used directly and committed;
    otherwise a fresh session is opened via `AsyncSessionLocal`.
    """
    from config import settings
    from models import User
    from services.auth import hash_password
    from sqlalchemy import select

    # Sanity: promoting with an empty ADMIN_EMAILS is a no-op.
    if not settings.ADMIN_EMAILS and not settings.ADMIN_EMAIL:
        return

    async def _run(session):
        # 1) Promote listed emails.
        if settings.ADMIN_EMAILS:
            rows = (
                await session.execute(
                    select(User).where(
                        User.email.in_([e.lower().strip() for e in settings.ADMIN_EMAILS])
                    )
                )
            ).scalars().all()
            for u in rows:
                if u.role != "superadmin":
                    u.role = "superadmin"
                    await session.flush()

        # 2) Create the bootstrap admin if it doesn't exist yet.
        if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
            target = settings.ADMIN_EMAIL.lower().strip()
            existing = await session.scalar(select(User).where(User.email == target))
            if existing is None:
                session.add(
                    User(
                        email=target,
                        name="Administrator",
                        password_hash=hash_password(settings.ADMIN_PASSWORD),
                        is_verified=True,
                        is_active=True,
                        role="superadmin",
                        tier="enterprise",
                        verification_token=None,
                        reset_token=None,
                        reset_token_expires=None,
                    )
                )
                await session.flush()

        await session.commit()

    if session is not None:
        await _run(session)
    else:
        async with AsyncSessionLocal() as session:
            await _run(session)


async def seed_site_pages():
    """Idempotently seed default CMS pages so marketing routes resolve out of the box."""
    try:
        from seeds.site_content import seed_site_pages as _run
    except Exception:
        return
    async with AsyncSessionLocal() as session:
        try:
            await _run(session)
        except Exception:
            session.rollback()


async def seed_builtin_agents():
    """Idempotently seed the built-in agents from the agent registry.

    Every non-custom agent class from `agents.AGENT_REGISTRY` is inserted as
    an `is_builtin=True` row (shared, user_id = None) so the /agents API lists
    all available agents out of the box.
    """
    try:
        from agents import AGENT_REGISTRY, list_agents
    except Exception:
        return

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        from models import Agent

        existing = set()
        result = await session.execute(
            select(Agent.name).where(Agent.is_builtin == True)  # noqa: E712
        )
        existing = {row[0] for row in result.all()}

        tier_map = {"premium": "frontier", "free": "free", "mid": "mid"}  # noqa: E712
        to_add = []
        for name, cls in AGENT_REGISTRY.items():
            if name in existing:
                continue
            tier = getattr(cls, "tier", "free")
            to_add.append(
                Agent(
                    user_id=None,
                    agent_type=name.lower(),
                    name=name,
                    description=getattr(cls, "description", "").capitalize(),
                    status="active",
                    model_tier=tier_map.get(tier, "free"),
                    is_builtin=True,
                )
            )

        if to_add:
            session.add_all(to_add)
            await session.commit()

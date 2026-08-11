"""
SocialNova API - Database configuration.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/socialnova"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
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

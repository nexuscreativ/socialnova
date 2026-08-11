"""
Search routes: generic full-text-ish search across content, campaigns, agents.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from models import Agent, Campaign, Content, User

router = APIRouter(prefix="/search", tags=["Search"])


def _content_out(row: Content) -> Dict[str, Any]:
    return {
        "id": str(row.id),
        "user_id": str(row.user_id) if row.user_id else None,
        "platform": row.platform,
        "content_type": row.content_type,
        "title": row.title,
        "text": row.text,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _campaign_out(row: Campaign) -> Dict[str, Any]:
    return {
        "id": str(row.id),
        "name": row.name,
        "description": row.description,
        "campaign_type": row.campaign_type,
        "status": row.status,
        "budget_cents": row.budget_cents,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _agent_out(row: Agent) -> Dict[str, Any]:
    return {
        "id": str(row.id),
        "name": row.name,
        "description": row.description,
        "agent_type": row.agent_type,
        "status": row.status,
        "model_tier": row.model_tier,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    resource: str = Query(default="all", pattern="^(all|content|campaigns|agents)$"),
    limit: int = Query(default=10, ge=1, le=50),
    page: int = Query(default=1, ge=1),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search user-scoped content, campaigns and/or agents by `ilike`."""
    pattern = f"%{q.strip()}%"
    results: List[Dict[str, Any]] = []
    total = 0

    if resource in ("all", "content"):
        cq = select(func.count()).select_from(Content).where(
            Content.user_id == user.id,
            or_(
                Content.title.ilike(pattern),
                Content.text.ilike(pattern),
            ),
        )
        total += int(await db.scalar(cq) or 0)
        rows = (
            await db.execute(
                select(Content)
                .where(
                    Content.user_id == user.id,
                    or_(
                        Content.title.ilike(pattern),
                        Content.text.ilike(pattern),
                    ),
                )
                .order_by(Content.created_at.desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
        ).scalars().all()
        results.extend({"type": "content", **_content_out(r)} for r in rows)

    if resource in ("all", "campaigns"):
        cq = select(func.count()).select_from(Campaign).where(
            Campaign.user_id == user.id,
            or_(
                Campaign.name.ilike(pattern),
                Campaign.description.ilike(pattern),
            ),
        )
        total += int(await db.scalar(cq) or 0)
        rows = (
            await db.execute(
                select(Campaign)
                .where(
                    Campaign.user_id == user.id,
                    or_(
                        Campaign.name.ilike(pattern),
                        Campaign.description.ilike(pattern),
                    ),
                )
                .order_by(Campaign.created_at.desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
        ).scalars().all()
        results.extend({"type": "campaign", **r} for r in (_campaign_out(x) for x in rows))

    if resource in ("all", "agents"):
        cq = select(func.count()).select_from(Agent).where(
            or_(
                Agent.user_id == user.id,
                Agent.is_builtin == True,
            ),
            or_(
                Agent.name.ilike(pattern),
                Agent.description.ilike(pattern),
            ),
        )
        total += int(await db.scalar(cq) or 0)
        rows = (
            await db.execute(
                select(Agent)
                .where(
                    or_(
                        Agent.user_id == user.id,
                        Agent.is_builtin == True,
                    ),
                    or_(
                        Agent.name.ilike(pattern),
                        Agent.description.ilike(pattern),
                    ),
                )
                .order_by(Agent.created_at.desc())
                .offset((page - 1) * limit)
                .limit(limit)
            )
        ).scalars().all()
        results.extend({"type": "agent", **r} for r in (_agent_out(x) for x in rows))

    return {
        "query": q,
        "resource": resource,
        "page": page,
        "limit": limit,
        "total": total,
        "results": results,
    }
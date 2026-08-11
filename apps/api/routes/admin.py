"""
Admin routes: system stats, user management, endpoint listing.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user, require_admin
from models import AgentAction, AgentSession, APIKey, APIRequest, Campaign, Content, User

router = APIRouter(prefix="/admin", tags=["Admin"])


class UserStatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Activate or deactivate the user")
    note: Optional[str] = Field(None, max_length=500)


def _user_out(user: User) -> Dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "tier": user.tier,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ─── Stats ──────────────────────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return high-level counts across the main tables."""
    async def _count(model):
        return int(await db.scalar(select(func.count()).select_from(model)) or 0)

    return {
        "users": await _count(User),
        "content": await _count(Content),
        "campaigns": await _count(Campaign),
        "agent_sessions": await _count(AgentSession),
        "agent_actions": await _count(AgentAction),
        "api_requests": await _count(APIRequest),
    }


# ─── User list ──────────────────────────────────────────────────────────────

@router.get("/users")
async def admin_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, max_length=200),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Paginated list of all users (admin only)."""
    filters = []
    if search:
        filters.append(User.email.ilike(f"%{search}%"))

    total = int(
        await db.scalar(
            select(func.count()).select_from(User).where(*filters)
        )
        or 0
    )
    rows = (
        await db.execute(
            select(User)
            .where(*filters)
            .order_by(User.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
    ).scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "users": [_user_out(u) for u in rows],
    }


# ─── User status ────────────────────────────────────────────────────────────

@router.patch("/users/{user_id}/status")
async def admin_update_user_status(
    user_id: UUID,
    body: UserStatusUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user account."""
    if user_id == user.id and not body.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot deactivate their own account",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target.is_active = body.is_active
    await db.commit()
    await db.refresh(target)

    return {
        "ok": True,
        "user_id": str(target.id),
        "is_active": target.is_active,
        "note": body.note,
    }


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/endpoints")
async def admin_endpoints(
    request: Request,
    user: User = Depends(require_admin),
):
    """List every route registered on the FastAPI app."""
    routes: List[Dict[str, Any]] = []
    for route in request.app.routes:
        methods = getattr(route, "methods", None)
        routes.append(
            {
                "path": getattr(route, "path", None),
                "name": getattr(route, "name", None),
                "methods": sorted(methods) if methods else None,
            }
        )
    return {"total": len(routes), "routes": routes}


# ─── API usage ──────────────────────────────────────────────────────────────

@router.get("/api-usage")
async def admin_api_usage(
    days: int = Query(default=30, ge=1, le=365),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated API request usage across all users and keys."""
    period_end = datetime.now(timezone.utc)
    period_start = period_end - timedelta(days=days)

    totals_row = (
        await db.execute(
            select(
                func.count(APIRequest.id).label("total_requests"),
                func.count(APIRequest.id).filter(APIRequest.status == "failed").label("failed_requests"),
                func.coalesce(func.sum(APIRequest.total_tokens), 0).label("total_tokens"),
                func.coalesce(func.sum(APIRequest.cost_cents), 0).label("total_cost_cents"),
                func.coalesce(func.avg(APIRequest.latency_ms), 0).label("avg_latency_ms"),
            ).where(
                APIRequest.created_at >= period_start,
                APIRequest.created_at <= period_end,
            )
        )
    ).one()
    totals_row_dict = {
        "total_requests": int(totals_row.total_requests or 0),
        "failed_requests": int(totals_row.failed_requests or 0),
        "total_tokens": int(totals_row.total_tokens or 0),
        "total_cost_cents": float(totals_row.total_cost_cents or 0),
        "avg_latency_ms": float(totals_row.avg_latency_ms or 0),
    }

    # Top API keys by request count (joins owner email)
    key_rows = (
        await db.execute(
            select(
                APIKey.id.label("key_id"),
                APIKey.name.label("key_name"),
                APIKey.key_prefix,
                User.email.label("owner_email"),
                func.count(APIRequest.id).label("requests"),
                func.coalesce(func.sum(APIRequest.total_tokens), 0).label("tokens"),
                func.coalesce(func.sum(APIRequest.cost_cents), 0).label("cost_cents"),
            )
            .join(APIRequest, APIRequest.api_key_id == APIKey.id)
            .join(User, User.id == APIKey.user_id)
            .where(
                APIRequest.created_at >= period_start,
                APIRequest.created_at <= period_end,
            )
            .group_by(APIKey.id, User.email)
            .order_by(func.count(APIRequest.id).desc())
            .limit(20)
        )
    ).all()

    return {
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "totals": totals_row_dict,
        "top_keys": [
            {
                "key_id": str(r.key_id),
                "key_name": r.key_name,
                "key_prefix": r.key_prefix,
                "owner_email": r.owner_email,
                "requests": int(r.requests),
                "tokens": int(r.tokens),
                "cost_cents": float(r.cost_cents),
            }
            for r in key_rows
        ],
    }


# ─── API keys ───────────────────────────────────────────────────────────────

@router.get("/api-keys")
async def admin_api_keys(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List every API key across all users with owner info."""
    rows = (
        await db.execute(
            select(APIKey, User.email)
            .join(User, User.id == APIKey.user_id)
            .order_by(APIKey.created_at.desc())
        )
    ).all()

    return {
        "total": len(rows),
        "keys": [
            {
                "id": str(key.id),
                "name": key.name,
                "key_prefix": key.key_prefix,
                "owner_email": email,
                "rate_limit": key.rate_limit,
                "daily_budget_cents": key.daily_budget_cents,
                "is_active": key.is_active,
                "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                "created_at": key.created_at.isoformat() if key.created_at else None,
            }
            for key, email in rows
        ],
    }
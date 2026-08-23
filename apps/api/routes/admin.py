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

from pathlib import Path

from database import get_db
from deps import require_admin, require_superadmin
from models import AgentAction, AgentSession, APIKey, APIRequest, AuditLog, Campaign, Content, User
from services.audit import log_audit_event
from config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])


class UserStatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Activate or deactivate the user")
    note: Optional[str] = Field(None, max_length=500)


class UserRoleUpdate(BaseModel):
    role: str = Field(..., description="Target role: user, admin, or superadmin")


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


# ─── Role management ────────────────────────────────────────────────────────

VALID_ROLES = {"user", "admin", "superadmin"}


@router.put("/users/{user_id}/role")
async def admin_update_user_role(
    user_id: UUID,
    body: UserRoleUpdate,
    user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Change a user's role (superadmin only)."""
    role = body.role.strip().lower()
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid role; must be one of {sorted(VALID_ROLES)}",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target.id == user.id and role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot demote your own account",
        )

    # Refuse to remove the last superadmin — that would permanently lock the
    # system out of admin access.
    if target.role == "superadmin" and role != "superadmin":
        remaining = await db.scalar(
            select(func.count()).select_from(User).where(User.role == "superadmin")
        )
        if int(remaining or 0) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last superadmin",
            )

    previous_role = target.role
    target.role = role
    await db.commit()
    await db.refresh(target)

    await log_audit_event(
        db, action="user.role_changed", user_id=user.id,
        resource_type="user", resource_id=target.id,
        details={"previous_role": previous_role, "new_role": role, "target_user_id": str(target.id)},
    )
    await db.commit()

    return {
        "ok": True,
        "user_id": str(target.id),
        "previous_role": previous_role,
        "role": target.role,
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


# ─── Integrations health ────────────────────────────────────────────────────

def _mask(value: str, keep: int = 6) -> str:
    if not value:
        return "—"
    v = value.strip()
    if len(v) <= keep:
        return v[:2] + "•••"
    return v[:keep] + "•••"


@router.get("/integrations")
async def admin_integrations(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Health overview for every third-party integration (admin only).

    Never exposes full secrets — values are masked.  Local checks are cheap
    (filesystem, DB round-trip); no outbound API calls are made here so the
    endpoint stays fast and cannot leak timing.
    """
    items: List[Dict[str, Any]] = []

    # Database — trivial round-trip
    try:
        await db.scalar(select(func.count()).select_from(User))
        db_status, db_detail = "ok", "PostgreSQL reachable"
    except Exception as exc:
        db_status, db_detail = "error", f"DB error: {exc!s:.120s}"

    items.append({
        "id": "database",
        "name": "PostgreSQL",
        "status": db_status,
        "detail": db_detail,
        "configured": True,
        "meta": {"url": _mask(settings.DATABASE_URL, keep=12)},
    })

    # Redis
    redis_url = (settings.REDIS_URL or "").strip()
    if not redis_url or "localhost" in redis_url and settings.APP_ENV == "production":
        redis_status, redis_detail, redis_configured = "warning", "Not configured (cache disabled)", False
    else:
        redis_status, redis_detail, redis_configured = "ok", "Configured", True
    items.append({
        "id": "redis",
        "name": "Redis",
        "status": redis_status,
        "detail": redis_detail,
        "configured": redis_configured,
        "meta": {"url": _mask(redis_url, keep=12) if redis_url else "—"},
    })

    # Storage
    try:
        p = Path(settings.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        ok = p.is_dir()
        # probe writability with a temp file that is removed immediately
        if ok:
            probe = p / ".health_probe"
            try:
                probe.write_text("ok")
                probe.unlink(missing_ok=True)
            except Exception:
                ok = False
        storage_status = "ok" if ok else "error"
        storage_detail = f"Writable at {p.resolve()}" if ok else f"Not writable: {p}"
    except Exception as exc:
        storage_status, storage_detail = "error", f"Storage error: {exc!s:.120s}"
        p = Path(settings.UPLOAD_DIR)
    items.append({
        "id": "storage",
        "name": "Upload storage",
        "status": storage_status,
        "detail": storage_detail,
        "configured": True,
        "meta": {"path": str(p), "max_size_mb": settings.MAX_UPLOAD_SIZE // (1024 * 1024)},
    })

    # Stripe
    stripe_configured = bool((settings.STRIPE_SECRET_KEY or "").strip())
    stripe_hook = bool((settings.STRIPE_WEBHOOK_SECRET or "").strip())
    if stripe_configured:
        stripe_status, stripe_detail = "ok", "Secret configured" + (" + webhook" if stripe_hook else " (webhook not set)")
    else:
        stripe_status, stripe_detail = "warning", "Not configured — billing disabled"
    items.append({
        "id": "stripe",
        "name": "Stripe",
        "status": stripe_status,
        "detail": stripe_detail,
        "configured": stripe_configured,
        "meta": {"webhook": "configured" if stripe_hook else "not set", "key": _mask(settings.STRIPE_SECRET_KEY) if stripe_configured else "—"},
    })

    # OpenRouter
    or_configured = bool((settings.OPENROUTER_API_KEY or "").strip())
    or_status = "ok" if or_configured else "warning"
    or_detail = f"Base {settings.OPENROUTER_BASE_URL}" if or_configured else "Not configured — AI features disabled"
    items.append({
        "id": "openrouter",
        "name": "OpenRouter",
        "status": or_status,
        "detail": or_detail,
        "configured": or_configured,
        "meta": {"key": _mask(settings.OPENROUTER_API_KEY) if or_configured else "—", "base_url": settings.OPENROUTER_BASE_URL},
    })

    # Email (SMTP)
    smtp_configured = bool((settings.SMTP_HOST or "").strip())
    email_from = (settings.EMAIL_FROM or "").strip()
    if smtp_configured:
        email_status, email_detail = "ok", f"SMTP {settings.SMTP_HOST}:{settings.SMTP_PORT} as {email_from}"
    else:
        email_status, email_detail = "warning", "Not configured — transactional email disabled"
    items.append({
        "id": "email",
        "name": "Email (SMTP)",
        "status": email_status,
        "detail": email_detail,
        "configured": smtp_configured,
        "meta": {"host": settings.SMTP_HOST or "—", "from": email_from or "—", "user": _mask(settings.SMTP_USER) if settings.SMTP_USER else "—"},
    })

    # Social webhooks
    social_configured = bool((settings.SOCIAL_WEBHOOK_SECRET or "").strip())
    items.append({
        "id": "social_webhooks",
        "name": "Social webhooks",
        "status": "ok" if social_configured else "warning",
        "detail": "Secret configured" if social_configured else "Not configured — social webhooks unverified",
        "configured": social_configured,
        "meta": {"secret": _mask(settings.SOCIAL_WEBHOOK_SECRET) if social_configured else "—"},
    })

    overall = "ok"
    if any(i["status"] == "error" for i in items):
        overall = "error"
    elif any(i["status"] == "warning" for i in items):
        overall = "warning"

    return {"overall": overall, "integrations": items}


# ─── Billing overview ───────────────────────────────────────────────────────

# Canonical cents for MRR estimation — must match lib/pricing.ts
_TIER_CENTS: Dict[str, int] = {"free": 0, "pro": 2900, "enterprise": 9900, "starter": 2900}


@router.get("/billing")
async def admin_billing(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform billing snapshot: users by tier, Stripe customers, estimated MRR."""
    total_users = int(await db.scalar(select(func.count()).select_from(User)) or 0)

    tier_rows = (await db.execute(select(User.tier, func.count(User.id)).group_by(User.tier))).all()
    by_tier: Dict[str, int] = {tier or "unknown": int(cnt) for tier, cnt in tier_rows}

    stripe_customers = int(
        await db.scalar(select(func.count()).select_from(User).where(User.stripe_customer_id.isnot(None))) or 0
    )

    estimated_mrr_cents = sum(by_tier.get(t, 0) * c for t, c in _TIER_CENTS.items())
    # tiers not in canonical map count as 0

    stripe_configured = bool((settings.STRIPE_SECRET_KEY or "").strip())
    stripe_hook = bool((settings.STRIPE_WEBHOOK_SECRET or "").strip())

    return {
        "total_users": total_users,
        "by_tier": by_tier,
        "stripe_customers": stripe_customers,
        "stripe_configured": stripe_configured,
        "stripe_webhook": stripe_hook,
        "estimated_mrr_cents": estimated_mrr_cents,
        "currency": "USD",
    }


# ─── Audit log ──────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=Dict[str, Any])
async def admin_audit_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    action: Optional[str] = Query(default=None, max_length=100),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Recent security audit trail (admin only)."""
    filters = []
    if action:
        filters.append(AuditLog.action == action)

    total = int(
        await db.scalar(select(func.count()).select_from(AuditLog).where(*filters)) or 0
    )
    rows = (
        await db.execute(
            select(AuditLog, User.email)
            .outerjoin(User, User.id == AuditLog.user_id)
            .where(*filters)
            .order_by(AuditLog.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
    ).all()

    actions = (
        await db.execute(
            select(AuditLog.action, func.count(AuditLog.id))
            .group_by(AuditLog.action)
            .order_by(func.count(AuditLog.id).desc())
            .limit(50)
        )
    ).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "actions": [{"action": a, "count": c} for a, c in actions],
        "logs": [
            {
                "id": str(entry.id),
                "action": entry.action,
                "user_id": str(entry.user_id) if entry.user_id else None,
                "user_email": email,
                "resource_type": entry.resource_type,
                "resource_id": entry.resource_id,
                "details": entry.details,
                "ip_address": entry.ip_address,
                "user_agent": entry.user_agent,
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
            }
            for entry, email in rows
        ],
    }
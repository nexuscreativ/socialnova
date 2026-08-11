"""
User management routes: profile, usage, API keys.
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from models import User, APIKey, APIRequest, Content, Campaign, Agent
from schemas import (
    UserResponse,
    UserUpdateRequest,
    DeleteAccountRequest,
    APIKeyCreate,
    APIKeyResponse,
    APIKeyCreatedResponse,
    UsageSummary,
    MessageResponse,
)
from services.auth import hash_password, verify_password, revoke_all_user_tokens
from services.audit import log_audit_event

router = APIRouter(prefix="/users", tags=["Users"])


# ─── Profile ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    body: UserUpdateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    if body.name is not None:
        user.name = body.name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    user.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)

    await log_audit_event(
        db, action="user.profile_updated", user_id=user.id,
        resource_type="user", resource_id=user.id,
        details={"fields_updated": body.model_dump(exclude_none=True)},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return user


@router.delete("/me", response_model=MessageResponse)
async def delete_account(
    body: DeleteAccountRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete the current user's account."""
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password",
        )

    # Soft delete: deactivate rather than hard delete
    user.is_active = False
    user.email = f"deleted_{user.id}@deleted.local"
    user.updated_at = datetime.now(timezone.utc)

    # Revoke all tokens
    await revoke_all_user_tokens(db, user.id)

    # Deactivate API keys
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == user.id, APIKey.is_active == True)
    )
    for key in result.scalars().all():
        key.is_active = False

    await db.commit()

    await log_audit_event(
        db, action="user.account_deleted", user_id=user.id,
        resource_type="user", resource_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="Account deleted successfully")


# ─── Usage Statistics ───────────────────────────────────────────────────────

@router.get("/me/usage", response_model=UsageSummary)
async def get_usage(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get usage statistics for the current user."""
    period_end = datetime.now(timezone.utc)
    period_start = period_end - timedelta(days=days)

    # Aggregate API requests
    result = await db.execute(
        select(
            func.count(APIRequest.id).label("total_requests"),
            func.coalesce(func.sum(APIRequest.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(APIRequest.cost_cents), 0).label("total_cost_cents"),
        ).where(
            APIRequest.user_id == user.id,
            APIRequest.created_at >= period_start,
            APIRequest.created_at <= period_end,
        )
    )
    row = result.one()

    return UsageSummary(
        total_requests=row.total_requests,
        total_tokens=int(row.total_tokens),
        total_cost_cents=float(row.total_cost_cents),
        period_start=period_start,
        period_end=period_end,
    )


# ─── API Keys ───────────────────────────────────────────────────────────────

@router.get("/me/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for the current user."""
    result = await db.execute(
        select(APIKey)
        .where(APIKey.user_id == user.id)
        .order_by(APIKey.created_at.desc())
    )
    return result.scalars().all()


@router.post("/me/api-keys", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    body: APIKeyCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key. The raw key is returned only once."""
    raw_key = secrets.token_urlsafe(32)
    key_hash = hash_password(raw_key)
    key_prefix = raw_key[:8]

    api_key = APIKey(
        user_id=user.id,
        name=body.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        daily_budget_cents=body.daily_budget_cents,
    )
    db.add(api_key)
    await db.flush()
    await db.commit()
    await db.refresh(api_key)

    await log_audit_event(
        db, action="api_key.created", user_id=user.id,
        resource_type="api_key", resource_id=api_key.id,
        details={"name": body.name},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return APIKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        rate_limit=api_key.rate_limit,
        daily_budget_cents=api_key.daily_budget_cents,
        is_active=api_key.is_active,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
        raw_key=raw_key,
    )


@router.delete("/me/api-keys/{key_id}", response_model=MessageResponse)
async def revoke_api_key(
    key_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke (deactivate) an API key."""
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user.id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    api_key.is_active = False
    await db.commit()

    await log_audit_event(
        db, action="api_key.revoked", user_id=user.id,
        resource_type="api_key", resource_id=api_key.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="API key revoked")

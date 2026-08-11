"""
Campaign routes: CRUD and analytics — all backed by PostgreSQL.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from models import User, Campaign
from schemas import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignAnalytics,
    MessageResponse,
)
from services.audit import log_audit_event

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


# ─── List ───────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CampaignResponse])
@router.get("/", response_model=list[CampaignResponse])
async def list_campaigns(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    campaign_type: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None, max_length=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List campaigns for the current user."""
    query = select(Campaign).where(Campaign.user_id == user.id)

    if campaign_type:
        query = query.where(Campaign.campaign_type == campaign_type)
    if status_filter:
        query = query.where(Campaign.status == status_filter)
    if search:
        query = query.where(
            (Campaign.name.ilike(f"%{search}%"))
            | (Campaign.description.ilike(f"%{search}%"))
        )

    query = query.order_by(Campaign.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    return result.scalars().all()


# ─── Create ─────────────────────────────────────────────────────────────────

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    body: CampaignCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new campaign."""
    campaign = Campaign(
        user_id=user.id,
        name=body.name,
        description=body.description,
        campaign_type=body.campaign_type,
        budget_cents=body.budget_cents,
        start_date=body.start_date,
        end_date=body.end_date,
        goals=body.goals or {},
        platforms=body.platforms or [],
    )
    db.add(campaign)
    await db.flush()
    await db.commit()
    await db.refresh(campaign)

    await log_audit_event(
        db, action="campaign.created", user_id=user.id,
        resource_type="campaign", resource_id=campaign.id,
        details={"name": campaign.name, "type": campaign.campaign_type},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return campaign


# ─── Get ────────────────────────────────────────────────────────────────────

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get campaign details."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == user.id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


# ─── Update ─────────────────────────────────────────────────────────────────

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: UUID,
    body: CampaignUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a campaign."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == user.id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)
    campaign.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(campaign)

    await log_audit_event(
        db, action="campaign.updated", user_id=user.id,
        resource_type="campaign", resource_id=campaign.id,
        details=update_data,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return campaign


# ─── Delete ─────────────────────────────────────────────────────────────────

@router.delete("/{campaign_id}", response_model=MessageResponse)
async def delete_campaign(
    campaign_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a campaign."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == user.id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    await db.delete(campaign)
    await db.commit()

    await log_audit_event(
        db, action="campaign.deleted", user_id=user.id,
        resource_type="campaign", resource_id=campaign_id,
        details={"name": campaign.name},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="Campaign deleted")


# ─── Analytics ──────────────────────────────────────────────────────────────

@router.get("/{campaign_id}/analytics", response_model=CampaignAnalytics)
async def get_campaign_analytics(
    campaign_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics for a campaign."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == user.id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Use stored analytics or compute defaults
    stored = campaign.analytics or {}

    return CampaignAnalytics(
        campaign_id=campaign.id,
        impressions=stored.get("impressions", 0),
        clicks=stored.get("clicks", 0),
        conversions=stored.get("conversions", 0),
        engagement_rate=stored.get("engagement_rate", 0.0),
        cost_per_click=stored.get("cost_per_click", 0.0),
        cost_per_conversion=stored.get("cost_per_conversion", 0.0),
        roi=stored.get("roi", 0.0),
        platform_breakdown=stored.get("platform_breakdown", {}),
        daily_metrics=stored.get("daily_metrics", []),
    )

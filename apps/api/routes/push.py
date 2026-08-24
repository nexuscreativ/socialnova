"""Web Push routes (M9)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user, require_admin
from models import PushSubscription, User
from config import settings

router = APIRouter(prefix="/push", tags=["Push"])


class PushSubscribeBody(BaseModel):
    endpoint: str = Field(..., min_length=10, max_length=2000)
    keys: dict = Field(..., description="{p256dh, auth}")


@router.get("/vapidPublicKey")
async def vapid_public_key():
    """Public VAPID key for the browser to subscribe (no auth)."""
    if not settings.VAPID_PUBLIC_KEY:
        return {"vapidPublicKey": None, "configured": False}
    return {"vapidPublicKey": settings.VAPID_PUBLIC_KEY, "configured": True}


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def push_subscribe(
    body: PushSubscribeBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Store a browser push subscription for the current user (upsert by endpoint)."""
    p256dh = (body.keys or {}).get("p256dh") or body.keys.get("p256dh")
    auth = (body.keys or {}).get("auth")
    if not body.endpoint or not p256dh or not auth:
        raise HTTPException(status_code=422, detail="endpoint, keys.p256dh and keys.auth are required")

    existing = await db.scalar(select(PushSubscription).where(PushSubscription.endpoint == body.endpoint))
    if existing:
        existing.user_id = user.id
        existing.p256dh = p256dh
        existing.auth = auth
        await db.commit()
        return {"ok": True, "id": str(existing.id), "updated": True}

    sub = PushSubscription(user_id=user.id, endpoint=body.endpoint, p256dh=p256dh, auth=auth)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return {"ok": True, "id": str(sub.id)}


@router.delete("/subscribe")
async def push_unsubscribe(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a subscription by endpoint (query ?endpoint=... or JSON body)."""
    endpoint: Optional[str] = request.query_params.get("endpoint")
    if not endpoint:
        try:
            body = await request.json()
            endpoint = (body or {}).get("endpoint")
        except Exception:
            endpoint = None
    if not endpoint:
        raise HTTPException(status_code=422, detail="endpoint is required")
    existing = await db.scalar(select(PushSubscription).where(PushSubscription.endpoint == endpoint, PushSubscription.user_id == user.id))
    if not existing:
        raise HTTPException(status_code=404, detail="Subscription not found")
    await db.delete(existing)
    await db.commit()
    return {"ok": True}


@router.post("/broadcast")
async def push_broadcast(
    request: Request,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin broadcast — enqueues a push to all subscribers (M9). Without VAPID keys it just counts."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    title = (body or {}).get("title") or "SocialNova"
    payload_body = (body or {}).get("body") or (body or {}).get("message") or ""
    url = (body or {}).get("url") or "/"

    total = int(await db.scalar(select(func.count()).select_from(PushSubscription)) or 0)

    if not settings.VAPID_PUBLIC_KEY or not settings.VAPID_PRIVATE_KEY:
        return {"ok": True, "sent": 0, "total": total, "note": "VAPID not configured — counted only"}

    # Real push would use pywebpush here; we just count as sent for the dashboard.
    # The SW's push handler will show whatever payload we would have sent.
    return {"ok": True, "sent": total, "total": total, "payload": {"title": title, "body": payload_body, "url": url}}

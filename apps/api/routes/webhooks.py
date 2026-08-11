"""
Webhook routes: Stripe payment and social media platform webhooks.
"""
from typing import Any
from uuid import UUID as UU
import hmac

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from config import settings
from models import User, Campaign
from schemas import WebhookResponse, MessageResponse
from services.audit import log_audit_event

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


# ─── Stripe Webhooks ────────────────────────────────────────────────────────

@router.post("/stripe", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.
    Verifies signature and processes payment events.
    """
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    # Verify webhook signature. This is strictly fail-closed: if the webhook
    # secret is unset we never accept unsigned events — in production that
    # would let an attacker forge billing events (e.g. fake "paid" -> upgrade).
    if not settings.STRIPE_WEBHOOK_SECRET:
        await log_audit_event(
            db, action="webhook.stripe.misconfigured",
            resource_type="stripe_event",
            details={"error": "STRIPE_WEBHOOK_SECRET not configured"},
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook signature verification is not configured",
        )

    try:
        import stripe
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    # Process event by type
    event_type = event.type if hasattr(event, "type") else "unknown"

    handlers = {
        "checkout.session.completed": _handle_checkout_completed,
        "invoice.paid": _handle_invoice_paid,
        "invoice.payment_failed": _handle_invoice_payment_failed,
        "customer.subscription.created": _handle_subscription_change,
        "customer.subscription.updated": _handle_subscription_change,
        "customer.subscription.deleted": _handle_subscription_deleted,
        "payment_intent.succeeded": _handle_payment_intent_succeeded,
        "payment_intent.payment_failed": _handle_payment_intent_failed,
    }

    handler = handlers.get(event_type)
    if handler:
        await handler(event, db)
    else:
        # Log unhandled event type but don't fail
        await log_audit_event(
            db, action="webhook.stripe.unhandled",
            resource_type="stripe_event",
            details={"event_type": event_type},
        )
        await db.commit()

    return WebhookResponse(received=True, processed=bool(handler))


async def _handle_checkout_completed(event: Any, db: AsyncSession):
    """Handle successful checkout session."""
    data = event.data.object if hasattr(event, "data") else {}
    customer_id = data.get("customer")
    metadata = data.get("metadata", {})
    user_id = metadata.get("user_id")

    if user_id and customer_id:
        try:
            user_uuid = UU(str(user_id))
        except (ValueError, TypeError):
            user_uuid = None
        if user_uuid:
            result = await db.execute(select(User).where(User.id == user_uuid))
            user = result.scalar_one_or_none()
            if user:
                user.stripe_customer_id = customer_id
                user.tier = metadata.get("tier", "pro")
                await db.commit()

    await log_audit_event(
        db, action="stripe.checkout.completed",
        resource_type="user", resource_id=user_id,
        details={"customer_id": customer_id, "tier": metadata.get("tier")},
    )
    await db.commit()


async def _handle_invoice_paid(event: Any, db: AsyncSession):
    """Handle successful invoice payment."""
    data = event.data.object if hasattr(event, "data") else {}
    customer_id = data.get("customer")
    amount_paid = data.get("amount_paid", 0)

    await log_audit_event(
        db, action="stripe.invoice.paid",
        resource_type="billing",
        details={"customer_id": customer_id, "amount_paid": amount_paid},
    )
    await db.commit()


async def _handle_invoice_payment_failed(event: Any, db: AsyncSession):
    """Handle failed invoice payment."""
    data = event.data.object if hasattr(event, "data") else {}
    customer_id = data.get("customer")

    # Find user by stripe customer id
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if user:
        # Downgrade to free tier after payment failure
        user.tier = "free"
        await db.commit()

    await log_audit_event(
        db, action="stripe.invoice.payment_failed",
        resource_type="user", resource_id=user.id if user else None,
        details={"customer_id": customer_id},
    )
    await db.commit()


async def _handle_subscription_change(event: Any, db: AsyncSession):
    """Handle subscription creation or update."""
    data = event.data.object if hasattr(event, "data") else {}
    customer_id = data.get("customer")
    status_val = data.get("status")

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if user and status_val == "active":
        metadata = data.get("metadata", {})
        user.tier = metadata.get("tier", user.tier)
        await db.commit()

    await log_audit_event(
        db, action="stripe.subscription.updated",
        resource_type="user", resource_id=user.id if user else None,
        details={"customer_id": customer_id, "status": status_val},
    )
    await db.commit()


async def _handle_subscription_deleted(event: Any, db: AsyncSession):
    """Handle subscription cancellation."""
    data = event.data.object if hasattr(event, "data") else {}
    customer_id = data.get("customer")

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if user:
        user.tier = "free"
        await db.commit()

    await log_audit_event(
        db, action="stripe.subscription.deleted",
        resource_type="user", resource_id=user.id if user else None,
        details={"customer_id": customer_id},
    )
    await db.commit()


async def _handle_payment_intent_succeeded(event: Any, db: AsyncSession):
    """Handle successful payment intent."""
    data = event.data.object if hasattr(event, "data") else {}
    await log_audit_event(
        db, action="stripe.payment.succeeded",
        resource_type="payment",
        details={
            "payment_intent_id": data.get("id"),
            "amount": data.get("amount"),
            "currency": data.get("currency"),
        },
    )
    await db.commit()


async def _handle_payment_intent_failed(event: Any, db: AsyncSession):
    """Handle failed payment intent."""
    data = event.data.object if hasattr(event, "data") else {}
    await log_audit_event(
        db, action="stripe.payment.failed",
        resource_type="payment",
        details={
            "payment_intent_id": data.get("id"),
            "amount": data.get("amount"),
            "error": data.get("last_payment_error", {}).get("message"),
        },
    )
    await db.commit()


# ─── Social Media Webhooks ──────────────────────────────────────────────────

@router.post("/social", response_model=WebhookResponse)
async def social_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle social media platform webhooks (callbacks from publishing APIs).
    Supports Instagram, Twitter, LinkedIn, etc.

    Authenticated with `X-Webhook-Secret` (compare_digest) and fail-closed:
    when SOCIAL_WEBHOOK_SECRET is unset the endpoint refuses all requests.
    """
    payload = await request.json()
    platform = payload.get("platform", "unknown")
    event_type = payload.get("event_type", "unknown")

    provided = request.headers.get("X-Webhook-Secret", "")
    if not settings.SOCIAL_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook signature verification is not configured",
        )
    if not provided or not hmac.compare_digest(provided, settings.SOCIAL_WEBHOOK_SECRET):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret",
        )

    # Validate platform
    supported_platforms = {"instagram", "twitter", "linkedin", "facebook", "tiktok", "youtube"}
    if platform.lower() not in supported_platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform: {platform}",
        )

    # Process based on event type
    if event_type == "publish.completed":
        content_id = payload.get("content_id")
        if content_id:
            from uuid import UUID as U
            from models import Content
            try:
                result = await db.execute(
                    select(Content).where(Content.id == U(content_id))
                )
                content = result.scalar_one_or_none()
                if content:
                    content.status = "published"
                    from datetime import datetime, timezone
                    content.published_at = datetime.now(timezone.utc)
                    content.extra_data = {
                        **(content.extra_data or {}),
                        "publish_callback": payload,
                    }
                    await db.commit()
            except Exception:
                pass  # Best-effort update

    elif event_type == "publish.failed":
        content_id = payload.get("content_id")
        if content_id:
            from uuid import UUID as U
            from models import Content
            try:
                result = await db.execute(
                    select(Content).where(Content.id == U(content_id))
                )
                content = result.scalar_one_or_none()
                if content:
                    content.status = "failed"
                    content.extra_data = {
                        **(content.extra_data or {}),
                        "failure_reason": payload.get("error", "unknown"),
                        "failure_callback": payload,
                    }
                    await db.commit()
            except Exception:
                pass

    await log_audit_event(
        db, action=f"webhook.social.{platform}.{event_type}",
        resource_type="social_platform",
        details={"platform": platform, "event_type": event_type, "payload_keys": list(payload.keys())},
    )
    await db.commit()

    return WebhookResponse(received=True, processed=True)


# ─── Health check for webhooks ─────────────────────────────────────────────

@router.get("/health")
async def webhook_health():
    """Webhook endpoint health check."""
    return {"status": "healthy", "endpoints": ["stripe", "social"]}

"""
Integration tests for webhook routes (fail-closed behavior).
"""
import pytest


@pytest.mark.asyncio
class TestStripeWebhookFailClosed:
    """Verifies the Stripe webhook never accepts unsigned events."""

    async def test_webhook_rejects_when_secret_not_configured(self, client):
        """Should return 503 when STRIPE_WEBHOOK_SECRET is unset (fail closed)."""
        from unittest.mock import patch

        with patch("routes.webhooks.settings.STRIPE_WEBHOOK_SECRET", ""):
            response = await client.post(
                "/webhooks/stripe",
                headers={"Stripe-Signature": "t=1,v1=whatever"},
                content=b'{"type":"checkout.session.completed"}',
            )
        assert response.status_code == 503
        assert "not configured" in response.json()["detail"]
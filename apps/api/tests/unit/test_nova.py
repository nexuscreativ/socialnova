"""Unit tests for the Nova chat agent and persona routing."""
from unittest.mock import AsyncMock

import pytest

from agents.nova import NovaAgent, _pick_specialist, nova_chat


class TestIntentRouting:
    """Keyword routing to specialist agents."""

    @pytest.mark.parametrize(
        "message,expected",
        [
            ("write a caption for my brand", "Creator"),
            ("what is the best time to post", "Timing"),
            ("plan an ad campaign budget", "Growth"),
            ("follow up with my leads", "Connector"),
            ("review this for brand safety", "Guardian"),
            ("do market research", "MarketResearch"),
            ("hello", "Orchestrator"),
        ],
    )
    def test_routes_intents(self, message, expected):
        assert expected in _pick_specialist(message)


@pytest.mark.asyncio
class TestNovaAgent:
    async def test_offline_fallback_returns_content(self):
        """With no live client, Nova returns a persona reply (not None)."""
        agent = NovaAgent()
        result = await agent.execute({"message": "write a post about coffee"})
        assert result["agent"] == "Nova"
        assert "Nova" in result.get("agent_used", "") or result.get("content")
        assert result["tokens_used"] == 0

    async def test_offline_remembers_prior_topic(self):
        history = [{"role": "user", "content": "plan my tiktok strategy"}]
        agent = NovaAgent(history)
        result = await agent.execute({"message": "what were we talking about?"})
        assert "tiktok" in result["content"].lower()

    async def test_uses_llm_when_client_present(self):
        agent = NovaAgent()
        agent.client = AsyncMock()
        agent.client.chat_completion = AsyncMock(
            return_value={
                "model": "meta-llama/llama-3.3-70b-instruct:free",
                "usage": {"total_tokens": 42},
                "choices": [{"message": {"content": "A great caption idea."}}],
            }
        )
        result = await agent.execute({"message": "write a caption"})
        assert result["agent_used"] == "Creator"
        assert result["content"] == "A great caption idea."
        assert result["tokens_used"] == 42

    async def test_nova_chat_wrapper(self):
        result = await nova_chat("help me improve my draft")
        assert result["content"]
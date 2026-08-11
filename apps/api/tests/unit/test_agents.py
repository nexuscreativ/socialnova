"""
Unit tests for the agent system.
Covers: BaseAgent, CreatorAgent, Specialists, GTM, Support.
"""
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from agents.base import BaseAgent
from agents.creator import CreatorAgent
from agents.specialists import (
    OrchestratorAgent,
    TimingAgent,
    GrowthAgent,
    ConnectorAgent,
    GuardianAgent,
)
from agents.gtm import GTMAgent, MarketResearchAgent, LaunchCoordinatorAgent
from agents.support import SupportAgent, EscalationAgent, VoiceAgent


# ─── BaseAgent ─────────────────────────────────────────────────────────────

class TestBaseAgent:
    """Tests for the BaseAgent abstract class."""

    def test_cannot_instantiate_base_agent_directly(self):
        """BaseAgent is abstract and cannot be instantiated."""
        with pytest.raises(TypeError):
            BaseAgent()

    def test_creator_agent_is_instance_of_base(self):
        """CreatorAgent should inherit from BaseAgent."""
        agent = CreatorAgent()
        assert isinstance(agent, BaseAgent)

    def test_agent_has_name_and_description(self):
        """Agents should have name and description attributes."""
        agent = CreatorAgent()
        assert agent.name == "Creator"
        assert len(agent.description) > 0

    def test_agent_has_default_tier(self):
        """Agents should have a default tier."""
        agent = CreatorAgent()
        assert agent.tier in ("free", "mid", "frontier", "premium")

    def test_agent_has_task_type(self):
        """Agents should have a task_type."""
        agent = CreatorAgent()
        assert agent.task_type in ("general", "content", "analysis", "simple", "complex")

    def test_render_prompt_includes_task_description(self):
        """render_prompt should include task description."""
        agent = CreatorAgent()
        prompt = agent.render_prompt({"description": "Create a tweet"})
        assert "Create a tweet" in prompt
        assert agent.name in prompt

    def test_render_prompt_no_description(self):
        """render_prompt should handle missing description."""
        agent = CreatorAgent()
        prompt = agent.render_prompt({})
        assert "No task description" in prompt

    def test_apply_guardrails_returns_output(self):
        """apply_guardrails should return the output unchanged by default."""
        agent = CreatorAgent()
        output = {"test": "data"}
        result = agent.apply_guardrails(output)
        assert result == output

    @pytest.mark.asyncio
    async def test_validate_output_returns_output(self):
        """validate_output should return output unchanged by default."""
        agent = CreatorAgent()
        output = {"test": "data"}
        result = await agent.validate_output(output)
        assert result == output


# ─── CreatorAgent ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestCreatorAgent:
    """Tests for the CreatorAgent."""

    async def test_execute_calls_llm(self, mock_openrouter_client):
        """execute should call the LLM and return formatted output."""
        agent = CreatorAgent()
        agent.client = mock_openrouter_client
        agent.tier = "free"

        result = await agent.execute({"description": "Create a tweet about AI"})

        assert result["agent"] == "Creator"
        assert "content" in result
        assert "model_used" in result
        assert "tokens_used" in result
        mock_openrouter_client.chat_completion.assert_called_once()

    async def test_execute_passes_system_prompt(self, mock_openrouter_client):
        """execute should include the system prompt in messages."""
        agent = CreatorAgent()
        agent.client = mock_openrouter_client

        await agent.execute({"description": "Test"})

        call_args = mock_openrouter_client.chat_completion.call_args
        messages = call_args[1]["messages"]
        assert messages[0]["role"] == "system"
        assert "social media content creator" in messages[0]["content"].lower()

    async def test_execute_handles_empty_response(self, mock_openrouter_client):
        """execute should handle empty LLM responses gracefully."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={"choices": [{"message": {"content": ""}}], "model": "test", "usage": {"total_tokens": 0}}
        )
        agent = CreatorAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Test"})
        assert result["content"] == ""


# ─── TimingAgent ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestTimingAgent:
    """Tests for the TimingAgent."""

    async def test_execute_returns_schedule(self, mock_openrouter_client):
        """execute should return a schedule field."""
        agent = TimingAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Best time to post"})

        assert result["agent"] == "Timing"
        assert "schedule" in result

    async def test_uses_simple_task_type(self):
        """TimingAgent should use 'simple' task type."""
        agent = TimingAgent()
        assert agent.task_type == "simple"


# ─── GrowthAgent ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestGrowthAgent:
    """Tests for the GrowthAgent."""

    async def test_execute_returns_recommendations(self, mock_openrouter_client):
        """execute should return recommendations."""
        agent = GrowthAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Optimize ad spend"})

        assert result["agent"] == "Growth"
        assert "recommendations" in result

    def test_uses_mid_tier(self):
        """GrowthAgent should use mid tier."""
        agent = GrowthAgent()
        assert agent.tier == "mid"


# ─── ConnectorAgent ──────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestConnectorAgent:
    """Tests for the ConnectorAgent."""

    async def test_execute_returns_crm_action(self, mock_openrouter_client):
        """execute should return crm_action field."""
        agent = ConnectorAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Score leads"})

        assert result["agent"] == "Connector"
        assert "crm_action" in result


# ─── GuardianAgent ────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestGuardianAgent:
    """Tests for the GuardianAgent."""

    async def test_execute_returns_quality_review(self, mock_openrouter_client):
        """execute should return quality_review field."""
        agent = GuardianAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Review this post"})

        assert result["agent"] == "Guardian"
        assert "quality_review" in result

    def test_uses_analysis_task_type(self):
        """GuardianAgent should use analysis task type."""
        agent = GuardianAgent()
        assert agent.task_type == "analysis"


# ─── OrchestratorAgent ────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestOrchestratorAgent:
    """Tests for the OrchestratorAgent."""

    async def test_execute_decomposes_task(self, mock_openrouter_client):
        """execute should decompose task and route to agents."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "subtasks": [
                                        {"description": "Create content", "assigned_agent": "Creator"}
                                    ]
                                }
                            )
                        }
                    }
                ]
            }
        )

        mock_creator = AsyncMock()
        mock_creator.execute = AsyncMock(return_value={"status": "done"})

        agent = OrchestratorAgent(agents={"Creator": mock_creator})
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Do everything"})

        assert result["status"] == "completed"
        mock_creator.execute.assert_called_once()

    async def test_execute_handles_invalid_json_from_llm(self, mock_openrouter_client):
        """Should fall back when LLM returns invalid JSON."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={"choices": [{"message": {"content": "not json"}}]}
        )

        agent = OrchestratorAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Test"})
        assert "results" in result

    async def test_execute_skips_unknown_agents(self, mock_openrouter_client):
        """Should skip subtasks assigned to unknown agents."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "subtasks": [
                                        {"description": "Test", "assigned_agent": "UnknownAgent"}
                                    ]
                                }
                            )
                        }
                    }
                ]
            }
        )

        agent = OrchestratorAgent(agents={})
        agent.client = mock_openrouter_client

        result = await agent.execute({"description": "Test"})
        assert result["results"] == {}


# ─── GTMAgent ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestGTMAgent:
    """Tests for the GTMAgent."""

    async def test_execute_admin_gtm(self, mock_openrouter_client):
        """Admin GTM should generate strategy for internal features."""
        agent = GTMAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "launch_type": "admin",
            "feature_name": "Agent Factory",
            "launch_date": "2026-01-01T00:00:00",
        })

        assert result["launch_type"] == "admin"
        assert result["feature"] == "Agent Factory"
        assert "phases" in result
        assert "strategy" in result

    async def test_execute_customer_gtm(self, mock_openrouter_client):
        """Customer GTM should generate client strategy."""
        agent = GTMAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "launch_type": "customer",
            "product_name": "Widget Pro",
            "client_name": "Acme Corp",
            "target_audience": "Developers",
            "budget": 10000,
            "launch_date": "2026-06-01T00:00:00",
        })

        assert result["launch_type"] == "customer"
        assert result["product"] == "Widget Pro"
        assert result["budget"] == 10000
        assert len(result["phases"]) == 3

    def test_generate_phases_correct_count(self):
        """Should generate 3 phases: Pre-Launch, Launch Day, Post-Launch."""
        agent = GTMAgent()
        phases = agent._generate_phases("2026-06-15T00:00:00")
        assert len(phases) == 3
        assert phases[0]["name"] == "Pre-Launch"
        assert phases[1]["name"] == "Launch Day"
        assert phases[2]["name"] == "Post-Launch"

    def test_generate_phases_invalid_date(self):
        """Should handle invalid date gracefully."""
        agent = GTMAgent()
        phases = agent._generate_phases("invalid-date")
        assert len(phases) == 3  # Should still generate phases

    def test_launch_phases_configuration(self):
        """LAUNCH_PHASES should have correct structure."""
        assert len(GTMAgent.LAUNCH_PHASES) == 3
        for phase in GTMAgent.LAUNCH_PHASES:
            assert "name" in phase
            assert "duration_days" in phase
            assert "focus" in phase


@pytest.mark.asyncio
class TestMarketResearchAgent:
    """Tests for the MarketResearchAgent."""

    async def test_execute_returns_research(self, mock_openrouter_client):
        """execute should return research field."""
        agent = MarketResearchAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"product_name": "Widget", "target_audience": "Devs"})
        assert result["agent"] == "MarketResearch"
        assert "research" in result


@pytest.mark.asyncio
class TestLaunchCoordinatorAgent:
    """Tests for the LaunchCoordinatorAgent."""

    async def test_execute_returns_coordination(self, mock_openrouter_client):
        """execute should return coordination field."""
        agent = LaunchCoordinatorAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"launch_date": "2026-06-01"})
        assert result["agent"] == "LaunchCoordinator"
        assert "coordination" in result


# ─── SupportAgent ─────────────────────────────────────────────────────────

class TestSupportAgentFAQ:
    """Tests for SupportAgent FAQ search."""

    def test_search_faq_pricing(self):
        """Should find pricing FAQ."""
        agent = SupportAgent()
        result = agent._search_faq("What are your pricing plans?")
        assert result is not None
        assert result["category"] == "Pricing"

    def test_search_faq_features(self):
        """Should find features FAQ."""
        agent = SupportAgent()
        result = agent._search_faq("What AI agents do you have?")
        assert result is not None
        assert result["category"] == "Features"

    def test_search_faq_no_match(self):
        """Should return None for unmatched query."""
        agent = SupportAgent()
        result = agent._search_faq("random gibberish xyz")
        assert result is None

    def test_get_suggested_actions_gtm(self):
        """GTM-related query should suggest GTM action."""
        agent = SupportAgent()
        actions = agent._get_suggested_actions("How do I launch?", None)
        action_types = [a["type"] for a in actions]
        assert "gtm" in action_types

    def test_get_suggested_actions_help(self):
        """Help query should suggest escalation."""
        agent = SupportAgent()
        actions = agent._get_suggested_actions("I need help", None)
        action_types = [a["type"] for a in actions]
        assert "escalation" in action_types

    def test_get_suggested_actions_faq_match(self):
        """FAQ match should suggest FAQ action."""
        agent = SupportAgent()
        actions = agent._get_suggested_actions("pricing", {"id": "pricing-1"})
        action_types = [a["type"] for a in actions]
        assert "faq" in action_types


@pytest.mark.asyncio
class TestSupportAgentExecution:
    """Tests for SupportAgent execute method."""

    async def test_execute_returns_structured_output(self, mock_openrouter_client):
        """execute should return properly structured output."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "response": "I can help with that!",
                                    "needsEscalation": False,
                                    "escalationChannel": None,
                                    "gtmTrigger": False,
                                }
                            )
                        }
                    }
                ]
            }
        )

        agent = SupportAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "query": "How much does it cost?",
            "user_id": "user-123",
        })

        assert result["agent"] == "Support"
        assert result["user_id"] == "user-123"
        assert result["query"] == "How much does it cost?"
        assert "response" in result
        assert "needsEscalation" in result
        assert "faqMatch" in result
        assert "suggestedActions" in result

    async def test_execute_handles_invalid_json(self, mock_openrouter_client):
        """Should handle non-JSON LLM responses gracefully."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={"choices": [{"message": {"content": "I'm here to help"}}]}
        )

        agent = SupportAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"query": "Hello"})
        assert result["response"] == "I'm here to help"
        assert result["needsEscalation"] is False

    async def test_execute_includes_faq_match(self, mock_openrouter_client):
        """Should include FAQ match in output when found."""
        mock_openrouter_client.chat_completion = AsyncMock(
            return_value={
                "choices": [{"message": {"content": '{"response": "pricing info"}'}}]
            }
        )

        agent = SupportAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({"query": "What are your pricing plans?"})
        assert result["faqMatch"] is not None


# ─── EscalationAgent ──────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestEscalationAgent:
    """Tests for the EscalationAgent."""

    async def test_execute_whatsapp_channel(self, mock_openrouter_client):
        """Should generate WhatsApp link for whatsapp channel."""
        agent = EscalationAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "channel": "whatsapp",
            "conversation_summary": "User has billing issue",
        })

        assert result["agent"] == "Escalation"
        assert result["channel"] == "whatsapp"
        assert result["status"] == "escalated"
        assert result["whatsapp_link"] is not None
        assert "wa.me" in result["whatsapp_link"]

    async def test_execute_telegram_channel(self, mock_openrouter_client):
        """Should generate Telegram link for telegram channel."""
        agent = EscalationAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "channel": "telegram",
            "conversation_summary": "Technical issue",
        })

        assert result["telegram_link"] is not None
        assert "t.me" in result["telegram_link"]

    async def test_execute_voice_channel_no_links(self, mock_openrouter_client):
        """Voice channel should not generate messaging links."""
        agent = EscalationAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "channel": "voice",
            "conversation_summary": "Complex issue",
        })

        assert result["whatsapp_link"] is None
        assert result["telegram_link"] is None


# ─── VoiceAgent ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestVoiceAgent:
    """Tests for the VoiceAgent."""

    async def test_execute_returns_voice_response(self, mock_openrouter_client):
        """execute should return voice_response and text_response."""
        agent = VoiceAgent()
        agent.client = mock_openrouter_client

        result = await agent.execute({
            "voice_input": "What's my schedule today?",
            "action": "process",
            "language": "en-US",
        })

        assert result["agent"] == "Voice"
        assert "voice_response" in result
        assert "text_response" in result
        assert result["should_speak"] is True
        assert result["language"] == "en-US"

    async def test_execute_includes_voice_input_in_messages(self, mock_openrouter_client):
        """Should include voice input in LLM messages."""
        agent = VoiceAgent()
        agent.client = mock_openrouter_client

        await agent.execute({"voice_input": "Hello there"})

        call_args = mock_openrouter_client.chat_completion.call_args
        messages = call_args[1]["messages"]
        user_content = messages[1]["content"]
        assert "Hello there" in user_content

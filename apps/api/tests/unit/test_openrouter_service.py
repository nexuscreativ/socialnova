"""
Unit tests for the OpenRouter client service.
Covers: model selection, tier routing, fallback chain, chat completion.
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock, call

import pytest
import httpx

from services.openrouter import OpenRouterClient, get_openrouter_client


# ─── Model Selection ───────────────────────────────────────────────────────

class TestModelSelection:
    """Tests for tier-based model routing."""

    def test_get_model_free_general(self):
        """Should return free general model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("free", "general")
        assert model == "meta-llama/llama-3.3-70b-instruct:free"

    def test_get_model_free_content(self):
        """Should return free content model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("free", "content")
        assert model == "meta-llama/llama-3.3-70b-instruct:free"

    def test_get_model_free_analysis(self):
        """Should return free analysis model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("free", "analysis")
        assert model == "deepseek/deepseek-chat:free"

    def test_get_model_free_simple(self):
        """Should return free simple model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("free", "simple")
        assert model == "google/gemma-2-9b-it:free"

    def test_get_model_mid_general(self):
        """Should return mid-tier general model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("mid", "general")
        assert model == "meta-llama/llama-3.3-70b-instruct"

    def test_get_model_mid_content(self):
        """Should return mid-tier content model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("mid", "content")
        assert model == "deepseek/deepseek-v3.2"

    def test_get_model_frontier_general(self):
        """Should return frontier general model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("frontier", "general")
        assert model == "anthropic/claude-sonnet-4.5"

    def test_get_model_frontier_analysis(self):
        """Should return frontier analysis model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("frontier", "analysis")
        assert model == "openai/gpt-5.1"

    def test_get_model_unknown_tier_falls_back_to_free(self):
        """Unknown tier should fall back to free general model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("nonexistent", "general")
        assert model == "meta-llama/llama-3.3-70b-instruct:free"

    def test_get_model_unknown_task_falls_back_to_free(self):
        """Unknown task type should fall back to free general model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model("free", "nonexistent_task")
        assert model == "meta-llama/llama-3.3-70b-instruct:free"

    def test_get_model_default_parameters(self):
        """Default parameters should return free general model."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        model = client.get_model()
        assert model == "meta-llama/llama-3.3-70b-instruct:free"


# ─── Chat Completion ──────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestChatCompletion:
    """Tests for the chat_completion method."""

    async def test_chat_completion_success(self, mock_openrouter_response):
        """Should return response on successful API call."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        client.api_key = "test-key"
        client.base_url = "https://openrouter.ai/api/v1"

        mock_http_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_openrouter_response
        mock_http_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_http_client

        result = await client.chat_completion(
            messages=[{"role": "user", "content": "Hello"}],
            tier="free",
            task_type="general",
        )

        assert result == mock_openrouter_response
        mock_http_client.post.assert_called_once()

    async def test_chat_completion_uses_specified_model(self, mock_openrouter_response):
        """Should use the specified model when provided."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        client.api_key = "test-key"
        client.base_url = "https://openrouter.ai/api/v1"

        mock_http_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_openrouter_response
        mock_http_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_http_client

        await client.chat_completion(
            messages=[{"role": "user", "content": "Hello"}],
            model="custom/model-name",
            tier="free",
        )

        call_args = mock_http_client.post.call_args
        body = call_args[1]["json"]
        assert body["model"] == "custom/model-name"

    async def test_chat_completion_free_tier_adds_plugins(self, mock_openrouter_response):
        """Free tier should include auto-router plugin and provider config."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        client.api_key = "test-key"
        client.base_url = "https://openrouter.ai/api/v1"

        mock_http_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_openrouter_response
        mock_http_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_http_client

        await client.chat_completion(
            messages=[{"role": "user", "content": "Hello"}],
            tier="free",
        )

        call_args = mock_http_client.post.call_args
        body = call_args[1]["json"]
        assert "plugins" in body
        assert body["plugins"][0]["id"] == "auto-router"
        assert "provider" in body
        assert body["provider"]["data_collection"] == "deny"

    async def test_chat_completion_non_free_tier_no_plugins(self, mock_openrouter_response):
        """Non-free tiers should not include plugins."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        client.api_key = "test-key"
        client.base_url = "https://openrouter.ai/api/v1"

        mock_http_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_openrouter_response
        mock_http_client.post = AsyncMock(return_value=mock_response)
        client.client = mock_http_client

        await client.chat_completion(
            messages=[{"role": "user", "content": "Hello"}],
            tier="mid",
        )

        call_args = mock_http_client.post.call_args
        body = call_args[1]["json"]
        assert "plugins" not in body
        assert "provider" not in body


# ─── Fallback Chain ───────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestFallbackChain:
    """Tests for the fallback model chain when primary model fails."""

    async def test_fallback_used_when_primary_fails(self, mock_openrouter_response):
        """Should try fallback models when primary returns non-200."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        client.api_key = "test-key"
        client.base_url = "https://openrouter.ai/api/v1"

        mock_http_client = AsyncMock()
        fail_response = MagicMock()
        fail_response.status_code = 503

        success_response = MagicMock()
        success_response.status_code = 200
        success_response.json.return_value = {
            **mock_openrouter_response,
            "_fallback_used": "deepseek/deepseek-chat:free",
        }

        mock_http_client.post = AsyncMock(side_effect=[fail_response, success_response])
        client.client = mock_http_client

        result = await client.chat_completion(
            messages=[{"role": "user", "content": "Hello"}],
            tier="free",
        )

        assert "_fallback_used" in result
        # The first chain candidate (FALLBACK_CHAIN[0]) is used when the
        # primary request fails; the mock's second response is that fallback.
        assert result["_fallback_used"] == client.FALLBACK_CHAIN[0]

    async def test_all_fallbacks_fail_raises_exception(self):
        """Should raise exception when all fallback models fail."""
        client = OpenRouterClient.__new__(OpenRouterClient)
        client.api_key = "test-key"
        client.base_url = "https://openrouter.ai/api/v1"

        mock_http_client = AsyncMock()
        fail_response = MagicMock()
        fail_response.status_code = 503
        mock_http_client.post = AsyncMock(return_value=fail_response)
        client.client = mock_http_client

        with pytest.raises(Exception, match="All fallback models failed"):
            await client.chat_completion(
                messages=[{"role": "user", "content": "Hello"}],
                tier="free",
            )


# ─── Client Singleton ─────────────────────────────────────────────────────

class TestClientSingleton:
    """Tests for the OpenRouter client singleton pattern."""

    @patch("services.openrouter._client", None)
    def test_get_openrouter_client_returns_singleton(self):
        """Should return the same instance on repeated calls."""
        with patch("services.openrouter.settings") as mock_settings:
            mock_settings.OPENROUTER_API_KEY = "test-key"
            mock_settings.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
            mock_settings.APP_URL = "http://localhost:3000"

            client1 = get_openrouter_client()
            client2 = get_openrouter_client()
            assert client1 is client2

    def test_openrouter_client_has_correct_headers(self):
        """Client should be initialized with proper headers."""
        with patch("services.openrouter.settings") as mock_settings:
            mock_settings.OPENROUTER_API_KEY = "test-key"
            mock_settings.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
            mock_settings.APP_URL = "http://localhost:3000"

            import services.openrouter as module
            module._client = None
            client = get_openrouter_client()

            assert client.api_key == "test-key"
            assert client.base_url == "https://openrouter.ai/api/v1"

            # Cleanup
            module._client = None


# ─── Tier Models Configuration ────────────────────────────────────────────

class TestTierModelsConfiguration:
    """Tests for the TIER_MODELS configuration."""

    def test_all_tiers_have_required_task_types(self):
        """Every tier should have general, content, analysis, and simple models."""
        required_tasks = {"general", "content", "analysis", "simple"}
        for tier, tasks in OpenRouterClient.TIER_MODELS.items():
            assert set(tasks.keys()) == required_tasks, f"Tier '{tier}' missing tasks"

    def test_free_tier_uses_free_models(self):
        """Free tier models should contain ':free' suffix."""
        for task, model in OpenRouterClient.TIER_MODELS["free"].items():
            assert ":free" in model, f"Free tier task '{task}' model '{model}' missing :free"

    def test_fallback_chain_not_empty(self):
        """Fallback chain should have at least one model."""
        assert len(OpenRouterClient.FALLBACK_CHAIN) > 0

    def test_fallback_chain_uses_free_models(self):
        """Fallback models should all be free tier."""
        for model in OpenRouterClient.FALLBACK_CHAIN:
            assert ":free" in model

import httpx
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential
from config import settings

class OpenRouterClient:
    """Vendor-agnostic AI client with fallbacks"""
    
    TIER_MODELS = {
        "free": {
            "general": "meta-llama/llama-3.3-70b-instruct:free",
            "content": "meta-llama/llama-3.3-70b-instruct:free",
            "analysis": "deepseek/deepseek-chat:free",
            "simple": "google/gemma-2-9b-it:free",
        },
        "mid": {
            "general": "meta-llama/llama-3.3-70b-instruct",
            "content": "deepseek/deepseek-v3.2",
            "analysis": "deepseek/deepseek-v3.2",
            "simple": "google/gemini-2.0-flash-001",
        },
        "frontier": {
            "general": "anthropic/claude-sonnet-4.5",
            "content": "anthropic/claude-sonnet-4.5",
            "analysis": "openai/gpt-5.1",
            "simple": "google/gemini-3.1-pro-preview",
        }
    }
    
    FALLBACK_CHAIN = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "deepseek/deepseek-chat:free",
        "google/gemma-2-9b-it:free",
    ]
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": settings.APP_URL,
            "X-OpenRouter-Title": "SocialNova",
        }
        if self.api_key:
            # Only attach the Authorization header when a real key is set.
            # An empty key was producing "Bearer " (ttpx rejects empty values)
            # and making every chat call 500.
            headers["Authorization"] = f"Bearer {self.api_key}"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            timeout=30.0,
        )
    
    def get_model(self, tier: str = "free", task_type: str = "general") -> str:
        return self.TIER_MODELS.get(tier, self.TIER_MODELS["free"]).get(
            task_type, self.TIER_MODELS["free"]["general"]
        )
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        tier: str = "free",
        task_type: str = "general",
        **kwargs,
    ) -> Dict[str, Any]:
        if model is None:
            model = self.get_model(tier, task_type)
        
        request_body = {
            "model": model,
            "messages": messages,
            **kwargs,
        }
        
        if tier == "free":
            request_body["plugins"] = [
                {"id": "auto-router", "cost_tier": "low"}
            ]
            request_body["provider"] = {
                "sort": "price",
                "data_collection": "deny",
            }
        
        response = await self.client.post("/chat/completions", json=request_body)
        
        if response.status_code == 200:
            return response.json()
        
        return await self._handle_fallback(request_body)
    
    async def _handle_fallback(self, request: Dict) -> Dict:
        for model in self.FALLBACK_CHAIN:
            request["model"] = model
            try:
                resp = await self.client.post("/chat/completions", json=request)
                if resp.status_code == 200:
                    result = resp.json()
                    result["_fallback_used"] = model
                    return result
            except Exception:
                continue
        raise Exception("All fallback models failed")
    
    async def close(self):
        await self.client.aclose()


# Singleton
_client: Optional[OpenRouterClient] = None

def get_openrouter_client() -> Optional[OpenRouterClient]:
    """Return the shared client, or None when no API key is configured."""
    global _client
    if not settings.OPENROUTER_API_KEY:
        return None
    if _client is None:
        _client = OpenRouterClient()
    return _client

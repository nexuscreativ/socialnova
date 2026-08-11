from .base import BaseAgent
from typing import Dict, Any, Optional

class CreatorAgent(BaseAgent):
    """Generates on-brand content for social media platforms"""
    
    name = "Creator"
    description = "a social media content creator that generates platform-adapted posts"
    tier = "free"
    task_type = "content"
    
    SYSTEM_PROMPT = """You are a social media content creator for SocialNova.
    Generate platform-adapted posts with captions, hashtags, and hooks.
    Always maintain brand voice and tone.
    Output JSON with: caption, hashtags, platform_specific, best_time_to_post."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"Create content for: {task.get('description', '')}"},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        return {
            "agent": self.name,
            "content": content,
            "model_used": response.get("model", "unknown"),
            "tokens_used": response.get("usage", {}).get("total_tokens", 0),
        }

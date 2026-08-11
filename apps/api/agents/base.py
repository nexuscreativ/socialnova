from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from services.openrouter import get_openrouter_client

class BaseAgent(ABC):
    """Base class for all specialized agents"""
    
    name: str = "base"
    description: str = ""
    tier: str = "free"
    task_type: str = "general"
    
    def __init__(self):
        self.client = get_openrouter_client()
        self.tools = {}
        self.guardrails = []
    
    @abstractmethod
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        pass
    
    async def llm_call(self, messages: List[Dict[str, str]], **kwargs) -> Dict:
        return await self.client.chat_completion(
            messages=messages,
            tier=self.tier,
            task_type=self.task_type,
            **kwargs,
        )
    
    def render_prompt(self, task: Dict, context: Optional[Dict] = None) -> str:
        return f"""You are {self.name}, {self.description}.

Task: {task.get('description', 'No task description')}
Context: {context or 'None'}

Respond with a JSON object containing your results."""
    
    async def validate_output(self, output: Dict) -> Dict:
        return output
    
    def apply_guardrails(self, output: Dict) -> Dict:
        return output

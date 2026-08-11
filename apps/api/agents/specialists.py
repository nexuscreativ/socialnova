from .base import BaseAgent
from typing import Dict, Any, Optional

class OrchestratorAgent(BaseAgent):
    """Coordinates all agents and decomposes complex tasks"""
    
    name = "Orchestrator"
    description = "a coordinator that decomposes tasks and routes to specialist agents"
    tier = "mid"
    task_type = "general"
    
    def __init__(self, agents: dict = None):
        super().__init__()
        self.agents = agents or {}
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        decomposition = await self.decompose_task(task)
        
        results = {}
        for subtask in decomposition.get("subtasks", []):
            agent_name = subtask.get("assigned_agent")
            if agent_name in self.agents:
                agent = self.agents[agent_name]
                results[agent_name] = await agent.execute(subtask)
        
        return {"status": "completed", "results": results}
    
    async def decompose_task(self, task: Dict) -> Dict:
        messages = [
            {"role": "system", "content": "Decompose tasks into subtasks for specialist agents. Return JSON."},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        import json
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"subtasks": [{"description": task.get("description", ""), "assigned_agent": "Creator"}]}


class TimingAgent(BaseAgent):
    """Determines optimal posting times"""
    
    name = "Timing"
    description = "determines optimal posting times for social media content"
    tier = "free"
    task_type = "simple"
    
    SYSTEM_PROMPT = """You are a social media scheduling expert.
    Determine the best times to post content based on platform and audience.
    Return JSON with optimal posting times."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"agent": self.name, "schedule": content}


class GrowthAgent(BaseAgent):
    """Manages paid advertising optimization"""
    
    name = "Growth"
    description = "optimizes paid advertising campaigns for maximum ROI"
    tier = "mid"
    task_type = "analysis"
    
    SYSTEM_PROMPT = """You are a paid advertising expert.
    Analyze campaign performance and suggest optimizations.
    Return JSON with recommendations."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"agent": self.name, "recommendations": content}


class ConnectorAgent(BaseAgent):
    """Manages CRM and lead interactions"""
    
    name = "Connector"
    description = "manages customer relationships and lead scoring"
    tier = "free"
    task_type = "general"
    
    SYSTEM_PROMPT = """You are a CRM expert.
    Score leads and suggest follow-up actions.
    Return JSON with lead score and next steps."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"agent": self.name, "crm_action": content}


class GuardianAgent(BaseAgent):
    """Ensures content quality and brand consistency"""
    
    name = "Guardian"
    description = "reviews content for quality and brand consistency"
    tier = "free"
    task_type = "analysis"
    
    SYSTEM_PROMPT = """You are a content quality reviewer.
    Check content for brand consistency, grammar, and engagement potential.
    Return JSON with quality score and suggestions."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"agent": self.name, "quality_review": content}

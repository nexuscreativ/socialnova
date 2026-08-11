from .base import BaseAgent
from .creator import CreatorAgent
from .specialists import (
    OrchestratorAgent,
    TimingAgent,
    GrowthAgent,
    ConnectorAgent,
    GuardianAgent,
)
from .gtm import GTMAgent, MarketResearchAgent, LaunchCoordinatorAgent
from .support import SupportAgent, EscalationAgent, VoiceAgent

__all__ = [
    "BaseAgent",
    "CreatorAgent",
    "OrchestratorAgent",
    "TimingAgent",
    "GrowthAgent",
    "ConnectorAgent",
    "GuardianAgent",
    "GTMAgent",
    "MarketResearchAgent",
    "LaunchCoordinatorAgent",
    "SupportAgent",
    "EscalationAgent",
    "VoiceAgent",
]

# Agent registry for easy access
AGENT_REGISTRY = {
    "Creator": CreatorAgent,
    "Orchestrator": OrchestratorAgent,
    "Timing": TimingAgent,
    "Growth": GrowthAgent,
    "Connector": ConnectorAgent,
    "Guardian": GuardianAgent,
    "GTM": GTMAgent,
    "MarketResearch": MarketResearchAgent,
    "LaunchCoordinator": LaunchCoordinatorAgent,
    "Support": SupportAgent,
    "Escalation": EscalationAgent,
    "Voice": VoiceAgent,
}

def get_agent(agent_name: str) -> type:
    """Get agent class by name"""
    return AGENT_REGISTRY.get(agent_name)

def list_agents() -> list:
    """List all available agents"""
    return [
        {
            "name": name,
            "class": cls,
            "description": cls.description if hasattr(cls, 'description') else '',
            "tier": cls.tier if hasattr(cls, 'tier') else 'free',
        }
        for name, cls in AGENT_REGISTRY.items()
    ]

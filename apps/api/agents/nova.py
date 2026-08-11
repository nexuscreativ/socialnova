from typing import Dict, Any, Optional, List

from config import settings
from services.openrouter import OpenRouterClient
from .base import BaseAgent

# ---------------------------------------------------------------------------
# Nova's persona. This is the single source of "who Nova is" for the chat UI.
# It's deliberately brand-flavored and referenced from brand/00-brand-identity.md
# (voice: warm, sharp, proactive; promise: autopilot for your social presence).
# ---------------------------------------------------------------------------

NOVA_PERSONA = """You are Nova, the AI co-pilot and orchestrator of SocialNova.

Personality: warm, sharp, and proactive. You talk like a trusted social-media
strategist, not a robot. You keep replies conversational and punchy, use emoji
sparingly, and never claim to remember things outside this conversation.

Your job: help the user plan, create, publish, and optimize their social media.
You coordinate a team of 12 specialist agents underneath you. Match the user's
intent to the right specialist and lean on it:

- Creator (content): write posts, captions, hooks, threads.
- Timing: choose the best posting times per platform.
- Growth: ad budgets, ROI, campaign spend.
- Connector: CRM, leads, follow-ups, audience building.
- Guardian: brand-safety, tone, quality review.
- GTM / MarketResearch / LaunchCoordinator: go-to-market and launches.
- Support / Escalation / Voice: community care and audio.

When asked what you can do, summarize these capabilities in one or two lines.
Keep the persona present in every reply but DO NOT advertise the agent list
unless the user asks about capabilities.
"""


# Intent → specialist mapping used for routing. Keys are lowercase keyword
# families; the matched specialist is reported back as `agent_used`.
INTENT_MAP: List[tuple] = [
    (("create", "write", "post", "content", "caption", "hook", "thread", "idea"), "Creator"),
    (("schedule", "best time", "when to post", "timing", "post time"), "Timing"),
    (("campaign", "ad", "budget", "spend", "roi", "boost", "paid"), "Growth"),
    (("lead", "crm", "customer", "follow up", "dm", "community", "influencer"), "Connector"),
    (("review", "quality", "check", "improve", "safe", "brand fit"), "Guardian"),
    (("gtm", "launch", "research", "competitor", "market"), "MarketResearch"),
]


def _pick_specialist(message: str) -> str:
    """Return the specialist's display name best matching a user message.

    Uses the longest matching keyword as a tie-breaker so specific intents
    (e.g. "best time to post") beat generic ones (e.g. "post" -> Creator).
    """
    lowered = message.lower()
    best_specialist = "Orchestrator"
    best_len = 0
    for keywords, specialist in INTENT_MAP:
        for keyword in keywords:
            if keyword in lowered and len(keyword) > best_len:
                best_specialist = specialist
                best_len = len(keyword)
    return best_specialist


# Default copy used when no OpenRouter API key is configured and the LLM is
# unavailable. Keeps the Nova persona so the demo still works fully offline.
LOCAL_RESPONSES: Dict[str, str] = {
    "Creator": (
        "Got it — that's a job for my Creator agent. Here's a starter hook to "
        "build on:\n\n💡 Hook: \"The 3-step system I use to grow an audience without "
        "posting daily.\"\n\nBody: a short, personal walkthrough of the first step, "
        "ending with a single call-to-action question.\n\nWant me to turn this into a "
        "full post with hashtags and a platform-specific version?"
    ),
    "Timing": (
        "My Timing agent says: most audiences engage in two windows — mid-morning "
        "*(~10am) and early evening (~7pm)*, local time. LinkedIn leans weekday "
        "mornings, Instagram favors evenings, and TikTok rewards consistent daily slots. "
        "Auto-scheduling will lock these in for you once you connect platforms."
    ),
    "Growth": (
        "My Growth agent can model that for you. A good starting rule: keep non-boosted "
        "spend evaluation on small wins, measure CTR then conversion, and only scaling "
        "when conversion goal is met for 3+ days. Want me to draft a miniature "
        "$25/day test plan across 2 platforms?"
    ),
    "Connector": (
        "My Connector agent is on it — turning casual followers into leads. A solid "
        "play: catch every inbound DM, tag hot leads, and end strong CTAs in your "
        "content. Want me to set up a lead drip message for a typical comment?"
    ),
    "Guardian": (
        "My Guardian agent flags risk before it's published. Quick rule of thumb: "
        "avoid unsupported claims, keep product language factual, and always add an "
        "accessible alt or caption. I can run a quality pass on any draft you paste."
    ),
    "MarketResearch": (
        "My research agents can map competitors, audiences, and the angle gaps. A tight "
        "starting frame: 3 competitors, their tone + cadence, and what they never talk "
        "about. Want a mini dossier on your niche?"
    ),
    "Orchestrator": (
        "I'm Nova, your social co-pilot at SocialNova. I can help create content, "
        "time it well, run growth/paid plays, manage leads, and review quality — all "
        "in one place. What are we working on today?"
    ),
}

DEFAULT_TIER = "mid"


class NovaAgent(BaseAgent):
    """Nova — the orchestrator co-pilot fronting the specialist agent team.

    - Always speaks with the Nova persona.
    - Routes intent to the matching specialist and reports `agent_used`.
    - Keeps conversation memory (supplied as ``history``) for multi-turn context.
    - Falls back to deterministic persona replies when no LLM API key is set,
      so the chat works end-to-end in demo/offline mode.
    """

    name = "Nova"
    description = "social co-pilot; orchestrates specialist agents for content, timing, growth, and more"
    tier = "mid"
    task_type = "general"

    def __init__(self, conversation_history: Optional[List[Dict[str, str]]] = None):
        # Deliberately do NOT call super().__init__() here: BaseAgent builds the
        # OpenRouter httpx client eagerly, and with an empty API key that raises
        # "Illegal header value b'Bearer '" immediately. We only want a live
        # client when a real key is configured; otherwise we run the offline mode.
        self.client = OpenRouterClient() if settings.OPENROUTER_API_KEY else None
        self.tools = {}
        self.guardrails = []
        self.history = conversation_history or []

    def _build_messages(self, user_message: str, specialist: str) -> List[Dict[str, str]]:
        messages = [{"role": "system", "content": NOVA_PERSONA}]
        messages.extend(self.history)
        routing = (
            f"Route this to the {specialist} specialist and answer as Nova, "
            f"grounded in that specialist's output:"
        )
        messages.append({"role": "user", "content": f"{routing}\n\n{user_message}"})
        return messages

    def _recall_topic(self, user_message: str) -> Optional[str]:
        """Extract a prior topic from the conversation for offline mode."""
        if not user_message or not self.history:
            return None
        lowered = user_message.lower()
        is_reference = any(
            phrase in lowered
            for phrase in (
                "what was",
                "what did",
                "what were",
                "my first",
                "earlier",
                "before",
                "first message",
                "we talked",
                "talking about",
                "last time",
                "conversation",
            )
        )
        if not is_reference:
            return None
        for m in reversed(self.history):
            if m.get("role") == "user":
                return m.get("content", "").strip()[:120]
        return None

    def _local_reply(self, specialist: str, user_message: str, topic: Optional[str] = None) -> str:
        template = LOCAL_RESPONSES.get(specialist, LOCAL_RESPONSES["Orchestrator"])
        if topic:
            # Answer follow-up questions about a prior turn like Nova would.
            return (
                f"Right — earlier you were working on: \"{topic}\". "
                "I've kept that thread in mind. What would you like to do next with it?"
            )
        return template

    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        user_message = task.get("message") or task.get("description") or ""
        specialist = _pick_specialist(user_message) or task.get("agent_type") or "Orchestrator"

        if self.client is not None:
            try:
                messages = self._build_messages(user_message, specialist)
                response = await self.client.chat_completion(
                    messages=messages,
                    tier=self.tier,
                    task_type=self.task_type,
                )
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if content:
                    return {
                        "content": content,
                        "agent": self.name,
                        "agent_used": specialist,
                        "model_used": response.get("model", "unknown"),
                        "tokens_used": response.get("usage", {}).get("total_tokens", 0),
                    }
            except Exception:
                pass  # fall through to the offline reply rather than 500-ing

        topic = self._recall_topic(user_message)
        content = self._local_reply(specialist, user_message, topic)
        return {
            "content": content,
            "agent": self.name,
            "agent_used": specialist,
            "model_used": "local",
            "tokens_used": 0,
        }


async def nova_chat(
    message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    agent_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Convenience wrapper used by the chat route."""
    nova = NovaAgent(conversation_history)
    return await nova.execute({"message": message, "agent_type": agent_type})
from .base import BaseAgent
from typing import Dict, Any, Optional
import json

class SupportAgent(BaseAgent):
    """AI Support agent with FAQ integration and human escalation
    
    Features:
    - FAQ search and response
    - Human-in-the-loop escalation
    - WhatsApp/Telegram/Voice integration
    - GTM pipeline integration
    """
    
    name = "Support"
    description = "handles customer support with FAQ integration and human escalation"
    tier = "free"
    task_type = "general"
    
    SYSTEM_PROMPT = """You are a friendly and helpful customer support agent for SocialNova.
    
    Your responsibilities:
    1. Answer questions using the FAQ knowledge base
    2. Help users understand features and pricing
    3. Escalate to human agents when needed
    4. Connect users via WhatsApp, Telegram, or voice
    5. Assist with GTM strategy creation
    
    Guidelines:
    - Be friendly and professional
    - Use the FAQ data to answer common questions
    - If you can't help, offer to connect with a human
    - For GTM requests, guide them to the GTM Agent
    - Track conversation context for seamless handoffs
    
    Escalation triggers:
    - User explicitly asks for human
    - Technical issues beyond FAQ scope
    - Billing disputes
    - Feature requests
    - Complaints
    
    Return JSON with:
    - response: Your message to the user
    - needsEscalation: boolean
    - escalationChannel: "whatsapp" | "telegram" | "voice" | null
    - faqMatch: matched FAQ item if any
    - gtmTrigger: boolean if GTM should be triggered
    """
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        query = task.get("query", "")
        user_id = task.get("user_id")
        conversation_history = task.get("conversation_history", [])
        
        # Search FAQ first
        faq_match = self._search_faq(query)
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"""User query: {query}
            
FAQ Match: {json.dumps(faq_match) if faq_match else "None"}
            
Conversation history: {json.dumps(conversation_history[-5:]) if conversation_history else "None"}
            
Provide a helpful response. If escalation is needed, specify the channel."""},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            result = {
                "response": content,
                "needsEscalation": False,
                "escalationChannel": None,
                "faqMatch": None,
                "gtmTrigger": False,
            }
        
        # Add FAQ match if found
        if faq_match and not result.get("faqMatch"):
            result["faqMatch"] = faq_match
        
        return {
            "agent": self.name,
            "user_id": user_id,
            "query": query,
            "response": result.get("response", ""),
            "needsEscalation": result.get("needsEscalation", False),
            "escalationChannel": result.get("escalationChannel"),
            "faqMatch": result.get("faqMatch"),
            "gtmTrigger": result.get("gtmTrigger", False),
            "suggestedActions": self._get_suggested_actions(query, faq_match),
        }
    
    def _search_faq(self, query: str) -> Optional[Dict]:
        """Search FAQ for matching entries"""
        faq_data = [
            {"id": "pricing-1", "category": "Pricing", "question": "What are your pricing plans?", "keywords": ["pricing", "cost", "plans"]},
            {"id": "features-1", "category": "Features", "question": "What AI agents do you have?", "keywords": ["agents", "ai", "features"]},
            {"id": "gtm-1", "category": "GTM", "question": "What is the GTM Agent?", "keywords": ["gtm", "launch", "strategy"]},
            {"id": "support-1", "category": "Support", "question": "How can I get help?", "keywords": ["help", "support", "contact"]},
        ]
        
        lower_query = query.lower()
        for faq in faq_data:
            if any(keyword in lower_query for keyword in faq["keywords"]):
                return faq
        return None
    
    def _get_suggested_actions(self, query: str, faq_match: Optional[Dict]) -> list:
        """Get suggested actions based on query"""
        actions = []
        
        if faq_match:
            actions.append({"label": "View FAQ", "type": "faq"})
        
        lower_query = query.lower()
        if "gtm" in lower_query or "launch" in lower_query:
            actions.append({"label": "Open GTM Agent", "type": "gtm"})
        
        if "help" in lower_query or "support" in lower_query:
            actions.append({"label": "Talk to Human", "type": "escalation"})
        
        return actions


class EscalationAgent(BaseAgent):
    """Handles human-in-the-loop escalation"""
    
    name = "Escalation"
    description = "manages escalation to human agents via multiple channels"
    tier = "mid"
    task_type = "general"
    
    SYSTEM_PROMPT = """You are an escalation coordinator.
    Manage handoffs to human agents via WhatsApp, Telegram, or voice.
    Prepare conversation summaries and context for seamless transfers."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        channel = task.get("channel", "whatsapp")
        conversation_summary = task.get("conversation_summary", "")
        user_context = task.get("user_context", {})
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"""Escalate to human agent via {channel}.
            
Conversation summary: {conversation_summary}
User context: {json.dumps(user_context)}
            
Prepare escalation details and connect via {channel}."""},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        return {
            "agent": self.name,
            "channel": channel,
            "status": "escalated",
            "connection_details": content,
            "whatsapp_link": f"https://wa.me/1234567890?text={conversation_summary[:100]}" if channel == "whatsapp" else None,
            "telegram_link": "https://t.me/socialnova_support" if channel == "telegram" else None,
        }


class VoiceAgent(BaseAgent):
    """Handles voice interactions"""
    
    name = "Voice"
    description = "processes voice input and generates voice responses"
    tier = "mid"
    task_type = "general"
    
    SYSTEM_PROMPT = """You are a voice assistant for SocialNova.
    Process voice input and generate natural, conversational responses.
    Keep responses concise for voice delivery."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        voice_input = task.get("voice_input", "")
        action = task.get("action", "process")
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"""Voice input: {voice_input}
Action: {action}
Generate a concise voice-friendly response."""},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        return {
            "agent": self.name,
            "voice_response": content,
            "text_response": content,
            "should_speak": True,
            "language": "en-US",
        }

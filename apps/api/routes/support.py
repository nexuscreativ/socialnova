from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from deps import get_current_user
from models import User

router = APIRouter(prefix="/support", tags=["Support"])

# Request/Response models
class SupportChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    conversation_history: Optional[List[dict]] = []
    channel: Optional[str] = "web"

class EscalationRequest(BaseModel):
    channel: str  # "whatsapp", "telegram", "voice"
    conversation_summary: str
    user_context: Optional[dict] = {}

class VoiceRequest(BaseModel):
    voice_input: str
    action: str = "process"
    language: str = "en-US"

class FAQSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None

# Initialize agents
from agents.support import SupportAgent, EscalationAgent, VoiceAgent

support_agent = SupportAgent()
escalation_agent = EscalationAgent()
voice_agent = VoiceAgent()

@router.post("/chat")
async def support_chat(
    request: SupportChatRequest,
    user: User = Depends(get_current_user),
):
    """Handle support chat with AI agent"""
    try:
        task = {
            "query": request.query,
            "user_id": str(user.id),
            "conversation_history": request.conversation_history,
            "channel": request.channel,
        }
        result = await support_agent.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/escalate")
async def escalate_to_human(
    request: EscalationRequest,
    user: User = Depends(get_current_user),
):
    """Escalate conversation to human agent"""
    try:
        task = {
            "channel": request.channel,
            "conversation_summary": request.conversation_summary,
            "user_context": request.user_context,
        }
        result = await escalation_agent.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice")
async def process_voice(
    request: VoiceRequest,
    user: User = Depends(get_current_user),
):
    """Process voice input and generate response"""
    try:
        task = {
            "voice_input": request.voice_input,
            "action": request.action,
            "language": request.language,
        }
        result = await voice_agent.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/faq/search")
async def search_faq(
    request: FAQSearchRequest,
    user: User = Depends(get_current_user),
):
    """Search FAQ database"""
    try:
        # FAQ search logic
        faq_data = [
            {"id": "pricing-1", "category": "Pricing", "question": "What are your pricing plans?", "answer": "We offer 4 pricing tiers..."},
            {"id": "features-1", "category": "Features", "question": "What AI agents do you have?", "answer": "We have 9 specialized AI agents..."},
            {"id": "gtm-1", "category": "GTM", "question": "What is the GTM Agent?", "answer": "Our GTM Agent creates launch strategies..."},
        ]
        
        lower_query = request.query.lower()
        results = [faq for faq in faq_data if any(keyword in lower_query for keyword in [faq["category"].lower(), faq["question"].lower()])]
        
        return {"results": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels")
async def get_support_channels():
    """Get available support channels"""
    return {
        "channels": [
            {
                "name": "WhatsApp",
                "icon": "whatsapp",
                "color": "#25D366",
                "link": "https://wa.me/1234567890",
                "description": "Chat with us on WhatsApp",
                "available": True,
            },
            {
                "name": "Telegram",
                "icon": "telegram",
                "color": "#0088cc",
                "link": "https://t.me/socialnova_support",
                "description": "Message us on Telegram",
                "available": True,
            },
            {
                "name": "Voice Call",
                "icon": "phone",
                "color": "#8B5CF6",
                "link": "tel:+1234567890",
                "description": "Call our support team",
                "available": True,
            },
            {
                "name": "Email",
                "icon": "mail",
                "color": "var(--accent)",
                "link": "mailto:support@socialnova.com",
                "description": "Email us anytime",
                "available": True,
            },
        ]
    }

@router.get("/faq/categories")
async def get_faq_categories():
    """Get FAQ categories"""
    return {
        "categories": [
            {"name": "Pricing", "count": 3},
            {"name": "Features", "count": 3},
            {"name": "GTM", "count": 2},
            {"name": "Technical", "count": 2},
            {"name": "Support", "count": 2},
        ]
    }

@router.get("/faq/{category}")
async def get_faq_by_category(category: str):
    """Get FAQ items by category"""
    faq_data = {
        "pricing": [
            {"id": "pricing-1", "question": "What are your pricing plans?", "answer": "We offer 4 pricing tiers..."},
            {"id": "pricing-2", "question": "Is there a free trial?", "answer": "Yes! Our Free plan is free forever..."},
        ],
        "features": [
            {"id": "features-1", "question": "What AI agents do you have?", "answer": "We have 9 specialized AI agents..."},
            {"id": "features-2", "question": "What platforms do you support?", "answer": "We support 14 social media platforms..."},
        ],
        "gtm": [
            {"id": "gtm-1", "question": "What is the GTM Agent?", "answer": "Our GTM Agent creates complete launch strategies..."},
        ],
    }
    
    items = faq_data.get(category.lower(), [])
    return {"category": category, "items": items, "total": len(items)}

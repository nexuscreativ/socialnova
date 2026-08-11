from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from deps import get_current_user, require_admin
from models import User

router = APIRouter(prefix="/gtm", tags=["GTM"])

# Request/Response models
class GTMRequest(BaseModel):
    launch_type: str = "customer"  # "admin" or "customer"
    product_name: str
    target_audience: Optional[str] = "General"
    budget: Optional[float] = 5000
    launch_date: Optional[str] = None
    platforms: Optional[List[str]] = ["LinkedIn", "Instagram", "Twitter"]
    unique_selling_points: Optional[List[str]] = []
    competitor_products: Optional[List[str]] = []
    
    # For admin launches
    feature_name: Optional[str] = None
    context: Optional[dict] = None

class GTMStrategyResponse(BaseModel):
    agent: str
    launch_type: str
    product: Optional[str] = None
    feature: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    launch_date: Optional[str] = None
    phases: list
    strategy: dict
    status: str

class LaunchTimelineRequest(BaseModel):
    launch_date: str
    phases: Optional[list] = None

class ContentCalendarRequest(BaseModel):
    product_name: str
    target_audience: str
    platforms: List[str]
    start_date: str
    duration_days: int = 30

# Initialize GTM agent
from agents.gtm import GTMAgent, MarketResearchAgent, LaunchCoordinatorAgent

gtm_agent = GTMAgent()
market_research_agent = MarketResearchAgent()
launch_coordinator = LaunchCoordinatorAgent()

@router.post("/strategy", response_model=GTMStrategyResponse)
async def create_gtm_strategy(
    request: GTMRequest,
    user: User = Depends(get_current_user),
):
    """Create a comprehensive go-to-market strategy"""
    try:
        task = {
            "launch_type": request.launch_type,
            "product_name": request.product_name,
            "target_audience": request.target_audience,
            "budget": request.budget,
            "launch_date": request.launch_date or datetime.now().isoformat(),
            "platforms": request.platforms,
            "unique_selling_points": request.unique_selling_points,
            "competitor_products": request.competitor_products,
            "feature_name": request.feature_name,
            "context": request.context,
        }
        
        result = await gtm_agent.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/research")
async def conduct_market_research(
    product_name: str, target_audience: str,
    user: User = Depends(get_current_user),
):
    """Conduct market research for a product"""
    try:
        task = {
            "product_name": product_name,
            "target_audience": target_audience,
            "research_type": "market_analysis"
        }
        result = await market_research_agent.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/timeline")
async def create_launch_timeline(
    request: LaunchTimelineRequest,
    user: User = Depends(get_current_user),
):
    """Create a detailed launch timeline"""
    try:
        task = {
            "launch_date": request.launch_date,
            "phases": request.phases,
            "coordination_type": "timeline"
        }
        result = await launch_coordinator.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calendar")
async def create_content_calendar(
    request: ContentCalendarRequest,
    user: User = Depends(get_current_user),
):
    """Create a content calendar for launch"""
    try:
        task = {
            "product_name": request.product_name,
            "target_audience": request.target_audience,
            "platforms": request.platforms,
            "start_date": request.start_date,
            "duration_days": request.duration_days,
            "calendar_type": "launch"
        }
        result = await gtm_agent.execute(task)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def list_gtm_templates():
    """List available GTM templates"""
    return {
        "templates": [
            {
                "name": "SaaS Product Launch",
                "description": "For launching new software features or products",
                "duration": "45 days",
                "budget_range": "$5,000 - $50,000"
            },
            {
                "name": "Mobile App Launch",
                "description": "For launching mobile applications",
                "duration": "60 days",
                "budget_range": "$10,000 - $100,000"
            },
            {
                "name": "Feature Update",
                "description": "For announcing new features to existing users",
                "duration": "14 days",
                "budget_range": "$1,000 - $10,000"
            },
            {
                "name": "Brand Refresh",
                "description": "For rebranding or brand awareness campaigns",
                "duration": "90 days",
                "budget_range": "$20,000 - $200,000"
            }
        ]
    }

@router.get("/admin/auto-generate")
async def auto_generate_socialnova_gtm(
    admin: User = Depends(require_admin),
):
    """Auto-generate GTM strategy for SocialNova's own features (Admin)"""
    try:
        task = {
            "launch_type": "admin",
            "feature_name": "Agent Factory",
            "product_name": "SocialNova Agent Factory",
            "target_audience": "Marketing agencies and solopreneurs",
            "budget": 25000,
            "platforms": ["LinkedIn", "Twitter", "Product Hunt", "Hacker News"],
            "unique_selling_points": [
                "Create custom AI agents in minutes",
                "No coding required",
                "Template-based approach",
                "Seamless integration with existing workflow"
            ],
            "competitor_products": ["Zapier", "Make.com", "Custom AI solutions"],
            "context": {
                "launch_purpose": "Feature announcement",
                "key_messaging": "Democratizing AI agent creation"
            }
        }
        
        result = await gtm_agent.execute(task)
        return {
            "status": "auto_generated",
            "message": "GTM strategy auto-generated for SocialNova Agent Factory",
            "strategy": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

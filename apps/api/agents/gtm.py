from .base import BaseAgent
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json

class GTMAgent(BaseAgent):
    """Go-To-Market agent for automated social media launch strategies
    
    Dual purpose:
    1. Admin Process: Auto-generate GTM plans for SocialNova features/products
    2. Service Offering: Help customers create and execute GTM campaigns
    """
    
    name = "GTM"
    description = "creates and executes go-to-market strategies for product launches"
    tier = "premium"
    task_type = "complex"
    
    SYSTEM_PROMPT = """You are an expert Go-To-Market strategist specializing in social media launches.
    
    Your responsibilities:
    1. Market Research: Analyze competitors, trends, and audience behavior
    2. Strategy Development: Create positioning, messaging, and channel plans
    3. Campaign Planning: Build content calendars, timelines, and asset lists
    4. Execution Coordination: Sequence posts, ads, and influencer activities
    5. Performance Tracking: Monitor KPIs and optimize in real-time
    
    For SocialNova Admin (internal launches):
    - Research feature positioning vs competitors
    - Create launch campaigns for new features/products
    - Coordinate cross-platform announcements
    - Track adoption metrics and iterate
    
    For Customer Service (client launches):
    - Develop custom GTM strategies per client
    - Create launch timelines and content plans
    - Coordinate multi-platform campaigns
    - Provide performance dashboards
    
    Return JSON with:
    - strategy: Overall approach and positioning
    - timeline: Phased launch plan with dates
    - channels: Platform-specific tactics
    - content_plan: Content types and schedule
    - kpi_targets: Success metrics
    - budget_allocation: Recommended spend distribution
    """
    
    LAUNCH_PHASES = [
        {"name": "Pre-Launch", "duration_days": 14, "focus": "Teaser content, audience building"},
        {"name": "Launch Day", "duration_days": 1, "focus": "Coordinated announcements, PR push"},
        {"name": "Post-Launch", "duration_days": 30, "focus": "Engagement, feedback, optimization"},
    ]
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        launch_type = task.get("launch_type", "customer")  # "admin" or "customer"
        
        if launch_type == "admin":
            return await self._execute_admin_gtm(task, context)
        else:
            return await self._execute_customer_gtm(task, context)
    
    async def _execute_admin_gtm(self, task: Dict, context: Optional[Dict] = None) -> Dict:
        """Internal GTM for SocialNova feature/product launches"""
        
        feature_name = task.get("feature_name", "New Feature")
        launch_date = task.get("launch_date", (datetime.now() + timedelta(days=14)).isoformat())
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"""Create a GTM strategy for SocialNova's internal launch:
            
Feature: {feature_name}
Target Launch Date: {launch_date}
Context: {json.dumps(task.get('context', {}))}

Include:
1. Competitive positioning vs Socella and other tools
2. Key messaging and value propositions
3. Platform-specific launch tactics (LinkedIn, Twitter, Product Hunt, etc.)
4. Content calendar with specific post types
5. Influencer and partner outreach plan
6. KPI targets for first 30 days
7. Budget allocation recommendations"""},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            strategy = json.loads(content)
        except json.JSONDecodeError:
            strategy = {"strategy": content}
        
        return {
            "agent": self.name,
            "launch_type": "admin",
            "feature": feature_name,
            "launch_date": launch_date,
            "phases": self._generate_phases(launch_date),
            "strategy": strategy,
            "status": "ready_for_review"
        }
    
    async def _execute_customer_gtm(self, task: Dict, context: Optional[Dict] = None) -> Dict:
        """Customer-facing GTM service"""
        
        client_name = task.get("client_name", "Client")
        product_name = task.get("product_name", "Product")
        target_audience = task.get("target_audience", "General")
        budget = task.get("budget", 5000)
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"""Create a comprehensive GTM strategy for client:
            
Client: {client_name}
Product: {product_name}
Target Audience: {target_audience}
Budget: ${budget}
Platforms: {task.get('platforms', ['LinkedIn', 'Instagram', 'Twitter'])}
Launch Date: {task.get('launch_date', 'TBD')}

Deliver:
1. Market analysis and competitor landscape
2. Audience personas and targeting strategy
3. Positioning and messaging framework
4. Platform-specific content strategy
5. 30-day content calendar
6. Paid media strategy with budget split
7. Influencer partnership recommendations
8. KPI dashboard and success metrics
9. Risk mitigation plan"""},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            strategy = json.loads(content)
        except json.JSONDecodeError:
            strategy = {"strategy": content}
        
        return {
            "agent": self.name,
            "launch_type": "customer",
            "client": client_name,
            "product": product_name,
            "budget": budget,
            "phases": self._generate_phases(task.get("launch_date")),
            "strategy": strategy,
            "status": "draft"
        }
    
    def _generate_phases(self, launch_date: str) -> list:
        """Generate launch phases based on date"""
        try:
            base_date = datetime.fromisoformat(launch_date.replace("Z", "+00:00"))
        except:
            base_date = datetime.now() + timedelta(days=14)
        
        phases = []
        current_date = base_date - timedelta(days=14)
        
        for phase in self.LAUNCH_PHASES:
            phases.append({
                "name": phase["name"],
                "start_date": current_date.isoformat(),
                "end_date": (current_date + timedelta(days=phase["duration_days"])).isoformat(),
                "focus": phase["focus"]
            })
            current_date += timedelta(days=phase["duration_days"])
        
        return phases


class MarketResearchAgent(BaseAgent):
    """Deep market research for GTM strategies"""
    
    name = "MarketResearch"
    description = "conducts market research and competitor analysis"
    tier = "mid"
    task_type = "analysis"
    
    SYSTEM_PROMPT = """You are a market research analyst.
    Analyze market trends, competitors, and audience behavior.
    Return JSON with insights and recommendations."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"agent": self.name, "research": content}


class LaunchCoordinatorAgent(BaseAgent):
    """Coordinates multi-platform launch execution"""
    
    name = "LaunchCoordinator"
    description = "coordinates cross-platform launch activities"
    tier = "mid"
    task_type = "general"
    
    SYSTEM_PROMPT = """You are a launch coordinator.
    Sequence activities across platforms for maximum impact.
    Return JSON with execution timeline and dependencies."""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        response = await self.llm_call(messages)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"agent": self.name, "coordination": content}

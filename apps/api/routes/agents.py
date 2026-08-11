"""
Agent routes: CRUD, execution, history — all backed by PostgreSQL.
"""
import time
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user, get_current_verified_user
from models import User, Agent, AgentSession, AgentAction
from schemas import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentExecuteRequest,
    AgentExecuteResponse,
    AgentSessionResponse,
    MessageResponse,
)
from services.audit import log_audit_event

router = APIRouter(prefix="/agents", tags=["Agents"])


# ─── List ───────────────────────────────────────────────────────────────────

@router.get("", response_model=list[AgentResponse])
@router.get("/", response_model=list[AgentResponse])
async def list_agents(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    agent_type: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None, max_length=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List agents for the current user.
    Returns built-in agents plus the user's custom agents.
    """
    query = select(Agent).where(
        (Agent.user_id == user.id) | (Agent.is_builtin == True)
    )

    if agent_type:
        query = query.where(Agent.agent_type == agent_type)
    if status_filter:
        query = query.where(Agent.status == status_filter)
    if search:
        query = query.where(Agent.name.ilike(f"%{search}%"))

    query = query.order_by(Agent.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    return result.scalars().all()


# ─── Create ─────────────────────────────────────────────────────────────────

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    body: AgentCreate,
    request: Request,
    user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom agent."""
    agent = Agent(
        user_id=user.id,
        agent_type=body.agent_type,
        name=body.name,
        description=body.description,
        model_tier=body.model_tier,
        config=body.config or {},
    )
    db.add(agent)
    await db.flush()
    await db.commit()
    await db.refresh(agent)

    await log_audit_event(
        db, action="agent.created", user_id=user.id,
        resource_type="agent", resource_id=agent.id,
        details={"name": agent.name, "type": agent.agent_type},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return agent


# ─── Get ────────────────────────────────────────────────────────────────────

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get agent details."""
    result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            (Agent.user_id == user.id) | (Agent.is_builtin == True),
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


# ─── Update ─────────────────────────────────────────────────────────────────

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    body: AgentUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an agent."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.user_id == user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    if agent.is_builtin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify built-in agents",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    agent.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(agent)

    await log_audit_event(
        db, action="agent.updated", user_id=user.id,
        resource_type="agent", resource_id=agent.id,
        details=update_data,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return agent


# ─── Delete ─────────────────────────────────────────────────────────────────

@router.delete("/{agent_id}", response_model=MessageResponse)
async def delete_agent(
    agent_id: UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom agent."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.user_id == user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    if agent.is_builtin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete built-in agents",
        )

    await db.delete(agent)
    await db.commit()

    await log_audit_event(
        db, action="agent.deleted", user_id=user.id,
        resource_type="agent", resource_id=agent_id,
        details={"name": agent.name},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="Agent deleted")


# ─── Execute ────────────────────────────────────────────────────────────────

@router.post("/{agent_id}/execute", response_model=AgentExecuteResponse)
async def execute_agent(
    agent_id: UUID,
    body: AgentExecuteRequest,
    request: Request,
    user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute an agent task.
    Creates a session, runs the agent, and records the result.
    """
    # Verify agent exists and user has access
    result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            (Agent.user_id == user.id) | (Agent.is_builtin == True),
            Agent.status == "active",
        )
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found or inactive")

    # Create session
    session = AgentSession(
        agent_id=agent.id,
        user_id=user.id,
        input_data=body.input_data,
        status="running",
    )
    db.add(session)
    await db.flush()

    start_time = time.monotonic()
    output = None
    tokens_used = 0
    cost_cents = 0.0

    try:
        # Import and route to the appropriate agent executor
        from agents.creator import CreatorAgent
        from agents.specialists import (
            OrchestratorAgent, TimingAgent, GrowthAgent,
            ConnectorAgent, GuardianAgent,
        )
        from agents.gtm import GTMAgent, MarketResearchAgent, LaunchCoordinatorAgent
        from agents.support import SupportAgent, EscalationAgent, VoiceAgent

        AGENT_MAP = {
            "creator": CreatorAgent,
            "orchestrator": OrchestratorAgent,
            "timing": TimingAgent,
            "growth": GrowthAgent,
            "connector": ConnectorAgent,
            "guardian": GuardianAgent,
            "gtm": GTMAgent,
            "marketresearch": MarketResearchAgent,
            "launchcoordinator": LaunchCoordinatorAgent,
            "support": SupportAgent,
            "escalation": EscalationAgent,
            "voice": VoiceAgent,
        }

        agent_cls = AGENT_MAP.get(agent.agent_type)
        if agent_cls:
            agent_instance = agent_cls()
            agent_instance.tier = agent.model_tier
            raw = await agent_instance.execute(body.input_data)
            output = raw
            tokens_used = raw.get("tokens_used", 0)
        else:
            output = {
                "status": "completed",
                "message": f"Agent type '{agent.agent_type}' executed with custom config",
                "input_received": body.input_data,
            }

    except Exception as e:
        output = {"error": str(e)}
        session.status = "failed"
    else:
        session.status = "completed"
    finally:
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        session.output = output
        session.completed_at = datetime.now(timezone.utc)
        await db.flush()

        # Record API request for billing
        api_request = APIRequest(
            request_id=f"agent-{session.id}",
            user_id=user.id,
            agent_id=agent.id,
            status=session.status,
            prompt_tokens=tokens_used,
            total_tokens=tokens_used,
            cost_cents=cost_cents,
            latency_ms=elapsed_ms,
        )
        db.add(api_request)

    await db.commit()

    await log_audit_event(
        db, action="agent.executed", user_id=user.id,
        resource_type="agent", resource_id=agent.id,
        details={
            "session_id": str(session.id),
            "status": session.status,
            "tokens_used": tokens_used,
        },
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return AgentExecuteResponse(
        session_id=session.id,
        status=session.status,
        output=output,
        tokens_used=tokens_used,
        cost_cents=cost_cents,
        duration_ms=elapsed_ms,
    )


# ─── History ────────────────────────────────────────────────────────────────

@router.get("/{agent_id}/history", response_model=list[AgentSessionResponse])
async def get_agent_history(
    agent_id: UUID,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get execution history for an agent."""
    # Verify access
    agent_result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            (Agent.user_id == user.id) | (Agent.is_builtin == True),
        )
    )
    if not agent_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    query = select(AgentSession).where(
        AgentSession.agent_id == agent_id,
        AgentSession.user_id == user.id,
    )
    if status_filter:
        query = query.where(AgentSession.status == status_filter)

    query = query.order_by(AgentSession.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    return result.scalars().all()


# ─── Missing import for APIRequest ──────────────────────────────────────────
from models import APIRequest  # noqa: E402 — imported at module level for execute route

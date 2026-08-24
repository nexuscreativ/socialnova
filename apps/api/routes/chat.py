import asyncio
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from schemas import ChatRequest, ChatResponse, ChatCompletionsRequest
from agents.nova import nova_chat
from services.openrouter import get_openrouter_client
from models import ChatMessage, User

router = APIRouter(prefix="/api/v1", tags=["chat"])


async def _load_messages(db: AsyncSession, conversation_id: uuid.UUID) -> list[ChatMessage]:
    """Return the most recent conversation turns, oldest-first."""
    rows = (
        (await db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(20)
        ))
        .scalars()
        .all()
    )
    return list(reversed(rows))


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Handle a chat message through Nova, the SocialNova AI co-pilot.

    Nova routes the user's intent to the appropriate specialist agent, keeps
    conversation memory (persisted per conversation), and always responds in
    the Nova persona.
    """
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="message cannot be empty")

    # Validate the id coming from the client; fall back to a fresh one on garbage.
    try:
        conversation_id = uuid.UUID(request.conversation_id) if request.conversation_id else uuid.uuid4()
    except ValueError:
        conversation_id = uuid.uuid4()

    history_rows = await _load_messages(db, conversation_id)

    result = await nova_chat(
        message=request.message,
        conversation_history=[{"role": m.role, "content": m.content} for m in history_rows],
        agent_type=request.agent_type,
    )

    # Persist both the user message and Nova's reply for future context.
    db.add(
        ChatMessage(
            conversation_id=conversation_id,
            user_id=user.id,
            role="user",
            content=request.message,
        )
    )
    db.add(
        ChatMessage(
            conversation_id=conversation_id,
            user_id=user.id,
            role="assistant",
            content=result.get("content", ""),
            agent_used=result.get("agent_used"),
        )
    )
    await db.commit()

    return ChatResponse(
        response=result.get("content", "Sorry, I couldn't process that. Try again."),
        agent_used=result.get("agent_used", "Nova"),
        conversation_id=str(conversation_id),
        tokens_used=result.get("tokens_used", 0),
        suggestions=[],
        metadata={"model_used": result.get("model_used", "local")},
    )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """SSE streaming variant of /chat — streams Nova's reply token-by-token."""
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="message cannot be empty")
    try:
        conversation_id = uuid.UUID(request.conversation_id) if request.conversation_id else uuid.uuid4()
    except ValueError:
        conversation_id = uuid.uuid4()

    history_rows = await _load_messages(db, conversation_id)
    result = await nova_chat(
        message=request.message,
        conversation_history=[{"role": m.role, "content": m.content} for m in history_rows],
        agent_type=request.agent_type,
    )
    content: str = result.get("content", "")
    agent_used: str = result.get("agent_used", "Nova")
    cid_str = str(conversation_id)

    # Persist both turns before streaming so history is consistent even if the
    # client disconnects mid-stream.
    db.add(ChatMessage(conversation_id=conversation_id, user_id=user.id, role="user", content=request.message))
    db.add(ChatMessage(conversation_id=conversation_id, user_id=user.id, role="assistant", content=content, agent_used=agent_used))
    await db.commit()

    async def event_gen():
        # Chunk by ~20 chars to simulate token streaming without depending on the
        # provider actually streaming.
        chunk_size = 24
        for i in range(0, len(content), chunk_size):
            chunk = content[i : i + chunk_size]
            yield f"data: {json.dumps({'token': chunk})}\n\n"
            await asyncio.sleep(0.03)
        yield f"data: {json.dumps({'done': True, 'conversation_id': cid_str, 'agent_used': agent_used})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/conversations")
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List distinct conversations for the current user, newest first."""
    # Distinct conversation_ids for this user
    rows = (await db.execute(select(ChatMessage.conversation_id).where(ChatMessage.user_id == user.id).distinct())).all()
    cids = [r[0] for r in rows if r[0] is not None]
    conversations = []
    for cid in cids:
        last_row = await db.execute(
            select(ChatMessage).where(ChatMessage.user_id == user.id, ChatMessage.conversation_id == cid).order_by(desc(ChatMessage.created_at)).limit(1)
        )
        last = last_row.scalar_one_or_none()
        count = int(await db.scalar(select(func.count()).select_from(ChatMessage).where(ChatMessage.user_id == user.id, ChatMessage.conversation_id == cid)) or 0)
        conversations.append({
            "conversation_id": str(cid),
            "last_message": (last.content[:100] if last and last.content else ""),
            "last_role": last.role if last else None,
            "updated_at": last.created_at.isoformat() if last and last.created_at else None,
            "message_count": count,
        })
    conversations.sort(key=lambda x: x["updated_at"] or "", reverse=True)
    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Load full history for a conversation (oldest-first, up to 50)."""
    rows = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user.id, ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(50)
        )
    ).scalars().all()
    return {
        "conversation_id": str(conversation_id),
        "messages": [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None} for m in rows],
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    result = await db.execute(select(ChatMessage).where(ChatMessage.user_id == user.id, ChatMessage.conversation_id == conversation_id))
    msgs = result.scalars().all()
    if not msgs:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for m in msgs:
        await db.delete(m)
    await db.commit()
    return {"ok": True, "conversation_id": str(conversation_id)}


@router.post("/chat/completions")
async def chat_completions(
    request: ChatCompletionsRequest,
    user: User = Depends(get_current_user),
):
    """OpenRouter-compatible chat completions endpoint."""
    client = get_openrouter_client()
    if client is None:
        raise HTTPException(status_code=503, detail="AI provider not configured")

    # Never trust client-supplied tier/model for billing: enforce an allowlist
    # so an authenticated user cannot burn the shared OpenRouter key on
    # arbitrary (potentially expensive) frontier models.
    tier = request.tier if request.tier in client.TIER_MODELS else "free"
    known_models = {m for models in client.TIER_MODELS.values() for m in models.values()}
    known_models.update(client.FALLBACK_CHAIN)
    model = request.model
    if model is not None and model not in known_models:
        raise HTTPException(status_code=400, detail=f"Unknown model: {model}")

    response = await client.chat_completion(
        messages=request.messages,
        model=model,
        tier=tier,
    )

    return response
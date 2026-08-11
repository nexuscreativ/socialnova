import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
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


@router.post("/chat/completions")
async def chat_completions(
    request: ChatCompletionsRequest,
    user: User = Depends(get_current_user),
):
    """OpenRouter-compatible chat completions endpoint."""
    client = get_openrouter_client()
    if client is None:
        raise HTTPException(status_code=503, detail="AI provider not configured")

    response = await client.chat_completion(
        messages=request.messages,
        model=request.model,
        tier=request.tier,
    )

    return response
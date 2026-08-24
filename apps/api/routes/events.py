"""Real-time events SSE channel (M10)."""
import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from deps import get_current_user
from models import User

router = APIRouter(prefix="/api/v1", tags=["events"])


@router.get("/events")
async def events_stream(user: User = Depends(get_current_user)):
    """Server-Sent Events channel for dashboard + notifications.

    Sends a `connected` event, then a `heartbeat` every 20s.  The channel
    stays open until the client disconnects — the frontend EventSource
    reconnects automatically.  Push-trigger source for M9 is the same
    payload shape.
    """

    async def gen():
        yield f"data: {json.dumps({'type': 'connected', 'user_id': str(user.id)})}\n\n"
        counter = 0
        while True:
            await asyncio.sleep(20)
            counter += 1
            payload = {
                "type": "heartbeat",
                "ts": datetime.now(timezone.utc).isoformat(),
                "counter": counter,
            }
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

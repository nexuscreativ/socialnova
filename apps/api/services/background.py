"""
SocialNova API - Background task runner.

A minimal async task queue built on `asyncio.Queue` with a single worker loop.
Tasks are named, executed with try/except + logging, and never crash the app.

The worker is started/stopped by the FastAPI lifespan.
"""
import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, Optional, Tuple

logger = logging.getLogger("socialnova.background")

# ─── Queue ──────────────────────────────────────────────────────────────────

_MAX_QUEUE = 1024
_queue: Optional[asyncio.Queue] = None
_worker_task: Optional[asyncio.Task] = None
_shutdown = asyncio.Event()


def _get_queue() -> asyncio.Queue:
    """Return the worker queue, creating it lazily inside a running loop.

    Creating the queue at import time binds it to a loop that does not exist
    yet and can hang or misbehave on first use, so we defer construction until
    `start_task_runner` is called from the lifespan (a live loop).
    """
    global _queue
    if _queue is None:
        _queue = asyncio.Queue(maxsize=_MAX_QUEUE)
    return _queue


async def enqueue(name: str, fn, *args, **kwargs) -> bool:
    """Queue a callable (sync or async). Returns False if the queue is full."""
    try:
        _get_queue().put_nowait((name, fn, args, kwargs))
        return True
    except asyncio.QueueFull:
        logger.warning("background.queue_full", extra={"extra_data": {"name": name}})
        return False


async def _worker_loop() -> None:
    logger.info("background.worker_started")
    q = _get_queue()
    while True:
        try:
            name, fn, args, kwargs = await q.get()
        except asyncio.CancelledError:
            logger.info("background.worker_cancelled")
            raise

        started = time.monotonic()
        try:
            result = fn(*args, **kwargs)
            if asyncio.iscoroutine(result):
                await asyncio.wait_for(result, timeout=30.0)
            logger.info(
                "background.task_completed",
                extra={"extra_data": {"task": name, "duration_ms": round((time.monotonic() - started) * 1000, 2)}},
            )
        except asyncio.TimeoutError:
            logger.warning("background.task_timeout", extra={"extra_data": {"task": name}})
        except Exception as exc:  # never let a task failure kill the worker
            logger.error(
                "background.task_failed",
                extra={"extra_data": {"task": name, "error": str(exc)}},
            )
        finally:
            q.task_done()


def start_task_runner() -> asyncio.Task:
    """Start the single background worker (idempotent). Returns the worker task."""
    global _worker_task
    if _worker_task is None or _worker_task.done():
        _worker_task = asyncio.create_task(_worker_loop(), name="background-worker")
    return _worker_task


async def stop_task_runner() -> None:
    """Gracefully stop the worker by cancelling it and draining the queue.

    Bounded: if the worker is mid-task (e.g. a DB query), the cancellation is
    awaited under a hard timeout so shutdown can never hang the lifespan.
    """
    global _worker_task
    if _worker_task and not _worker_task.done():
        _worker_task.cancel()
        try:
            await asyncio.wait_for(asyncio.shield(_worker_task), timeout=3.0)
        except (asyncio.CancelledError, asyncio.TimeoutError, Exception):
            pass
    _worker_task = None
    # Clear the queue without validating tasks (we are shutting down).
    if _queue is not None:
        while not _queue.empty():
            try:
                _queue.get_nowait()
                _queue.task_done()
            except Exception:
                break


# ─── Sample queued task: record usage ───────────────────────────────────────

async def record_usage() -> dict:
    """Sample API usage metrics and update the active-agent-session gauge.

    Reads counts from the database with a short-lived session and does NOT
    insert into `APIRequest` — existing billing writes are untouched.
    """
    from database import AsyncSessionLocal
    from models import APIRequest, AgentSession
    from sqlalchemy import func, select
    from services.metrics import set_active_agent_sessions

    async with AsyncSessionLocal() as db:
        total_requests = await asyncio.wait_for(
            db.scalar(select(func.count()).select_from(APIRequest)), timeout=5.0
        ) or 0
        active_sessions = await asyncio.wait_for(
            db.scalar(
                select(func.count()).select_from(AgentSession).where(AgentSession.status == "running")
            ),
            timeout=5.0,
        ) or 0

    set_active_agent_sessions(int(active_sessions))

    payload = {
        "sampled_at": time.time(),
        "total_requests": int(total_requests),
        "active_agent_sessions": int(active_sessions),
    }
    logger.info("background.usage_sampled", extra={"extra_data": payload})
    return payload


async def run_sampler_periodically(interval_seconds: float = 60.0) -> asyncio.Task:
    """Schedule `record_usage` on an interval. Runs forever until cancelled.

    Called from the lifespan after the worker is started; the task itself is
    cancelled during shutdown in the lifespan.
    """

    async def _loop():
        while True:
            try:
                await record_usage()
            except Exception as exc:
                logger.debug("background.sampler_error", extra={"error": str(exc)})
            await asyncio.sleep(interval_seconds)

    return asyncio.create_task(_loop(), name="usage-sampler")
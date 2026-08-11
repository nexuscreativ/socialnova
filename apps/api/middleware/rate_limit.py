"""
SocialNova API - In-memory sliding-window rate limiter.

Pure-Python implementation (no Redis required). Uses `collections.deque` plus
monotonic timestamps to build a sliding-window counter per identity. Provides:

  * `rate_limiter` - a shared singleton `SlidingWindowRateLimiter`
  * `rate_limit(...)` - a FastAPI dependency for per-endpoint limits
  * `RateLimitMiddleware` - a Starlette BaseHTTPMiddleware applying the
    settings-dict limits to every request.
"""
import asyncio
import logging
import time
from collections import OrderedDict, deque
from typing import Callable, Dict, Optional

from fastapi import Depends, HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import settings

# Attempt to resolve the authenticated user id without a DB round-trip. If the
# token can't be decoded we fall back to the client IP as the identity.
try:
    from services.auth import decode_access_token as _decode_access_token
except Exception:  # pragma: no cover - defensive, must never break startup
    _decode_access_token = None

logger = __import__("logging").getLogger("socialnova.rate_limit")

# ─── Sliding-Window Rate Limiter ────────────────────────────────────────────


class SlidingWindowRateLimiter:
    """Sliding-window counter keyed by identity string.

    The implementation is intentionally synchronous: `check` performs O(window)
    work in a few microseconds and is safe to call from async code. A threading
    lock guards the shared dicts across event-loop threads (e.g. multi-worker).
    """

    def __init__(self, max_keys: int = 100_000) -> None:
        self._requests: "OrderedDict[str, deque]" = OrderedDict()
        self._max_keys = max(1, max_keys)
        self._lock = asyncio.Lock()

    def _get_window(self, key: str) -> deque:
        """Return the window for `key`, evicting the least-recently-used key
        when the tracked-key cap is exceeded (bounds memory usage)."""
        window = self._requests.pop(key, None)
        if window is None:
            if len(self._requests) >= self._max_keys:
                self._requests.popitem(last=False)
            window = deque()
        self._requests[key] = window  # re-insert as most-recently-used
        return window

    async def check(self, key: str, limit: int, window_seconds: float = 60.0) -> Optional[float]:
        """Record a request for `key` and return retry-after seconds if over limit."""
        if limit <= 0:
            return None
        now = time.monotonic()
        async with self._lock:
            window = self._get_window(key)
            # Drop timestamps that have fallen out of the sliding window.
            while window and now - window[0] >= window_seconds:
                window.popleft()

            if len(window) >= limit:
                retry_after = max(1.0, window_seconds - (now - window[0]))
                logger.debug("rate_limit.exceeded", extra={"key": key, "limit": limit})
                return retry_after

            window.append(now)
            return None

    async def remaining(self, key: str, limit: int, window_seconds: float = 60.0) -> int:
        """Return how many requests remain in the window for `key` (no recording)."""
        now = time.monotonic()
        async with self._lock:
            window = self._requests.get(key)
            if window is None:
                return max(0, limit)
            while window and now - window[0] >= window_seconds:
                window.popleft()
            return max(0, limit - len(window))

    async def reset(self, key: Optional[str] = None) -> None:
        """Clear the window for one key, or all keys when `key` is None."""
        async with self._lock:
            if key is None:
                self._requests.clear()
            else:
                self._requests.pop(key, None)


# Shared singleton used by both the middleware and the dependency.
rate_limiter = SlidingWindowRateLimiter(max_keys=settings.RATE_LIMIT_MAX_KEYS)


# ─── Identity resolution ────────────────────────────────────────────────────

def _client_ip(request) -> str:
    """Resolve the client IP for rate-limit identity.

    `X-Forwarded-For` is attacker-controlled unless the immediate peer is the
    configured trusted proxy, so it is only consulted in that case.
    """
    peer = request.client.host if request.client else None
    trusted = settings.TRUSTED_PROXY
    if peer and trusted:
        if isinstance(trusted, str):
            is_trusted = peer == trusted
        else:
            is_trusted = peer in trusted
        if is_trusted:
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                return forwarded.split(",")[0].strip()
    return peer or "unknown"


def request_identity(request) -> str:
    """Return a stable identity string for a request.

    Prefers the authenticated user (decoded from the JWT without hitting a DB),
    falling back to the client IP (`X-Forwarded-For` only from a trusted proxy).
    """
    auth_header = request.headers.get("Authorization", "") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if _decode_access_token is not None:
            try:
                payload = _decode_access_token(token)
                if payload and payload.get("sub"):
                    return f"user:{payload['sub']}"
            except Exception:
                pass

    return f"ip:{_client_ip(request)}"


# ─── Per-endpoint dependency ────────────────────────────────────────────────

def rate_limit(
    limit: int = 60,
    window_seconds: int = 60,
    scope: str = "default",
) -> Callable:
    """FastAPI dependency factory.

    Usage::

        @router.get("/things")
        async def list_things(_: None = Depends(rate_limit(limit=30, window_seconds=60))):
            ...

    Raises 429 with a `Retry-After` header when the limit is exceeded.
    """

    async def _dependency(request: Request) -> None:
        identity = f"{scope}:{request_identity(request)}"
        retry_after = await rate_limiter.check(identity, limit, window_seconds)
        if retry_after is not None:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={"Retry-After": str(int(retry_after))},
            )
        return None

    return _dependency


# ─── Exempt paths ───────────────────────────────────────────────────────────

EXEMPT_PATHS = frozenset({
    "/health",
    "/health/live",
    "/health/ready",
    "/api/docs",
    "/api/redoc",
    "/api/openapi.json",
    "/metrics",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
})


def is_exempt(path: str) -> bool:
    path = path.split("?", 1)[0].rstrip("/") or "/"
    if path in EXEMPT_PATHS:
        return True
    return path.startswith("/health")


# ─── Global middleware ──────────────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Apply a per-path settings-dict limit to every request.

    * Skipped for health/docs/metrics paths.
    * Uses `settings.RATE_LIMIT_PER_MINUTE` as the default ceiling.
    * Returns 429 with a `Retry-After` header on exceed.
    """

    def __init__(self, app, limits: Optional[Dict[str, int]] = None, default_limit: Optional[int] = None):
        super().__init__(app)
        self.limits = limits or {}
        self.default_limit = default_limit or settings.RATE_LIMIT_PER_MINUTE
        self.window_seconds = 60

    async def dispatch(self, request, call_next):
        if not settings.ENABLE_RATE_LIMIT:
            return await call_next(request)

        path = request.url.path
        if is_exempt(path):
            return await call_next(request)

        limit = self.limits.get(path, self.default_limit)
        identity = request_identity(request)
        retry_after = await rate_limiter.check(identity, limit, self.window_seconds)
        if retry_after is not None:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded",
                    "retry_after": int(retry_after),
                },
                headers={
                    "Retry-After": str(int(retry_after)),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Window": str(self.window_seconds),
                },
            )

        response = await call_next(request)
        try:
            remaining = await rate_limiter.remaining(identity, limit, self.window_seconds)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
        except Exception:
            pass
        return response
"""
SocialNova API - Cache layer.

Tries Redis first (via `redis.asyncio` at `settings.REDIS_URL`) and silently
falls back to an in-memory TTL dictionary when Redis is unavailable. None of
these functions may ever raise to the caller — every failure degrades to a
cache miss instead of a 500.
"""
import asyncio
import json
import logging
import threading
import time
from typing import Any, Awaitable, Callable, Optional

from config import settings

logger = logging.getLogger("socialnova.cache")

# ─── Optional Redis import ──────────────────────────────────────────────────

try:
    import redis.asyncio as aioredis

    REDIS_AVAILABLE = True
except Exception:  # pragma: no cover - redis not installed
    REDIS_AVAILABLE = False
    aioredis = None


# ─── In-memory fallback ─────────────────────────────────────────────────────

class MemoryTTLCache:
    """Thread-safe TTL dictionary storing JSON-serializable values."""

    def __init__(self) -> None:
        self._store: dict = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            expires_at, raw = item
            if expires_at is not None and expires_at < time.monotonic():
                self._store.pop(key, None)
                return None
            try:
                return json.loads(raw)
            except Exception:
                return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl_seconds = ttl if ttl is not None else settings.CACHE_TTL
        with self._lock:
            expires_at = time.monotonic() + ttl_seconds if ttl_seconds else None
            try:
                raw = json.dumps(value, default=str)
            except Exception as exc:
                logger.debug("cache.serialize_failed", extra={"error": str(exc)})
                raw = json.dumps(str(value))
            self._store[key] = (expires_at, raw)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


memory_cache = MemoryTTLCache()

# ─── Redis client (lazy singleton) ──────────────────────────────────────────

_redis_client: Optional[Any] = None
_redis_failed: bool = False
_redis_lock = threading.Lock()


def _get_redis_client() -> Optional[Any]:
    """Return a lazily-created redis client, or None if unusable."""
    global _redis_client, _redis_failed
    if not REDIS_AVAILABLE or _redis_failed:
        return None
    if _redis_client is None:
        with _redis_lock:
            if _redis_client is None and not _redis_failed:
                try:
                    _redis_client = aioredis.from_url(
                        settings.REDIS_URL,
                        max_connections=settings.REDIS_MAX_CONNECTIONS,
                        socket_timeout=1.0,
                        socket_connect_timeout=1.0,
                        decode_responses=True,
                    )
                except Exception as exc:
                    logger.debug("cache.redis_connect_failed", extra={"error": str(exc)})
                    _redis_failed = True
                    _redis_client = None
    return _redis_client


async def _redis_alive() -> bool:
    """Return True only if Redis is reachable.

    LATCHES failure: once a ping fails the client is marked unusable for the
    lifetime of the process so a dead Redis never stalls every cache call.
    """
    global _redis_failed
    if not REDIS_AVAILABLE or _redis_failed:
        return False
    client = _get_redis_client()
    if client is None:
        return False
    try:
        await asyncio.wait_for(client.ping(), timeout=1.0)
        return True
    except Exception:
        _redis_failed = True
        logger.warning("cache.redis_health_failed", extra={"url": settings.REDIS_URL})
        return False


def _key(key: str) -> str:
    return f"{settings.CACHE_PREFIX}{key}"


# ─── Public API ─────────────────────────────────────────────────────────────

async def get_cache(key: str) -> Optional[Any]:
    """Return a cached value or None. Never raises."""
    if not settings.CACHE_ENABLED:
        return None
    full_key = _key(key)

    # Try Redis first.
    if await _redis_alive():
        try:
            raw = await _get_redis_client().get(full_key)
            if raw is not None:
                return json.loads(raw)
        except Exception as exc:
            logger.debug("cache.redis_get_failed", extra={"error": str(exc)})

    # In-memory fallback.
    return memory_cache.get(full_key)


async def set_cache(key: str, value: Any, ttl: Optional[int] = None) -> None:
    """Store a value with an optional TTL. Never raises."""
    if not settings.CACHE_ENABLED:
        return
    full_key = _key(key)
    ttl_seconds = ttl if ttl is not None else settings.CACHE_TTL

    if await _redis_alive():
        try:
            raw = json.dumps(value, default=str)
            await _get_redis_client().set(full_key, raw, ex=ttl_seconds if ttl_seconds else None)
            return
        except Exception as exc:
            logger.debug("redis_set_failed", extra={"error": str(exc)})

    memory_cache.set(full_key, value, ttl=ttl_seconds)


async def delete_cache(key: str) -> None:
    """Delete a key from both stores. Never raises."""
    full_key = _key(key)
    if await _redis_alive():
        try:
            await _get_redis_client().delete(full_key)
        except Exception:
            pass
    memory_cache.delete(full_key)


async def clear_cache() -> None:
    """Clear the cache (Redis is clear-scoped to this app prefix). Never raises."""
    if await _redis_alive():
        try:
            prefix = settings.CACHE_PREFIX
            if prefix:
                async for k in _get_redis_client().scan_iter(match=f"{prefix}*"):
                    await _get_redis_client().delete(k)
            else:
                await _get_redis_client().flushdb()
        except Exception:
            pass
    memory_cache.clear()


async def get_or_set(key: str, factory: Callable[[], Awaitable[Any] | Any], ttl: Optional[int] = None) -> Any:
    """Return the cached value for `key`, or compute it via `factory`.

    Concurrent callers may both run the factory; that is an acceptable
    trade-off for a lockless cache layer.
    """
    cached = await get_cache(key)
    if cached is not None:
        return cached

    value = await _resolve_factory(factory)
    if value is not None:
        await set_cache(key, value, ttl=ttl)
    return value


async def _resolve_factory(factory: Callable[[], Awaitable[Any] | Any]) -> Any:
    result = factory()
    if asyncio.iscoroutine(result):
        return await result
    return result
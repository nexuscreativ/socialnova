"""
SocialNova API - Request context, request logging and simple API versioning.

Provides:
  * `RequestContextMiddleware` - generates/echoes `X-Request-ID`, exposes it to
    loggers through a contextvar.
  * `RequestLogMiddleware` - logs method / path / status / duration_ms / request_id
    after each response using the existing structured logging configuration.
  * `VersioningMiddleware` - honors the `X-API-Version` request header.
"""
import logging
import time
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware

from config import settings

logger = logging.getLogger("http.requests")

# ─── Context vars (bound per task) ──────────────────────────────────────────

request_id_var: ContextVar = ContextVar("request_id", default=None)
user_id_var: ContextVar = ContextVar("user_id", default=None)


def get_request_id() -> str:
    return request_id_var.get() or ""


def get_user_id() -> str:
    return user_id_var.get() or ""


def bind_user_id(user_id) -> None:
    """Expose the current user id to loggers within this request context."""
    user_id_var.set(str(user_id))


# ─── Request Context Middleware ─────────────────────────────────────────────

class RequestContextMiddleware(BaseHTTPMiddleware):
    """Echo or create an X-Request-ID and bind it to the request context."""

    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", "") or uuid.uuid4().hex[:16]
        token = request_id_var.set(request_id)
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        try:
            response.headers.setdefault("X-Request-ID", request_id)
        except Exception:
            pass
        return response


# ─── Request Log Middleware ─────────────────────────────────────────────────

class RequestLogMiddleware(BaseHTTPMiddleware):
    """Log basic request telemetry: method, path, status, duration, request_id."""

    async def dispatch(self, request, call_next):
        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception as exc:  # propagate errors, but still log what we can
            duration_ms = (time.monotonic() - start) * 1000
            try:
                logger.error(
                    "request.error",
                    extra={
                        "request_id": get_request_id(),
                        "extra_data": {
                            "method": request.method,
                            "path": request.url.path,
                            "status_code": 500,
                            "duration_ms": round(duration_ms, 2),
                            "error": str(exc)[:500],
                        },
                    },
                )
            except Exception:
                pass
            raise

        duration_ms = (time.monotonic() - start) * 1000
        try:
            logger.info(
                "request.completed",
                extra={
                    "request_id": get_request_id(),
                    "extra_data": {
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                        "client": getattr(request.client, "host", "unknown"),
                    },
                },
            )
        except Exception:
            pass
        return response


# ─── API Versioning Middleware ──────────────────────────────────────────────

class VersioningMiddleware(BaseHTTPMiddleware):
    """Handle the `X-API-Version` header for graceful API versioning.

    If the client sends `X-API-Version: 0.2` we advertise the upcoming version
    in `X-API-Version-Next`; otherwise we mark the response as the current
    stable version `1.0`.
    """

    HEADER = settings.APP_VERSION_HEADER or "X-API-Version"
    VERSION_NEXT = "1.0"
    VERSION_CURRENT = settings.X_API_VERSION_CURRENT or "1.0"

    async def dispatch(self, request, call_next):
        requested = request.headers.get(self.HEADER, "")
        response = await call_next(request)
        try:
            if requested == "0.2":
                response.headers["X-API-Version-Next"] = self.VERSION_NEXT
                response.headers["X-API-Version-Current"] = "0.2"
            else:
                response.headers["X-API-Version-Current"] = self.VERSION_CURRENT
        except Exception:
            pass
        return response
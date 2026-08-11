import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import text

from config import settings
from database import init_db, engine

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.agents import router as agents_router
from routes.content import router as content_router
from routes.campaigns import router as campaigns_router
from routes.chat import router as chat_router
from routes.gtm import router as gtm_router
from routes.support import router as support_router
from routes.webhooks import router as webhooks_router
from routes.uploads import router as uploads_router
from routes.search import router as search_router
from routes.admin import router as admin_router
from routes.site_pages import router as site_pages_router

from middleware.metrics import MetricsMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.request_context import (
    RequestContextMiddleware,
    RequestLogMiddleware,
    VersioningMiddleware,
)

from services import background, metrics as metrics_service

logger = logging.getLogger("socialnova.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Refuse to boot in production without a real JWT signing key. The public
    # default key would let anyone forge tokens and take over any account.
    if settings.is_production() and not settings.has_secure_secret_key():
        raise RuntimeError(
            "Refusing to start in production: SECRET_KEY must be set to a strong "
            "random value (not the default 'change-me-in-production')."
        )

    # Database schema
    await init_db()

    # Rebuild the in-memory upload metadata registry from disk (survives
    # restarts; important when uploads live on a persistent volume).
    try:
        from services.storage import rebuild_upload_registry

        uploaded = rebuild_upload_registry()
        logger.info("storage.registry_rebuilt", extra={"files": uploaded})
    except Exception as exc:
        logger.debug("storage.registry_rebuild_skipped", exc_info=exc)

    # Background task runner + usage sampler
    start_sampler_task = None
    try:
        background.start_task_runner()
        await background.enqueue("record_usage", background.record_usage)
        start_sampler_task = await background.run_sampler_periodically(interval_seconds=60)
    except Exception as exc:
        logger.exception("background.startup_failed", exc_info=exc)
    yield
    # Graceful shutdown: cancel sampler + worker, close engine
    try:
        if start_sampler_task is not None:
            start_sampler_task.cancel()
            try:
                await start_sampler_task
            except Exception:
                pass
    except Exception:
        pass
    try:
        await background.stop_task_runner()
    except Exception:
        pass
    try:
        from database import engine

        await engine.dispose()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered social media management API with 12 specialized agents",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Middleware order: the LAST add_middleware is the OUTERMOST. We add from
# innermost to outermost so execution flows:
#   GZip -> CORS -> RateLimit -> RequestContext -> RequestLog -> Versioning -> Metrics -> routes
app.add_middleware(MetricsMiddleware)  # innermost
app.add_middleware(VersioningMiddleware)
app.add_middleware(RequestLogMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)  # outermost

app.include_router(auth_router, tags=["Authentication"])
app.include_router(users_router, tags=["Users"])
app.include_router(agents_router, tags=["Agents"])
app.include_router(content_router, tags=["Content"])
app.include_router(campaigns_router, tags=["Campaigns"])
app.include_router(chat_router, tags=["Chat"])
app.include_router(gtm_router, tags=["GTM"])
app.include_router(support_router, tags=["Support"])
app.include_router(webhooks_router, tags=["Webhooks"])
app.include_router(uploads_router, tags=["Uploads"])
app.include_router(search_router, tags=["Search"])
app.include_router(admin_router, tags=["Admin"])
app.include_router(site_pages_router, tags=["Site Pages"])


# ─── Health / readiness / liveness ──────────────────────────────────────────

async def _db_check() -> str:
    """Run a real `SELECT 1` against the DB engine. Returns 'ok' or 'error'."""
    try:
        from database import engine

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ok"
    except Exception as exc:
        logger.warning("health.db_error", extra={"error": str(exc)})
        return "error"


async def _redis_check() -> str:
    """Ping Redis when available. Returns 'ok' or 'disabled'."""
    try:
        from services.cache import _redis_alive

        if await _redis_alive():
            return "ok"
        return "disabled"
    except Exception as exc:
        logger.debug("health.redis_error", extra={"error": str(exc)})
        return "disabled"


def _route_count() -> int:
    try:
        return len(app.routes)
    except Exception:
        return 0


@app.get("/")
async def root():
    return {
        "message": "SocialNova API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "agents": 12,
        "routes": _route_count(),
        "endpoints": [r.path for r in app.routes if getattr(r, "path", None)],
    }


@app.get("/health")
async def health():
    db = await _db_check()
    redis = await _redis_check()
    return {
        "status": "healthy" if db == "ok" else "degraded",
        "version": settings.APP_VERSION,
        "agents": "operational",
        "checks": {
            "database": db,
            "redis": redis,
        },
    }


@app.get("/health/ready")
async def health_ready():
    """Readiness: DB must be reachable; Redis optional."""
    db = await _db_check()
    redis = await _redis_check()
    return {
        "status": "ready" if db == "ok" else "not_ready",
        "checks": {"database": db, "redis": redis},
    }


@app.get("/health/live")
async def health_live():
    """Liveness: the process is up and serving."""
    return {"status": "alive", "version": settings.APP_VERSION}


# ─── Prometheus metrics ─────────────────────────────────────────────────────

@app.get("/metrics", include_in_schema=False)
async def metrics_endpoint():
    """Prometheus exposition endpoint (plaintext)."""
    payload = metrics_service.generate_metrics_output()
    if payload is None:
        return PlainTextResponse(
            "metrics disabled (install prometheus-client or enable PROMETHEUS_ENABLED)",
            status_code=503,
        )
    return PlainTextResponse(payload, media_type=metrics_service.metrics_content_type())
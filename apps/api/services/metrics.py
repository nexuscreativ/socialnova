"""
SocialNova API - Prometheus-style metrics.

Collects HTTP request counters, a latency histogram and an active agent
session gauge. All access is guarded so a missing `prometheus_client` install
never crashes the application.
"""
import logging
import re
import threading
import time
from typing import Optional

from config import settings

logger = logging.getLogger("socialnova.metrics")

# ─── Optional import ────────────────────────────────────────────────────────

try:
    from prometheus_client import (
        CONTENT_TYPE_LATEST,
        Counter,
        Gauge,
        Histogram,
        generate_latest,
    )

    PROMETHEUS_AVAILABLE = True
except Exception:  # pragma: no cover - offline / stripped envs
    PROMETHEUS_AVAILABLE = False
    Counter = Gauge = Histogram = None
    generate_latest = None
    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4; charset=utf-8"


# ─── Metrics registry ───────────────────────────────────────────────────────

_lock = threading.Lock()

REQUESTS_TOTAL = None
REQUEST_LATENCY = None
ACTIVE_AGENT_SESSIONS = None
METRICS_INITIALIZED = False

_PATH_NORMALIZER = re.compile(r"/[0-9a-fA-F-]{8,}/")
_CLEANUP = re.compile(r"[^a-zA-Z0-9_:]")


def _normalize_path(path: str) -> str:
    """Replace UUID-ish segments so label cardinality stays bounded."""
    path = _PATH_NORMALIZER.sub("/:id/", path)
    return _CLEANUP.sub("_", path) or "root"


def init_metrics() -> None:
    """Idempotently create the prometheus collectors."""
    global REQUESTS_TOTAL, REQUEST_LATENCY, ACTIVE_AGENT_SESSIONS, METRICS_INITIALIZED
    if METRICS_INITIALIZED:
        return
    if not PROMETHEUS_AVAILABLE or not settings.PROMETHEUS_ENABLED:
        logger.debug("metrics.disabled")
        return
    with _lock:
        if METRICS_INITIALIZED:
            return
        REQUESTS_TOTAL = Counter(
            "socialnova_http_requests_total",
            "Total HTTP requests handled",
            ["method", "path", "status"],
        )
        REQUEST_LATENCY = Histogram(
            "socialnova_http_request_duration_seconds",
            "HTTP request latency in seconds",
            ["method", "path"],
            buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
        )
        ACTIVE_AGENT_SESSIONS = Gauge(
            "socialnova_active_agent_sessions",
            "Number of agent sessions currently in 'running' state",
        )
        METRICS_INITIALIZED = True
        logger.debug("metrics.initialized")


def record_request(method: str, path: str, status_code: int, duration_seconds: float) -> None:
    """Record one request telemetry point. Never raises."""
    try:
        init_metrics()
        if not METRICS_INITIALIZED:
            return
        name = _normalize_path(path)
        REQUESTS_TOTAL.labels(method=method, path=name, status=str(status_code)).inc()
        REQUEST_LATENCY.labels(method=method, path=name).observe(duration_seconds)
    except Exception as exc:  # pragma: no cover
        logger.debug("metrics.record_request_failed", extra={"error": str(exc)})


def set_active_agent_sessions(count: int) -> None:
    """Update the active agent-session gauge. Never raises."""
    try:
        init_metrics()
        if METRICS_INITIALIZED:
            ACTIVE_AGENT_SESSIONS.set(count)
    except Exception as exc:  # pragma: no cover
        logger.debug("metrics.gauge_failed", extra={"error": str(exc)})


def generate_metrics_output() -> Optional[bytes]:
    """Return Prometheus exposition bytes, or None when metrics are unavailable."""
    try:
        init_metrics()
        if not METRICS_INITIALIZED or generate_latest is None:
            return None
        return generate_latest()
    except Exception as exc:  # pragma: no cover
        logger.debug("metrics.generate_failed", extra={"error": str(exc)})
        return None


def metrics_content_type() -> str:
    return CONTENT_TYPE_LATEST


# Convenience: enable when the app boots (idempotent)
init_metrics()
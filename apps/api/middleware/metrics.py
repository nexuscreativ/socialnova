"""
SocialNova API - Metrics collection middleware.

Records HTTP request counters and latency histograms via services/metrics.
Fully guarded: any metrics error is swallowed so requests never 500 because
of telemetry.
"""
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("socialnova.metrics")


class MetricsMiddleware(BaseHTTPMiddleware):
    """Measure method/path/status/latency for every HTTP request."""

    async def dispatch(self, request, call_next):
        start = time.monotonic()
        try:
            response = await call_next(request)
            duration = time.monotonic() - start
            try:
                from services.metrics import record_request

                record_request(request.method, request.url.path, response.status_code, duration)
            except Exception as exc:
                logger.debug("metrics.middleware_failed", extra={"error": str(exc)})
            return response
        except Exception as exc:
            duration = time.monotonic() - start
            try:
                from services.metrics import record_request

                record_request(request.method, request.url.path, 500, duration)
            except Exception:
                pass
            logger.debug("metrics.middleware_exception", extra={"error": str(exc)})
            raise
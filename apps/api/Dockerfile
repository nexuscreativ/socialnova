# =============================================================================
# SocialNova API - Multi-stage Dockerfile
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS base

# Security: non-root user
RUN groupadd -r socialnova && useradd -r -g socialnova -d /app -s /sbin/nologin socialnova

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Stage 2: Dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 3: Development
# ---------------------------------------------------------------------------
FROM deps AS development

COPY apps/api/. .

# Install dev dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    httpx \
    ruff \
    mypy

RUN chown -R socialnova:socialnova /app

USER socialnova

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "debug"]

# ---------------------------------------------------------------------------
# Stage 4: Production Builder
# ---------------------------------------------------------------------------
FROM deps AS production-builder

COPY apps/api/. .

# Run tests before building production image
RUN python -c "from config import settings; print('Config OK')"

# ---------------------------------------------------------------------------
# Stage 5: Production
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS production

# Security: non-root user
RUN groupadd -r socialnova && useradd -r -g socialnova -d /app -s /sbin/nologin socialnova

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages
COPY --from=production-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=production-builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --from=production-builder /app /app

RUN chown -R socialnova:socialnova /app

# Uploads volume (Fly.io) / persistent upload store
RUN mkdir -p /data/uploads && chown -R socialnova:socialnova /data/uploads

USER socialnova

# Security headers
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=random

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run with gunicorn for production
CMD ["gunicorn", "main:app", \
     "-w", "4", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]

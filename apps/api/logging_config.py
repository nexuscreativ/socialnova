# =============================================================================
# SocialNova API - Structured Logging Configuration
# =============================================================================

import logging
import logging.config
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
import structlog
from config import settings

# =============================================================================
# Custom JSON Formatter
# =============================================================================

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "thread": record.thread,
            "process": record.process,
        }

        # Add extra fields
        if hasattr(record, "extra_data"):
            log_entry["data"] = record.extra_data

        # Add exception info
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        # Add request context if available
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "trace_id"):
            log_entry["trace_id"] = record.trace_id

        return json.dumps(log_entry, default=str)


class TextFormatter(logging.Formatter):
    """Text formatter for development."""

    COLORS = {
        "DEBUG": "\033[36m",      # Cyan
        "INFO": "\033[32m",       # Green
        "WARNING": "\033[33m",    # Yellow
        "ERROR": "\033[31m",      # Red
        "CRITICAL": "\033[35m",   # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return (
            f"{color}{timestamp} | {record.levelname:8} | "
            f"{record.name}:{record.lineno} | {record.getMessage()}{self.RESET}"
        )


# =============================================================================
# Logging Configuration
# =============================================================================

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": JSONFormatter,
        },
        "text": {
            "()": TextFormatter,
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json" if settings.LOG_FORMAT == "json" else "text",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "json",
            "filename": settings.LOG_FILE or "logs/socialnova.log",
            "maxBytes": settings.LOG_MAX_SIZE,
            "backupCount": settings.LOG_BACKUP_COUNT,
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "json",
            "filename": settings.LOG_FILE or "logs/socialnova-error.log",
            "maxBytes": settings.LOG_MAX_SIZE,
            "backupCount": settings.LOG_BACKUP_COUNT,
            "level": "ERROR",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console"],
            "level": settings.LOG_LEVEL.upper(),
            "propagate": True,
        },
        "uvicorn": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.error": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "sqlalchemy": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "sqlalchemy.engine": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "redis": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": settings.LOG_LEVEL.upper(),
    },
}

# Add file handler if log file is specified
if settings.LOG_FILE:
    LOGGING_CONFIG["handlers"]["console"]["handlers"] = ["console", "file", "error_file"]


def setup_logging():
    """Configure logging for the application."""
    logging.config.dictConfig(LOGGING_CONFIG)

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer() if settings.LOG_FORMAT == "json" else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        wrapper_class=structlog.BoundLogger,
        cache_logger_on_first_use=True,
    )


# =============================================================================
# Request Logging Middleware
# =============================================================================

class RequestLoggingMiddleware:
    """Middleware for logging HTTP requests."""

    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger("http.requests")

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request_id = scope.get("headers", [b"", b""])[0].decode() if scope.get("headers") else None
            method = scope.get("method", "UNKNOWN")
            path = scope.get("path", "/")

            # Log request start
            self.logger.info(
                "Request started",
                extra={
                    "extra_data": {
                        "method": method,
                        "path": path,
                        "query_string": scope.get("query_string", b"").decode(),
                        "client": scope.get("client", ("", 0))[0],
                    }
                }
            )

            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    status_code = message.get("status", 0)
                    self.logger.info(
                        "Request completed",
                        extra={
                            "extra_data": {
                                "method": method,
                                "path": path,
                                "status_code": status_code,
                            }
                        }
                    )
                await send(message)

            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)

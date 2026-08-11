# =============================================================================
# SocialNova API - Enhanced Configuration
# =============================================================================

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os

class Settings(BaseSettings):
    # -------------------------------------------------------------------------
    # App
    # -------------------------------------------------------------------------
    APP_NAME: str = "SocialNova API"
    APP_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"
    APP_ENV: str = "development"  # development, staging, production, testing
    DEBUG: bool = False
    API_VERSION: str = "v1"
    APP_VERSION: str = "0.2.0"
    APP_VERSION_HEADER: str = "X-API-Version"
    X_API_VERSION_CURRENT: str = "1.0"

    # -------------------------------------------------------------------------
    # Database
    # -------------------------------------------------------------------------
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/socialnova"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # -------------------------------------------------------------------------
    # Redis
    # -------------------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_SOCKET_CONNECT_TIMEOUT: int = 5

    # -------------------------------------------------------------------------
    # OpenRouter (AI)
    # -------------------------------------------------------------------------
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_TIMEOUT: int = 60
    OPENROUTER_MAX_RETRIES: int = 3

    # -------------------------------------------------------------------------
    # Auth
    # -------------------------------------------------------------------------
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"

    # -------------------------------------------------------------------------
    # Stripe
    # -------------------------------------------------------------------------
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    SOCIAL_WEBHOOK_SECRET: str = ""

    # -------------------------------------------------------------------------
    # Email
    # -------------------------------------------------------------------------
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@socialnova.com"
    SMTP_USE_TLS: bool = True

    # -------------------------------------------------------------------------
    # CORS
    # -------------------------------------------------------------------------
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # -------------------------------------------------------------------------
    # Rate Limiting
    # -------------------------------------------------------------------------
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    RATE_LIMIT_PER_DAY: int = 10000
    ENABLE_RATE_LIMIT: bool = True
    # Trusted reverse-proxy IP (nginx/ALB). X-Forwarded-For is only honoured
    # when the immediate peer matches this value; unset means XFF stays ignored.
    TRUSTED_PROXY: Optional[str] = None
    # Cap on distinct rate-limit keys kept in memory (LRU eviction).
    RATE_LIMIT_MAX_KEYS: int = 100_000

    # -------------------------------------------------------------------------
    # Security
    # -------------------------------------------------------------------------
    ADMIN_EMAILS: list[str] = []
    ALLOWED_HOSTS: list[str] = ["*"]
    SECRET_KEY_ROTATION_DAYS: int = 90
    API_KEY_EXPIRY_DAYS: int = 365

    # -------------------------------------------------------------------------
    # Logging
    # -------------------------------------------------------------------------
    LOG_LEVEL: str = "info"
    LOG_FORMAT: str = "json"  # json, text
    LOG_FILE: str = ""
    LOG_MAX_SIZE: int = 100 * 1024 * 1024  # 100MB
    LOG_BACKUP_COUNT: int = 5
    LOG_ROTATION: str = "midnight"

    # -------------------------------------------------------------------------
    # Monitoring
    # -------------------------------------------------------------------------
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    METRICS_PATH: str = "/metrics"
    PROMETHEUS_ENABLED: bool = True
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1

    # -------------------------------------------------------------------------
    # Performance
    # -------------------------------------------------------------------------
    MAX_REQUESTS_PER_SECOND: int = 1000
    REQUEST_TIMEOUT: int = 60
    KEEP_ALIVE_TIMEOUT: int = 75
    WORKERS: int = 4
    MAX_CONNECTIONS: int = 100

    # -------------------------------------------------------------------------
    # Cache
    # -------------------------------------------------------------------------
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_PREFIX: str = "socialnova:"
    CACHE_ENABLED: bool = True

    # -------------------------------------------------------------------------
    # File Storage
    # -------------------------------------------------------------------------
    UPLOAD_DIR: str = "./uploads"
    UPLOAD_URL_PREFIX: str = "/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt"}

    # -------------------------------------------------------------------------
    # Feature Flags
    # -------------------------------------------------------------------------
    ENABLE_AI_FEATURES: bool = True
    ENABLE_ANALYTICS: bool = True
    ENABLE_WEBHOOKS: bool = True
    ENABLE_CONTENT_MODERATION: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    def is_testing(self) -> bool:
        return self.APP_ENV == "testing"

    def has_secure_secret_key(self) -> bool:
        """True when the JWT signing key is not the public default/empty value."""
        return bool(self.SECRET_KEY) and self.SECRET_KEY != "change-me-in-production"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: Optional[str] = Field(None, max_length=255)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class VerifyEmailRequest(BaseModel):
    token: str


# ─── User Schemas ────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    tier: str
    role: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = Field(None, max_length=500)


class DeleteAccountRequest(BaseModel):
    password: str = Field(..., min_length=1)


# ─── API Key Schemas ─────────────────────────────────────────────────────────

class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    daily_budget_cents: int = Field(default=1000, ge=0, le=100000)


class APIKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    rate_limit: int
    daily_budget_cents: int
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class APIKeyCreatedResponse(APIKeyResponse):
    raw_key: str  # Only returned on creation


# ─── Usage Schemas ───────────────────────────────────────────────────────────

class UsageSummary(BaseModel):
    total_requests: int
    total_tokens: int
    total_cost_cents: float
    period_start: datetime
    period_end: datetime


class UsageBreakdown(BaseModel):
    requests_by_agent: Dict[str, int]
    tokens_by_agent: Dict[str, int]
    cost_by_agent: Dict[str, float]


# ─── Agent Schemas ───────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    agent_type: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    model_tier: str = Field(default="free", pattern="^(free|mid|frontier)$")
    config: Optional[Dict[str, Any]] = {}


class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, pattern="^(active|paused|archived)$")
    model_tier: Optional[str] = Field(None, pattern="^(free|mid|frontier)$")
    config: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    agent_type: str
    name: str
    description: Optional[str]
    status: str
    model_tier: str
    is_builtin: bool
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentExecuteRequest(BaseModel):
    input_data: Dict[str, Any] = Field(..., min_length=1)
    timeout_seconds: int = Field(default=120, ge=5, le=600)


class AgentExecuteResponse(BaseModel):
    session_id: UUID
    status: str
    output: Optional[Dict[str, Any]] = None
    tokens_used: int = 0
    cost_cents: float = 0.0
    duration_ms: int = 0


class AgentSessionResponse(BaseModel):
    id: UUID
    agent_id: UUID
    status: str
    input_data: Dict[str, Any]
    output: Optional[Dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Content Schemas ─────────────────────────────────────────────────────────

class ContentCreate(BaseModel):
    platform: str = Field(..., min_length=1, max_length=50)
    content_type: str = Field(..., min_length=1, max_length=50)
    title: Optional[str] = Field(None, max_length=500)
    text: str = Field(..., min_length=1, max_length=5000)
    hashtags: List[str] = Field(default_factory=list, max_length=30)
    media_urls: List[str] = Field(default_factory=list, max_length=10)
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = {}


class ContentUpdate(BaseModel):
    platform: Optional[str] = Field(None, min_length=1, max_length=50)
    content_type: Optional[str] = Field(None, min_length=1, max_length=50)
    title: Optional[str] = Field(None, max_length=500)
    text: Optional[str] = Field(None, min_length=1, max_length=5000)
    hashtags: Optional[List[str]] = Field(None, max_length=30)
    media_urls: Optional[List[str]] = Field(None, max_length=10)
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class ContentResponse(BaseModel):
    id: UUID
    user_id: UUID
    agent_id: Optional[UUID]
    platform: str
    content_type: str
    title: Optional[str]
    text: str
    hashtags: List[str]
    media_urls: List[str]
    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    status: str
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, content):
        return cls(
            id=content.id,
            user_id=content.user_id,
            agent_id=content.agent_id,
            platform=content.platform,
            content_type=content.content_type,
            title=content.title,
            text=content.text,
            hashtags=content.hashtags or [],
            media_urls=content.media_urls or [],
            scheduled_at=content.scheduled_at,
            published_at=content.published_at,
            status=content.status,
            metadata=content.extra_data or {},
            created_at=content.created_at,
            updated_at=content.updated_at,
        )


class PublishRequest(BaseModel):
    platforms: List[str] = Field(default_factory=list)
    publish_now: bool = True


class ScheduleRequest(BaseModel):
    scheduled_at: datetime = Field(..., description="When to publish (ISO 8601)")
    platforms: List[str] = Field(default_factory=list)


# ─── Campaign Schemas ────────────────────────────────────────────────────────

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    campaign_type: str = Field(..., min_length=1, max_length=20)
    budget_cents: Optional[int] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    goals: Optional[Dict[str, Any]] = {}
    platforms: Optional[List[str]] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    campaign_type: Optional[str] = Field(None, min_length=1, max_length=20)
    status: Optional[str] = Field(None, pattern="^(draft|active|paused|completed|archived)$")
    budget_cents: Optional[int] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    goals: Optional[Dict[str, Any]] = None
    platforms: Optional[List[str]] = None


class CampaignResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    campaign_type: str
    status: str
    budget_cents: Optional[int]
    spent_cents: int
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    goals: Dict[str, Any]
    platforms: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CampaignAnalytics(BaseModel):
    campaign_id: UUID
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    engagement_rate: float = 0.0
    cost_per_click: float = 0.0
    cost_per_conversion: float = 0.0
    roi: float = 0.0
    platform_breakdown: Dict[str, Dict[str, int]] = {}
    daily_metrics: List[Dict[str, Any]] = []


# ─── Webhook Schemas ─────────────────────────────────────────────────────────

class WebhookResponse(BaseModel):
    received: bool = True
    processed: bool = True


# ─── Admin Schemas ───────────────────────────────────────────────────────────

class PlatformStats(BaseModel):
    total_users: int
    active_users_30d: int
    total_agents: int
    total_content: int
    total_campaigns: int
    total_api_requests: int
    total_tokens_used: int
    total_cost_cents: float
    revenue_cents: float
    tier_distribution: Dict[str, int]


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    tier: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class BroadcastRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)
    target_tier: Optional[str] = None  # None = all users
    target_role: Optional[str] = None


# ─── Shared Schemas ──────────────────────────────────────────────────────────

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


class ErrorResponse(BaseModel):
    detail: str
    code: str = "error"
    metadata: Optional[Dict[str, Any]] = None


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


# ─── Chat Schemas ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[str] = None
    agent_type: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}


class ChatResponse(BaseModel):
    response: str
    agent_used: str
    conversation_id: str
    tokens_used: int = 0
    suggestions: List[str] = []
    metadata: Optional[Dict[str, Any]] = {}


class ChatCompletionsRequest(BaseModel):
    messages: List[Dict[str, str]] = Field(..., min_length=1, max_length=100)
    model: Optional[str] = None
    tier: str = "free"

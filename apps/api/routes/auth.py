"""
Authentication routes: register, login, refresh, logout, password reset, me.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from models import User
from schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    UserResponse,
    MessageResponse,
)
from services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_refresh_token_record,
    create_user,
    decode_access_token,
    get_user_by_email,
    revoke_all_user_tokens,
    revoke_refresh_token,
    validate_refresh_token,
    verify_email_token,
    generate_verification_token,
    generate_reset_token,
    reset_password as reset_password_service,
)
from services.audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = await create_user(db, body.email, body.password, body.name)
    await db.commit()

    await log_audit_event(
        db, action="user.registered", user_id=user.id,
        resource_type="user", resource_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return JWT tokens."""
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id, user.role)
    refresh_raw = create_refresh_token(user.id)
    record = await create_refresh_token_record(db, user.id, refresh_raw)

    await db.commit()

    await log_audit_event(
        db, action="user.login", user_id=user.id,
        resource_type="user", resource_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    from config import settings
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_raw,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Issue new access + refresh tokens from a valid refresh token."""
    record = await validate_refresh_token(db, body.refresh_token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Revoke old token (rotation)
    record.is_revoked = True
    await db.flush()

    user = record.user_id

    # Get user for role
    from services.auth import get_user_by_id
    user_obj = await get_user_by_id(db, user)
    if not user_obj or not user_obj.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active",
        )

    access_token = create_access_token(user, user_obj.role)
    refresh_raw = create_refresh_token(user)
    await create_refresh_token_record(db, user, refresh_raw)

    await db.commit()

    from config import settings
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_raw,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke all refresh tokens for the current user."""
    count = await revoke_all_user_tokens(db, user.id)
    await db.commit()

    await log_audit_event(
        db, action="user.logout", user_id=user.id,
        resource_type="user", resource_id=user.id,
        details={"tokens_revoked": count},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return MessageResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Send a password reset email (token delivered by email, never in the body)."""
    user = await get_user_by_email(db, body.email)
    if not user:
        # Always return success to prevent email enumeration
        return MessageResponse(message="If the email exists, a reset link has been sent")

    token = await generate_reset_token(db, user.id)
    await db.commit()

    await log_audit_event(
        db, action="user.password_reset_requested", user_id=user.id,
        resource_type="user", resource_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    from services.email import send_password_reset_email
    await send_password_reset_email(user, token)

    # Always return the same message for both existing and non-existing emails
    # to prevent email enumeration. The reset token is only delivered by email.
    return MessageResponse(
        message="If the email exists, a reset link has been sent",
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_endpoint(
    body: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the token from forgot-password."""
    success = await reset_password_service(db, body.token, body.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    await db.commit()

    # Revoke all existing sessions
    # TODO: also revoke all access tokens via a token blacklist

    return MessageResponse(message="Password reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    body: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify email address using verification token."""
    user = await verify_email_token(db, body.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token",
        )
    await db.commit()

    return MessageResponse(message="Email verified successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return user

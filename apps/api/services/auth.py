"""
Authentication service: JWT token management, password hashing, and verification.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import User, RefreshToken

# ─── Password Hashing ───────────────────────────────────────────────────────

import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


# ─── Token Utilities ────────────────────────────────────────────────────────

def create_access_token(user_id: UUID, role: str = "user") -> str:
    """Create a short-lived JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    """Create a long-lived opaque refresh token."""
    return secrets.token_urlsafe(64)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate an access token. Returns payload or None."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def hash_token(token: str) -> str:
    """SHA-256 hash of a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


# ─── Database Operations ────────────────────────────────────────────────────

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, password: str, name: Optional[str] = None) -> User:
    """Create a new user with hashed password."""
    user = User(
        email=email.lower().strip(),
        name=name,
        password_hash=hash_password(password),
        verification_token=secrets.token_urlsafe(32),
    )
    db.add(user)
    await db.flush()
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user by email/password. Returns User or None."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


async def create_refresh_token_record(db: AsyncSession, user_id: UUID, token: str) -> RefreshToken:
    """Store refresh token hash in database."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    record = RefreshToken(
        user_id=user_id,
        token_hash=hash_token(token),
        expires_at=expires_at,
    )
    db.add(record)
    await db.flush()
    return record


async def validate_refresh_token(db: AsyncSession, token: str) -> Optional[RefreshToken]:
    """Validate a refresh token. Returns the record if valid."""
    token_hash = hash_token(token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    return result.scalar_one_or_none()


async def revoke_refresh_token(db: AsyncSession, token: str) -> bool:
    """Revoke a single refresh token."""
    token_hash = hash_token(token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = result.scalar_one_or_none()
    if record:
        record.is_revoked = True
        await db.flush()
        return True
    return False


async def revoke_all_user_tokens(db: AsyncSession, user_id: UUID) -> int:
    """Revoke all refresh tokens for a user. Returns count."""
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False,
        )
    )
    records = result.scalars().all()
    for record in records:
        record.is_revoked = True
    await db.flush()
    return len(records)


async def generate_verification_token(db: AsyncSession, user_id: UUID) -> str:
    """Generate a new email verification token."""
    token = secrets.token_urlsafe(32)
    user = await get_user_by_id(db, user_id)
    if user:
        user.verification_token = token
        await db.flush()
    return token


async def verify_email_token(db: AsyncSession, token: str) -> Optional[User]:
    """Verify email with token. Returns user if valid."""
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()
    if user:
        user.is_verified = True
        user.verification_token = None
        await db.flush()
    return user


async def generate_reset_token(db: AsyncSession, user_id: UUID) -> str:
    """Generate a password reset token with expiry."""
    token = secrets.token_urlsafe(32)
    user = await get_user_by_id(db, user_id)
    if user:
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.flush()
    return token


async def validate_reset_token(db: AsyncSession, token: str) -> Optional[User]:
    """Validate a password reset token. Returns user if valid."""
    result = await db.execute(
        select(User).where(
            User.reset_token == token,
            User.reset_token_expires > datetime.now(timezone.utc),
        )
    )
    return result.scalar_one_or_none()


async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
    """Reset password using token."""
    user = await validate_reset_token(db, token)
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.flush()
    return True

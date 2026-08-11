"""
Unit tests for the authentication service.
Covers: password hashing, JWT tokens, user CRUD, refresh tokens, verification, reset.
"""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from jose import jwt

from config import settings
from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_token,
    get_user_by_email,
    get_user_by_id,
    create_user,
    authenticate_user,
    create_refresh_token_record,
    validate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    generate_verification_token,
    verify_email_token,
    generate_reset_token,
    validate_reset_token,
    reset_password,
)


# ─── Password Hashing ──────────────────────────────────────────────────────

class TestPasswordHashing:
    """Tests for bcrypt password hashing."""

    def test_hash_password_returns_string(self):
        """Arrange / Act / Assert"""
        hashed = hash_password("TestPass123")
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_is_different_each_time(self):
        """Bcrypt should produce different hashes for the same input."""
        hash1 = hash_password("TestPass123")
        hash2 = hash_password("TestPass123")
        assert hash1 != hash2

    def test_verify_password_correct(self):
        """Correct password should verify."""
        plain = "SecurePass456"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_incorrect(self):
        """Wrong password should fail verification."""
        hashed = hash_password("CorrectPass1")
        assert verify_password("WrongPass999", hashed) is False

    def test_verify_password_empty_string(self):
        """Empty password should not verify against any hash."""
        hashed = hash_password("SomePass1")
        assert verify_password("", hashed) is False

    def test_verify_password_special_characters(self):
        """Passwords with special characters should work."""
        plain = "P@$$w0rd!#%"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_unicode(self):
        """Unicode passwords should be hashable."""
        plain = "ПарольТест1"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True


# ─── JWT Token Creation & Decoding ────────────────────────────────────────

class TestJWTTokens:
    """Tests for JWT access token creation and decoding."""

    def test_create_access_token_returns_string(self):
        """Token should be a non-empty string."""
        token = create_access_token(uuid.uuid4(), "user")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_contains_correct_payload(self):
        """Decoded token should contain user ID, role, and type."""
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "admin")
        payload = decode_access_token(token)

        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["role"] == "admin"
        assert payload["type"] == "access"

    def test_decode_access_token_valid(self):
        """Valid token should decode successfully."""
        token = create_access_token(uuid.uuid4(), "user")
        payload = decode_access_token(token)
        assert payload is not None
        assert "exp" in payload
        assert "iat" in payload

    def test_decode_access_token_expired(self):
        """Expired token should return None."""
        payload = {
            "sub": str(uuid.uuid4()),
            "role": "user",
            "type": "access",
            "exp": datetime(2020, 1, 1, tzinfo=timezone.utc),
            "iat": datetime(2019, 1, 1, tzinfo=timezone.utc),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        assert decode_access_token(token) is None

    def test_decode_access_token_wrong_secret(self):
        """Token signed with wrong secret should return None."""
        payload = {
            "sub": str(uuid.uuid4()),
            "role": "user",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(payload, "wrong-secret-key", algorithm=settings.ALGORITHM)
        assert decode_access_token(token) is None

    def test_decode_access_token_refresh_type_rejected(self):
        """Token with type='refresh' should be rejected by decode_access_token."""
        payload = {
            "sub": str(uuid.uuid4()),
            "role": "user",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        assert decode_access_token(token) is None

    def test_decode_access_token_malformed(self):
        """Malformed token string should return None."""
        assert decode_access_token("not.a.valid.jwt") is None
        assert decode_access_token("") is None
        assert decode_access_token("garbage") is None

    def test_create_refresh_token_returns_urlsafe_string(self):
        """Refresh token should be a URL-safe string of sufficient length."""
        token = create_refresh_token(uuid.uuid4())
        assert isinstance(token, str)
        assert len(token) >= 60

    def test_create_refresh_token_unique(self):
        """Each refresh token should be unique."""
        tokens = {create_refresh_token(uuid.uuid4()) for _ in range(50)}
        assert len(tokens) == 50


# ─── Token Hashing ─────────────────────────────────────────────────────────

class TestTokenHashing:
    """Tests for SHA-256 token hashing."""

    def test_hash_token_deterministic(self):
        """Same token should always produce the same hash."""
        token = "test-refresh-token-abc123"
        assert hash_token(token) == hash_token(token)

    def test_hash_token_different_inputs(self):
        """Different tokens should produce different hashes."""
        h1 = hash_token("token-a")
        h2 = hash_token("token-b")
        assert h1 != h2

    def test_hash_token_returns_hex_string(self):
        """Hash should be a 64-character hex string (SHA-256)."""
        result = hash_token("test")
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)


# ─── User Database Operations ─────────────────────────────────────────────

@pytest.mark.asyncio
class TestUserDatabaseOperations:
    """Tests for user-related database operations."""

    async def test_get_user_by_email_found(self, db_session, test_user):
        """Should return user when email exists."""
        db_session.add(test_user)
        await db_session.flush()

        result = await get_user_by_email(db_session, test_user.email)
        assert result is not None
        assert result.email == test_user.email

    async def test_get_user_by_email_not_found(self, db_session):
        """Should return None when email doesn't exist."""
        result = await get_user_by_email(db_session, "nonexistent@example.com")
        assert result is None

    async def test_get_user_by_id_found(self, db_session, test_user):
        """Should return user when ID exists."""
        db_session.add(test_user)
        await db_session.flush()

        result = await get_user_by_id(db_session, test_user.id)
        assert result is not None
        assert result.id == test_user.id

    async def test_get_user_by_id_not_found(self, db_session):
        """Should return None when ID doesn't exist."""
        result = await get_user_by_id(db_session, uuid.uuid4())
        assert result is None

    async def test_create_user_success(self, db_session):
        """Should create a new user with hashed password."""
        user = await create_user(db_session, "new@example.com", "StrongPass1", "New User")
        assert user.email == "new@example.com"
        assert user.name == "New User"
        assert user.password_hash != "StrongPass1"  # Must be hashed
        assert verify_password("StrongPass1", user.password_hash)
        assert user.is_verified is False
        assert user.is_active is True

    async def test_create_user_email_normalized(self, db_session):
        """Email should be lowercased and stripped."""
        user = await create_user(db_session, "  UPPER@EXAMPLE.COM  ", "Pass1234")
        assert user.email == "upper@example.com"

    async def test_create_user_with_verification_token(self, db_session):
        """New user should have a verification token."""
        user = await create_user(db_session, "verify@example.com", "Pass1234")
        assert user.verification_token is not None
        assert len(user.verification_token) > 0

    async def test_authenticate_user_success(self, db_session, test_user):
        """Should return user when credentials are correct."""
        db_session.add(test_user)
        await db_session.flush()

        result = await authenticate_user(db_session, test_user.email, "TestPass123")
        assert result is not None
        assert result.id == test_user.id

    async def test_authenticate_user_wrong_password(self, db_session, test_user):
        """Should return None when password is wrong."""
        db_session.add(test_user)
        await db_session.flush()

        result = await authenticate_user(db_session, test_user.email, "WrongPassword1")
        assert result is None

    async def test_authenticate_user_nonexistent_email(self, db_session):
        """Should return None for non-existent email."""
        result = await authenticate_user(db_session, "ghost@example.com", "AnyPass1")
        assert result is None

    async def test_authenticate_user_inactive(self, db_session, inactive_user):
        """Should return None for inactive users."""
        db_session.add(inactive_user)
        await db_session.flush()

        result = await authenticate_user(db_session, inactive_user.email, "TestPass123")
        assert result is None


# ─── Refresh Token Operations ──────────────────────────────────────────────

@pytest.mark.asyncio
class TestRefreshTokenOperations:
    """Tests for refresh token CRUD and validation."""

    async def test_create_refresh_token_record(self, db_session, test_user):
        """Should store refresh token hash in database."""
        db_session.add(test_user)
        await db_session.flush()

        raw_token = create_refresh_token(test_user.id)
        record = await create_refresh_token_record(db_session, test_user.id, raw_token)

        assert record.user_id == test_user.id
        assert record.token_hash == hash_token(raw_token)
        assert record.is_revoked is False
        assert record.expires_at > datetime.now(timezone.utc)

    async def test_validate_refresh_token_valid(self, db_session, test_user):
        """Should return record for valid refresh token."""
        db_session.add(test_user)
        await db_session.flush()

        raw_token = create_refresh_token(test_user.id)
        await create_refresh_token_record(db_session, test_user.id, raw_token)
        await db_session.flush()

        result = await validate_refresh_token(db_session, raw_token)
        assert result is not None
        assert result.user_id == test_user.id

    async def test_validate_refresh_token_invalid(self, db_session):
        """Should return None for non-existent token."""
        result = await validate_refresh_token(db_session, "nonexistent-token")
        assert result is None

    async def test_validate_refresh_token_revoked(self, db_session, test_user):
        """Should return None for revoked token."""
        db_session.add(test_user)
        await db_session.flush()

        raw_token = create_refresh_token(test_user.id)
        await create_refresh_token_record(db_session, test_user.id, raw_token)
        await db_session.flush()

        await revoke_refresh_token(db_session, raw_token)
        await db_session.flush()

        result = await validate_refresh_token(db_session, raw_token)
        assert result is None

    async def test_revoke_refresh_token_success(self, db_session, test_user):
        """Should revoke a valid refresh token."""
        db_session.add(test_user)
        await db_session.flush()

        raw_token = create_refresh_token(test_user.id)
        await create_refresh_token_record(db_session, test_user.id, raw_token)
        await db_session.flush()

        success = await revoke_refresh_token(db_session, raw_token)
        assert success is True

    async def test_revoke_refresh_token_not_found(self, db_session):
        """Should return False for non-existent token."""
        success = await revoke_refresh_token(db_session, "nonexistent")
        assert success is False

    async def test_revoke_all_user_tokens(self, db_session, test_user):
        """Should revoke all active refresh tokens for a user."""
        db_session.add(test_user)
        await db_session.flush()

        for _ in range(3):
            raw = create_refresh_token(test_user.id)
            await create_refresh_token_record(db_session, test_user.id, raw)

        await db_session.flush()
        count = await revoke_all_user_tokens(db_session, test_user.id)
        assert count == 3

    async def test_revoke_all_user_tokens_none_active(self, db_session, test_user):
        """Should return 0 when no active tokens exist."""
        db_session.add(test_user)
        await db_session.flush()

        count = await revoke_all_user_tokens(db_session, test_user.id)
        assert count == 0


# ─── Email Verification ───────────────────────────────────────────────────

@pytest.mark.asyncio
class TestEmailVerification:
    """Tests for email verification token flow."""

    async def test_generate_verification_token(self, db_session, test_user):
        """Should generate and store a new verification token."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_verification_token(db_session, test_user.id)
        assert token is not None
        assert len(token) > 0

    async def test_verify_email_token_success(self, db_session, test_user):
        """Should mark user as verified when valid token is used."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_verification_token(db_session, test_user.id)
        await db_session.flush()

        user = await verify_email_token(db_session, token)
        assert user is not None
        assert user.is_verified is True
        assert user.verification_token is None

    async def test_verify_email_token_invalid(self, db_session):
        """Should return None for invalid verification token."""
        result = await verify_email_token(db_session, "invalid-token")
        assert result is None

    async def test_verify_email_token_reusable_after_clearing(self, db_session, test_user):
        """Token should be cleared after first use."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_verification_token(db_session, test_user.id)
        await db_session.flush()

        await verify_email_token(db_session, token)
        await db_session.flush()

        result = await verify_email_token(db_session, token)
        assert result is None


# ─── Password Reset ────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestPasswordReset:
    """Tests for password reset flow."""

    async def test_generate_reset_token(self, db_session, test_user):
        """Should generate a reset token with expiry."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_reset_token(db_session, test_user.id)
        assert token is not None
        assert len(token) > 0

    async def test_validate_reset_token_valid(self, db_session, test_user):
        """Should return user for valid reset token."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_reset_token(db_session, test_user.id)
        await db_session.flush()

        user = await validate_reset_token(db_session, token)
        assert user is not None
        assert user.id == test_user.id

    async def test_validate_reset_token_invalid(self, db_session):
        """Should return None for invalid reset token."""
        result = await validate_reset_token(db_session, "bad-token")
        assert result is None

    async def test_reset_password_success(self, db_session, test_user):
        """Should update password when valid reset token is used."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_reset_token(db_session, test_user.id)
        await db_session.flush()

        success = await reset_password(db_session, token, "NewPass789")
        assert success is True
        await db_session.flush()

        # Verify old password no longer works
        from services.auth import get_user_by_id
        user = await get_user_by_id(db_session, test_user.id)
        assert verify_password("NewPass789", user.password_hash)
        assert not verify_password("TestPass123", user.password_hash)

    async def test_reset_password_clears_token(self, db_session, test_user):
        """Reset token should be cleared after successful password reset."""
        db_session.add(test_user)
        await db_session.flush()

        token = await generate_reset_token(db_session, test_user.id)
        await db_session.flush()

        await reset_password(db_session, token, "NewPass789")
        await db_session.flush()

        from services.auth import get_user_by_id
        user = await get_user_by_id(db_session, test_user.id)
        assert user.reset_token is None
        assert user.reset_token_expires is None

    async def test_reset_password_invalid_token(self, db_session):
        """Should return False for invalid reset token."""
        success = await reset_password(db_session, "invalid-token", "NewPass123")
        assert success is False

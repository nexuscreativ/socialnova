"""
Integration tests for authentication routes.
Covers: register, login, refresh, logout, forgot-password, reset-password, verify-email, me.
"""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest

from models import User, RefreshToken
from services.auth import hash_password, create_access_token, create_refresh_token, hash_token


@pytest.mark.asyncio
class TestRegisterEndpoint:
    """Tests for POST /api/v1/auth/register."""

    async def test_register_success(self, client):
        """Should create a new user and return 201."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "StrongPass1",
                "name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["name"] == "New User"
        assert "id" in data
        assert data["tier"] == "free"

    async def test_register_duplicate_email(self, client, db_session, test_user):
        """Should return 409 for duplicate email."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/auth/register",
            json={
                "email": test_user.email,
                "password": "StrongPass1",
            },
        )
        assert response.status_code == 409

    async def test_register_weak_password(self, client):
        """Should return 422 for weak password."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "weak",
            },
        )
        assert response.status_code == 422

    async def test_register_invalid_email(self, client):
        """Should return 422 for invalid email."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "not-an-email",
                "password": "StrongPass1",
            },
        )
        assert response.status_code == 422

    async def test_register_missing_fields(self, client):
        """Should return 422 when required fields are missing."""
        response = await client.post(
            "/auth/register",
            json={"email": "test@example.com"},
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestLoginEndpoint:
    """Tests for POST /api/v1/auth/login."""

    async def test_login_success(self, client, db_session, test_user):
        """Should return tokens for valid credentials."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "TestPass123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    async def test_login_wrong_password(self, client, db_session, test_user):
        """Should return 401 for wrong password."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "WrongPassword1",
            },
        )
        assert response.status_code == 401

    async def test_login_nonexistent_email(self, client):
        """Should return 401 for non-existent email."""
        response = await client.post(
            "/auth/login",
            json={
                "email": "ghost@example.com",
                "password": "AnyPass1",
            },
        )
        assert response.status_code == 401

    async def test_login_inactive_user(self, client, db_session, inactive_user):
        """Should return 401 for inactive user."""
        db_session.add(inactive_user)
        await db_session.commit()

        response = await client.post(
            "/auth/login",
            json={
                "email": inactive_user.email,
                "password": "TestPass123",
            },
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestRefreshTokenEndpoint:
    """Tests for POST /api/v1/auth/refresh."""

    async def test_refresh_success(self, client, db_session, test_user):
        """Should return new tokens for valid refresh token."""
        db_session.add(test_user)
        await db_session.commit()

        raw_token = create_refresh_token(test_user.id)
        from services.auth import create_refresh_token_record
        await create_refresh_token_record(db_session, test_user.id, raw_token)
        await db_session.commit()

        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": raw_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["refresh_token"] != raw_token  # Token rotation

    async def test_refresh_invalid_token(self, client):
        """Should return 401 for invalid refresh token."""
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )
        assert response.status_code == 401

    async def test_refresh_revoked_token(self, client, db_session, test_user):
        """Should return 401 for revoked refresh token."""
        db_session.add(test_user)
        await db_session.commit()

        raw_token = create_refresh_token(test_user.id)
        from services.auth import create_refresh_token_record, revoke_refresh_token
        await create_refresh_token_record(db_session, test_user.id, raw_token)
        await db_session.commit()

        await revoke_refresh_token(db_session, raw_token)
        await db_session.commit()

        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": raw_token},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestLogoutEndpoint:
    """Tests for POST /api/v1/auth/logout."""

    async def test_logout_success(self, client, db_session, test_user, auth_headers):
        """Should revoke all tokens and return 200."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/auth/logout",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

    async def test_logout_unauthenticated(self, client):
        """Should return 401 without auth headers."""
        response = await client.post("/auth/logout")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestForgotPasswordEndpoint:
    """Tests for POST /api/v1/auth/forgot-password."""

    async def test_forgot_password_existing_email(self, client, db_session, test_user):
        """Should return success message for existing email."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.post(
            "/auth/forgot-password",
            json={"email": test_user.email},
        )
        assert response.status_code == 200
        body = response.json()
        assert "reset link" in body["message"].lower()
        assert body.get("detail") is None
        assert not body.get("token")

    async def test_forgot_password_nonexistent_email(self, client):
        """Should return same success message to prevent email enumeration."""
        response = await client.post(
            "/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200
        assert "reset link" in response.json()["message"].lower()


@pytest.mark.asyncio
class TestResetPasswordEndpoint:
    """Tests for POST /api/v1/auth/reset-password."""

    async def test_reset_password_success(self, client, db_session, test_user):
        """Should reset password with valid token."""
        db_session.add(test_user)
        await db_session.commit()

        from services.auth import generate_reset_token
        token = await generate_reset_token(db_session, test_user.id)
        await db_session.commit()

        response = await client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": "NewPass789"},
        )
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()

    async def test_reset_password_invalid_token(self, client):
        """Should return 400 for invalid reset token."""
        response = await client.post(
            "/auth/reset-password",
            json={"token": "invalid-token", "new_password": "NewPass789"},
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestVerifyEmailEndpoint:
    """Tests for POST /api/v1/auth/verify-email."""

    async def test_verify_email_success(self, client, db_session, test_user):
        """Should verify email with valid token."""
        db_session.add(test_user)
        await db_session.commit()

        from services.auth import generate_verification_token
        token = await generate_verification_token(db_session, test_user.id)
        await db_session.commit()

        response = await client.post(
            "/auth/verify-email",
            json={"token": token},
        )
        assert response.status_code == 200
        assert "verified" in response.json()["message"].lower()

    async def test_verify_email_invalid_token(self, client):
        """Should return 400 for invalid verification token."""
        response = await client.post(
            "/auth/verify-email",
            json={"token": "invalid-token"},
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestGetMeEndpoint:
    """Tests for GET /api/v1/auth/me."""

    async def test_get_me_authenticated(self, client, db_session, test_user, auth_headers):
        """Should return current user profile."""
        db_session.add(test_user)
        await db_session.commit()

        response = await client.get(
            "/auth/me",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email

    async def test_get_me_unauthenticated(self, client):
        """Should return 401 without auth."""
        response = await client.get("/auth/me")
        assert response.status_code == 401

    async def test_get_me_expired_token(self, client, expired_headers):
        """Should return 401 for expired token."""
        response = await client.get(
            "/auth/me",
            headers=expired_headers,
        )
        assert response.status_code == 401


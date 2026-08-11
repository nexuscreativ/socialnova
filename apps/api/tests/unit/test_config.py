"""
Unit tests for configuration security guards.
"""
import pytest

from config import Settings


class TestSecretKeyGuard:
    def test_default_key_is_insecure(self):
        s = Settings(SECRET_KEY="change-me-in-production")
        assert s.has_secure_secret_key() is False

    def test_empty_key_is_insecure(self):
        s = Settings(SECRET_KEY="")
        assert s.has_secure_secret_key() is False

    def test_strong_key_is_secure(self):
        s = Settings(SECRET_KEY="a9f3!k2$m8@q1#z7^")
        assert s.has_secure_secret_key() is True

    def test_production_with_default_key_rejected(self):
        s = Settings(APP_ENV="production", SECRET_KEY="change-me-in-production")
        assert s.is_production()
        assert not s.has_secure_secret_key()
        assert not (s.is_production() and s.has_secure_secret_key())

    def test_production_with_strong_key_passes_guard(self):
        s = Settings(APP_ENV="production", SECRET_KEY="random-strong-secret")
        assert s.is_production() and s.has_secure_secret_key()


class TestAdminEmailsParsing:
    def test_comma_separated_env_string(self):
        s = Settings(ADMIN_EMAILS="a@x.com, b@x.com ,c@x.com")
        assert s.ADMIN_EMAILS == ["a@x.com", "b@x.com", "c@x.com"]

    def test_list_value_passthrough(self):
        s = Settings(ADMIN_EMAILS=["a@x.com", "b@x.com"])
        assert s.ADMIN_EMAILS == ["a@x.com", "b@x.com"]

    def test_empty_string(self):
        s = Settings(ADMIN_EMAILS="")
        assert s.ADMIN_EMAILS == []

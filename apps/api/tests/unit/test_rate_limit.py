"""
Unit tests for the rate limiter identity resolution and memory bounds.
"""
import pytest

from config import settings
from middleware import rate_limit as rl
from middleware.rate_limit import SlidingWindowRateLimiter, request_identity


def _make_request(client_host="127.0.0.1", xff=None, auth=None):
    request = type("Request", (), {})()
    request.client = type("Client", (), {"host": client_host})()
    request.headers = {}
    if xff is not None:
        request.headers["X-Forwarded-For"] = xff
    if auth is not None:
        request.headers["Authorization"] = auth
    return request


def test_identity_uses_client_host_by_default(monkeypatch):
    monkeypatch.setattr(settings, "TRUSTED_PROXY", None)
    req = _make_request(client_host="203.0.113.7", xff="192.168.1.1")
    assert request_identity(req) == "ip:203.0.113.7"


def test_identity_ignores_xff_from_untrusted_peer(monkeypatch):
    monkeypatch.setattr(settings, "TRUSTED_PROXY", "10.0.0.1")
    req = _make_request(client_host="203.0.113.7", xff="192.168.1.1")
    assert request_identity(req) == "ip:203.0.113.7"


def test_identity_uses_xff_from_trusted_proxy(monkeypatch):
    monkeypatch.setattr(settings, "TRUSTED_PROXY", "10.0.0.1")
    req = _make_request(client_host="10.0.0.1", xff="192.168.1.1, 10.0.0.1")
    assert request_identity(req) == "ip:192.168.1.1"


def test_identity_falls_back_to_unknown():
    request = type("Request", (), {})()
    request.client = None
    request.headers = {}
    assert request_identity(request) == "ip:unknown"


def test_identity_prefers_authenticated_user(monkeypatch):
    monkeypatch.setattr(settings, "TRUSTED_PROXY", None)
    monkeypatch.setattr(rl, "_decode_access_token", lambda token: {"sub": "user-123"})
    req = _make_request(client_host="203.0.113.7", xff="192.168.1.1", auth="Bearer abc")
    assert request_identity(req) == "user:user-123"


@pytest.mark.asyncio
async def test_limiter_evicts_oldest_key_when_capped():
    limiter = SlidingWindowRateLimiter(max_keys=3)
    for i in range(5):
        await limiter.check(f"ip:{i}", limit=10)
    assert len(limiter._requests) == 3
    assert "ip:0" not in limiter._requests
    assert "ip:1" not in limiter._requests
    assert "ip:2" in limiter._requests
    assert "ip:3" in limiter._requests
    assert "ip:4" in limiter._requests


@pytest.mark.asyncio
async def test_limiter_remaining_does_not_create_keys():
    limiter = SlidingWindowRateLimiter(max_keys=3)
    assert await limiter.remaining("ip:new", limit=10) == 10
    assert "ip:new" not in limiter._requests
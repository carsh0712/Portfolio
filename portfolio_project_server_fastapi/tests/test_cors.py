"""동적 CORS 미들웨어 테스트."""
from unittest.mock import patch

import pytest


class TestDynamicCors:
    """DynamicCorsMiddleware 테스트"""

    def test_allowed_origin(self, auth_client):
        """등록된 origin → CORS 헤더 포함"""
        with patch("core.cors._is_origin_allowed", return_value=True):
            resp = auth_client.get("/ping", headers={"Origin": "http://localhost:5173"})
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
        assert resp.headers.get("access-control-allow-credentials") == "true"

    def test_disallowed_origin(self, auth_client):
        """미등록 origin → CORS 헤더 없음"""
        with patch("core.cors._is_origin_allowed", return_value=False):
            resp = auth_client.get("/ping", headers={"Origin": "http://evil.com"})
        assert resp.status_code == 200
        assert "access-control-allow-origin" not in resp.headers

    def test_no_origin_header(self, auth_client):
        """Origin 헤더 없는 요청 → 정상 통과, CORS 헤더 없음"""
        resp = auth_client.get("/ping")
        assert resp.status_code == 200
        assert "access-control-allow-origin" not in resp.headers

    def test_preflight_allowed(self, auth_client):
        """preflight OPTIONS 요청 — 등록된 origin"""
        with patch("core.cors._is_origin_allowed", return_value=True):
            resp = auth_client.options(
                "/ping",
                headers={
                    "Origin": "http://localhost:5173",
                    "Access-Control-Request-Method": "POST",
                },
            )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
        assert "POST" in resp.headers.get("access-control-allow-methods", "")

    def test_preflight_disallowed(self, auth_client):
        """preflight OPTIONS 요청 — 미등록 origin"""
        with patch("core.cors._is_origin_allowed", return_value=False):
            resp = auth_client.options(
                "/ping",
                headers={
                    "Origin": "http://evil.com",
                    "Access-Control-Request-Method": "POST",
                },
            )
        assert resp.status_code == 403

"""DB 기반 동적 CORS 미들웨어."""
import os
from urllib.parse import urlparse

from flask import request, make_response

import core.config  # noqa: F401 — 환경별 .env 자동 로드
from database import SessionLocal
from models import CorsOrigin

SERVER_CODE = os.getenv("SERVER_CODE", "PORTFOLIO_API")
CORS_ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
}


def _is_origin_allowed(origin: str) -> bool:
    """DB에서 현재 서버 코드에 해당하는 origin인지 조회한다."""
    parsed_origin = urlparse(origin)
    if parsed_origin.netloc == request.host:
        return True

    if origin in CORS_ALLOWED_ORIGINS:
        return True

    db = SessionLocal()
    try:
        return (
            db.query(CorsOrigin)
            .filter(
                CorsOrigin.server_code == SERVER_CODE,
                CorsOrigin.origin == origin,
            )
            .first()
            is not None
        )
    finally:
        db.close()


def _add_cors_headers(response, origin: str):
    """응답에 CORS 헤더를 추가한다."""
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response


def handle_cors_preflight():
    """before_request 훅: OPTIONS preflight 처리."""
    origin = request.headers.get("Origin")
    if request.method == "OPTIONS" and origin:
        if _is_origin_allowed(origin):
            response = make_response("", 200)
            _add_cors_headers(response, origin)
            return response
        return make_response("", 403)


def add_cors_headers_after(response):
    """after_request 훅: 응답에 CORS 헤더 추가."""
    origin = request.headers.get("Origin")
    if origin and _is_origin_allowed(origin):
        _add_cors_headers(response, origin)
    return response

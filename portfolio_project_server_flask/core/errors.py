"""커스텀 API 에러 처리."""
from flask import jsonify, request

from core.logger import setup_logger

logger = setup_logger("error")


class ApiError(Exception):
    """API 에러 예외 클래스."""

    def __init__(self, status_code: int, detail, headers: dict = None):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers or {}


def api_abort(status_code: int, detail, headers: dict = None):
    """API 에러를 발생시킨다."""
    raise ApiError(status_code, detail, headers)


def _log_error(status_code: int, detail):
    """에러 정보를 요청 컨텍스트와 함께 로깅한다."""
    method = request.method
    path = request.full_path.rstrip("?")
    logger.warning("%s %s -> %d | %s", method, path, status_code, detail)


def register_error_handlers(app):
    """Flask 앱에 에러 핸들러를 등록한다."""

    @app.errorhandler(ApiError)
    def handle_api_error(e):
        detail = e.detail
        # Pydantic errors()의 ctx 값이 JSON 직렬화 불가능한 경우 처리
        if isinstance(detail, list):
            safe = []
            for err in detail:
                if isinstance(err, dict) and "ctx" in err:
                    err = {k: (str(v) if k == "ctx" else v) for k, v in err.items()}
                safe.append(err)
            detail = safe
        _log_error(e.status_code, detail)
        response = jsonify({"detail": detail})
        response.status_code = e.status_code
        for key, value in e.headers.items():
            response.headers[key] = value
        return response

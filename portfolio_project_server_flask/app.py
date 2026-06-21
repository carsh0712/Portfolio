import sys
import logging
import traceback

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")
_boot_logger = logging.getLogger("boot")
_boot_logger.info("=== 서버 시작 ===")

try:
    _boot_logger.info("Flask 모듈 로딩...")
    from flask import Flask, g, jsonify
    from sqlalchemy import text
    _boot_logger.info("Flask 모듈 로딩 완료")

    _boot_logger.info("database 모듈 로딩...")
    from database import engine, Base, SessionLocal
    _boot_logger.info("database 모듈 로딩 완료")
except Exception as e:
    _boot_logger.error(f"모듈 로딩 실패: {type(e).__name__}: {e}")
    _boot_logger.error(traceback.format_exc())
    sys.exit(1)

from core.config import ENV
from core.logger import setup_logger
from core.errors import register_error_handlers
from core.cors import handle_cors_preflight, add_cors_headers_after

logger = setup_logger("app")


def create_app():
    """Flask 앱 팩토리."""
    app = Flask(__name__)

    # 에러 핸들러 등록
    register_error_handlers(app)

    # ValidationError 처리 (Pydantic)
    from pydantic import ValidationError
    from core.errors import _log_error

    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        _log_error(422, e.errors())
        return jsonify({"detail": e.errors()}), 422

    # DB 세션 관리
    @app.before_request
    def open_db():
        g.db = SessionLocal()

    @app.teardown_appcontext
    def close_db(exception=None):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    # CORS
    app.before_request(handle_cors_preflight)
    app.after_request(add_cors_headers_after)

    # 테이블 생성
    try:
        logger.info("데이터베이스 테이블 초기화 시작")
        Base.metadata.create_all(bind=engine)
        logger.info("데이터베이스 테이블 초기화 완료")
    except Exception as e:
        logger.error(f"데이터베이스 테이블 초기화 실패: {e}")
        sys.exit(1)

    # Blueprint 등록
    logger.info("API 라우터 등록 시작")
    from routers.auth import bp as auth_bp
    from routers.public import bp as public_bp
    from routers.portfolio import bp as portfolio_bp
    from routers.project import bp as project_bp
    from routers.user import bp as user_bp
    from routers.upload import bp as upload_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    logger.info("  - auth 라우터 등록")
    app.register_blueprint(user_bp, url_prefix="/api/v1/user")
    logger.info("  - user 라우터 등록")
    app.register_blueprint(public_bp, url_prefix="/api/v1/public")
    logger.info("  - public 라우터 등록")
    app.register_blueprint(portfolio_bp, url_prefix="/api/v1/portfolios")
    logger.info("  - portfolio 라우터 등록")
    app.register_blueprint(project_bp, url_prefix="/api/v1/projects")
    logger.info("  - project 라우터 등록")
    app.register_blueprint(upload_bp, url_prefix="/api/v1/files")
    logger.info("  - upload 라우터 등록")
    logger.info("API 라우터 등록 완료")

    # Swagger UI (development 환경에서만 활성화)
    if ENV == "development":
        from flasgger import Swagger
        swagger_config = {
            "headers": [],
            "specs": [
                {
                    "endpoint": "apispec",
                    "route": "/apispec.json",
                    "rule_filter": lambda rule: True,
                    "model_filter": lambda tag: True,
                }
            ],
            "static_url_path": "/flasgger_static",
            "swagger_ui": True,
            "specs_route": "/docs",
        }
        swagger_template = {
            "info": {
                "title": "Portfolio API",
                "description": "포트폴리오 관리 API",
                "version": "1.0.0",
            },
            "securityDefinitions": {
                "Bearer": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT 토큰. 형식: Bearer {token}",
                }
            },
            "definitions": {
                "SignupRequest": {
                    "type": "object",
                    "required": ["username", "email", "password"],
                    "properties": {
                        "username": {"type": "string", "description": "사용자명"},
                        "email": {"type": "string", "description": "이메일"},
                        "password": {"type": "string", "description": "비밀번호 (최소 8자)"},
                    },
                },
                "LoginRequest": {
                    "type": "object",
                    "required": ["email", "password"],
                    "properties": {
                        "email": {"type": "string", "description": "이메일"},
                        "password": {"type": "string", "description": "비밀번호"},
                    },
                },
                "LoginResponse": {
                    "type": "object",
                    "properties": {
                        "access_token": {"type": "string"},
                        "refresh_token": {"type": "string"},
                        "token_type": {"type": "string", "default": "bearer"},
                    },
                },
                "RefreshRequest": {
                    "type": "object",
                    "required": ["refresh_token"],
                    "properties": {
                        "refresh_token": {"type": "string"},
                    },
                },
                "RefreshResponse": {
                    "type": "object",
                    "properties": {
                        "access_token": {"type": "string"},
                        "token_type": {"type": "string", "default": "bearer"},
                    },
                },
                "LogoutRequest": {
                    "type": "object",
                    "required": ["refresh_token"],
                    "properties": {
                        "refresh_token": {"type": "string"},
                    },
                },
                "UserResponse": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "username": {"type": "string"},
                        "email": {"type": "string"},
                    },
                },
                "UpdateProfileRequest": {
                    "type": "object",
                    "required": ["username"],
                    "properties": {
                        "username": {"type": "string", "description": "변경할 사용자명"},
                    },
                },
                "ChangePasswordRequest": {
                    "type": "object",
                    "required": ["current_password", "new_password"],
                    "properties": {
                        "current_password": {"type": "string"},
                        "new_password": {"type": "string", "description": "새 비밀번호 (최소 8자)"},
                    },
                },
                "DeleteAccountRequest": {
                    "type": "object",
                    "required": ["password"],
                    "properties": {
                        "password": {"type": "string", "description": "비밀번호 확인"},
                    },
                },
                "FileReference": {
                    "type": "object",
                    "properties": {
                        "file_uuid": {"type": "string"},
                    },
                },
                "Screenshot": {
                    "type": "object",
                    "properties": {
                        "file_uuid": {"type": "string"},
                        "caption": {"type": "string"},
                    },
                },
                "Link": {
                    "type": "object",
                    "required": ["name", "url"],
                    "properties": {
                        "name": {"type": "string"},
                        "url": {"type": "string"},
                        "backgroundColor": {"type": "string"},
                        "textColor": {"type": "string"},
                        "icon": {"type": "string"},
                    },
                },
                "PortfolioCreate": {
                    "type": "object",
                    "required": ["code", "name", "description"],
                    "properties": {
                        "code": {"type": "string", "minLength": 5, "description": "포트폴리오 코드 (최소 5글자)"},
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "screenshot": {"$ref": "#/definitions/FileReference"},
                        "order": {"type": "integer", "default": 0},
                        "is_public": {"type": "boolean", "default": True},
                    },
                },
                "PortfolioUpdate": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "minLength": 5, "description": "포트폴리오 코드 (최소 5글자)"},
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "screenshot": {"$ref": "#/definitions/FileReference"},
                        "order": {"type": "integer"},
                        "is_public": {"type": "boolean"},
                    },
                },
                "PortfolioResponse": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer"},
                        "code": {"type": "string"},
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "screenshot": {"$ref": "#/definitions/FileReference"},
                        "order": {"type": "integer"},
                        "is_public": {"type": "boolean"},
                        "created_at": {"type": "string", "format": "date-time"},
                        "updated_at": {"type": "string", "format": "date-time"},
                    },
                },
                "ProjectCreate": {
                    "type": "object",
                    "required": ["portfolio_code", "code", "title", "summary"],
                    "properties": {
                        "portfolio_code": {"type": "string", "description": "포트폴리오 코드"},
                        "code": {"type": "string", "minLength": 5, "description": "프로젝트 코드 (최소 5글자)"},
                        "title": {"type": "string"},
                        "summary": {"type": "string"},
                        "thumbnail": {"$ref": "#/definitions/FileReference"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "order": {"type": "integer", "default": 0},
                        "is_public": {"type": "boolean", "default": True},
                        "description": {"type": "string"},
                        "tech_stack": {"type": "array", "items": {"type": "string"}},
                        "screenshots": {"type": "array", "items": {"$ref": "#/definitions/Screenshot"}},
                        "links": {"type": "array", "items": {"$ref": "#/definitions/Link"}},
                        "start_date": {"type": "string"},
                        "end_date": {"type": "string"},
                        "features": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "ProjectUpdate": {
                    "type": "object",
                    "properties": {
                        "portfolio_id": {"type": "integer"},
                        "code": {"type": "string", "minLength": 5, "description": "프로젝트 코드 (최소 5글자)"},
                        "title": {"type": "string"},
                        "summary": {"type": "string"},
                        "thumbnail": {"$ref": "#/definitions/FileReference"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "order": {"type": "integer"},
                        "is_public": {"type": "boolean"},
                        "description": {"type": "string"},
                        "tech_stack": {"type": "array", "items": {"type": "string"}},
                        "screenshots": {"type": "array", "items": {"$ref": "#/definitions/Screenshot"}},
                        "links": {"type": "array", "items": {"$ref": "#/definitions/Link"}},
                        "start_date": {"type": "string"},
                        "end_date": {"type": "string"},
                        "features": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "ProjectSummaryResponse": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string"},
                        "title": {"type": "string"},
                        "summary": {"type": "string"},
                        "thumbnail": {"$ref": "#/definitions/FileReference"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "tech_stack": {"type": "array", "items": {"type": "string"}},
                        "order": {"type": "integer"},
                        "is_public": {"type": "boolean"},
                    },
                },
                "ProjectResponse": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "portfolio_id": {"type": "integer"},
                        "code": {"type": "string"},
                        "title": {"type": "string"},
                        "summary": {"type": "string"},
                        "thumbnail": {"$ref": "#/definitions/FileReference"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "order": {"type": "integer"},
                        "is_public": {"type": "boolean"},
                        "description": {"type": "string"},
                        "tech_stack": {"type": "array", "items": {"type": "string"}},
                        "screenshots": {"type": "array", "items": {"$ref": "#/definitions/Screenshot"}},
                        "links": {"type": "array", "items": {"$ref": "#/definitions/Link"}},
                        "start_date": {"type": "string"},
                        "end_date": {"type": "string"},
                        "features": {"type": "array", "items": {"type": "string"}},
                        "created_at": {"type": "string", "format": "date-time"},
                        "updated_at": {"type": "string", "format": "date-time"},
                    },
                },
                "PaginationMeta": {
                    "type": "object",
                    "properties": {
                        "total": {"type": "integer", "description": "전체 아이템 수"},
                        "page": {"type": "integer", "description": "현재 페이지 번호"},
                        "page_size": {"type": "integer", "description": "페이지당 아이템 수"},
                        "total_pages": {"type": "integer", "description": "전체 페이지 수"},
                    },
                },
                "PaginatedPortfolioResponse": {
                    "type": "object",
                    "properties": {
                        "items": {"type": "array", "items": {"$ref": "#/definitions/PortfolioResponse"}},
                        "meta": {"$ref": "#/definitions/PaginationMeta"},
                    },
                },
                "PaginatedProjectSummaryResponse": {
                    "type": "object",
                    "properties": {
                        "items": {"type": "array", "items": {"$ref": "#/definitions/ProjectSummaryResponse"}},
                        "meta": {"$ref": "#/definitions/PaginationMeta"},
                    },
                },
                "FileUploadResponse": {
                    "type": "object",
                    "properties": {
                        "uuid": {"type": "string"},
                        "original_filename": {"type": "string"},
                        "stored_filename": {"type": "string"},
                        "file_size": {"type": "integer"},
                        "content_type": {"type": "string"},
                        "created_at": {"type": "string", "format": "date-time"},
                    },
                },
                "PaginatedFileResponse": {
                    "type": "object",
                    "properties": {
                        "items": {"type": "array", "items": {"$ref": "#/definitions/FileUploadResponse"}},
                        "meta": {"$ref": "#/definitions/PaginationMeta"},
                    },
                },
            },
        }
        Swagger(app, config=swagger_config, template=swagger_template)
        logger.info("Swagger UI 활성화 (/docs)")

    # 루트 엔드포인트
    @app.route("/")
    def read_root():
        return jsonify({
            "message": "Welcome to the Portfolio API. Go to /docs to see the API documentation."
        })

    @app.route("/ping")
    def ping():
        return jsonify({"message": "pong"})

    @app.route("/health")
    def health_check():
        try:
            g.db.execute(text("SELECT 1"))
            return jsonify({"status": "healthy", "database": "connected"})
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({"detail": "Database unavailable"}), 503

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)

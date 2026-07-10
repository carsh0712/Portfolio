"""APP_ENV 환경변수 기반 환경 설정 로더."""
import os
from dotenv import load_dotenv


def get_environment() -> str:
    """APP_ENV 환경변수로 환경을 판별한다. 미설정 시 development를 기본값으로 사용한다."""
    app_env = os.environ.get("APP_ENV", "development")
    if app_env in ("production", "development"):
        return app_env
    return "development"


def load_env():
    """환경에 맞는 .env 파일을 로드한다."""
    env = get_environment()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)

    candidate_files = [
        os.path.join(base_dir, f".env.{env}"),
        os.path.join(base_dir, ".env"),
        os.path.join(root_dir, f".env.{env}"),
        os.path.join(root_dir, ".env"),
    ]

    for env_file in candidate_files:
        if os.path.exists(env_file):
            load_dotenv(env_file, override=False)
            return env_file
    return None


# 모듈 임포트 시 자동 로드
LOADED_ENV_FILE = load_env()

ENV = get_environment()

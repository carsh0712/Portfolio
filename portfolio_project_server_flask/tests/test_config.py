"""core.config 환경 판별 로직 테스트."""
from unittest.mock import patch

from core.config import get_environment


class TestGetEnvironment:
    """get_environment 함수 테스트."""

    def test_app_env_production(self):
        """APP_ENV=production이면 production을 반환한다."""
        with patch.dict("os.environ", {"APP_ENV": "production"}):
            assert get_environment() == "production"

    def test_app_env_development(self):
        """APP_ENV=development이면 development를 반환한다."""
        with patch.dict("os.environ", {"APP_ENV": "development"}):
            assert get_environment() == "development"

    def test_app_env_invalid_falls_back_to_development(self):
        """APP_ENV가 유효하지 않은 값이면 development를 반환한다."""
        with patch.dict("os.environ", {"APP_ENV": "staging"}):
            assert get_environment() == "development"

    def test_no_app_env_defaults_to_development(self):
        """APP_ENV가 없으면 development를 반환한다."""
        env = dict(**__import__("os").environ)
        env.pop("APP_ENV", None)
        with patch.dict("os.environ", env, clear=True):
            assert get_environment() == "development"

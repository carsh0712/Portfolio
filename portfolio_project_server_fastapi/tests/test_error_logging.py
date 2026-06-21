"""에러 핸들러 로깅 테스트."""
import logging


class TestApiErrorLogging:
    """ApiError 발생 시 로그가 기록되는지 테스트."""

    def test_422_error_is_logged(self, client, caplog):
        """422 에러 시 요청 정보와 에러 원인이 로깅된다."""
        with caplog.at_level(logging.WARNING, logger="error"):
            resp = client.get("/api/v1/projects/?page=1&page_size=10")
        assert resp.status_code == 422
        assert "GET" in caplog.text
        assert "422" in caplog.text
        assert "portfolio_code is required" in caplog.text

    def test_404_error_is_logged(self, client, caplog):
        """404 에러 시 요청 정보와 에러 원인이 로깅된다."""
        with caplog.at_level(logging.WARNING, logger="error"):
            resp = client.get("/api/v1/projects/XXXXX/NONEXIST")
        assert resp.status_code == 404
        assert "GET" in caplog.text
        assert "404" in caplog.text

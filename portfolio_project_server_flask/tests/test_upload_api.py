"""파일 업로드 API 테스트."""
import io
from unittest.mock import patch

import pytest


def _file_data(filename, content, content_type="image/png"):
    """Flask test client용 파일 업로드 데이터를 생성한다."""
    return {
        "file": (io.BytesIO(content), filename, content_type),
    }


class TestUploadFile:
    """POST /api/v1/files/upload 테스트."""

    def test_upload_success(self, client, tmp_path):
        """정상적인 파일 업로드."""
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
            response = client.post(
                "/api/v1/files/upload",
                data=_file_data("test.png", b"fake image content", "image/png"),
                content_type="multipart/form-data",
            )
        assert response.status_code == 200
        data = response.get_json()
        assert data["original_filename"] == "test.png"
        assert data["content_type"] == "image/png"
        assert data["file_size"] == len(b"fake image content")
        assert "uuid" in data
        assert "stored_filename" in data
        # stored_filename은 "{user_id}-{uuid}.{ext}" 형식이어야 한다
        parts = data["stored_filename"].split("-", 1)
        assert len(parts) == 2, "stored_filename에 user_id prefix가 없습니다"
        assert parts[0].isdigit(), "stored_filename의 prefix가 user_id(숫자)가 아닙니다"
        assert parts[1].endswith(".png")
        assert "created_at" in data

    def test_upload_disallowed_extension(self, client, tmp_path):
        """허용되지 않은 확장자 업로드 시 400 반환."""
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
            response = client.post(
                "/api/v1/files/upload",
                data=_file_data("malware.exe", b"bad content", "application/octet-stream"),
                content_type="multipart/form-data",
            )
        assert response.status_code == 400
        assert "허용되지 않은 파일 형식" in response.get_json()["detail"]

    def test_upload_exceeds_max_size(self, client, tmp_path):
        """최대 크기 초과 시 400 반환."""
        large_content = b"x" * (10 * 1024 * 1024 + 1)  # 10MB + 1 byte
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)), \
             patch("routers.upload.MAX_FILE_SIZE", 10 * 1024 * 1024):
            response = client.post(
                "/api/v1/files/upload",
                data=_file_data("big.png", large_content, "image/png"),
                content_type="multipart/form-data",
            )
        assert response.status_code == 400
        assert "초과" in response.get_json()["detail"]

    def test_upload_various_extensions(self, client, tmp_path):
        """다양한 허용 확장자 테스트."""
        for ext in ["jpg", "jpeg", "pdf", "docx", "zip", "webp", "gif"]:
            with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
                response = client.post(
                    "/api/v1/files/upload",
                    data=_file_data(f"test.{ext}", b"content", "application/octet-stream"),
                    content_type="multipart/form-data",
                )
            assert response.status_code == 200, f"확장자 {ext} 업로드 실패"


class TestListFiles:
    """GET /api/v1/files/ 테스트."""

    def test_list_empty(self, client):
        """파일이 없을 때 빈 목록 반환."""
        response = client.get("/api/v1/files/")
        assert response.status_code == 200
        data = response.get_json()
        assert data["items"] == []
        assert data["meta"]["total"] == 0

    def test_list_with_files(self, client, tmp_path):
        """업로드 후 목록에 표시."""
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
            client.post(
                "/api/v1/files/upload",
                data=_file_data("a.png", b"aaa", "image/png"),
                content_type="multipart/form-data",
            )
            client.post(
                "/api/v1/files/upload",
                data=_file_data("b.jpg", b"bbb", "image/jpeg"),
                content_type="multipart/form-data",
            )
        response = client.get("/api/v1/files/")
        assert response.status_code == 200
        data = response.get_json()
        assert data["meta"]["total"] == 2

    def test_list_pagination(self, client, tmp_path):
        """페이지네이션 동작 확인."""
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
            for i in range(3):
                client.post(
                    "/api/v1/files/upload",
                    data=_file_data(f"file{i}.png", b"data", "image/png"),
                    content_type="multipart/form-data",
                )
        response = client.get("/api/v1/files/?page=1&page_size=2")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["items"]) == 2
        assert data["meta"]["total"] == 3
        assert data["meta"]["total_pages"] == 2


class TestGetFile:
    """GET /api/v1/files/{file_id} 테스트."""

    def test_download_file(self, client, tmp_path):
        """파일 다운로드 성공."""
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
            upload_resp = client.post(
                "/api/v1/files/upload",
                data=_file_data("test.png", b"image content", "image/png"),
                content_type="multipart/form-data",
            )
            file_uuid = upload_resp.get_json()["uuid"]
            response = client.get(f"/api/v1/files/{file_uuid}")
        assert response.status_code == 200
        assert response.data == b"image content"
        assert response.headers["cache-control"] == "public, max-age=86400"

    def test_get_file_not_found(self, client):
        """존재하지 않는 파일 조회 시 404 반환."""
        response = client.get("/api/v1/files/00000000000000000000000000099999")
        assert response.status_code == 404


class TestDeleteFile:
    """DELETE /api/v1/files/{file_id} 테스트."""

    def test_delete_file(self, client, tmp_path):
        """파일 삭제 성공."""
        with patch("routers.upload.UPLOAD_DIR", str(tmp_path)):
            upload_resp = client.post(
                "/api/v1/files/upload",
                data=_file_data("test.png", b"content", "image/png"),
                content_type="multipart/form-data",
            )
        file_uuid = upload_resp.get_json()["uuid"]

        response = client.delete(f"/api/v1/files/{file_uuid}")
        assert response.status_code == 200
        assert response.get_json()["message"] == "File deleted successfully"

        # 삭제 후 조회 시 404
        response = client.get(f"/api/v1/files/{file_uuid}")
        assert response.status_code == 404

    def test_delete_file_not_found(self, client):
        """존재하지 않는 파일 삭제 시 404 반환."""
        response = client.delete("/api/v1/files/00000000000000000000000000099999")
        assert response.status_code == 404



class TestFileOwnership:
    """파일 소유권 검증 테스트."""

    def test_cannot_access_other_users_file(self, client, db_session, other_user, tmp_path):
        """다른 사용자의 파일에 접근할 수 없다."""
        from models import UploadFile

        # 다른 사용자의 파일을 DB에 직접 생성
        other_file = UploadFile(
            user_id=other_user.id,
            original_filename="other.png",
            stored_filename="other_stored.png",
            file_size=100,
            content_type="image/png",
            upload_path=str(tmp_path / "other_stored.png"),
        )
        db_session.add(other_file)
        db_session.commit()
        db_session.refresh(other_file)

        # 현재 사용자로 접근 시도
        response = client.get(f"/api/v1/files/{other_file.uuid}")
        assert response.status_code == 404

        response = client.delete(f"/api/v1/files/{other_file.uuid}")
        assert response.status_code == 404

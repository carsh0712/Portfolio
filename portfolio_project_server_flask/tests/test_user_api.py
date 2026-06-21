"""/api/v1/user/* 엔드포인트 통합 테스트. auth_client 사용 (실제 JWT 검증)."""
import os

import pytest

from core.security import (
    create_access_token,
    get_password_hash,
)
from models import User, Portfolio, Project, UploadFile


# === Me ===


class TestMe:
    def test_with_valid_token(self, auth_client, db_session):
        user = User(
            username="meuser",
            email="me@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.get(
            "/api/v1/user/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["username"] == "meuser"
        assert data["email"] == "me@example.com"

    def test_without_token(self, auth_client):
        resp = auth_client.get("/api/v1/user/me")
        assert resp.status_code == 401

    def test_with_invalid_token(self, auth_client):
        resp = auth_client.get(
            "/api/v1/user/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401


# === Update Profile ===


class TestUpdateProfile:
    def test_success(self, auth_client, db_session):
        """프로필(username) 변경 성공"""
        user = User(
            username="profileuser",
            email="profile@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.put(
            "/api/v1/user/profile",
            json={"username": "newname"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["username"] == "newname"
        assert data["email"] == "profile@example.com"

    def test_duplicate_username(self, auth_client, db_session):
        """중복 username → 409"""
        user1 = User(
            username="existing",
            email="existing@example.com",
            password_hash=get_password_hash("password123"),
        )
        user2 = User(
            username="willchange",
            email="willchange@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add_all([user1, user2])
        db_session.commit()
        db_session.refresh(user2)

        token = create_access_token(data={"sub": str(user2.id)})
        resp = auth_client.put(
            "/api/v1/user/profile",
            json={"username": "existing"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 409

    def test_without_auth(self, auth_client):
        """인증 없이 요청 → 401"""
        resp = auth_client.put(
            "/api/v1/user/profile",
            json={"username": "newname"},
        )
        assert resp.status_code == 401


# === Change Password ===


class TestChangePassword:
    def test_success(self, auth_client, db_session):
        """비밀번호 변경 성공"""
        user = User(
            username="pwuser",
            email="pw@example.com",
            password_hash=get_password_hash("oldpassword1"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.put(
            "/api/v1/user/password",
            json={"current_password": "oldpassword1", "new_password": "newpassword1"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert "변경" in resp.get_json()["message"]

    def test_wrong_current_password(self, auth_client, db_session):
        """현재 비밀번호 불일치 → 401"""
        user = User(
            username="pwuser2",
            email="pw2@example.com",
            password_hash=get_password_hash("correctpw1"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.put(
            "/api/v1/user/password",
            json={"current_password": "wrongpw123", "new_password": "newpassword1"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    def test_new_password_too_short(self, auth_client, db_session):
        """새 비밀번호 8자 미만 → 422"""
        user = User(
            username="pwuser3",
            email="pw3@example.com",
            password_hash=get_password_hash("correctpw1"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.put(
            "/api/v1/user/password",
            json={"current_password": "correctpw1", "new_password": "short"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    def test_without_auth(self, auth_client):
        """인증 없이 요청 → 401"""
        resp = auth_client.put(
            "/api/v1/user/password",
            json={"current_password": "old12345", "new_password": "new12345"},
        )
        assert resp.status_code == 401

    def test_login_with_new_password(self, auth_client, db_session):
        """변경 후 새 비밀번호로 로그인 가능"""
        user = User(
            username="pwuser4",
            email="pw4@example.com",
            password_hash=get_password_hash("oldpassword1"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        auth_client.put(
            "/api/v1/user/password",
            json={"current_password": "oldpassword1", "new_password": "newpassword1"},
            headers={"Authorization": f"Bearer {token}"},
        )

        resp = auth_client.post("/api/v1/auth/login", json={
            "email": "pw4@example.com",
            "password": "newpassword1",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.get_json()


# === Delete Account ===


class TestDeleteAccount:
    def test_success(self, auth_client, db_session):
        """비밀번호 확인 후 계정 삭제 성공"""
        user = User(
            username="deluser",
            email="del@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.delete(
            "/api/v1/user/account",
            json={"password": "password123"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert "삭제" in resp.get_json()["message"]

        # DB에서 유저가 삭제되었는지 확인
        assert db_session.query(User).filter(User.id == user.id).first() is None

    def test_wrong_password(self, auth_client, db_session):
        """비밀번호 불일치 → 401"""
        user = User(
            username="deluser2",
            email="del2@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.delete(
            "/api/v1/user/account",
            json={"password": "wrongpassword"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

        # 유저가 삭제되지 않았는지 확인
        assert db_session.query(User).filter(User.id == user.id).first() is not None

    def test_without_auth(self, auth_client):
        """인증 없이 요청 → 401"""
        resp = auth_client.delete(
            "/api/v1/user/account",
            json={"password": "password123"},
        )
        assert resp.status_code == 401

    def test_cascade_deletes_portfolios_and_projects(self, auth_client, db_session):
        """계정 삭제 시 포트폴리오, 프로젝트도 cascade 삭제"""
        user = User(
            username="cascadeuser",
            email="cascade@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        portfolio = Portfolio(
            user_id=user.id, code="CASCAD", name="Cascade", description="D", order=0
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        project = Project(
            portfolio_id=portfolio.id, code="CITEM", title="CItem", summary="S", order=0
        )
        db_session.add(project)
        db_session.commit()

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.delete(
            "/api/v1/user/account",
            json={"password": "password123"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        assert db_session.query(Portfolio).filter(Portfolio.id == portfolio.id).first() is None
        assert db_session.query(Project).filter(Project.id == project.id).first() is None

    def test_deletes_physical_files(self, auth_client, db_session, tmp_path):
        """계정 삭제 시 물리 파일도 삭제"""
        user = User(
            username="fileuser",
            email="file@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # 물리 파일 생성
        file_path = tmp_path / f"{user.id}-test.png"
        file_path.write_bytes(b"fake data")

        db_file = UploadFile(
            user_id=user.id,
            original_filename="test.png",
            stored_filename=f"{user.id}-test.png",
            file_size=9,
            content_type="image/png",
            upload_path=str(file_path),
        )
        db_session.add(db_file)
        db_session.commit()

        token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.delete(
            "/api/v1/user/account",
            json={"password": "password123"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert not os.path.exists(str(file_path))

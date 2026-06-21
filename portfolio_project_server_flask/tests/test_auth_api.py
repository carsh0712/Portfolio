"""/api/v1/auth/* 엔드포인트 통합 테스트. auth_client 사용 (실제 JWT 검증)."""
import pytest
from jose import jwt

from core.security import (
    create_access_token,
    create_refresh_token,
    revoke_token,
    get_password_hash,
    SECRET_KEY,
    ALGORITHM,
)
from models import User


# === Signup ===


class TestSignup:
    def test_success(self, auth_client, db_session):
        """회원가입 성공"""
        resp = auth_client.post("/api/v1/auth/signup", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "securepassword",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_duplicate_username(self, auth_client, db_session):
        """중복 username → 409"""
        user = User(
            username="dupuser",
            email="dup1@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()

        resp = auth_client.post("/api/v1/auth/signup", json={
            "username": "dupuser",
            "email": "dup2@example.com",
            "password": "password123",
        })
        assert resp.status_code == 409
        assert "username" in resp.get_json()["detail"]

    def test_duplicate_email(self, auth_client, db_session):
        """중복 email → 409"""
        user = User(
            username="emailuser1",
            email="dup@example.com",
            password_hash=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()

        resp = auth_client.post("/api/v1/auth/signup", json={
            "username": "emailuser2",
            "email": "dup@example.com",
            "password": "password123",
        })
        assert resp.status_code == 409
        assert "email" in resp.get_json()["detail"]

    def test_password_too_short(self, auth_client):
        """비밀번호 8자 미만 → 422"""
        resp = auth_client.post("/api/v1/auth/signup", json={
            "username": "shortpw",
            "email": "short@example.com",
            "password": "short",
        })
        assert resp.status_code == 422

    def test_missing_fields(self, auth_client):
        """필수 필드 누락 → 422"""
        resp = auth_client.post("/api/v1/auth/signup", json={
            "username": "incomplete",
        })
        assert resp.status_code == 422


# === Login ===


class TestLogin:
    def test_success(self, auth_client, db_session):
        user = User(
            username="loginuser",
            email="login@example.com",
            password_hash=get_password_hash("correctpw"),
        )
        db_session.add(user)
        db_session.commit()

        resp = auth_client.post("/api/v1/auth/login", json={
            "email": "login@example.com",
            "password": "correctpw",
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_wrong_password(self, auth_client, db_session):
        user = User(
            username="loginuser2",
            email="login2@example.com",
            password_hash=get_password_hash("correctpw"),
        )
        db_session.add(user)
        db_session.commit()

        resp = auth_client.post("/api/v1/auth/login", json={
            "email": "login2@example.com",
            "password": "wrongpw",
        })
        assert resp.status_code == 401

    def test_nonexistent_user(self, auth_client):
        resp = auth_client.post("/api/v1/auth/login", json={
            "email": "nouser@example.com",
            "password": "anything",
        })
        assert resp.status_code == 401

    def test_missing_fields(self, auth_client):
        resp = auth_client.post("/api/v1/auth/login", json={"email": "only@example.com"})
        assert resp.status_code == 422


# === Refresh ===


class TestRefresh:
    def test_success(self, auth_client, db_session):
        user = User(
            username="refreshuser",
            email="refresh@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        resp = auth_client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert "access_token" in data

        payload = jwt.decode(data["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == str(user.id)
        assert payload["type"] == "access"

    def test_access_token_rejected(self, auth_client, db_session):
        user = User(
            username="refreshuser2",
            email="refresh2@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        access_token = create_access_token(data={"sub": str(user.id)})
        resp = auth_client.post("/api/v1/auth/refresh", json={
            "refresh_token": access_token,
        })
        assert resp.status_code == 401

    def test_invalid_token(self, auth_client):
        resp = auth_client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid.garbage.token",
        })
        assert resp.status_code == 401

    def test_revoked_token(self, auth_client, db_session):
        user = User(
            username="revokedrefresh",
            email="revref@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        revoke_token(refresh_token, db_session)
        db_session.commit()

        resp = auth_client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 401

    def test_nonexistent_user(self, auth_client):
        refresh_token = create_refresh_token(data={"sub": "99999"})
        resp = auth_client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 401


# === Logout ===


class TestLogout:
    def test_success(self, auth_client, db_session):
        user = User(
            username="logoutuser",
            email="logout@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        resp = auth_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert resp.status_code == 200
        assert resp.get_json()["message"] == "Successfully logged out."

    def test_without_auth_header(self, auth_client):
        resp = auth_client.post("/api/v1/auth/logout", json={
            "refresh_token": "some-token",
        })
        assert resp.status_code == 401

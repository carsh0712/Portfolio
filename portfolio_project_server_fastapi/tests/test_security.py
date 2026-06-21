"""core/security 모듈 테스트: 비밀번호, JWT, 토큰 폐기, get_current_user."""
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt

from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    is_token_revoked,
    revoke_token,
    get_current_user,
    SECRET_KEY,
    ALGORITHM,
)
from models import RevokedToken


# === 비밀번호 해싱 ===


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = get_password_hash("mysecret")
        assert verify_password("mysecret", hashed) is True

    def test_wrong_password(self):
        hashed = get_password_hash("mysecret")
        assert verify_password("wrongpassword", hashed) is False

    def test_hash_is_not_plaintext(self):
        hashed = get_password_hash("mysecret")
        assert hashed != "mysecret"

    def test_different_hashes_for_same_password(self):
        h1 = get_password_hash("same")
        h2 = get_password_hash("same")
        assert h1 != h2  # bcrypt salt


# === Access Token ===


class TestAccessToken:
    def test_contains_sub(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"

    def test_type_is_access(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["type"] == "access"

    def test_has_jti(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "jti" in payload
        assert len(payload["jti"]) == 36  # UUID

    def test_has_exp(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_custom_expiry(self):
        token = create_access_token(
            data={"sub": "testuser"},
            expires_delta=timedelta(minutes=5),
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = (exp - now).total_seconds()
        assert 280 < diff < 320

    def test_unique_jti(self):
        t1 = create_access_token(data={"sub": "user"})
        t2 = create_access_token(data={"sub": "user"})
        p1 = jwt.decode(t1, SECRET_KEY, algorithms=[ALGORITHM])
        p2 = jwt.decode(t2, SECRET_KEY, algorithms=[ALGORITHM])
        assert p1["jti"] != p2["jti"]


# === Refresh Token ===


class TestRefreshToken:
    def test_type_is_refresh(self):
        token = create_refresh_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["type"] == "refresh"

    def test_has_jti(self):
        token = create_refresh_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "jti" in payload

    def test_longer_expiry_than_access(self):
        access = create_access_token(data={"sub": "user"})
        refresh = create_refresh_token(data={"sub": "user"})
        ap = jwt.decode(access, SECRET_KEY, algorithms=[ALGORITHM])
        rp = jwt.decode(refresh, SECRET_KEY, algorithms=[ALGORITHM])
        assert rp["exp"] > ap["exp"]


# === 토큰 폐기 ===


class TestTokenRevocation:
    def test_not_revoked_initially(self, db_session):
        assert is_token_revoked("nonexistent-jti", db_session) is False

    def test_revoked_after_insert(self, db_session):
        revoked = RevokedToken(
            jti="test-jti-123",
            expired_at=datetime.now(timezone.utc),
        )
        db_session.add(revoked)
        db_session.commit()
        assert is_token_revoked("test-jti-123", db_session) is True

    def test_revoke_token_function(self, db_session):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload["jti"]
        revoke_token(token, db_session)
        db_session.commit()
        assert is_token_revoked(jti, db_session) is True

    def test_revoke_invalid_token_no_error(self, db_session):
        revoke_token("invalid.token.string", db_session)  # should not raise


# === get_current_user ===


class TestGetCurrentUser:
    def test_valid_access_token(self, db_session, test_user):
        token = create_access_token(data={"sub": str(test_user.id)})
        user = get_current_user(token=token, db=db_session)
        assert user.id == test_user.id

    def test_refresh_token_rejected(self, db_session, test_user):
        from core.errors import ApiError

        token = create_refresh_token(data={"sub": str(test_user.id)})
        with pytest.raises(ApiError) as exc_info:
            get_current_user(token=token, db=db_session)
        assert exc_info.value.status_code == 401

    def test_invalid_token_rejected(self, db_session):
        from core.errors import ApiError

        with pytest.raises(ApiError) as exc_info:
            get_current_user(token="not.a.valid.token", db=db_session)
        assert exc_info.value.status_code == 401

    def test_revoked_token_rejected(self, db_session, test_user):
        from core.errors import ApiError

        token = create_access_token(data={"sub": str(test_user.id)})
        revoke_token(token, db_session)
        db_session.commit()
        with pytest.raises(ApiError) as exc_info:
            get_current_user(token=token, db=db_session)
        assert exc_info.value.status_code == 401

    def test_nonexistent_user_rejected(self, db_session):
        from core.errors import ApiError

        token = create_access_token(data={"sub": "99999"})
        with pytest.raises(ApiError) as exc_info:
            get_current_user(token=token, db=db_session)
        assert exc_info.value.status_code == 401

    def test_missing_sub_claim(self, db_session):
        from core.errors import ApiError

        token = create_access_token(data={})
        with pytest.raises(ApiError) as exc_info:
            get_current_user(token=token, db=db_session)
        assert exc_info.value.status_code == 401

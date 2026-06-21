import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional

from flask import request, g
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import os

import core.config  # noqa: F401 — 환경별 .env 자동 로드
from core.errors import api_abort

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-change-me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access", "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def is_token_revoked(jti: str, db: Session) -> bool:
    from models import RevokedToken
    return db.query(RevokedToken).filter(RevokedToken.jti == jti).first() is not None


def revoke_token(token: str, db: Session) -> None:
    """토큰을 디코딩하여 jti와 만료시각을 추출하고 revoked_token 테이블에 저장한다."""
    from models import RevokedToken
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            expired_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            revoked = RevokedToken(jti=jti, expired_at=expired_at)
            db.merge(revoked)
    except JWTError:
        pass


def get_current_user(token: str, db: Session):
    """토큰과 DB 세션을 받아 현재 유저를 반환한다."""
    from models import User
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: str = payload.get("jti")
        if user_id is None or token_type != "access":
            api_abort(401, "Could not validate credentials")
    except JWTError:
        api_abort(401, "Could not validate credentials")

    if jti and is_token_revoked(jti, db):
        api_abort(401, "Could not validate credentials")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        api_abort(401, "Could not validate credentials")
    return user


def login_required(f):
    """Flask 라우트에 인증을 요구하는 데코레이터."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # 테스트 등에서 이미 current_user가 설정된 경우 스킵
        if hasattr(g, "current_user") and g.current_user is not None:
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            api_abort(401, "Could not validate credentials")
        token = auth_header[7:]
        user = get_current_user(token=token, db=g.db)
        g.current_user = user
        return f(*args, **kwargs)
    return decorated

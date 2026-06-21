from flask import Blueprint, request, jsonify, g
from jose import JWTError, jwt
from pydantic import ValidationError

from models import User
from schemas.auth import (
    SignupRequest,
    LoginRequest, LoginResponse,
    RefreshRequest, RefreshResponse,
    LogoutRequest, UserResponse,
)
from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    is_token_revoked,
    revoke_token,
    login_required,
    SECRET_KEY,
    ALGORITHM,
)
from core.errors import api_abort

bp = Blueprint("auth", __name__)


@bp.route("/signup", methods=["POST"])
def signup():
    """회원가입을 처리한다.
    ---
    tags:
      - 인증
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/SignupRequest'
    responses:
      201:
        description: 회원가입 성공
        schema:
          $ref: '#/definitions/UserResponse'
      409:
        description: 중복된 username 또는 email
      422:
        description: 유효성 검증 실패
    """
    try:
        data = SignupRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db

    if db.query(User).filter(User.username == data.username).first():
        api_abort(409, "이미 사용 중인 username입니다.")

    if db.query(User).filter(User.email == data.email).first():
        api_abort(409, "이미 사용 중인 email입니다.")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return jsonify(UserResponse.model_validate(user, from_attributes=True).model_dump()), 201


@bp.route("/login", methods=["POST"])
def login():
    """로그인을 처리한다.
    ---
    tags:
      - 인증
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/LoginRequest'
    responses:
      200:
        description: 로그인 성공
        schema:
          $ref: '#/definitions/LoginResponse'
      401:
        description: 이메일 또는 비밀번호 불일치
    """
    try:
        data = LoginRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        api_abort(401, "Incorrect email or password")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return jsonify(LoginResponse(access_token=access_token, refresh_token=refresh_token).model_dump())


@bp.route("/refresh", methods=["POST"])
def refresh():
    """토큰 갱신을 처리한다.
    ---
    tags:
      - 인증
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/RefreshRequest'
    responses:
      200:
        description: 새 access_token 반환
        schema:
          $ref: '#/definitions/RefreshResponse'
      401:
        description: 유효하지 않은 refresh token
    """
    try:
        data = RefreshRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db

    try:
        payload = jwt.decode(data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: str = payload.get("jti")
        if user_id is None or token_type != "refresh":
            api_abort(401, "Invalid refresh token")
    except JWTError:
        api_abort(401, "Invalid refresh token")

    if jti and is_token_revoked(jti, db):
        api_abort(401, "Invalid refresh token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        api_abort(401, "Invalid refresh token")

    new_access_token = create_access_token(data={"sub": str(user.id)})
    return jsonify(RefreshResponse(access_token=new_access_token).model_dump())


@bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """로그아웃을 처리한다.
    ---
    tags:
      - 인증
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/LogoutRequest'
    responses:
      200:
        description: 로그아웃 성공
    """
    try:
        data = LogoutRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db

    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header[7:] if auth_header.startswith("Bearer ") else ""

    revoke_token(access_token, db)
    revoke_token(data.refresh_token, db)
    db.commit()
    return jsonify({"message": "Successfully logged out."})

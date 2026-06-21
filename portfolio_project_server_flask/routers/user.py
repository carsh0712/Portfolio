from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError

from models import User
from schemas.auth import (
    UserResponse,
    UpdateProfileRequest, ChangePasswordRequest, DeleteAccountRequest,
)
from core.security import (
    verify_password,
    get_password_hash,
    login_required,
)
from core.errors import api_abort
from utils.file_cleanup import cleanup_user_files

bp = Blueprint("user", __name__)


@bp.route("/me", methods=["GET"])
@login_required
def read_current_user():
    """현재 유저 정보를 반환한다.
    ---
    tags:
      - 사용자
    security:
      - Bearer: []
    responses:
      200:
        description: 현재 유저 정보
        schema:
          $ref: '#/definitions/UserResponse'
      401:
        description: 인증 실패
    """
    return jsonify(UserResponse.model_validate(g.current_user, from_attributes=True).model_dump())


@bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    """프로필(username)을 변경한다.
    ---
    tags:
      - 사용자
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/UpdateProfileRequest'
    responses:
      200:
        description: 프로필 변경 성공
        schema:
          $ref: '#/definitions/UserResponse'
      409:
        description: 중복된 username
      401:
        description: 인증 실패
    """
    try:
        data = UpdateProfileRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    user = g.current_user

    existing = db.query(User).filter(User.username == data.username, User.id != user.id).first()
    if existing:
        api_abort(409, "이미 사용 중인 username입니다.")

    user.username = data.username
    db.commit()
    db.refresh(user)
    return jsonify(UserResponse.model_validate(user, from_attributes=True).model_dump())


@bp.route("/password", methods=["PUT"])
@login_required
def change_password():
    """비밀번호를 변경한다.
    ---
    tags:
      - 사용자
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/ChangePasswordRequest'
    responses:
      200:
        description: 비밀번호 변경 성공
      401:
        description: 현재 비밀번호 불일치 또는 인증 실패
      422:
        description: 유효성 검증 실패
    """
    try:
        data = ChangePasswordRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    user = g.current_user

    if not verify_password(data.current_password, user.password_hash):
        api_abort(401, "현재 비밀번호가 일치하지 않습니다.")

    user.password_hash = get_password_hash(data.new_password)
    g.db.commit()
    return jsonify({"message": "비밀번호가 변경되었습니다."})


@bp.route("/account", methods=["DELETE"])
@login_required
def delete_account():
    """계정을 삭제한다. 비밀번호 확인 후 모든 데이터와 업로드 파일을 삭제한다.
    ---
    tags:
      - 사용자
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/DeleteAccountRequest'
    responses:
      200:
        description: 계정 삭제 성공
      401:
        description: 비밀번호 불일치 또는 인증 실패
    """
    try:
        data = DeleteAccountRequest.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    user = g.current_user

    if not verify_password(data.password, user.password_hash):
        api_abort(401, "비밀번호가 일치하지 않습니다.")

    cleanup_user_files(db, user)
    db.delete(user)
    db.commit()
    return jsonify({"message": "계정이 삭제되었습니다."})

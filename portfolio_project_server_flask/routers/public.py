from pathlib import Path

from flask import Blueprint, g, jsonify, request, send_file

from models import Portfolio, Project, Profile, UploadFile, User
from schemas.project import ProjectResponse
from core.errors import api_abort
from utils.image_processing import get_thumbnail_path

bp = Blueprint("public", __name__)


def _has_public_file_reference(db, user_id, file_uuid):
    """Return True when a file is referenced by public portfolio content."""
    portfolio_reference_exists = (
        db.query(Portfolio.id)
        .filter(
            Portfolio.user_id == user_id,
            Portfolio.file_uuid == file_uuid,
            Portfolio.is_public == True
        )
        .first()
        is not None
    )
    if portfolio_reference_exists:
        return True

    profile_reference_exists = (
        db.query(Profile.id)
        .join(Portfolio, Portfolio.profile_id == Profile.id)
        .filter(
            Portfolio.user_id == user_id,
            Portfolio.is_public == True,
            Profile.avatar_file_uuid == file_uuid,
        )
        .first()
        is not None
    )
    if profile_reference_exists:
        return True

    public_projects = (
        db.query(Project)
        .join(Portfolio, Project.portfolio_id == Portfolio.id)
        .filter(
            Portfolio.user_id == user_id,
            Portfolio.is_public == True,
            Project.is_public == True,
        )
        .all()
    )

    for project in public_projects:
        if project.thumbnail_file_uuid == file_uuid:
            return True

        for screenshot in project.screenshots or []:
            if isinstance(screenshot, dict) and screenshot.get("file_uuid") == file_uuid:
                return True

    return False


@bp.route("/<username>/<portfolio_code>/", methods=["GET"])
def get_public_projects(username, portfolio_code):
    """공개된 프로젝트 목록을 조회합니다.
    ---
    tags:
      - 공개
    parameters:
      - name: username
        in: path
        type: string
        required: true
      - name: portfolio_code
        in: path
        type: string
        required: true
    responses:
      200:
        description: 공개 프로젝트 목록
        schema:
          type: array
          items:
            $ref: '#/definitions/ProjectResponse'
      404:
        description: 사용자 또는 포트폴리오 없음
    """
    db = g.db

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        api_abort(404, "User not found")

    portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == user.id,
            Portfolio.code == portfolio_code,
            Portfolio.is_public == True
        )
        .first()
    )

    if portfolio is None:
        api_abort(404, "Public portfolio not found")

    items = (
        db.query(Project)
        .filter(
            Project.portfolio_id == portfolio.id,
            Project.is_public == True
        )
        .order_by(Project.order)
        .all()
    )

    result = [
        ProjectResponse.model_validate(item, from_attributes=True).model_dump()
        for item in items
    ]
    return jsonify(result)


@bp.route("/<username>/<portfolio_code>/profile", methods=["GET"])
def get_public_portfolio_profile(username, portfolio_code):
    db = g.db

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        api_abort(404, "User not found")

    portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == user.id,
            Portfolio.code == portfolio_code,
            Portfolio.is_public == True
        )
        .first()
    )
    if portfolio is None:
        api_abort(404, "Public portfolio not found")

    profile = portfolio.profile
    if profile is None:
        profile = (
            db.query(Profile)
            .filter(Profile.user_id == user.id, Profile.is_default == True)
            .first()
        )

    if profile is None:
        return jsonify(None)

    public_extra_fields = [
        field
        for field in (profile.extra_fields or [])
        if isinstance(field, dict) and field.get("is_public", True) is True
    ]

    return jsonify({
        "id": profile.id,
        "display_name": profile.display_name,
        "email": profile.email,
        "headline": profile.headline,
        "bio": profile.bio,
        "avatar_file_uuid": profile.avatar_file_uuid,
        "links": profile.links or [],
        "extra_fields": public_extra_fields,
        "is_default": profile.is_default,
    })


@bp.route("/<username>/<portfolio_code>/<project_code>/", methods=["GET"])
def get_public_project_detail(username, portfolio_code, project_code):
    """공개된 프로젝트 상세 정보를 조회합니다.
    ---
    tags:
      - 공개
    parameters:
      - name: username
        in: path
        type: string
        required: true
      - name: portfolio_code
        in: path
        type: string
        required: true
      - name: project_code
        in: path
        type: string
        required: true
    responses:
      200:
        description: 공개 프로젝트 상세
        schema:
          $ref: '#/definitions/ProjectResponse'
      404:
        description: 프로젝트 없음
    """
    db = g.db

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        api_abort(404, "User not found")

    portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == user.id,
            Portfolio.code == portfolio_code,
            Portfolio.is_public == True
        )
        .first()
    )

    if portfolio is None:
        api_abort(404, "Public portfolio not found")

    item = (
        db.query(Project)
        .filter(
            Project.portfolio_id == portfolio.id,
            Project.code == project_code,
            Project.is_public == True
        )
        .first()
    )

    if item is None:
        api_abort(404, "Public project item not found")

    return jsonify(ProjectResponse.model_validate(item, from_attributes=True).model_dump())


@bp.route("/<username>/file/<string:file_uuid>", methods=["GET"])
def get_public_file(username, file_uuid):
    """공개 파일을 인증 없이 다운로드한다.
    ---
    tags:
      - 공개
    parameters:
      - name: username
        in: path
        type: string
        required: true
      - name: file_uuid
        in: path
        type: string
        required: true
    responses:
      200:
        description: 파일 다운로드
      404:
        description: 파일 없음
    """
    no_cache = {"Cache-Control": "no-store"}
    db = g.db

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        api_abort(404, "User not found", headers=no_cache)

    db_file = (
        db.query(UploadFile)
        .filter(UploadFile.uuid == file_uuid, UploadFile.user_id == user.id)
        .first()
    )
    if db_file is None:
        api_abort(404, "File not found", headers=no_cache)

    if not _has_public_file_reference(db, user.id, file_uuid):
        api_abort(404, "File not found", headers=no_cache)

    variant = request.args.get("variant", "detail")
    file_path = Path(db_file.upload_path)
    if variant == "thumbnail":
        thumbnail_path = get_thumbnail_path(file_path)
        if thumbnail_path.exists():
            file_path = thumbnail_path
    elif variant not in {"detail", "original"}:
        api_abort(400, "Invalid file variant", headers=no_cache)

    if not file_path.exists():
        api_abort(404, "파일을 찾을 수 없습니다.", headers=no_cache)

    response = send_file(
        file_path,
        download_name=db_file.original_filename,
        mimetype=db_file.content_type,
    )
    response.headers["Cache-Control"] = "public, max-age=86400"
    return response

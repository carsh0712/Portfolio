import os
import uuid
from pathlib import Path

from flask import Blueprint, request, jsonify, g, send_file

import core.config  # noqa: F401 — 환경별 .env 자동 로드
from models import UploadFile
from schemas.upload import FileUploadResponse
from core.security import login_required
from core.errors import api_abort
from utils.pagination import paginate_query

bp = Blueprint("files", __name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "zip"}


def _get_extension(filename: str) -> str:
    """파일명에서 확장자를 추출한다."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@bp.route("/upload", methods=["POST"])
@login_required
def upload_file():
    """파일을 업로드하고 메타데이터를 저장한다.
    ---
    tags:
      - 파일
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: 업로드할 파일
    responses:
      200:
        description: 파일 업로드 성공
        schema:
          $ref: '#/definitions/FileUploadResponse'
      400:
        description: 파일 누락 또는 허용되지 않은 형식
    """
    db = g.db
    current_user = g.current_user

    if "file" not in request.files:
        api_abort(400, "파일이 첨부되지 않았습니다.")

    file = request.files["file"]

    ext = _get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        api_abort(400, f"허용되지 않은 파일 형식입니다. 허용: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    content = file.read()
    if len(content) > MAX_FILE_SIZE:
        api_abort(400, f"파일 크기가 {MAX_FILE_SIZE // (1024 * 1024)}MB를 초과합니다.")

    upload_path = Path(UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{current_user.id}-{uuid.uuid4().hex}.{ext}"
    file_path = upload_path / stored_filename

    with open(file_path, "wb") as f:
        f.write(content)

    db_file = UploadFile(
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream",
        upload_path=str(file_path),
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return jsonify(FileUploadResponse.model_validate(db_file, from_attributes=True).model_dump())


@bp.route("/", methods=["GET"])
@login_required
def list_files():
    """현재 사용자의 업로드 파일 목록을 조회한다.
    ---
    tags:
      - 파일
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: page_size
        in: query
        type: integer
        default: 10
    responses:
      200:
        description: 파일 목록 (페이지네이션)
        schema:
          $ref: '#/definitions/PaginatedFileResponse'
    """
    db = g.db
    current_user = g.current_user

    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)

    query = (
        db.query(UploadFile)
        .filter(UploadFile.user_id == current_user.id)
        .order_by(UploadFile.created_at.desc())
    )
    result = paginate_query(query, page, page_size)
    return jsonify({
        "items": [FileUploadResponse.model_validate(f, from_attributes=True).model_dump() for f in result.items],
        "meta": result.meta.model_dump(),
    })


@bp.route("/<string:file_uuid>", methods=["GET"])
@login_required
def get_file(file_uuid):
    """파일을 다운로드한다.
    ---
    tags:
      - 파일
    security:
      - Bearer: []
    parameters:
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
    db = g.db
    current_user = g.current_user

    db_file = (
        db.query(UploadFile)
        .filter(UploadFile.uuid == file_uuid, UploadFile.user_id == current_user.id)
        .first()
    )
    if db_file is None:
        api_abort(404, "File not found")

    file_path = Path(db_file.upload_path)
    if not file_path.exists():
        api_abort(404, "파일을 찾을 수 없습니다.")

    response = send_file(
        file_path,
        download_name=db_file.original_filename,
        mimetype=db_file.content_type,
    )
    response.headers["Cache-Control"] = "public, max-age=86400"
    return response


@bp.route("/<string:file_uuid>", methods=["DELETE"])
@login_required
def delete_file(file_uuid):
    """파일과 메타데이터를 삭제한다.
    ---
    tags:
      - 파일
    security:
      - Bearer: []
    parameters:
      - name: file_uuid
        in: path
        type: string
        required: true
    responses:
      200:
        description: 파일 삭제 성공
      404:
        description: 파일 없음
    """
    db = g.db
    current_user = g.current_user

    db_file = (
        db.query(UploadFile)
        .filter(UploadFile.uuid == file_uuid, UploadFile.user_id == current_user.id)
        .first()
    )
    if db_file is None:
        api_abort(404, "File not found")

    file_path = Path(db_file.upload_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(db_file)
    db.commit()
    return jsonify({"message": "File deleted successfully"})

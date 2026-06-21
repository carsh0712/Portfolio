from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from sqlalchemy import cast, or_, String
from sqlalchemy.orm.attributes import flag_modified

from models import Project, Portfolio
from schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectSummaryResponse,
)
from core.security import login_required
from core.errors import api_abort
from utils.pagination import paginate_query
from utils.file_cleanup import cleanup_project_files

bp = Blueprint("projects", __name__)


def _get_owned_portfolio(portfolio_id: int, user_id: int, db) -> Portfolio:
    """사용자가 소유한 포트폴리오를 ID로 조회"""
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id)
        .first()
    )
    if portfolio is None:
        api_abort(404, "Portfolio not found")
    return portfolio


def _get_owned_portfolio_by_code(code: str, user_id: int, db) -> Portfolio:
    """사용자가 소유한 포트폴리오를 코드로 조회"""
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.code == code, Portfolio.user_id == user_id)
        .first()
    )
    if portfolio is None:
        api_abort(404, "Portfolio not found")
    return portfolio


@bp.route("/", methods=["POST"])
@login_required
def create_project_item():
    """프로젝트 아이템을 생성합니다.
    ---
    tags:
      - 프로젝트
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/ProjectCreate'
    responses:
      200:
        description: 프로젝트 생성 성공
        schema:
          $ref: '#/definitions/ProjectResponse'
      400:
        description: 중복된 프로젝트 코드
      404:
        description: 포트폴리오 없음
    """
    try:
        item = ProjectCreate.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    current_user = g.current_user

    portfolio = _get_owned_portfolio_by_code(item.portfolio_code, current_user.id, db)

    existing = db.query(Project).filter(
        Project.portfolio_id == portfolio.id,
        Project.code == item.code
    ).first()

    if existing:
        api_abort(400, "Project code already exists in this portfolio")

    db_item = Project(
        portfolio_id=portfolio.id,
        code=item.code,
        title=item.title,
        summary=item.summary,
        thumbnail_file_uuid=item.thumbnail.file_uuid if item.thumbnail else None,
        tags=item.tags,
        order=item.order,
        is_public=item.is_public,
        description=item.description,
        tech_stack=item.tech_stack,
        screenshots=[s.model_dump() for s in item.screenshots],
        links=[link.model_dump() for link in item.links],
        start_date=item.start_date,
        end_date=item.end_date,
        features=item.features,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return jsonify(ProjectResponse.model_validate(db_item, from_attributes=True).model_dump())


@bp.route("/", methods=["GET"])
@login_required
def read_project_items():
    """포트폴리오 내 프로젝트 아이템 목록을 페이지네이션하여 조회합니다. search로 tags/tech_stack LIKE 부분 일치 검색이 가능합니다.
    ---
    tags:
      - 프로젝트
    security:
      - Bearer: []
    parameters:
      - name: portfolio_code
        in: query
        type: string
        required: true
        description: 포트폴리오 코드
      - name: search
        in: query
        type: string
        required: false
        description: 검색어 (tags, tech_stack에서 LIKE 부분 일치 OR 검색)
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
        description: 프로젝트 목록 (페이지네이션)
        schema:
          $ref: '#/definitions/PaginatedProjectSummaryResponse'
      404:
        description: 포트폴리오 없음
    """
    db = g.db
    current_user = g.current_user

    portfolio_code = request.args.get("portfolio_code", type=str)
    if portfolio_code is None:
        api_abort(422, [{"msg": "portfolio_code is required"}])

    search = request.args.get("search", type=str)
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)

    if page < 1:
        api_abort(422, [{"msg": "page must be >= 1"}])
    if page_size < 1 or page_size > 100:
        api_abort(422, [{"msg": "page_size must be between 1 and 100"}])

    portfolio = _get_owned_portfolio_by_code(portfolio_code, current_user.id, db)
    query = (
        db.query(Project)
        .filter(Project.portfolio_id == portfolio.id)
        .order_by(Project.order)
    )

    if search:
        pattern = f'%{search}%'
        query = query.filter(or_(
            cast(Project.tags, String).like(pattern),
            cast(Project.tech_stack, String).like(pattern),
        ))

    result = paginate_query(query, page, page_size)
    return jsonify({
        "items": [ProjectSummaryResponse.model_validate(i, from_attributes=True).model_dump() for i in result.items],
        "meta": result.meta.model_dump(),
    })


@bp.route("/<string:portfolio_code>/<string:project_code>", methods=["GET"])
@login_required
def read_project_item(portfolio_code, project_code):
    """프로젝트 아이템 조회
    ---
    tags:
      - 프로젝트
    security:
      - Bearer: []
    parameters:
      - name: portfolio_code
        in: path
        type: string
        required: true
        description: 포트폴리오 코드
      - name: project_code
        in: path
        type: string
        required: true
        description: 프로젝트 코드
    responses:
      200:
        description: 프로젝트 상세 정보
        schema:
          $ref: '#/definitions/ProjectResponse'
      404:
        description: 프로젝트 없음
    """
    db = g.db
    current_user = g.current_user

    portfolio = _get_owned_portfolio_by_code(portfolio_code, current_user.id, db)
    item = db.query(Project).filter(
        Project.portfolio_id == portfolio.id,
        Project.code == project_code,
    ).first()
    if item is None:
        api_abort(404, "Project item not found")
    return jsonify(ProjectResponse.model_validate(item, from_attributes=True).model_dump())


@bp.route("/<string:portfolio_code>/<string:project_code>", methods=["PUT"])
@login_required
def update_project_item(portfolio_code, project_code):
    """프로젝트 아이템을 업데이트합니다.
    ---
    tags:
      - 프로젝트
    security:
      - Bearer: []
    parameters:
      - name: portfolio_code
        in: path
        type: string
        required: true
        description: 포트폴리오 코드
      - name: project_code
        in: path
        type: string
        required: true
        description: 프로젝트 코드
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/ProjectUpdate'
    responses:
      200:
        description: 프로젝트 수정 성공
        schema:
          $ref: '#/definitions/ProjectResponse'
      404:
        description: 프로젝트 없음
    """
    try:
        updated = ProjectUpdate.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    current_user = g.current_user

    portfolio = _get_owned_portfolio_by_code(portfolio_code, current_user.id, db)
    item = db.query(Project).filter(
        Project.portfolio_id == portfolio.id,
        Project.code == project_code,
    ).first()
    if item is None:
        api_abort(404, "Project item not found")

    update_data = updated.model_dump(exclude_unset=True)

    if "thumbnail" in update_data:
        thumbnail = update_data.pop("thumbnail")
        update_data["thumbnail_file_uuid"] = thumbnail["file_uuid"] if thumbnail else None

    if "portfolio_id" in update_data:
        _get_owned_portfolio(update_data["portfolio_id"], current_user.id, db)

    if "code" in update_data and update_data["code"] != item.code:
        target_portfolio_id = update_data.get("portfolio_id", item.portfolio_id)
        existing = db.query(Project).filter(
            Project.portfolio_id == target_portfolio_id,
            Project.code == update_data["code"]
        ).first()

        if existing:
            api_abort(400, "Project code already exists in this portfolio")

    json_fields = ("screenshots", "links", "tags", "tech_stack", "features")
    for field, value in update_data.items():
        if field in ("screenshots", "links") and value is not None:
            setattr(item, field, [s if isinstance(s, dict) else s.model_dump() for s in value])
        else:
            setattr(item, field, value)

    for field in json_fields:
        if field in update_data:
            flag_modified(item, field)

    db.commit()
    db.refresh(item)
    return jsonify(ProjectResponse.model_validate(item, from_attributes=True).model_dump())


@bp.route("/<string:portfolio_code>/<string:project_code>", methods=["DELETE"])
@login_required
def delete_project_item(portfolio_code, project_code):
    """프로젝트 아이템 삭제
    ---
    tags:
      - 프로젝트
    security:
      - Bearer: []
    parameters:
      - name: portfolio_code
        in: path
        type: string
        required: true
        description: 포트폴리오 코드
      - name: project_code
        in: path
        type: string
        required: true
        description: 프로젝트 코드
    responses:
      200:
        description: 프로젝트 삭제 성공
      404:
        description: 프로젝트 없음
    """
    db = g.db
    current_user = g.current_user

    portfolio = _get_owned_portfolio_by_code(portfolio_code, current_user.id, db)
    item = db.query(Project).filter(
        Project.portfolio_id == portfolio.id,
        Project.code == project_code,
    ).first()
    if item is None:
        api_abort(404, "Project item not found")
    cleanup_project_files(db, item)
    db.delete(item)
    db.commit()
    return jsonify({"message": "Project item deleted successfully"})

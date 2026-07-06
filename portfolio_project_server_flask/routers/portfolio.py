from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError

from models import Portfolio, Profile
from schemas.project import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from core.security import login_required
from core.errors import api_abort
from utils.pagination import paginate_query
from utils.file_cleanup import cleanup_portfolio_files

bp = Blueprint("portfolios", __name__)


@bp.route("/", methods=["POST"])
@login_required
def create_portfolio():
    """포트폴리오를 생성합니다.
    ---
    tags:
      - 포트폴리오
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/PortfolioCreate'
    responses:
      200:
        description: 포트폴리오 생성 성공
        schema:
          $ref: '#/definitions/PortfolioResponse'
      400:
        description: 중복된 포트폴리오 코드
    """
    try:
        portfolio = PortfolioCreate.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    current_user = g.current_user

    existing = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.code == portfolio.code
    ).first()

    if existing:
        api_abort(400, "Portfolio code already exists for this user")

    if portfolio.profile_id is not None:
        profile = db.query(Profile).filter(
            Profile.id == portfolio.profile_id,
            Profile.user_id == current_user.id,
        ).first()
        if profile is None:
            api_abort(400, "Profile not found")

    db_portfolio = Portfolio(
        user_id=current_user.id,
        profile_id=portfolio.profile_id,
        code=portfolio.code,
        name=portfolio.name,
        description=portfolio.description,
        file_uuid=portfolio.screenshot.file_uuid if portfolio.screenshot else None,
        order=portfolio.order,
        is_public=portfolio.is_public,
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return jsonify(PortfolioResponse.model_validate(db_portfolio, from_attributes=True).model_dump())


@bp.route("/", methods=["GET"])
@login_required
def read_portfolios():
    """사용자의 포트폴리오 목록을 페이지네이션하여 조회합니다.
    ---
    tags:
      - 포트폴리오
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
        description: 포트폴리오 목록 (페이지네이션)
        schema:
          $ref: '#/definitions/PaginatedPortfolioResponse'
    """
    db = g.db
    current_user = g.current_user

    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 10, type=int)

    if page < 1:
        api_abort(422, [{"msg": "page must be >= 1"}])
    if page_size < 1 or page_size > 100:
        api_abort(422, [{"msg": "page_size must be between 1 and 100"}])

    query = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == current_user.id)
        .order_by(Portfolio.order)
    )
    result = paginate_query(query, page, page_size)
    return jsonify({
        "items": [PortfolioResponse.model_validate(c, from_attributes=True).model_dump() for c in result.items],
        "meta": result.meta.model_dump(),
    })


@bp.route("/<string:code>", methods=["GET"])
@login_required
def read_portfolio(code):
    """포트폴리오를 코드로 조회합니다.
    ---
    tags:
      - 포트폴리오
    security:
      - Bearer: []
    parameters:
      - name: code
        in: path
        type: string
        required: true
        description: 포트폴리오 코드
    responses:
      200:
        description: 포트폴리오 상세 정보
        schema:
          $ref: '#/definitions/PortfolioResponse'
      404:
        description: 포트폴리오 없음
    """
    db = g.db
    current_user = g.current_user

    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.code == code, Portfolio.user_id == current_user.id)
        .first()
    )
    if portfolio is None:
        api_abort(404, "Portfolio not found")
    return jsonify(PortfolioResponse.model_validate(portfolio, from_attributes=True).model_dump())


@bp.route("/<string:code>", methods=["PUT"])
@login_required
def update_portfolio(code):
    """포트폴리오를 코드로 조회하여 업데이트합니다.
    ---
    tags:
      - 포트폴리오
    security:
      - Bearer: []
    parameters:
      - name: code
        in: path
        type: string
        required: true
        description: 포트폴리오 코드
      - in: body
        name: body
        required: true
        schema:
          $ref: '#/definitions/PortfolioUpdate'
    responses:
      200:
        description: 포트폴리오 수정 성공
        schema:
          $ref: '#/definitions/PortfolioResponse'
      404:
        description: 포트폴리오 없음
    """
    try:
        updated = PortfolioUpdate.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    current_user = g.current_user

    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.code == code, Portfolio.user_id == current_user.id)
        .first()
    )
    if portfolio is None:
        api_abort(404, "Portfolio not found")

    update_data = updated.model_dump(exclude_unset=True)

    if "screenshot" in update_data:
        screenshot = update_data.pop("screenshot")
        update_data["file_uuid"] = screenshot["file_uuid"] if screenshot else None

    if "profile_id" in update_data and update_data["profile_id"] is not None:
        profile = db.query(Profile).filter(
            Profile.id == update_data["profile_id"],
            Profile.user_id == current_user.id,
        ).first()
        if profile is None:
            api_abort(400, "Profile not found")

    if "code" in update_data and update_data["code"] != portfolio.code:
        existing = db.query(Portfolio).filter(
            Portfolio.user_id == current_user.id,
            Portfolio.code == update_data["code"]
        ).first()

        if existing:
            api_abort(400, "Portfolio code already exists for this user")

    for field, value in update_data.items():
        setattr(portfolio, field, value)

    db.commit()
    db.refresh(portfolio)
    return jsonify(PortfolioResponse.model_validate(portfolio, from_attributes=True).model_dump())


@bp.route("/<string:code>", methods=["DELETE"])
@login_required
def delete_portfolio(code):
    """포트폴리오를 코드로 조회하여 삭제합니다.
    ---
    tags:
      - 포트폴리오
    security:
      - Bearer: []
    parameters:
      - name: code
        in: path
        type: string
        required: true
        description: 포트폴리오 코드
    responses:
      200:
        description: 포트폴리오 삭제 성공
      404:
        description: 포트폴리오 없음
    """
    db = g.db
    current_user = g.current_user

    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.code == code, Portfolio.user_id == current_user.id)
        .first()
    )
    if portfolio is None:
        api_abort(404, "Portfolio not found")
    cleanup_portfolio_files(db, portfolio)
    db.delete(portfolio)
    db.commit()
    return jsonify({"message": "Portfolio deleted successfully"})

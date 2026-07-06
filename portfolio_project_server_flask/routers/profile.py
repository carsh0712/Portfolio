from flask import Blueprint, g, jsonify, request
from pydantic import ValidationError

from core.errors import api_abort
from core.security import login_required
from models import Portfolio, Profile
from schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from utils.pagination import paginate_query

bp = Blueprint("profiles", __name__)


def _clear_other_defaults(db, user_id: int, except_profile_id: int | None = None) -> None:
    query = db.query(Profile).filter(Profile.user_id == user_id)
    if except_profile_id is not None:
        query = query.filter(Profile.id != except_profile_id)
    query.update({Profile.is_default: False}, synchronize_session=False)


@bp.route("/", methods=["GET"])
@login_required
def list_profiles():
    db = g.db
    current_user = g.current_user

    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 100, type=int)

    if page < 1:
        api_abort(422, [{"msg": "page must be >= 1"}])
    if page_size < 1 or page_size > 100:
        api_abort(422, [{"msg": "page_size must be between 1 and 100"}])

    query = (
        db.query(Profile)
        .filter(Profile.user_id == current_user.id)
        .order_by(Profile.is_default.desc(), Profile.created_at.desc())
    )
    result = paginate_query(query, page, page_size)
    return jsonify({
        "items": [ProfileResponse.model_validate(profile, from_attributes=True).model_dump() for profile in result.items],
        "meta": result.meta.model_dump(),
    })


@bp.route("/", methods=["POST"])
@login_required
def create_profile():
    try:
        data = ProfileCreate.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    current_user = g.current_user

    has_profile = db.query(Profile.id).filter(Profile.user_id == current_user.id).first() is not None
    is_default = data.is_default or not has_profile
    if is_default:
        _clear_other_defaults(db, current_user.id)

    profile = Profile(
        user_id=current_user.id,
        display_name=data.display_name,
        email=data.email,
        headline=data.headline,
        bio=data.bio,
        avatar_file_uuid=data.avatar_file_uuid,
        links=[link.model_dump(by_alias=True, exclude_none=True) for link in data.links],
        extra_fields=[field.model_dump() for field in data.extra_fields],
        is_default=is_default,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return jsonify(ProfileResponse.model_validate(profile, from_attributes=True).model_dump())


@bp.route("/<int:profile_id>", methods=["GET"])
@login_required
def get_profile(profile_id):
    profile = (
        g.db.query(Profile)
        .filter(Profile.id == profile_id, Profile.user_id == g.current_user.id)
        .first()
    )
    if profile is None:
        api_abort(404, "Profile not found")
    return jsonify(ProfileResponse.model_validate(profile, from_attributes=True).model_dump())


@bp.route("/<int:profile_id>", methods=["PUT"])
@login_required
def update_profile(profile_id):
    try:
        data = ProfileUpdate.model_validate(request.get_json())
    except ValidationError as e:
        api_abort(422, e.errors())

    db = g.db
    current_user = g.current_user
    profile = (
        db.query(Profile)
        .filter(Profile.id == profile_id, Profile.user_id == current_user.id)
        .first()
    )
    if profile is None:
        api_abort(404, "Profile not found")

    update_data = data.model_dump(exclude_unset=True)
    if "links" in update_data and data.links is not None:
        update_data["links"] = [link.model_dump(by_alias=True, exclude_none=True) for link in data.links]
    if "extra_fields" in update_data and data.extra_fields is not None:
        update_data["extra_fields"] = [field.model_dump() for field in data.extra_fields]
    if update_data.get("is_default") is True:
        _clear_other_defaults(db, current_user.id, except_profile_id=profile.id)

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return jsonify(ProfileResponse.model_validate(profile, from_attributes=True).model_dump())


@bp.route("/<int:profile_id>", methods=["DELETE"])
@login_required
def delete_profile(profile_id):
    db = g.db
    current_user = g.current_user
    profile = (
        db.query(Profile)
        .filter(Profile.id == profile_id, Profile.user_id == current_user.id)
        .first()
    )
    if profile is None:
        api_abort(404, "Profile not found")

    linked_portfolio = (
        db.query(Portfolio.id)
        .filter(Portfolio.profile_id == profile.id, Portfolio.user_id == current_user.id)
        .first()
    )
    if linked_portfolio is not None:
        api_abort(409, "Profile is linked to one or more portfolios")

    was_default = profile.is_default
    db.delete(profile)
    db.flush()

    if was_default:
        fallback = (
            db.query(Profile)
            .filter(Profile.user_id == current_user.id)
            .order_by(Profile.created_at.desc())
            .first()
        )
        if fallback is not None:
            fallback.is_default = True

    db.commit()
    return jsonify({"message": "Profile deleted successfully"})

from math import ceil
from typing import TypeVar
from sqlalchemy.orm import Query
from schemas.pagination import PaginatedResponse, PaginationMeta

T = TypeVar("T")


def paginate_query(query: Query, page: int, page_size: int) -> PaginatedResponse:
    """
    SQLAlchemy 쿼리에 페이지네이션을 적용하고 페이지네이션된 응답을 반환합니다.

    Args:
        query: SQLAlchemy Query 객체
        page: 페이지 번호 (1부터 시작)
        page_size: 페이지당 아이템 수

    Returns:
        아이템과 페이지네이션 메타데이터가 포함된 PaginatedResponse
    """
    # 전체 항목 수 조회
    total = query.count()

    # 전체 페이지 수 계산
    total_pages = ceil(total / page_size) if total > 0 else 0

    # offset 계산
    offset = (page - 1) * page_size

    # 현재 페이지의 아이템 조회
    items = query.limit(page_size).offset(offset).all()

    # 페이지네이션 메타데이터 생성
    meta = PaginationMeta(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

    # 페이지네이션된 응답 반환
    return PaginatedResponse(items=items, meta=meta)

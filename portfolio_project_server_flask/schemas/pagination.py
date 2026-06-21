from math import ceil
from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """페이지네이션 메타데이터"""
    total: int = Field(description="전체 아이템 수")
    page: int = Field(description="현재 페이지 번호 (1부터 시작)")
    page_size: int = Field(description="페이지당 아이템 수")
    total_pages: int = Field(description="전체 페이지 수")


class PaginatedResponse(BaseModel, Generic[T]):
    """제네릭 페이지네이션 응답 래퍼"""
    items: List[T] = Field(description="현재 페이지의 아이템 목록")
    meta: PaginationMeta = Field(description="페이지네이션 메타데이터")

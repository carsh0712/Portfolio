from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from typing import Any, Dict, List, Optional
from schemas.pagination import PaginatedResponse


# --- 공통 서브모델 ---

class FileReference(BaseModel):
    """파일 참조 정보"""
    file_uuid: str


class Screenshot(BaseModel):
    """스크린샷 정보"""
    file_uuid: str
    caption: Optional[str] = None


class Link(BaseModel):
    """링크 정보"""
    name: str
    url: str
    background_color: Optional[str] = Field(None, alias="backgroundColor")
    text_color: Optional[str] = Field(None, alias="textColor")
    icon: Optional[str] = None

    class Config:
        populate_by_name = True


# --- Portfolio ---

class PortfolioCreate(BaseModel):
    """포트폴리오 생성 스키마"""
    code: str = Field(..., min_length=5, description="포트폴리오 코드 (최소 5글자, user_id별로 유니크)")
    name: str
    description: str
    screenshot: Optional[FileReference] = None
    order: int = 0
    is_public: bool = True


class PortfolioUpdate(BaseModel):
    """포트폴리오 업데이트 스키마"""
    code: Optional[str] = Field(None, min_length=5, description="포트폴리오 코드 (최소 5글자, user_id별로 유니크)")
    name: Optional[str] = None
    description: Optional[str] = None
    screenshot: Optional[FileReference] = None
    order: Optional[int] = None
    is_public: Optional[bool] = None


class PortfolioResponse(BaseModel):
    """포트폴리오 응답 스키마"""
    user_id: int
    code: str
    name: str
    description: str
    file_uuid: Optional[str] = Field(None, exclude=True)
    screenshot: Optional[FileReference] = None
    order: int
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def build_screenshot(self):
        """DB의 file_uuid를 screenshot 객체로 변환한다."""
        if self.file_uuid is not None and self.screenshot is None:
            self.screenshot = FileReference(file_uuid=self.file_uuid)
        return self


# --- Project ---

class ProjectCreate(BaseModel):
    """프로젝트 아이템 생성 스키마"""
    portfolio_code: str = Field(..., description="포트폴리오 코드")
    code: str = Field(..., min_length=5, description="프로젝트 아이템 코드 (최소 5글자, portfolio별로 유니크)")
    title: str
    summary: str
    thumbnail: Optional[FileReference] = None
    tags: List[str] = []
    order: int = 0
    is_public: bool = True
    # detail 필드 (선택)
    description: Optional[str] = None
    tech_stack: List[str] = []
    screenshots: List[Screenshot] = []
    links: List[Link] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    features: List[str] = []


class ProjectUpdate(BaseModel):
    """프로젝트 아이템 업데이트 스키마"""
    portfolio_id: Optional[int] = None
    code: Optional[str] = Field(None, min_length=5, description="프로젝트 아이템 코드 (최소 5글자, portfolio_id별로 유니크)")
    title: Optional[str] = None
    summary: Optional[str] = None
    thumbnail: Optional[FileReference] = None
    tags: Optional[List[str]] = None
    order: Optional[int] = None
    is_public: Optional[bool] = None
    # detail 필드 (선택)
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    screenshots: Optional[List[Screenshot]] = None
    links: Optional[List[Link]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    features: Optional[List[str]] = None


class ProjectSummaryResponse(BaseModel):
    """프로젝트 아이템 목록용 응답 스키마 (상세 필드 제외)"""
    code: str
    title: str
    summary: str
    thumbnail_file_uuid: Optional[str] = Field(None, exclude=True)
    thumbnail: Optional[FileReference] = None
    tags: List[str] = []
    tech_stack: List[str] = []
    order: int
    is_public: bool

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def build_thumbnail(self):
        """DB의 thumbnail_file_uuid를 thumbnail 객체로 변환한다."""
        if self.thumbnail_file_uuid is not None and self.thumbnail is None:
            self.thumbnail = FileReference(file_uuid=self.thumbnail_file_uuid)
        return self


class ProjectResponse(BaseModel):
    """프로젝트 아이템 상세 응답 스키마"""
    id: int
    portfolio_id: int
    code: str
    title: str
    summary: str
    thumbnail_file_uuid: Optional[str] = Field(None, exclude=True)
    thumbnail: Optional[FileReference] = None
    tags: List[str] = []
    order: int
    is_public: bool
    description: Optional[str] = None
    tech_stack: List[str] = []
    screenshots: List[Dict[str, Any]] = []
    links: List[Dict[str, Any]] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    features: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def build_thumbnail(self):
        """DB의 thumbnail_file_uuid를 thumbnail 객체로 변환한다."""
        if self.thumbnail_file_uuid is not None and self.thumbnail is None:
            self.thumbnail = FileReference(file_uuid=self.thumbnail_file_uuid)
        return self



# --- Paginated Response Types ---

PaginatedPortfolioResponse = PaginatedResponse[PortfolioResponse]
PaginatedItemResponse = PaginatedResponse[ProjectSummaryResponse]

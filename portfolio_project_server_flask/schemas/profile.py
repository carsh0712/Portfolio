from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from schemas.pagination import PaginatedResponse
from schemas.project import Link


class ProfileCreate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    avatar_file_uuid: Optional[str] = None
    links: List[Link] = []
    is_default: bool = False


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    avatar_file_uuid: Optional[str] = None
    links: Optional[List[Link]] = None
    is_default: Optional[bool] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    display_name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_file_uuid: Optional[str] = None
    links: List[dict] = []
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


PaginatedProfileResponse = PaginatedResponse[ProfileResponse]

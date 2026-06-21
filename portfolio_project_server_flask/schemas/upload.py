from datetime import datetime
from pydantic import BaseModel

from schemas.pagination import PaginatedResponse


class FileUploadResponse(BaseModel):
    """파일 업로드 응답 스키마."""
    uuid: str
    original_filename: str
    stored_filename: str
    file_size: int
    content_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


PaginatedFileResponse = PaginatedResponse[FileUploadResponse]

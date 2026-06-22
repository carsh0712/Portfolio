"""엔티티 삭제 시 연결된 파일(DB 레코드 + 물리 파일)을 정리하는 유틸리티."""

from pathlib import Path
from typing import List

from sqlalchemy.orm import Session

from models import UploadFile, Portfolio, Project
from utils.image_processing import get_thumbnail_path


def _delete_upload_files(db: Session, file_uuids: List[str]) -> None:
    """file_uuid 목록에 해당하는 UploadFile 레코드와 물리 파일을 삭제한다."""
    if not file_uuids:
        return

    files = db.query(UploadFile).filter(UploadFile.uuid.in_(file_uuids)).all()
    for f in files:
        path = Path(f.upload_path)
        if path.exists():
            path.unlink()
        thumbnail_path = get_thumbnail_path(path)
        if thumbnail_path.exists():
            thumbnail_path.unlink()
        db.delete(f)


def collect_project_file_uuids(project: Project) -> List[str]:
    """프로젝트에 연결된 모든 file_uuid를 수집한다."""
    uuids = []
    if project.thumbnail_file_uuid:
        uuids.append(project.thumbnail_file_uuid)
    for s in (project.screenshots or []):
        if isinstance(s, dict) and s.get("file_uuid"):
            uuids.append(s["file_uuid"])
    return uuids


def cleanup_project_files(db: Session, project: Project) -> None:
    """프로젝트에 연결된 파일을 모두 삭제한다."""
    file_uuids = collect_project_file_uuids(project)
    _delete_upload_files(db, file_uuids)


def cleanup_portfolio_files(db: Session, portfolio: Portfolio) -> None:
    """포트폴리오와 하위 프로젝트에 연결된 파일을 모두 삭제한다."""
    file_uuids = []

    # 포트폴리오 자체 스크린샷
    if portfolio.file_uuid:
        file_uuids.append(portfolio.file_uuid)

    # 하위 프로젝트들의 파일
    for project in portfolio.items:
        file_uuids.extend(collect_project_file_uuids(project))

    _delete_upload_files(db, file_uuids)


def cleanup_user_files(db: Session, user) -> None:
    """사용자의 모든 업로드 파일(물리 파일)을 삭제한다.

    DB 레코드는 cascade로 자동 삭제되므로 물리 파일만 처리한다.
    """
    files = db.query(UploadFile).filter(UploadFile.user_id == user.id).all()
    for f in files:
        path = Path(f.upload_path)
        if path.exists():
            path.unlink()
        thumbnail_path = get_thumbnail_path(path)
        if thumbnail_path.exists():
            thumbnail_path.unlink()

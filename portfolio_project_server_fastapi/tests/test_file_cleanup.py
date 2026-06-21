"""파일 정리(cleanup) 유틸리티 및 삭제 API 통합 테스트."""
import os
import tempfile

import pytest
from models import Portfolio, Project, UploadFile
from utils.file_cleanup import (
    collect_project_file_uuids,
    cleanup_project_files,
    cleanup_portfolio_files,
)


@pytest.fixture()
def upload_dir(tmp_path):
    """임시 업로드 디렉토리."""
    return tmp_path


def _create_upload_file(db_session, user, upload_dir, filename="test.png"):
    """테스트용 UploadFile 레코드와 물리 파일을 생성한다."""
    stored = f"{user.id}-{filename}"
    file_path = upload_dir / stored
    file_path.write_bytes(b"fake image data")

    db_file = UploadFile(
        user_id=user.id,
        original_filename=filename,
        stored_filename=stored,
        file_size=15,
        content_type="image/png",
        upload_path=str(file_path),
    )
    db_session.add(db_file)
    db_session.commit()
    db_session.refresh(db_file)
    return db_file


# === 유틸 함수 단위 테스트 ===


class TestCollectProjectFileUuids:
    def test_empty_project(self, db_session, sample_portfolio):
        """파일 참조가 없는 프로젝트"""
        project = Project(
            portfolio_id=sample_portfolio.id,
            code="NOFIL",
            title="No Files",
            summary="S",
            order=0,
        )
        db_session.add(project)
        db_session.commit()
        assert collect_project_file_uuids(project) == []

    def test_thumbnail_only(self, db_session, sample_portfolio):
        """썸네일만 있는 프로젝트"""
        project = Project(
            portfolio_id=sample_portfolio.id,
            code="THUMB",
            title="Thumb",
            summary="S",
            thumbnail_file_uuid="abc00000000000000000000000000042",
            order=0,
        )
        db_session.add(project)
        db_session.commit()
        assert collect_project_file_uuids(project) == ["abc00000000000000000000000000042"]

    def test_screenshots(self, db_session, sample_portfolio):
        """스크린샷이 있는 프로젝트"""
        project = Project(
            portfolio_id=sample_portfolio.id,
            code="SHOTS",
            title="Shots",
            summary="S",
            screenshots=[
                {"file_uuid": "abc00000000000000000000000000010", "caption": "a"},
                {"file_uuid": "abc00000000000000000000000000020", "caption": "b"},
            ],
            order=0,
        )
        db_session.add(project)
        db_session.commit()
        assert collect_project_file_uuids(project) == [
            "abc00000000000000000000000000010",
            "abc00000000000000000000000000020",
        ]

    def test_thumbnail_and_screenshots(self, db_session, sample_portfolio):
        """썸네일 + 스크린샷"""
        project = Project(
            portfolio_id=sample_portfolio.id,
            code="BOTH1",
            title="Both",
            summary="S",
            thumbnail_file_uuid="abc00000000000000000000000000001",
            screenshots=[{"file_uuid": "abc00000000000000000000000000002"}],
            order=0,
        )
        db_session.add(project)
        db_session.commit()
        assert collect_project_file_uuids(project) == [
            "abc00000000000000000000000000001",
            "abc00000000000000000000000000002",
        ]


class TestCleanupProjectFiles:
    def test_deletes_physical_and_db(self, db_session, test_user, sample_portfolio, upload_dir):
        """프로젝트 파일 정리 시 물리 파일과 DB 레코드 모두 삭제"""
        f1 = _create_upload_file(db_session, test_user, upload_dir, "thumb.png")
        f2 = _create_upload_file(db_session, test_user, upload_dir, "shot1.png")

        project = Project(
            portfolio_id=sample_portfolio.id,
            code="CLEAN",
            title="Clean",
            summary="S",
            thumbnail_file_uuid=f1.uuid,
            screenshots=[{"file_uuid": f2.uuid, "caption": "x"}],
            order=0,
        )
        db_session.add(project)
        db_session.commit()

        path1, path2 = f1.upload_path, f2.upload_path
        cleanup_project_files(db_session, project)
        db_session.commit()

        # 물리 파일 삭제 확인
        assert not os.path.exists(path1)
        assert not os.path.exists(path2)

        # DB 레코드 삭제 확인
        assert db_session.query(UploadFile).filter(UploadFile.uuid == f1.uuid).first() is None
        assert db_session.query(UploadFile).filter(UploadFile.uuid == f2.uuid).first() is None


class TestCleanupPortfolioFiles:
    def test_deletes_portfolio_and_project_files(self, db_session, test_user, upload_dir):
        """포트폴리오 삭제 시 자체 파일 + 하위 프로젝트 파일 모두 삭제"""
        f_portfolio = _create_upload_file(db_session, test_user, upload_dir, "portfolio.png")
        f_thumb = _create_upload_file(db_session, test_user, upload_dir, "pthumb.png")
        f_shot = _create_upload_file(db_session, test_user, upload_dir, "pshot.png")

        portfolio = Portfolio(
            user_id=test_user.id,
            code="PCLEAN",
            name="Portfolio Clean",
            description="D",
            file_uuid=f_portfolio.uuid,
            order=0,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        project = Project(
            portfolio_id=portfolio.id,
            code="PITEM",
            title="PItem",
            summary="S",
            thumbnail_file_uuid=f_thumb.uuid,
            screenshots=[{"file_uuid": f_shot.uuid}],
            order=0,
        )
        db_session.add(project)
        db_session.commit()

        paths = [f_portfolio.upload_path, f_thumb.upload_path, f_shot.upload_path]
        file_uuids = [f_portfolio.uuid, f_thumb.uuid, f_shot.uuid]

        cleanup_portfolio_files(db_session, portfolio)
        db_session.commit()

        for p in paths:
            assert not os.path.exists(p)
        for fuuid in file_uuids:
            assert db_session.query(UploadFile).filter(UploadFile.uuid == fuuid).first() is None


# === API 통합 테스트 ===


class TestDeleteProjectApiCleansFiles:
    def test_delete_project_removes_files(self, client, db_session, test_user, sample_portfolio, upload_dir, monkeypatch):
        """프로젝트 삭제 API 호출 시 연결 파일도 삭제됨"""
        f1 = _create_upload_file(db_session, test_user, upload_dir, "api_thumb.png")

        project = Project(
            portfolio_id=sample_portfolio.id,
            code="APIDL",
            title="ApiDel",
            summary="S",
            thumbnail_file_uuid=f1.uuid,
            order=0,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        path = f1.upload_path
        resp = client.delete(f"/api/v1/projects/{sample_portfolio.code}/{project.code}")
        assert resp.status_code == 200

        assert not os.path.exists(path)
        assert db_session.query(UploadFile).filter(UploadFile.uuid == f1.uuid).first() is None


class TestDeletePortfolioApiCleansFiles:
    def test_delete_portfolio_removes_files(self, client, db_session, test_user, upload_dir):
        """포트폴리오 삭제 API 호출 시 자체 파일 + 하위 프로젝트 파일 삭제됨"""
        f_port = _create_upload_file(db_session, test_user, upload_dir, "port_api.png")
        f_proj = _create_upload_file(db_session, test_user, upload_dir, "proj_api.png")

        portfolio = Portfolio(
            user_id=test_user.id,
            code="APDEL",
            name="ApiDel Portfolio",
            description="D",
            file_uuid=f_port.uuid,
            order=0,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        project = Project(
            portfolio_id=portfolio.id,
            code="APDIT",
            title="ApiDelItem",
            summary="S",
            thumbnail_file_uuid=f_proj.uuid,
            order=0,
        )
        db_session.add(project)
        db_session.commit()

        paths = [f_port.upload_path, f_proj.upload_path]
        file_uuids = [f_port.uuid, f_proj.uuid]

        resp = client.delete(f"/api/v1/portfolios/{portfolio.code}")
        assert resp.status_code == 200

        for p in paths:
            assert not os.path.exists(p)
        for fuuid in file_uuids:
            assert db_session.query(UploadFile).filter(UploadFile.uuid == fuuid).first() is None

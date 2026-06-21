"""Pydantic 스키마 유효성 검증 테스트."""
import pytest
from datetime import datetime
from pydantic import ValidationError


# === Auth Schemas ===


class TestLoginRequest:
    def test_valid(self):
        from schemas.auth import LoginRequest

        req = LoginRequest(email="admin@example.com", password="secret")
        assert req.email == "admin@example.com"
        assert req.password == "secret"

    def test_missing_email(self):
        from schemas.auth import LoginRequest

        with pytest.raises(ValidationError):
            LoginRequest(password="secret")

    def test_missing_password(self):
        from schemas.auth import LoginRequest

        with pytest.raises(ValidationError):
            LoginRequest(email="admin@example.com")


class TestLoginResponse:
    def test_default_token_type(self):
        from schemas.auth import LoginResponse

        resp = LoginResponse(access_token="abc", refresh_token="def")
        assert resp.token_type == "bearer"


class TestRefreshRequest:
    def test_valid(self):
        from schemas.auth import RefreshRequest

        req = RefreshRequest(refresh_token="sometoken")
        assert req.refresh_token == "sometoken"

    def test_missing_token(self):
        from schemas.auth import RefreshRequest

        with pytest.raises(ValidationError):
            RefreshRequest()


class TestRefreshResponse:
    def test_default_token_type(self):
        from schemas.auth import RefreshResponse

        resp = RefreshResponse(access_token="abc")
        assert resp.token_type == "bearer"


class TestLogoutRequest:
    def test_valid(self):
        from schemas.auth import LogoutRequest

        req = LogoutRequest(refresh_token="sometoken")
        assert req.refresh_token == "sometoken"


class TestUserResponse:
    def test_from_attributes(self):
        from schemas.auth import UserResponse

        class FakeUser:
            id = 1
            username = "admin"
            email = "admin@example.com"

        resp = UserResponse.model_validate(FakeUser(), from_attributes=True)
        assert resp.id == 1
        assert resp.username == "admin"


# === Portfolio Schemas ===


class TestPortfolioCreate:
    def test_valid_with_defaults(self):
        from schemas.project import PortfolioCreate

        cat = PortfolioCreate(code="APPSC", name="Apps", description="My apps")
        assert cat.code == "APPSC"
        assert cat.screenshot is None
        assert cat.order == 0
        assert cat.is_public is True

    def test_valid_with_all_fields(self):
        from schemas.project import PortfolioCreate

        cat = PortfolioCreate(
            code="APPSC",
            name="Apps",
            description="My apps",
            screenshot={"file_uuid": "abc00000000000000000000000000001"},
            order=5,
            is_public=False,
        )
        assert cat.code == "APPSC"
        assert cat.order == 5
        assert cat.is_public is False

    def test_code_min_length_validation(self):
        """code는 최소 5글자여야 함"""
        from schemas.project import PortfolioCreate

        with pytest.raises(ValidationError):
            PortfolioCreate(code="ABC", name="Apps", description="My apps")

    def test_missing_code(self):
        """code는 필수 필드"""
        from schemas.project import PortfolioCreate

        with pytest.raises(ValidationError):
            PortfolioCreate(name="Apps", description="My apps")

    def test_missing_description(self):
        from schemas.project import PortfolioCreate

        with pytest.raises(ValidationError):
            PortfolioCreate(code="APPSC", name="Apps")


class TestPortfolioUpdate:
    def test_all_optional(self):
        from schemas.project import PortfolioUpdate

        update = PortfolioUpdate()
        assert update.model_dump(exclude_unset=True) == {}

    def test_partial_update(self):
        from schemas.project import PortfolioUpdate

        update = PortfolioUpdate(name="New Name")
        dumped = update.model_dump(exclude_unset=True)
        assert dumped == {"name": "New Name"}
        assert "description" not in dumped


# === Project Item Schemas ===


class TestProjectCreate:
    def test_valid_with_defaults(self):
        from schemas.project import ProjectCreate

        item = ProjectCreate(portfolio_code="MYPORT", code="MYAPP", title="My App", summary="A cool app")
        assert item.tags == []
        assert item.order == 0
        assert item.thumbnail is None
        assert item.is_public is True
        # detail 필드 기본값
        assert item.description is None
        assert item.tech_stack == []
        assert item.screenshots == []
        assert item.links == []
        assert item.features == []

    def test_with_tags(self):
        from schemas.project import ProjectCreate

        item = ProjectCreate(
            portfolio_code="MYPORT",
            code="TAGAP",
            title="App",
            summary="Summary",
            tags=["python", "web"],
        )
        assert item.tags == ["python", "web"]

    def test_with_is_public_false(self):
        from schemas.project import ProjectCreate

        item = ProjectCreate(
            portfolio_code="MYPORT",
            code="PRIV1",
            title="Private App",
            summary="Private",
            is_public=False,
        )
        assert item.is_public is False

    def test_missing_required(self):
        from schemas.project import ProjectCreate

        with pytest.raises(ValidationError):
            ProjectCreate(portfolio_code="MYPORT", title="No Summary")

    def test_with_detail_fields(self):
        """detail 필드를 포함한 생성"""
        from schemas.project import ProjectCreate, Screenshot, Link

        item = ProjectCreate(
            portfolio_code="MYPORT",
            code="DETAP",
            title="Detail App",
            summary="With detail",
            description="Full detail",
            tech_stack=["Python", "FastAPI"],
            screenshots=[Screenshot(file_uuid="abc00000000000000000000000000001", caption="Main")],
            links=[
                Link(
                    name="github",
                    url="http://github.com/project",
                    background_color="#333",
                    text_color="#fff",
                    icon="github"
                )
            ],
            start_date="2024-01",
            end_date="2024-06",
            features=["Feature A"],
        )
        assert item.description == "Full detail"
        assert len(item.screenshots) == 1
        assert len(item.links) == 1
        assert item.tech_stack == ["Python", "FastAPI"]


class TestProjectUpdate:
    def test_all_optional(self):
        from schemas.project import ProjectUpdate

        update = ProjectUpdate()
        assert update.model_dump(exclude_unset=True) == {}

    def test_partial_fields(self):
        from schemas.project import ProjectUpdate

        update = ProjectUpdate(title="Updated Title", tags=["new"])
        dumped = update.model_dump(exclude_unset=True)
        assert "title" in dumped
        assert "tags" in dumped
        assert "summary" not in dumped

    def test_detail_fields_update(self):
        """detail 필드만 업데이트"""
        from schemas.project import ProjectUpdate

        update = ProjectUpdate(
            description="Updated desc",
            tech_stack=["React"],
            features=["New Feature"],
        )
        dumped = update.model_dump(exclude_unset=True)
        assert dumped["description"] == "Updated desc"
        assert dumped["tech_stack"] == ["React"]
        assert dumped["features"] == ["New Feature"]
        assert "title" not in dumped


class TestProjectSummaryResponse:
    def test_fields_included(self):
        """ProjectSummaryResponse에 tech_stack이 포함되고 portfolio_id, created_at, updated_at은 제외됨"""
        from schemas.project import ProjectSummaryResponse

        resp = ProjectSummaryResponse.model_validate(
            {
                "code": "TESTC",
                "title": "Test",
                "summary": "Summary",
                "tags": ["web"],
                "tech_stack": ["Python", "Flask"],
                "order": 0,
                "is_public": True,
            }
        )
        dumped = resp.model_dump()
        assert dumped["tech_stack"] == ["Python", "Flask"]
        assert dumped["tags"] == ["web"]
        assert "portfolio_id" not in dumped
        assert "created_at" not in dumped
        assert "updated_at" not in dumped

    def test_tech_stack_default(self):
        """tech_stack 기본값은 빈 리스트"""
        from schemas.project import ProjectSummaryResponse

        resp = ProjectSummaryResponse.model_validate(
            {
                "code": "TESTC",
                "title": "Test",
                "summary": "Summary",
                "order": 0,
                "is_public": True,
            }
        )
        assert resp.tech_stack == []


class TestProjectResponse:
    def test_detail_fields_included(self):
        """ProjectResponse에 상세 필드가 포함됨"""
        from schemas.project import ProjectResponse

        now = datetime.now()
        resp = ProjectResponse.model_validate(
            {
                "id": 1,
                "portfolio_id": 2,
                "code": "TESTC",
                "title": "Test Project",
                "summary": "Test summary",
                "order": 0,
                "is_public": True,
                "description": "desc",
                "tech_stack": ["Python"],
                "tags": ["web"],
                "thumbnail_file_uuid": "abc00000000000000000000000000001",
                "screenshots": [],
                "links": [
                    {
                        "name": "github",
                        "url": "http://github.com",
                        "background_color": "#333",
                        "text_color": "#fff",
                        "icon": "github"
                    }
                ],
                "features": [],
                "created_at": now,
                "updated_at": now,
            }
        )
        assert resp.id == 1
        assert resp.portfolio_id == 2
        assert resp.title == "Test Project"
        assert resp.description == "desc"
        assert len(resp.links) == 1

    def test_optional_description(self):
        """description이 None이어도 유효"""
        from schemas.project import ProjectResponse

        now = datetime.now()
        resp = ProjectResponse.model_validate(
            {
                "id": 1,
                "portfolio_id": 2,
                "code": "TESTC",
                "title": "Test",
                "summary": "Summary",
                "order": 0,
                "is_public": True,
                "description": None,
                "created_at": now,
                "updated_at": now,
            }
        )
        assert resp.description is None

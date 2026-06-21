"""ORM 모델 CRUD, 관계, 캐스케이드 삭제 테스트."""
import pytest
from sqlalchemy.exc import IntegrityError

from models import User, Portfolio, Project, RevokedToken
from core.security import get_password_hash


# === User ===


class TestUserModel:
    def test_create(self, db_session):
        user = User(
            username="newuser",
            email="new@example.com",
            password_hash=get_password_hash("password"),
        )
        db_session.add(user)
        db_session.commit()
        assert user.id is not None
        assert user.created_at is not None

    def test_username_unique(self, db_session, test_user):
        dup = User(
            username=test_user.username,
            email="different@example.com",
            password_hash="hash",
        )
        db_session.add(dup)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_email_unique(self, db_session, test_user):
        dup = User(
            username="differentuser",
            email=test_user.email,
            password_hash="hash",
        )
        db_session.add(dup)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_portfolios_relationship(self, db_session, test_user, sample_portfolio):
        db_session.refresh(test_user)
        assert len(test_user.portfolios) >= 1
        assert test_user.portfolios[0].name == "Test Portfolio"


# === Portfolio ===


class TestPortfolioModel:
    def test_create(self, db_session, test_user):
        cat = Portfolio(
            user_id=test_user.id,
            code="MYCAT",
            name="My Portfolio",
            description="Description here",
            order=1,
        )
        db_session.add(cat)
        db_session.commit()
        assert cat.id is not None
        assert cat.code == "MYCAT"
        assert cat.is_public is True

    def test_user_relationship(self, db_session, sample_portfolio, test_user):
        assert sample_portfolio.user.id == test_user.id

    def test_items_relationship(self, db_session, sample_portfolio, sample_item):
        db_session.refresh(sample_portfolio)
        assert len(sample_portfolio.items) >= 1

    def test_nullable_file_uuid(self, db_session, test_user):
        cat = Portfolio(
            user_id=test_user.id,
            code="NOIMG",
            name="No Image",
            description="No image portfolio",
            order=0,
        )
        db_session.add(cat)
        db_session.commit()
        assert cat.file_uuid is None


# === Project ===


class TestProjectModel:
    def test_create(self, db_session, sample_portfolio):
        item = Project(
            portfolio_id=sample_portfolio.id,
            code="NEWIT",
            title="New Item",
            summary="A new item",
            tags=["tag1", "tag2"],
            order=1,
        )
        db_session.add(item)
        db_session.commit()
        assert item.id is not None
        assert item.is_public is True

    def test_portfolio_relationship(self, db_session, sample_item, sample_portfolio):
        assert sample_item.portfolio.id == sample_portfolio.id

    def test_json_tags_round_trip(self, db_session, sample_portfolio):
        item = Project(
            portfolio_id=sample_portfolio.id,
            code="TAGGED",
            title="Tagged",
            summary="Has tags",
            tags=["python", "fastapi", "sqlalchemy"],
            order=0,
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        assert item.tags == ["python", "fastapi", "sqlalchemy"]

    def test_detail_fields(self, db_session, sample_portfolio):
        """detail 필드가 포함된 아이템 생성 테스트"""
        item = Project(
            portfolio_id=sample_portfolio.id,
            code="DETAI",
            title="Detail Item",
            summary="Has detail",
            order=0,
            description="Full description",
            tech_stack=["Python", "FastAPI"],
            screenshots=[{"file_uuid": "abc00000000000000000000000000001", "caption": "Cap"}],
            links=[
                {
                    "name": "github",
                    "url": "https://github.com/test",
                    "background_color": "#333",
                    "text_color": "#fff",
                    "icon": "github"
                }
            ],
            start_date="2024-01",
            end_date="2024-06",
            features=["Feature 1", "Feature 2"],
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        assert item.description == "Full description"
        assert item.tech_stack == ["Python", "FastAPI"]
        assert len(item.screenshots) == 1
        assert item.screenshots[0]["caption"] == "Cap"
        assert len(item.links) == 1
        assert item.links[0]["url"] == "https://github.com/test"
        assert item.features == ["Feature 1", "Feature 2"]
        assert item.start_date == "2024-01"
        assert item.end_date == "2024-06"

    def test_detail_fields_optional(self, db_session, sample_portfolio):
        """detail 필드 없이 아이템 생성 가능"""
        item = Project(
            portfolio_id=sample_portfolio.id,
            code="NODET",
            title="No Detail",
            summary="No detail fields",
            order=0,
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        assert item.description is None
        assert item.start_date is None
        assert item.end_date is None


# === 캐스케이드 삭제 ===


class TestCascadeDeletes:
    def test_delete_user_cascades_to_portfolios(self, db_session):
        user = User(
            username="cascade_user",
            email="cascade@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()

        cat = Portfolio(
            user_id=user.id, code="CATCD", name="Cat", description="Desc", order=0
        )
        db_session.add(cat)
        db_session.commit()
        cat_id = cat.id

        db_session.delete(user)
        db_session.commit()
        assert db_session.query(Portfolio).filter_by(id=cat_id).first() is None

    def test_delete_portfolio_cascades_to_items(self, db_session, test_user):
        cat = Portfolio(
            user_id=test_user.id, code="TEMPC", name="TempCat", description="Temp", order=0
        )
        db_session.add(cat)
        db_session.commit()

        item = Project(
            portfolio_id=cat.id, code="TEMPI", title="TempItem", summary="Temp", order=0
        )
        db_session.add(item)
        db_session.commit()
        item_id = item.id

        db_session.delete(cat)
        db_session.commit()
        assert db_session.query(Project).filter_by(id=item_id).first() is None

    def test_full_cascade_user_to_items(self, db_session):
        """유저 삭제 시 카테고리와 아이템까지 캐스케이드 삭제"""
        user = User(
            username="fullcasc",
            email="fullcasc@example.com",
            password_hash=get_password_hash("pw"),
        )
        db_session.add(user)
        db_session.commit()

        cat = Portfolio(
            user_id=user.id, code="FCCAT", name="FC", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()

        item = Project(
            portfolio_id=cat.id, code="FCITM", title="FI", summary="S", order=0,
            description="Detail"
        )
        db_session.add(item)
        db_session.commit()

        item_id, cat_id = item.id, cat.id

        db_session.delete(user)
        db_session.commit()

        assert db_session.query(Portfolio).filter_by(id=cat_id).first() is None
        assert db_session.query(Project).filter_by(id=item_id).first() is None


# === RevokedToken ===


class TestRevokedTokenModel:
    def test_create(self, db_session):
        from datetime import datetime, timezone

        rt = RevokedToken(jti="abc-123-def", expired_at=datetime.now(timezone.utc))
        db_session.add(rt)
        db_session.commit()
        assert db_session.query(RevokedToken).filter_by(jti="abc-123-def").first() is not None

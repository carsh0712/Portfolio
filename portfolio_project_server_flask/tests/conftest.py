"""
테스트 중앙 픽스처.

database.py는 import 시 MySQL 연결을 시도하고 실패하면 sys.exit(1)을 호출한다.
이를 방지하기 위해 sys.modules["database"]를 SQLite 기반 fake 모듈로 교체한다.
이 코드는 모든 애플리케이션 모듈보다 먼저 실행되어야 한다.
"""
import sys
import types

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

# ──────────────────────────────────────────────
# 1. SQLite in-memory 엔진 생성
# ──────────────────────────────────────────────
TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(TEST_ENGINE, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)
TestBase = declarative_base()

# ──────────────────────────────────────────────
# 2. sys.modules["database"] 교체
# ──────────────────────────────────────────────
_fake_database = types.ModuleType("database")
_fake_database.engine = TEST_ENGINE
_fake_database.SessionLocal = TestSessionLocal
_fake_database.Base = TestBase
_fake_database.get_db = None  # fixture에서 설정

sys.modules["database"] = _fake_database

# ──────────────────────────────────────────────
# 3. 이제 애플리케이션 코드를 안전하게 import
# ──────────────────────────────────────────────
import pytest  # noqa: E402
from flask import g  # noqa: E402

from models import User, Portfolio, Project, UploadFile  # noqa: E402
from core.security import get_password_hash, create_access_token  # noqa: E402


# ──────────────────────────────────────────────
# 4. Fixtures
# ──────────────────────────────────────────────
@pytest.fixture(scope="session")
def setup_database():
    """세션 1회: 테이블 생성."""
    from models import Base  # models.py가 import한 Base == TestBase

    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def db_session(setup_database):
    """함수 단위 트랜잭션 세션."""
    session = TestSessionLocal()

    yield session

    session.rollback()
    for table in reversed(TestBase.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    session.close()


@pytest.fixture()
def test_user(db_session):
    """테스트 유저 (username=testuser, password=testpassword123)."""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=get_password_hash("testpassword123"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def other_user(db_session):
    """소유권 테스트용 다른 유저."""
    user = User(
        username="otheruser",
        email="other@example.com",
        password_hash=get_password_hash("otherpassword123"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def client(db_session, test_user):
    """
    Flask TestClient: DB + 인증 모두 오버라이드.
    보호된 CRUD 엔드포인트 테스트에 사용.
    """
    from app import create_app

    app = create_app()

    @app.before_request
    def override_db_and_user():
        g.db = db_session
        g.current_user = test_user

    # teardown에서 세션을 닫지 않도록 제거
    app.teardown_appcontext_funcs.clear()

    with app.test_client() as c:
        yield c


@pytest.fixture()
def auth_client(db_session):
    """
    Flask TestClient: DB만 오버라이드 (JWT 실제 검증).
    /auth/* 엔드포인트 테스트에 사용.
    """
    from app import create_app

    app = create_app()

    @app.before_request
    def override_db():
        g.db = db_session

    # teardown에서 세션을 닫지 않도록 제거
    app.teardown_appcontext_funcs.clear()

    with app.test_client() as c:
        yield c


@pytest.fixture()
def sample_portfolio(db_session, test_user):
    """test_user 소유의 샘플 포트폴리오."""
    portfolio = Portfolio(
        user_id=test_user.id,
        code="TESTC",
        name="Test Portfolio",
        description="A test portfolio",
        file_uuid=None,
        order=0,
    )
    db_session.add(portfolio)
    db_session.commit()
    db_session.refresh(portfolio)
    return portfolio


@pytest.fixture()
def sample_item(db_session, sample_portfolio):
    """sample_portfolio에 속한 샘플 아이템."""
    item = Project(
        portfolio_id=sample_portfolio.id,
        code="TESTITEM",
        title="Test Item",
        summary="A test project item",
        thumbnail_file_uuid=None,
        tags=["python", "fastapi"],
        order=0,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item


@pytest.fixture()
def sample_item_with_detail(db_session, sample_portfolio):
    """detail 필드가 포함된 샘플 아이템."""
    item = Project(
        portfolio_id=sample_portfolio.id,
        code="DETAILITEM",
        title="Detail Item",
        summary="A test project item with detail",
        thumbnail_file_uuid=None,
        tags=["python", "fastapi"],
        order=1,
        description="Detailed description",
        tech_stack=["Python", "FastAPI", "PostgreSQL"],
        screenshots=[{"file_uuid": "a0000000000000000000000000000001", "caption": "Image 1"}],
        links=[
            {
                "name": "github",
                "url": "https://github.com/example",
                "background_color": "#333",
                "text_color": "#fff",
                "icon": "github"
            },
            {
                "name": "demo",
                "url": "https://demo.example.com",
                "background_color": "#007bff",
                "text_color": "#fff",
                "icon": "globe"
            },
            {
                "name": "blog",
                "url": "https://blog.example.com/post",
                "background_color": "#28a745",
                "text_color": "#fff",
                "icon": "book"
            }
        ],
        start_date="2024-01",
        end_date="2024-06",
        features=["Feature 1", "Feature 2"],
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item

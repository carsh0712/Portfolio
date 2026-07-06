import uuid as _uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, JSON, Integer, ForeignKey, TIMESTAMP, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "user"
    __table_args__ = {
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci",
    }

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, default=utc_now)
    updated_at = Column(TIMESTAMP, default=utc_now, onupdate=utc_now)

    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")
    files = relationship("UploadFile", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    display_name = Column(String(100), nullable=False)
    headline = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_file_uuid = Column(String(32), ForeignKey("upload_file.uuid", ondelete="SET NULL"), nullable=True)
    links = Column(JSON, nullable=False, default=list)
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, default=utc_now)
    updated_at = Column(TIMESTAMP, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="profiles")
    portfolios = relationship("Portfolio", back_populates="profile")

    __table_args__ = (
        Index("idx_profile_user", "user_id"),
        Index("idx_profile_default", "user_id", "is_default"),
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )


class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(Integer, ForeignKey("profile.id", ondelete="SET NULL"), nullable=True)
    code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    file_uuid = Column(String(32), ForeignKey("upload_file.uuid", ondelete="SET NULL"), nullable=True)
    order = Column(Integer, nullable=False, default=0)
    is_public = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, default=utc_now)
    updated_at = Column(TIMESTAMP, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="portfolios")
    profile = relationship("Profile", back_populates="portfolios")
    items = relationship("Project", back_populates="portfolio", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_portfolio_user", "user_id"),
        Index("idx_portfolio_order", "user_id", "order"),
        UniqueConstraint("user_id", "code", name="uq_user_portfolio_code"),
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )


class Project(Base):
    __tablename__ = "project"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    summary = Column(String(500), nullable=False)
    thumbnail_file_uuid = Column(String(32), nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    order = Column(Integer, nullable=False, default=0)
    is_public = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, default=utc_now)
    updated_at = Column(TIMESTAMP, default=utc_now, onupdate=utc_now)

    description = Column(Text, nullable=True)
    tech_stack = Column(JSON, nullable=False, default=list)
    screenshots = Column(JSON, nullable=False, default=list)
    links = Column(JSON, nullable=False, default=list)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    features = Column(JSON, nullable=False, default=list)

    portfolio = relationship("Portfolio", back_populates="items")

    __table_args__ = (
        Index("idx_item_portfolio", "portfolio_id"),
        Index("idx_item_order", "portfolio_id", "order"),
        UniqueConstraint("portfolio_id", "code", name="uq_portfolio_item_code"),
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )


class UploadFile(Base):
    """업로드된 파일의 메타데이터를 저장하는 모델."""
    __tablename__ = "upload_file"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(32), nullable=False, unique=True, default=lambda: _uuid.uuid4().hex)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)
    upload_path = Column(String(500), nullable=False)
    created_at = Column(TIMESTAMP, default=utc_now)

    user = relationship("User", back_populates="files")

    __table_args__ = (
        Index("idx_upload_file_user", "user_id"),
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )


class CorsOrigin(Base):
    """서버 코드별 허용 CORS origin을 저장하는 모델."""
    __tablename__ = "cors_origin"

    id = Column(Integer, primary_key=True, autoincrement=True)
    server_code = Column(String(50), nullable=False)
    origin = Column(String(500), nullable=False)
    created_at = Column(TIMESTAMP, default=utc_now)

    __table_args__ = (
        Index("idx_cors_server_code", "server_code"),
        UniqueConstraint("server_code", "origin", name="uq_cors_server_origin"),
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )


class RevokedToken(Base):
    __tablename__ = "revoked_token"
    __table_args__ = {
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci",
    }

    jti = Column(String(36), primary_key=True)
    expired_at = Column(TIMESTAMP, nullable=False)
    revoked_at = Column(TIMESTAMP, default=utc_now)

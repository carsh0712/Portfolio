"""
데이터베이스 초기화 스크립트

모든 테이블을 삭제하고 models.py 기반으로 재생성한 뒤 시드 데이터를 입력합니다.

사용법:
    python scripts/reset_db.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from core.config import ENV
from database import engine, Base, MYSQL_DB

# models.py를 임포트해야 Base.metadata에 테이블 정보가 등록됨
import models  # noqa: F401

SQL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_data.sql")


def reset_db():
    print("=" * 50)
    print(f"  데이터베이스 초기화 [{ENV}]")
    print("=" * 50)

    # 1) 데이터베이스 캐릭터셋 설정
    print("\n[1/4] 데이터베이스 캐릭터셋 설정 중...")
    with engine.connect() as conn:
        conn.execute(text(
            f"ALTER DATABASE `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        ))
        conn.commit()
    print("       완료")

    # 2) 기존 테이블 전부 삭제 (FK 제약 무시)
    print("[2/4] 기존 테이블 삭제 중...")
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.commit()
    Base.metadata.drop_all(bind=engine)
    with engine.connect() as conn:
        # models.py에 없는 레거시 테이블도 삭제
        # models.py에 없는 레거시 테이블도 삭제
        conn.execute(text("DROP TABLE IF EXISTS portfolio_item_detail"))
        conn.execute(text("DROP TABLE IF EXISTS portfolio_item"))
        conn.execute(text("DROP TABLE IF EXISTS portfolio_category"))
        conn.execute(text("DROP TABLE IF EXISTS category"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        conn.commit()
    print("       완료")

    # 3) models.py 기준으로 테이블 재생성
    print("[3/4] 테이블 재생성 중...")
    Base.metadata.create_all(bind=engine)
    print("       완료")

    # 4) 시드 데이터 입력
    print("[4/4] 시드 데이터 입력 중...")
    with open(SQL_FILE, "r", encoding="utf-8") as f:
        sql_content = f.read()

    statements = []
    for stmt in sql_content.split(";"):
        cleaned = stmt.strip()
        lines = [
            line for line in cleaned.splitlines() if not line.strip().startswith("--")
        ]
        cleaned = "\n".join(lines).strip()
        if cleaned:
            statements.append(cleaned)

    with engine.connect() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
        conn.commit()

    print(f"       완료 ({len(statements)}개 쿼리 실행)")
    print("\n" + "=" * 50)
    print("  초기화 완료! (admin / admin123)")
    print("=" * 50)


if __name__ == "__main__":
    reset_db()

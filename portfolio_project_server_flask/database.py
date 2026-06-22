from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sys
import time

import core.config  # noqa: F401 — 환경별 .env 자동 로드
from core.logger import setup_logger

logger = setup_logger("database")

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "64306")
MYSQL_DB = os.getenv("MYSQL_DB", "portfolio")
MYSQL_USER = os.getenv("MYSQL_USER", "portfolio")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")

# DB 연결 재시도 설정
MAX_RETRIES = int(os.getenv("DB_MAX_RETRIES", "2"))  # 기본 2회 (총 2번 시도)
RETRY_DELAY = int(os.getenv("DB_RETRY_DELAY", "3"))  # 기본 3초 대기

if not MYSQL_PASSWORD:
    logger.error("MYSQL_PASSWORD 환경 변수가 설정되어 있지 않습니다. .env 파일 또는 실행 환경에 값을 지정하세요.")
    sys.exit(1)

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

logger.info(f"데이터베이스 설정 - HOST: {MYSQL_HOST}, PORT: {MYSQL_PORT}, DB: {MYSQL_DB}, USER: {MYSQL_USER}")
logger.info(f"데이터베이스 연결 URL: mysql+pymysql://{MYSQL_USER}:****@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}")
logger.info(f"DB 연결 재시도 설정 - 최대 시도: {MAX_RETRIES}회, 재시도 대기: {RETRY_DELAY}초")

# DB 연결 재시도 로직
engine = None
last_error = None

for attempt in range(1, MAX_RETRIES + 1):
    try:
        logger.info(f"[{attempt}/{MAX_RETRIES}] SQLAlchemy 엔진 생성 중...")
        engine = create_engine(DATABASE_URL, echo=True)
        logger.info(f"[{attempt}/{MAX_RETRIES}] SQLAlchemy 엔진 생성 완료, 연결 테스트 시작...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"✓ 데이터베이스 연결 성공: {MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB} (시도 {attempt}회)")
        break  # 연결 성공 시 루프 종료
    except Exception as e:
        last_error = e
        logger.warning(f"✗ [{attempt}/{MAX_RETRIES}] 데이터베이스 연결 실패: {type(e).__name__}: {e}")

        if attempt < MAX_RETRIES:
            logger.info(f"→ {RETRY_DELAY}초 후 재시도...")
            time.sleep(RETRY_DELAY)
        else:
            logger.error(f"✗ 최대 재시도 횟수({MAX_RETRIES}회) 초과. 데이터베이스 연결 실패")
            logger.error(f"최종 에러: {type(last_error).__name__}: {last_error}")
            sys.exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """DB 세션을 생성하여 반환한다."""
    return SessionLocal()

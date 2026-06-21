# Portfolio Project Server (FastAPI)

## 환경 설정

프로젝트는 환경별로 `.env` 파일을 분리하여 관리합니다.

| 파일 | 용도 |
|------|------|
| `.env.development` | 개발 환경 (기본값) |
| `.env.production` | 운영 환경 |

### 환경 판별 순서

1. `APP_ENV` 환경변수가 설정되어 있으면 해당 값을 사용 (`production` 또는 `development`)
2. 설정되어 있지 않으면 서버 호스트명으로 자동 판별

## 데이터베이스 초기화

`reset_db.py`는 모든 테이블을 삭제하고 재생성한 뒤 시드 데이터를 입력합니다.

```bash
# 기본 실행 (호스트명 자동 판별)
python scripts/reset_db.py

# 환경을 직접 지정하여 실행
# Linux / macOS
APP_ENV=development python scripts/reset_db.py
APP_ENV=production python scripts/reset_db.py

# Windows CMD
set APP_ENV=production && python scripts/reset_db.py

# Windows PowerShell
$env:APP_ENV="production"; python scripts/reset_db.py
```

> **참고:** `production` 환경에서는 실행 전 확인 프롬프트가 표시됩니다.

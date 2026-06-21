# Portfolio Project Server (Flask)

Flask 기반 Portfolio REST API 서버입니다. 인증, Portfolio, Project, 파일 업로드, 공개 조회 API를 제공합니다.

## 실행

```bash
pip install -r requirements.txt
python app.py
```

기본 포트는 `8000`입니다.

## Swagger 문서

개발 환경에서 실행하면 다음 URL을 사용할 수 있습니다.

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/apispec.json`

Swagger UI는 `APP_ENV=development`에서 활성화됩니다.

## 환경 설정

`core/config.py`는 `APP_ENV`에 따라 다음 순서로 환경 파일을 읽습니다.

- `APP_ENV=development`: `.env.development`
- `APP_ENV=production`: `.env.production`
- 위 파일이 없으면 `.env`

개발 환경 예시:

```env
APP_ENV=development
SERVER_CODE=PORTFOLIO_API

MYSQL_HOST=localhost
MYSQL_PORT=64306
MYSQL_DB=portfolio
MYSQL_USER=portfolio
MYSQL_PASSWORD=change-this-password

JWT_SECRET_KEY=change-this-to-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
DB_MAX_RETRIES=2
DB_RETRY_DELAY=3
```

## 데이터베이스 초기화

```bash
python scripts/reset_db.py
```

PowerShell에서 환경을 지정하려면 다음처럼 실행합니다.

```powershell
$env:APP_ENV="development"; python scripts/reset_db.py
```

## 테스트

```bash
pytest tests/ -v
```

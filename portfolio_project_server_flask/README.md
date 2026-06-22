# Portfolio Project Server (Flask)

Flask 기반 Portfolio REST API 서버입니다. 인증, Portfolio, Project, 파일 업로드, 공개 조회 API를 제공합니다.

## 실행

```bash
pip install -r requirements.txt
python app.py
```

기본 포트는 `8000`입니다.

클라이언트를 함께 제공하려면 먼저 Vite 앱을 빌드합니다.

```bash
cd ../portfolio_project_client_vite
npm install
npm run build
cd ../portfolio_project_server_flask
python app.py
```

`portfolio_project_client_vite/dist/index.html`이 있으면 `http://localhost:8000/`에서 빌드된 클라이언트를 제공합니다. API는 기존처럼 `/api/v1/*`, Swagger는 개발 환경에서 `/docs`를 사용합니다.

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
CLIENT_DIST_DIR=../portfolio_project_client_vite/dist
MAX_FILE_SIZE=10485760
DB_MAX_RETRIES=2
DB_RETRY_DELAY=3
```

## 운영 배포 전 환경 체크

프로젝트 루트에서 운영 환경 변수 누락 여부를 확인할 수 있습니다.

```bash
node scripts/check-production-env.mjs --cors-origin https://your-portfolio-domain.com
```

다른 환경 파일을 검사하려면 `--env-path`를 사용합니다.

```bash
node scripts/check-production-env.mjs \
  --env-path portfolio_project_server_flask/.env.production \
  --cors-origin https://your-portfolio-domain.com
```

체크 항목:

- DB: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`, `MYSQL_USER`, `MYSQL_PASSWORD`
- JWT: `JWT_SECRET_KEY`, `JWT_ALGORITHM`, 토큰 만료 시간
- 업로드/정적 파일: `UPLOAD_DIR`, `CLIENT_DIST_DIR`, `MAX_FILE_SIZE`
- 안정성: `DB_MAX_RETRIES`, `DB_RETRY_DELAY`
- CORS: 운영 공개 origin 지정 여부

검사 성공 시 `cors_origin` 테이블에 등록할 SQL을 함께 출력합니다.
`CLIENT_DIST_DIR`의 상대 경로는 `portfolio_project_server_flask` 디렉터리 기준으로 해석됩니다.

## 데이터베이스 초기화

```bash
python ../scripts/reset_db.py
```

PowerShell에서 환경을 지정하려면 다음처럼 실행합니다.

```powershell
$env:APP_ENV="development"; python ../scripts/reset_db.py
```

## 테스트

```bash
pytest tests/ -v
```

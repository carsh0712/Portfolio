# Portfolio

React와 Flask로 만든 포트폴리오 관리 웹 애플리케이션입니다. 사용자는 회원가입과 로그인 후 포트폴리오와 프로젝트를 등록, 수정, 조회할 수 있으며, 공개 API를 통해 외부 방문자가 포트폴리오를 확인할 수 있습니다.

## 주요 기능

- JWT 기반 회원가입, 로그인, 토큰 갱신, 로그아웃
- 사용자 프로필 관리
- 포트폴리오 및 프로젝트 CRUD
- 프로젝트 이미지 파일 업로드 및 공개 파일 조회
- 공개 포트폴리오/프로젝트 페이지 제공
- Flask REST API 및 개발 환경 Swagger 문서
- Vite 빌드 결과물을 Flask 서버에서 정적 파일로 제공

## 기술 스택

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Vitest, Playwright

### Backend

- Python
- Flask
- SQLAlchemy
- MySQL / PyMySQL
- Pydantic
- python-jose, passlib
- Flasgger
- Pillow
- Pytest

## 프로젝트 구조

```text
.
├── portfolio_project_client_vite/   # React + Vite 클라이언트
├── portfolio_project_server_flask/   # Flask API 서버
├── scripts/                          # 개발/운영 보조 스크립트
├── docs/                             # 문서
├── html/                             # 수동 공개용 HTML 리소스
├── package.json                      # 루트 개발 스크립트
└── README.md
```

## 사전 준비

- Node.js 20 이상 권장
- npm
- Python 3.11 이상 권장
- MySQL 8.x 또는 호환 DB

## 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd Portfolio
```

### 2. 프론트엔드 의존성 설치

```bash
npm install
npm --prefix portfolio_project_client_vite install
```

### 3. 백엔드 가상환경 및 의존성 설치

```bash
cd portfolio_project_server_flask
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

Windows PowerShell에서는 다음처럼 가상환경을 활성화합니다.

```powershell
cd portfolio_project_server_flask
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

## 설정 방법

### 1. 백엔드 환경 변수

백엔드 서버는 `APP_ENV` 값에 따라 `portfolio_project_server_flask` 디렉터리의 환경 파일을 읽습니다.

- `APP_ENV=development`: `.env.development`
- `APP_ENV=production`: `.env.production`
- 위 파일이 없으면 `.env`

개발 환경 예시는 다음과 같습니다.

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
MANUAL_PUBLIC=false
MAX_FILE_SIZE=10485760
DB_MAX_RETRIES=2
DB_RETRY_DELAY=3
DB_POOL_RECYCLE=1800
DB_SQL_ECHO=false
```

`MYSQL_PASSWORD`는 필수입니다. 값이 없으면 서버가 시작되지 않습니다.

### 2. 프론트엔드 환경 변수

프론트엔드는 `portfolio_project_client_vite/.env.development` 또는 `.env.production`에 API 서버 주소를 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8000
```

운영 빌드를 Flask 서버와 같은 origin에서 제공할 경우 비워둘 수 있습니다.

```env
VITE_API_BASE_URL=
```

### 3. 데이터베이스 준비

MySQL에 환경 변수와 동일한 데이터베이스와 계정을 준비합니다.

```sql
CREATE DATABASE portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portfolio'@'%' IDENTIFIED BY 'change-this-password';
GRANT ALL PRIVILEGES ON portfolio.* TO 'portfolio'@'%';
FLUSH PRIVILEGES;
```

기존 개발 DB를 초기화해야 하는 경우 루트에서 다음 스크립트를 실행합니다.

```bash
python scripts/reset_db.py
```

## 실행 방법

### 프론트엔드와 백엔드 동시 실행

루트에서 다음 명령을 실행합니다.

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/apispec.json`

Swagger 문서는 `APP_ENV=development`에서만 활성화됩니다.

### 프론트엔드만 실행

```bash
npm run dev:frontend
```

### 백엔드만 실행

```bash
npm run dev:backend
```

또는 백엔드 디렉터리에서 직접 실행할 수 있습니다.

```bash
cd portfolio_project_server_flask
python app.py
```

## 빌드

프론트엔드 운영 빌드는 다음 명령으로 생성합니다.

```bash
npm --prefix portfolio_project_client_vite run build
```

빌드 결과는 `portfolio_project_client_vite/dist`에 생성됩니다. Flask 서버는 `CLIENT_DIST_DIR` 경로에 `index.html`이 있으면 `http://localhost:8000/`에서 클라이언트 앱을 제공합니다.

## 테스트

### 프론트엔드 테스트

```bash
npm --prefix portfolio_project_client_vite run test
npm --prefix portfolio_project_client_vite run test:e2e
```

### 백엔드 테스트

```bash
cd portfolio_project_server_flask
pytest tests/ -v
```

## 운영 배포 전 점검

운영 환경 변수 누락 여부는 루트에서 다음 명령으로 확인할 수 있습니다.

```bash
npm run check:prod-env -- --cors-origin https://your-portfolio-domain.com
```

다른 환경 파일을 검사하려면 `--env-path`를 지정합니다.

```bash
npm run check:prod-env -- \
  --env-path portfolio_project_server_flask/.env.production \
  --cors-origin https://your-portfolio-domain.com
```

검사 성공 시 운영 CORS origin 등록에 사용할 SQL이 함께 출력됩니다.

## 참고

- 모든 소스와 환경 파일은 UTF-8 인코딩을 기준으로 사용합니다.
- `MANUAL_PUBLIC=true`를 설정하면 `/manual` 경로에서 `html` 디렉터리의 수동 문서를 공개합니다. 운영 환경에서는 필요한 경우에만 활성화하는 것을 권장합니다.

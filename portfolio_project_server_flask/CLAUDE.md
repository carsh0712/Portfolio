# CLAUDE.md

## 작업 규칙

### 코드 작성 규칙
- 주석과 docstring은 한글로 작성한다.
- 함수, 클래스의 docstring은 간결하고 명확하게 작성한다.

### 데이터베이스 모델 변경
- `models.py`에서 ORM 모델을 변경할 경우, 반드시 `../scripts/seed_data.sql`도 함께 업데이트한다.
- 새로운 컬럼 추가 시: INSERT 문에 해당 컬럼과 값을 추가
- 컬럼 삭제 시: INSERT 문에서 해당 컬럼을 제거
- 컬럼 이름 변경 시: INSERT 문에서 컬럼 이름을 변경

### Swagger UI 모델 동기화
- `schemas/` 디렉토리에서 Pydantic 스키마(request/response 모델)를 추가·수정·삭제할 경우, 반드시 `app.py`의 `swagger_template > definitions`도 함께 업데이트한다.
- 라우터 docstring에서 request/response 스키마를 변경할 경우, `$ref: '#/definitions/모델명'` 참조가 올바른지 확인한다.
- 새로운 스키마 추가 시: `definitions`에 해당 모델 정의를 추가하고, 라우터 docstring의 `schema`에 `$ref` 참조를 추가
- 스키마 필드 변경 시: `definitions`의 `properties`를 함께 수정
- 스키마 삭제 시: `definitions`에서 해당 모델을 제거하고, 라우터 docstring의 `$ref` 참조도 제거

### 테스트 필수
- 모든 기능 추가/수정 작업 시 반드시 해당 테스트를 먼저 작성하거나 기존 테스트를 업데이트한다.
- 작업 완료 후 `pytest tests/ -v` 를 실행하여 전체 테스트가 통과하는지 확인한다.
- 테스트 없이 코드를 완료한 것으로 간주하지 않는다.

### 테스트 구조
- 테스트 파일 위치: `tests/`
- 픽스처 및 DB 설정: `tests/conftest.py` (SQLite in-memory)
- 테스트 분류:
  - `test_schemas.py` — Pydantic 스키마 유효성
  - `test_security.py` — 인증/보안 함수
  - `test_models.py` — ORM 모델, 관계, 캐스케이드
  - `test_auth_api.py` — /auth/* 엔드포인트
  - `test_user_api.py` — /user/* 엔드포인트
  - `test_portfolio_api.py` — /portfolios/* 엔드포인트
  - `test_project_api.py` — /projects/* 엔드포인트
  - `test_project_detail_api.py` — /projects/item/* 엔드포인트

### 테스트 실행
```bash
# 전체 테스트
pytest tests/ -v

# 특정 파일
pytest tests/test_portfolio_api.py -v

# 커버리지
pytest tests/ --cov=. --cov-report=term-missing
```

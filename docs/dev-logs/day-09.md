# Day 9. 운영 DB 스키마와 모델 동기화 점검

## 시작하며

기능을 추가하다 보면 코드의 모델과 실제 DB 스키마가 조금씩 어긋날 수 있다. 특히 운영 DB에 직접 마이그레이션을 적용해야 하는 환경에서는 이 차이를 빨리 확인하는 것이 중요하다.

오늘은 SQLAlchemy 모델, 마이그레이션 SQL, 실제 DB 스키마를 비교했다.

## 오늘의 목표

- `models.py` 기준의 현재 스키마를 확인한다.
- 실제 DB에 필요한 테이블과 컬럼이 있는지 확인한다.
- 프로필 관련 마이그레이션이 반영되었는지 점검한다.
- FK, 인덱스, unique 제약을 확인한다.

## 추가된 주요 스키마

프로필 기능을 위해 `profile` 테이블이 추가되었다.

주요 컬럼은 다음과 같다.

- `user_id`
- `display_name`
- `email`
- `headline`
- `bio`
- `avatar_file_uuid`
- `links`
- `extra_fields`
- `is_default`

포트폴리오에는 `profile_id` 컬럼을 추가했다.

```text
portfolio.profile_id -> profile.id
```

프로필이 삭제되면 포트폴리오의 연결만 해제되도록 `ON DELETE SET NULL`을 사용했다.

## 실제 DB 점검

실제 DB에서 확인한 내용은 다음과 같다.

- `profile` 테이블 존재
- `portfolio.profile_id` 컬럼 존재
- `profile.user_id -> user.id` FK 존재
- `profile.avatar_file_uuid -> upload_file.uuid` FK 존재
- `portfolio.profile_id -> profile.id` FK 존재
- 프로필 관련 인덱스 존재
- 기존 포트폴리오/프로젝트/업로드 파일 제약 유지

즉, 프로필 관련 최신 스키마는 실제 DB에 반영되어 있었다.

## 발견한 차이

현재 연결된 DB는 MySQL 8이 아니라 MariaDB 10.11 계열로 확인되었다.

이 때문에 SQLAlchemy의 JSON 컬럼은 DB에서 `longtext`와 `json_valid(...)` 체크 제약으로 보였다. MariaDB에서는 자연스러운 표현 방식이라 기능상 문제로 보지는 않았다.

다만 `docker-compose.yml`은 `mysql:8.4`를 기준으로 되어 있으므로, 로컬 개발 DB와 운영 DB의 엔진 차이는 문서에 남겨둘 필요가 있다.

또 하나의 차이는 `revoked_token.expired_at`의 기본값이었다. 모델에서는 단순 `TIMESTAMP NOT NULL`에 가깝지만, 실제 DB에서는 `DEFAULT current_timestamp() ON UPDATE current_timestamp()` 형태로 보였다.

이 값은 토큰 만료 시각이므로 업데이트 시 자동 변경되는 것은 바람직하지 않을 수 있다. 당장 문제가 되는 흐름은 아니지만 정리 후보로 기록했다.

## 고민한 점

마이그레이션은 단순히 "컬럼을 추가했다"로 끝나지 않는다.

운영 DB에서는 이미 데이터가 있을 수 있고, 일부 컬럼만 적용된 중간 상태일 수도 있다. 그래서 마이그레이션 SQL은 가능한 한 idempotent하게 작성하는 것이 좋다.

이미 존재하면 건너뛰고, 없으면 추가하는 방식으로 구성하면 운영 반영 시 부담이 줄어든다.

## 오늘의 결과

현재 실제 DB는 최신 모델과 큰 틀에서 맞아 있었다.

프로필 테이블, 포트폴리오 연결 컬럼, FK, 인덱스 모두 확인했고, 남은 차이는 MariaDB 엔진 특성과 일부 timestamp 기본값 정도로 정리했다.

## 다음 작업

다음은 테스트와 안정화다. 기능이 늘어난 만큼 프론트와 백엔드 테스트를 통해 주요 흐름이 깨지지 않았는지 확인할 예정이다.

# Database Schema

포트폴리오 프로젝트의 데이터베이스 스키마 문서입니다.

## 테이블 구조

### user

사용자 정보를 저장하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 사용자 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 사용자명 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 |
| password_hash | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정 일시 |

### portfolio_category

포트폴리오 카테고리를 저장하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 카테고리 ID |
| user_id | INT | FOREIGN KEY (user.id), NOT NULL | 사용자 ID |
| name | VARCHAR(100) | NOT NULL | 카테고리명 |
| description | TEXT | NOT NULL | 카테고리 설명 |
| image_url | VARCHAR(255) | NULL | 카테고리 이미지 URL |
| order | INT | NOT NULL, DEFAULT 0 | 정렬 순서 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정 일시 |

**인덱스:**
- `idx_user_id` on `user_id`

**제약조건:**
- `FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE`

### portfolio_item

포트폴리오 아이템을 저장하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 아이템 ID |
| category_id | INT | FOREIGN KEY (portfolio_category.id), NOT NULL | 카테고리 ID |
| title | VARCHAR(200) | NOT NULL | 프로젝트 제목 |
| summary | TEXT | NOT NULL | 프로젝트 요약 |
| thumbnail_url | VARCHAR(255) | NULL | 썸네일 이미지 URL |
| tags | JSON | NOT NULL, DEFAULT '[]' | 태그 목록 (JSON 배열) |
| order | INT | NOT NULL, DEFAULT 0 | 정렬 순서 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정 일시 |

**인덱스:**
- `idx_category_id` on `category_id`

**제약조건:**
- `FOREIGN KEY (category_id) REFERENCES portfolio_category(id) ON DELETE CASCADE`

**JSON 컬럼 구조:**

- `tags`: 문자열 배열
  ```json
  ["Python", "FastAPI", "React"]
  ```

### portfolio_item_detail

포트폴리오 아이템의 상세 정보를 저장하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| item_id | INT | PRIMARY KEY, FOREIGN KEY (portfolio_item.id) | 아이템 ID |
| description | TEXT | NOT NULL | 프로젝트 상세 설명 |
| tech_stack | JSON | NOT NULL, DEFAULT '[]' | 기술 스택 목록 (JSON 배열) |
| screenshots | JSON | NOT NULL, DEFAULT '[]' | 스크린샷 목록 (JSON 배열) |
| links | JSON | NOT NULL, DEFAULT '[]' | 링크 목록 (JSON 배열) |
| start_date | VARCHAR(20) | NULL | 프로젝트 시작일 (YYYY-MM 형식) |
| end_date | VARCHAR(20) | NULL | 프로젝트 종료일 (YYYY-MM 형식) |
| features | JSON | NOT NULL, DEFAULT '[]' | 주요 기능 목록 (JSON 배열) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정 일시 |

**제약조건:**
- `FOREIGN KEY (item_id) REFERENCES portfolio_item(id) ON DELETE CASCADE`

**JSON 컬럼 구조:**

- `tech_stack`: 문자열 배열
  ```json
  ["React", "TypeScript", "Node.js", "Express", "MongoDB"]
  ```

- `screenshots`: 스크린샷 객체 배열
  ```json
  [
    {
      "url": "https://example.com/screenshot1.png",
      "caption": "메인 페이지"
    },
    {
      "url": "https://example.com/screenshot2.png",
      "caption": "관리자 대시보드"
    }
  ]
  ```

- `links`: 링크 객체 배열 (스타일링 정보 포함)
  ```json
  [
    {
      "name": "github",
      "url": "https://github.com/username/project",
      "background_color": "#181717",
      "text_color": "#ffffff",
      "icon": "github"
    },
    {
      "name": "demo",
      "url": "https://demo.example.com",
      "background_color": "#007bff",
      "text_color": "#ffffff",
      "icon": "globe"
    },
    {
      "name": "blog",
      "url": "https://blog.example.com/project-post",
      "background_color": "#28a745",
      "text_color": "#ffffff",
      "icon": "book"
    }
  ]
  ```

- `features`: 문자열 배열
  ```json
  [
    "JWT 기반 사용자 인증",
    "실시간 채팅 기능",
    "반응형 디자인",
    "다국어 지원"
  ]
  ```

## 관계도

```
user (1) ──< (N) portfolio_category
                     │
                     └──< (N) portfolio_item
                              │
                              └──< (1) portfolio_item_detail
```

## 주요 특징

### 캐스케이드 삭제
- 사용자 삭제 시 해당 사용자의 모든 카테고리가 삭제됩니다.
- 카테고리 삭제 시 해당 카테고리의 모든 아이템이 삭제됩니다.
- 아이템 삭제 시 해당 아이템의 상세 정보가 삭제됩니다.

### JSON 컬럼 사용
- 유연한 데이터 구조를 위해 `tags`, `tech_stack`, `screenshots`, `links`, `features` 필드는 JSON 타입을 사용합니다.
- MySQL 5.7.8 이상 또는 MariaDB 10.2.7 이상이 필요합니다.

### 날짜 형식
- `start_date`, `end_date`는 `YYYY-MM` 형식의 문자열로 저장됩니다. (예: `2024-01`, `2024-06`)

### 링크 스타일링
- `links` 배열의 각 링크는 `background_color`, `text_color`, `icon` 필드를 통해 UI 커스터마이징이 가능합니다.
- 색상은 HEX 형식 (`#RRGGBB`)을 사용합니다.
- `icon`은 프론트엔드에서 사용할 아이콘 이름을 저장합니다. (예: `github`, `globe`, `book`)

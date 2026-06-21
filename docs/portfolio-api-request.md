# Portfolio Item API Request 명세

## 0. 파일 업로드 (File Upload)

스크린샷 등 이미지 파일은 먼저 파일 업로드 API로 업로드한 뒤, 응답의 `id`를 포트폴리오 생성/수정 요청에 사용한다.

### Endpoint

```
POST /api/v1/files/upload
```

### Request

- **Content-Type**: `multipart/form-data`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | binary | O | 업로드할 파일 |

### Response (200)

```json
{
  "id": 1,
  "original_filename": "screenshot.png",
  "stored_filename": "abc123.png",
  "file_size": 204800,
  "content_type": "image/png",
  "created_at": "2026-01-30T12:10:15.412Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 파일 고유 ID (스크린샷 참조에 사용) |
| `original_filename` | string | 원본 파일명 |
| `stored_filename` | string | 서버 저장 파일명 |
| `file_size` | number | 파일 크기 (bytes) |
| `content_type` | string | MIME 타입 |
| `created_at` | string | 생성 시각 (ISO 8601) |

### Response (422) - Validation Error

```json
{
  "detail": [
    {
      "loc": ["string", 0],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

---

## 1. Portfolio Item 생성 (Create)

스크린샷은 사전에 파일 업로드 API로 업로드 후, 응답의 `id`(file_id)를 사용한다.

### Endpoint (예상)

```
POST /api/v1/portfolios/
```

### Request Body

```json
{
  "category_id": 1,
  "code": "my-project",
  "title": "프로젝트 제목",
  "summary": "프로젝트 요약",
  "description": "프로젝트 상세 설명",
  "tech_stack": ["React", "TypeScript"],
  "tags": ["frontend", "web"],
  "features": ["기능1", "기능2"],
  "screenshots": [
    {
      "file_id": 1,
      "caption": "메인 화면"
    }
  ],
  "thumbnail_index": 0,
  "links": [
    {
      "name": "GitHub",
      "url": "https://github.com/example",
      "backgroundColor": "#333333",
      "textColor": "#FFFFFF",
      "icon": "github"
    }
  ],
  "start_date": "2025-01-01",
  "end_date": "2025-06-01",
  "is_public": true
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `category_id` | number | O | 소속 카테고리 ID |
| `code` | string | O | URL용 고유 코드 (slug) |
| `title` | string | O | 프로젝트 제목 |
| `summary` | string | O | 짧은 요약 |
| `description` | string | O | 상세 설명 |
| `tech_stack` | string[] | O | 기술 스택 태그 목록 |
| `tags` | string[] | O | 일반 태그 목록 |
| `features` | string[] | O | 주요 기능 목록 |
| `screenshots` | Screenshot[] | X | 스크린샷 배열 |
| `thumbnail_index` | number | X | 대표 이미지로 사용할 스크린샷 인덱스 |
| `links` | ProjectLink[] | X | 외부 링크 배열 |
| `start_date` | string | X | 시작일 (YYYY-MM-DD) |
| `end_date` | string | X | 종료일 (YYYY-MM-DD) |
| `is_public` | boolean | O | 공개 여부 |

### 중첩 타입

#### Screenshot

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file_id` | number | O | 파일 업로드 API 응답의 `id` |
| `caption` | string | X | 캡션 |

#### ProjectLink

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | O | 링크 표시 이름 |
| `url` | string | O | URL |
| `backgroundColor` | string | X | 배경색 (hex) |
| `textColor` | string | X | 텍스트색 (hex) |
| `icon` | string | X | 아이콘 이름 |

---

## 2. Portfolio Item 수정 (Update)

### Endpoint (예상)

```
PUT /api/v1/portfolios/{portfolio_id}
```

### Request Body

생성과 동일한 구조. `category_id`는 변경하지 않는 경우 생략 가능.

```json
{
  "code": "my-project",
  "title": "수정된 제목",
  "summary": "수정된 요약",
  "description": "수정된 설명",
  "tech_stack": ["React", "TypeScript", "Vite"],
  "tags": ["frontend", "web"],
  "features": ["기능1", "기능2", "새 기능"],
  "screenshots": [
    {
      "file_id": 1,
      "caption": "메인 화면"
    },
    {
      "file_id": 3,
      "caption": "새로 추가한 스크린샷"
    }
  ],
  "thumbnail_index": 0,
  "links": [
    {
      "name": "GitHub",
      "url": "https://github.com/example",
      "backgroundColor": "#333333",
      "textColor": "#FFFFFF",
      "icon": "github"
    }
  ],
  "start_date": "2025-01-01",
  "end_date": "2025-06-01",
  "is_public": true
}
```

---

## 3. 플로우 요약

```
1. 사용자가 스크린샷 이미지 선택
2. POST /api/v1/files/upload → file_id 획득
3. 포트폴리오 생성/수정 시 screenshots[].file_id에 해당 ID 사용
4. POST 또는 PUT /api/v1/portfolio/item/
```

---

## 4. 클라이언트 코드 현황

- **생성**: [ProjectAdd.tsx:50-56](src/pages/ProjectAdd.tsx#L50-L56) - `handleSave`에서 `console.log`만 수행 (TODO)
- **수정**: [ProjectDetail.tsx:89-128](src/pages/ProjectDetail.tsx#L89-L128) - `handleSave`에서 `console.log`만 수행 (TODO)
- **API 유틸**: [api.ts](src/utils/api.ts) - 파일 업로드 / 생성 / 수정 API 함수 미구현
- **타입 정의**: [project.ts](src/types/project.ts) - `PortfolioItemDetail`, `Project`, `ProjectLink`, `Screenshot` 인터페이스 정의됨

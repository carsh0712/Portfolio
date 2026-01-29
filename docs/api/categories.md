# Categories API

카테고리 정보를 관리하는 API입니다.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

모든 API 요청은 Bearer 토큰 인증이 필요합니다.

```http
Authorization: Bearer <access_token>
```

## Endpoints

### GET /categories/

카테고리 목록을 조회합니다. 페이지네이션을 지원합니다.

#### Parameters

| Name      | Type    | In    | Required | Description                      |
|-----------|---------|-------|----------|----------------------------------|
| page      | integer | query | No       | 페이지 번호 (1부터 시작, 기본값: 1) |
| page_size | integer | query | No       | 페이지당 아이템 수 (최대 100, 기본값: 10) |

#### Request Example

```bash
curl -X GET "http://localhost:8000/api/v1/categories/?page=1&page_size=10" \
  -H "Authorization: Bearer <access_token>"
```

#### Response

**Status Code: 200 OK**

```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "name": "내가 만든 앱",
      "description": "직접 개발한 애플리케이션 프로젝트 모음",
      "image_url": "https://example.com/images/app.jpg",
      "order": 1,
      "created_at": "2026-01-29T09:50:38.362Z",
      "updated_at": "2026-01-29T09:50:38.362Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "name": "내가 깬 게임",
      "description": "클리어한 게임들의 기록",
      "image_url": "https://example.com/images/game.jpg",
      "order": 2,
      "created_at": "2026-01-29T09:50:38.362Z",
      "updated_at": "2026-01-29T09:50:38.362Z"
    },
    {
      "id": 3,
      "user_id": 1,
      "name": "내가 그린 그림",
      "description": "창작한 일러스트 및 디자인 작품",
      "image_url": "https://example.com/images/art.jpg",
      "order": 3,
      "created_at": "2026-01-29T09:50:38.362Z",
      "updated_at": "2026-01-29T09:50:38.362Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "page_size": 10,
    "total_pages": 1
  }
}
```

#### Response Schema

**CategoryListResponse**

| Field | Type   | Description           |
|-------|--------|-----------------------|
| items | Array  | 카테고리 배열          |
| meta  | Object | 페이지네이션 메타 정보 |

**Category (items의 각 요소)**

| Field       | Type    | Description                    |
|-------------|---------|--------------------------------|
| id          | integer | 카테고리 ID                     |
| user_id     | integer | 사용자 ID                       |
| name        | string  | 카테고리 이름                   |
| description | string  | 카테고리 설명                   |
| image_url   | string  | 카테고리 이미지 URL             |
| order       | integer | 정렬 순서 (낮을수록 먼저 표시)  |
| created_at  | string  | 생성 일시 (ISO 8601 형식)       |
| updated_at  | string  | 수정 일시 (ISO 8601 형식)       |

**PaginationMeta (meta)**

| Field       | Type    | Description        |
|-------------|---------|--------------------|
| total       | integer | 전체 아이템 수      |
| page        | integer | 현재 페이지 번호    |
| page_size   | integer | 페이지당 아이템 수  |
| total_pages | integer | 전체 페이지 수      |

#### Error Responses

**401 Unauthorized**

인증되지 않은 요청입니다.

```json
{
  "detail": "Not authenticated"
}
```

**422 Validation Error**

요청 파라미터가 유효하지 않습니다.

```json
{
  "detail": [
    {
      "loc": ["query", "page"],
      "msg": "ensure this value is greater than or equal to 1",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

## 프론트엔드 구현

### API 클라이언트

`src/utils/api.ts`에 정의된 `getCategories` 함수를 사용하여 카테고리 목록을 조회합니다.

```typescript
import { getCategories } from '../utils/api';

// 사용 예시
const fetchCategories = async () => {
  try {
    const response = await getCategories(1, 10);
    console.log(response.items); // 카테고리 배열
    console.log(response.meta);  // 페이지네이션 정보
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};
```

### 타입 정의

`src/types/category.ts`에 정의된 타입을 사용합니다.

```typescript
import type { Category, CategoryListResponse } from '../types/category';
```

### 컴포넌트 사용

`src/pages/CategoryList.tsx`에서 카테고리 목록을 카드 형태로 표시합니다.

특징:
- API 호출을 통한 동적 데이터 로딩
- 로딩 상태 표시
- 에러 처리
- 페이지네이션 지원
- 카테고리 카드 클릭 시 상세 페이지로 이동

## 목 데이터

개발 및 테스트용 목 데이터:
- "내가 만든 앱" - 직접 개발한 애플리케이션 프로젝트 모음
- "내가 깬 게임" - 클리어한 게임들의 기록
- "내가 그린 그림" - 창작한 일러스트 및 디자인 작품

## 참고사항

- 카테고리는 `order` 필드를 기준으로 오름차순 정렬됩니다.
- 인증되지 않은 요청은 로그인 페이지로 리다이렉트됩니다.
- 페이지당 최대 100개의 아이템을 조회할 수 있습니다.

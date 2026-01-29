# Portfolio API 문서

## 개요

Portfolio API는 포트폴리오 프로젝트 목록을 관리하는 RESTful API입니다.

## Base URL

```
http://localhost:8000/api/v1
```

## 인증

모든 API 요청은 JWT 토큰을 사용한 Bearer 인증이 필요합니다.

```http
Authorization: Bearer {access_token}
```

## Endpoints

### GET /portfolios/

카테고리별 포트폴리오 목록을 조회합니다.

#### Parameters

| Name | Type | Required | Description | Default | Constraints |
|------|------|----------|-------------|---------|-------------|
| `category_id` | integer | Yes | 카테고리 ID | - | - |
| `page` | integer | No | 페이지 번호 (1부터 시작) | 1 | minimum: 1 |
| `page_size` | integer | No | 페이지당 아이템 수 | 10 | minimum: 1, maximum: 100 |

#### Request Example

```bash
GET /api/v1/portfolios/?category_id=1&page=1&page_size=10
```

#### Response

**Status Code:** `200 OK`

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": 1,
      "category_id": 1,
      "title": "프로젝트 제목",
      "summary": "프로젝트 요약 설명",
      "thumbnail_url": "https://example.com/thumbnail.jpg",
      "tags": ["React", "TypeScript", "Vite"],
      "order": 1,
      "created_at": "2026-01-29T10:01:15.159Z",
      "updated_at": "2026-01-29T10:01:15.159Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "page_size": 10,
    "total_pages": 3
  }
}
```

#### Response Schema

##### PortfolioItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | 포트폴리오 고유 ID |
| `category_id` | integer | 카테고리 ID |
| `title` | string | 프로젝트 제목 |
| `summary` | string | 프로젝트 요약 설명 |
| `thumbnail_url` | string | 썸네일 이미지 URL |
| `tags` | array[string] | 프로젝트 태그 목록 (기술 스택, 키워드 등) |
| `order` | integer | 정렬 순서 |
| `created_at` | string (ISO 8601) | 생성 일시 |
| `updated_at` | string (ISO 8601) | 수정 일시 |

##### PaginationMeta

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | 전체 아이템 수 |
| `page` | integer | 현재 페이지 번호 |
| `page_size` | integer | 페이지당 아이템 수 |
| `total_pages` | integer | 전체 페이지 수 |

#### Error Responses

**422 Unprocessable Entity** - 유효하지 않은 파라미터

```json
{
  "detail": [
    {
      "loc": ["query", "category_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**401 Unauthorized** - 인증 실패

```json
{
  "detail": "Could not validate credentials"
}
```

## 프론트엔드 통합

### TypeScript 타입 정의

```typescript
// src/types/project.ts

export interface PortfolioItem {
  id: number;
  category_id: number;
  title: string;
  summary: string;
  thumbnail_url: string;
  tags: string[];
  order: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PortfolioListResponse {
  items: PortfolioItem[];
  meta: PaginationMeta;
}
```

### API 호출 함수

```typescript
// src/utils/api.ts

import type { PortfolioListResponse } from '../types/project';

export async function getPortfolios(
  categoryId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PortfolioListResponse> {
  const response = await apiFetch(
    `/api/v1/portfolios/?category_id=${categoryId}&page=${page}&page_size=${pageSize}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolios: ${response.statusText}`);
  }

  return response.json();
}
```

### 사용 예시

```typescript
// src/pages/ProjectList.tsx

import { useEffect, useState } from 'react';
import { getPortfolios } from '../utils/api';
import type { PortfolioItem } from '../types/project';

function ProjectList() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPortfolios(1, 1, 10);
        setPortfolios(response.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : '에러 발생');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      {portfolios.map((item) => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <img src={item.thumbnail_url} alt={item.title} />
          <div>
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 참고 사항

1. **페이지네이션**: 기본 페이지 크기는 10이며, 최대 100까지 설정 가능합니다.
2. **인증**: 모든 요청은 유효한 JWT 토큰이 필요합니다.
3. **에러 처리**: 401 에러 시 자동으로 로그인 페이지로 리다이렉트됩니다. ([src/utils/api.ts:35](src/utils/api.ts#L35))
4. **타입 변환**: API의 `PortfolioItem`을 프론트엔드의 `Project` 타입으로 변환하는 헬퍼 함수를 사용합니다. ([src/pages/ProjectList.tsx:10](src/pages/ProjectList.tsx#L10))

## 관련 파일

- [src/types/project.ts](src/types/project.ts) - 타입 정의
- [src/utils/api.ts](src/utils/api.ts) - API 서비스 함수
- [src/pages/ProjectList.tsx](src/pages/ProjectList.tsx) - 사용 예시

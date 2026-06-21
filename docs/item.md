# Portfolio Item Detail API

포트폴리오 아이템의 상세 정보를 조회하는 API 문서입니다.

## Endpoint

### GET /api/v1/portfolio/item/{item_id}

특정 포트폴리오 아이템의 상세 정보를 조회합니다.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| item_id | integer | Yes | 조회할 포트폴리오 아이템 ID |

#### Example Request

```http
GET /api/v1/portfolio/item/1 HTTP/1.1
Host: localhost:8000
Authorization: Bearer {access_token}
```

#### Response

##### 200 OK - Successful Response

포트폴리오 아이템의 모든 상세 정보를 반환합니다.

**Response Schema:**

```json
{
  "id": "string",
  "categoryId": "string",
  "title": "string",
  "summary": "string",
  "description": "string",
  "techStack": ["string"],
  "tags": ["string"],
  "imageUrl": "string",
  "screenshots": [
    {
      "url": "string",
      "caption": "string"
    }
  ],
  "links": [
    {
      "name": "string",
      "url": "string",
      "backgroundColor": "string",
      "textColor": "string",
      "icon": "string"
    }
  ],
  "startDate": "string",
  "endDate": "string",
  "features": ["string"],
  "createdAt": "2026-01-29T12:34:15.476Z",
  "updatedAt": "2026-01-29T12:34:15.476Z"
}
```

**Response Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | 포트폴리오 아이템 ID |
| categoryId | string | Yes | 카테고리 ID |
| title | string | Yes | 프로젝트 제목 |
| summary | string | Yes | 프로젝트 요약 설명 |
| description | string | Yes | 프로젝트 상세 설명 |
| techStack | array[string] | Yes | 기술 스택 목록 |
| tags | array[string] | Yes | 태그 목록 |
| imageUrl | string | No | 대표 이미지 URL |
| screenshots | array[object] | No | 스크린샷 목록 |
| screenshots[].url | string | Yes | 스크린샷 이미지 URL |
| screenshots[].caption | string | No | 스크린샷 설명 |
| links | array[object] | No | 관련 링크 목록 |
| links[].name | string | Yes | 링크 이름 (예: "GitHub", "Demo", "Download") |
| links[].url | string | Yes | 링크 URL |
| links[].backgroundColor | string | No | 버튼 배경색 (예: "#1f2937") |
| links[].textColor | string | No | 버튼 텍스트 색상 (예: "#ffffff") |
| links[].icon | string | No | 아이콘 이름 또는 SVG |
| startDate | string | Yes | 프로젝트 시작일 (ISO 8601) |
| endDate | string | No | 프로젝트 종료일 (ISO 8601) |
| features | array[string] | Yes | 주요 기능 목록 |
| createdAt | string | Yes | 생성 일시 (ISO 8601) |
| updatedAt | string | Yes | 수정 일시 (ISO 8601) |

**Example Response:**

```json
{
  "id": "1",
  "categoryId": "cat-apps",
  "title": "E-Commerce Platform",
  "summary": "React와 Node.js로 구축한 풀스택 쇼핑몰 플랫폼",
  "description": "사용자 인증, 상품 관리, 장바구니, 결제 시스템을 포함한 완전한 이커머스 솔루션입니다. Redux를 활용한 상태 관리와 Stripe API를 통한 결제 처리를 구현했습니다.",
  "techStack": ["React", "TypeScript", "Node.js", "Express", "MongoDB", "Redux", "Stripe API"],
  "tags": ["Web", "Full-Stack", "E-Commerce"],
  "imageUrl": "/images/ecommerce.png",
  "screenshots": [
    {
      "url": "https://placehold.co/800x600/3b82f6/white?text=메인+페이지",
      "caption": "메인 페이지"
    },
    {
      "url": "https://placehold.co/800x600/10b981/white?text=상품+목록",
      "caption": "상품 목록"
    }
  ],
  "links": [
    {
      "name": "GitHub",
      "url": "https://github.com/username/ecommerce",
      "backgroundColor": "#1f2937",
      "textColor": "#ffffff",
      "icon": "github"
    },
    {
      "name": "Live Demo",
      "url": "https://ecommerce-demo.com",
      "backgroundColor": "#3b82f6",
      "textColor": "#ffffff",
      "icon": "external-link"
    },
    {
      "name": "개발 일지",
      "url": "https://blog.example.com/ecommerce-dev-log",
      "backgroundColor": "#f59e0b",
      "textColor": "#ffffff",
      "icon": "book"
    }
  ],
  "startDate": "2024-01",
  "endDate": "2024-06",
  "features": [
    "JWT 기반 사용자 인증",
    "상품 검색 및 필터링",
    "실시간 장바구니 업데이트",
    "Stripe 결제 연동",
    "주문 내역 관리",
    "관리자 대시보드"
  ],
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-29T12:34:15.476Z"
}
```

##### 422 Unprocessable Entity - Validation Error

요청 파라미터가 유효하지 않을 때 반환됩니다.

**Error Response Schema:**

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

**Example Error Response:**

```json
{
  "detail": [
    {
      "loc": ["path", "item_id"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

##### 404 Not Found - Item Not Found

존재하지 않는 item_id를 요청했을 때 반환됩니다.

```json
{
  "detail": "Portfolio item not found"
}
```

## Frontend Integration

### TypeScript Type Definition

```typescript
// src/types/project.ts

export interface Screenshot {
  url: string;
  caption?: string;
}

export interface ProjectLink {
  name: string;
  url: string;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
}

export interface PortfolioItemDetail {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  description: string;
  techStack: string[];
  tags: string[];
  imageUrl?: string;
  screenshots?: Screenshot[];
  links?: ProjectLink[];
  startDate: string;
  endDate?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}
```

### API Service Function

```typescript
// src/utils/api.ts

export async function getPortfolioItemDetail(itemId: number): Promise<PortfolioItemDetail> {
  const response = await apiFetch(`/api/v1/portfolio/item/${itemId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio item: ${response.statusText}`);
  }

  return response.json();
}
```

### Usage Example

```typescript
// src/pages/ProjectDetail.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPortfolioItemDetail } from '../utils/api';
import type { PortfolioItemDetail } from '../types/project';

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<PortfolioItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPortfolioItemDetail(Number(id));
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) return <div>Not found</div>;

  return (
    <div>
      <h1>{project.title}</h1>
      <p>{project.summary}</p>
      <div>{project.description}</div>

      {/* Tech Stack */}
      <div>
        {project.techStack.map((tech) => (
          <span key={tech}>{tech}</span>
        ))}
      </div>

      {/* Links */}
      <div>
        {project.links?.map((link) => (
          <a
            key={link.name}
            href={link.url}
            style={{
              backgroundColor: link.backgroundColor,
              color: link.textColor
            }}
          >
            {link.name}
          </a>
        ))}
      </div>

      {/* Screenshots */}
      <div>
        {project.screenshots?.map((screenshot, index) => (
          <div key={index}>
            <img src={screenshot.url} alt={screenshot.caption} />
            {screenshot.caption && <p>{screenshot.caption}</p>}
          </div>
        ))}
      </div>

      {/* Features */}
      <ul>
        {project.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Notes

- **인증 필수**: Authorization 헤더에 Bearer 토큰을 포함해야 합니다.
- **ID 형식**: item_id는 양의 정수여야 합니다.
- **응답 구조 변경**: 이전 버전에서는 별도의 목록 API와 상세 API를 조합해야 했지만, 현재 버전은 단일 API로 모든 정보를 제공합니다.
- **Links 필드**: 여러 종류의 링크를 지원하며, 각 링크에 대한 스타일링 정보(배경색, 텍스트 색상, 아이콘)를 포함할 수 있습니다.
- **Screenshots**: URL과 선택적 caption을 포함하는 객체 배열입니다.

## Related APIs

- [GET /api/v1/portfolios/](./portfolio.md) - 포트폴리오 목록 조회
- [GET /api/v1/categories/](./category.md) - 카테고리 목록 조회

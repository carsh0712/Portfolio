# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

소프트웨어 개발 프로젝트를 전시하는 포트폴리오 사이트. React + TypeScript + Vite 기반.

## Commands

```bash
npm run dev       # 개발 서버 실행 (http://localhost:5173)
npm run build     # TypeScript 컴파일 + 프로덕션 빌드
npm run lint      # ESLint + Prettier 검사
npm run lint:fix  # 자동 수정
npm run format    # Prettier로 전체 포맷팅
npm run preview   # 프로덕션 빌드 미리보기
```

## Architecture

### Tech Stack
- **Vite** - 빌드 도구 (SWC 기반 React 플러그인)
- **React 19** + **TypeScript**
- **React Router** - 클라이언트 사이드 라우팅
- **Tailwind CSS v4** - Vite 플러그인 방식 (`@tailwindcss/vite`)

### Structure
```
src/
├── data/projects.json    # 프로젝트 데이터 (새 프로젝트 추가 시 여기 수정)
├── types/project.ts      # Project 인터페이스 정의
├── components/           # 재사용 컴포넌트
├── pages/                # 라우트별 페이지 컴포넌트
└── App.tsx               # 라우팅 설정
```

### Routes
- `/` - 프로젝트 목록 (ProjectList)
- `/project/:id` - 프로젝트 상세 (ProjectDetail)

### Data Flow
프로젝트 데이터는 `src/data/projects.json`에서 정적으로 import하여 사용. 새 프로젝트 추가 시 JSON 파일에 객체 추가.

## Code Style
- ESLint + Prettier 통합 설정
- 세미콜론 사용, 싱글쿼트, 100자 줄 길이
- 저장 시 자동 포맷팅 권장

## After Code Changes

코드 수정 후 반드시 아래 명령어로 검사:

```bash
npm run lint        # 문법/포맷 검사
npm run lint:fix    # 자동 수정
npm run format      # Prettier로 전체 포맷팅
```

## Testing

코드 수정 후 반드시 테스트를 실행하여 기능이 정상적으로 동작하는지 확인해야 합니다.

### 테스트 환경
- **Vitest** - 유닛 테스트 및 API 테스트
- **React Testing Library** - 컴포넌트 테스트
- **MSW (Mock Service Worker)** - API 모킹
- **Playwright** - E2E 테스트

### 테스트 명령어

#### 1. 유닛 테스트 (Unit Tests)
컴포넌트, 함수, hooks 등의 단위 테스트:

```bash
npm run test              # Vitest 실행 (watch 모드)
npm run test:ui           # Vitest UI로 실행
npm run test:coverage     # 코드 커버리지 포함 실행
```

**테스트 파일 위치**: `src/**/*.test.tsx` 또는 `src/**/*.test.ts`

#### 2. API 테스트 (Integration Tests)
API 호출 로직 및 데이터 fetch 테스트 (MSW를 사용한 API 모킹):

```bash
npm run test              # 유닛 테스트와 동일한 명령어 사용
```

**테스트 파일 위치**: `src/test/examples/api.test.ts`

#### 3. E2E 테스트 (End-to-End Tests)
실제 브라우저에서 사용자 플로우 테스트:

```bash
npm run test:e2e          # Playwright E2E 테스트 실행
npm run test:e2e:ui       # Playwright UI 모드로 실행
```

**테스트 파일 위치**: `e2e/**/*.spec.ts`

### 테스트 작성 가이드

#### 유닛 테스트 예시
```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### API 테스트 예시
```typescript
// src/test/examples/api.test.ts
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('API Test', () => {
  it('should fetch data successfully', async () => {
    server.use(
      http.get('*/api/data', () => {
        return HttpResponse.json({ data: 'test' });
      })
    );

    const response = await fetch('/api/data');
    const data = await response.json();
    expect(data.data).toBe('test');
  });
});
```

#### E2E 테스트 예시
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*home/);
});
```

### 테스트 실행 순서

코드 수정 후 아래 순서로 테스트를 실행하는 것을 권장합니다:

1. **Lint 검사**: `npm run lint`
2. **유닛 테스트**: `npm run test` (Ctrl+C로 중지)
3. **E2E 테스트**: `npm run test:e2e`
4. **빌드 확인**: `npm run build`

### 테스트 파일 구조
```
src/
├── test/
│   ├── setup.ts              # Vitest 전역 설정
│   ├── utils.tsx             # 테스트 유틸리티 (custom render)
│   ├── mocks/
│   │   ├── handlers.ts       # MSW 핸들러
│   │   └── server.ts         # MSW 서버 설정
│   └── examples/
│       └── api.test.ts       # API 테스트 예시
├── components/
│   └── *.test.tsx            # 컴포넌트 테스트
e2e/
└── *.spec.ts                 # E2E 테스트
```

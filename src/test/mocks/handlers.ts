import { http, HttpResponse } from 'msw';

// API 요청을 모킹하기 위한 핸들러 정의
export const handlers = [
  // 예시: GET /api/projects
  http.get('/api/projects', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        tags: ['React', 'TypeScript'],
      },
    ]);
  }),

  // 필요한 다른 API 엔드포인트 추가
];

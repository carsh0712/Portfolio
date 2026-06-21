import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('API 테스트 예시', () => {
  describe('Login API', () => {
    it('로그인이 성공적으로 수행되어야 한다', async () => {
      // MSW를 사용하여 API 응답 모킹
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            token_type: 'Bearer',
          });
        })
      );

      // API 호출
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.access_token).toBe('mock-access-token');
      expect(data.refresh_token).toBe('mock-refresh-token');
      expect(data.token_type).toBe('Bearer');
    });

    it('잘못된 인증 정보로 로그인 시 실패해야 한다', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json(
            { detail: '이메일 또는 비밀번호가 올바르지 않습니다.' },
            { status: 401 }
          );
        })
      );

      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'wrong@example.com', password: 'wrongpass' }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.detail).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    });
  });

  describe('Projects API', () => {
    beforeEach(() => {
      // 각 테스트 전에 핸들러 리셋
      server.resetHandlers();
    });

    it('프로젝트 목록을 가져와야 한다', async () => {
      server.use(
        http.get('*/api/projects', () => {
          return HttpResponse.json([
            {
              id: '1',
              title: 'Project 1',
              description: 'Description 1',
              tags: ['React', 'TypeScript'],
            },
            {
              id: '2',
              title: 'Project 2',
              description: 'Description 2',
              tags: ['Vue', 'JavaScript'],
            },
          ]);
        })
      );

      const response = await fetch('http://localhost:3000/api/projects');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('Project 1');
      expect(data[1].title).toBe('Project 2');
    });
  });
});

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// MSW 서버 시작
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// 각 테스트 후 자동으로 cleanup 및 핸들러 리셋
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// MSW 서버 종료
afterAll(() => {
  server.close();
});

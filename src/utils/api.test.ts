import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import {
  getCurrentUser,
  getCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  getPortfolios,
  getPortfolioDetail,
  createProject,
  updatePortfolio,
  getPublicPortfolios,
  getPublicProjectDetail,
  getPublicFileUrl,
  API_BASE_URL,
} from './api';

describe('API 유틸리티', () => {
  beforeEach(() => {
    localStorage.clear();
    // 인증 토큰 설정
    localStorage.setItem(
      'auth_tokens',
      JSON.stringify({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
      })
    );
  });

  describe('getCurrentUser', () => {
    it('현재 사용자 정보를 가져와야 한다', async () => {
      const user = await getCurrentUser();
      expect(user.id).toBe(1);
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('요청 실패 시 에러를 throw해야 한다', async () => {
      server.use(
        http.get('*/api/v1/user/me', () => {
          return HttpResponse.json(null, { status: 500 });
        })
      );
      await expect(getCurrentUser()).rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('카테고리 목록을 가져와야 한다', async () => {
      server.use(
        http.get('*/api/v1/portfolios/', () => {
          return HttpResponse.json({
            items: [
              {
                id: 1,
                user_id: 1,
                code: 'web',
                name: 'Web Projects',
                description: 'Web development projects',
                screenshot: { file_uuid: 'mock-uuid-1' },
                order: 1,
                is_public: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            meta: { total: 1, page: 1, page_size: 10, total_pages: 1 },
          });
        })
      );
      const result = await getCategories();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Web Projects');
      expect(result.meta.total).toBe(1);
    });

    it('페이지네이션 파라미터를 전달할 수 있어야 한다', async () => {
      const result = await getCategories(2, 5);
      expect(result.items).toBeDefined();
    });
  });

  describe('getCategoryDetail', () => {
    it('코드로 카테고리 상세를 가져와야 한다', async () => {
      const result = await getCategoryDetail('web');
      expect(result.id).toBe(1);
      expect(result.code).toBe('web');
      expect(result.name).toBe('Web Projects');
    });

    it('존재하지 않는 코드일 때 에러를 throw해야 한다', async () => {
      await expect(getCategoryDetail('nonexistent')).rejects.toThrow();
    });
  });

  describe('createCategory', () => {
    it('카테고리를 생성해야 한다', async () => {
      const result = await createCategory({
        code: 'web',
        name: 'Web Projects',
        description: 'Web development projects',
        screenshot_file_uuid: 'mock-uuid-1',
        order: 1,
        is_public: true,
      });
      expect(result.code).toBe('web');
    });

    it('생성 실패 시 에러 메시지를 포함해야 한다', async () => {
      server.use(
        http.post('*/api/v1/portfolios/', () => {
          return HttpResponse.json({ detail: '이미 존재하는 코드입니다.' }, { status: 400 });
        })
      );
      await expect(
        createCategory({
          code: 'web',
          name: 'Web',
          description: '',
          screenshot_file_uuid: null,
          order: 1,
          is_public: true,
        })
      ).rejects.toThrow('이미 존재하는 코드입니다.');
    });
  });

  describe('updateCategory', () => {
    it('코드로 카테고리를 업데이트해야 한다', async () => {
      const result = await updateCategory('web', {
        code: 'web',
        name: 'Updated Web Projects',
        description: 'Updated',
        screenshot_file_uuid: null,
        order: 1,
        is_public: true,
      });
      expect(result.id).toBe(1);
    });
  });

  describe('deleteCategory', () => {
    it('코드로 카테고리를 삭제해야 한다', async () => {
      await expect(deleteCategory('web')).resolves.toBeUndefined();
    });

    it('존재하지 않는 코드일 때 에러를 throw해야 한다', async () => {
      await expect(deleteCategory('nonexistent')).rejects.toThrow();
    });
  });

  describe('getPortfolios', () => {
    it('포트폴리오 목록을 가져와야 한다', async () => {
      const result = await getPortfolios('test-category');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Project');
    });

    it('search 파라미터로 필터링해야 한다', async () => {
      const result = await getPortfolios('test-category', 1, 10, 'React');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tech_stack).toContain('React');
    });

    it('존재하지 않는 search로 필터링하면 빈 목록을 반환해야 한다', async () => {
      const result = await getPortfolios('test-category', 1, 10, 'NonExistentTag');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getPortfolioDetail', () => {
    it('포트폴리오 상세를 가져와야 한다', async () => {
      const result = await getPortfolioDetail('test-category', 'test-project');
      expect(result.title).toBe('Test Project');
      expect(result.tech_stack).toContain('React');
    });
  });

  describe('updatePortfolio', () => {
    it('포트폴리오를 수정해야 한다', async () => {
      const result = await updatePortfolio('test-category', 'test-project', {
        portfolio_id: 1,
        code: 'updated-project',
        title: 'Updated Project',
        summary: 'Updated summary',
        thumbnail: { file_uuid: 'mock-uuid-1' },
        tags: ['React'],
        order: 0,
        is_public: true,
        description: 'Updated description',
        tech_stack: ['React', 'TypeScript'],
        screenshots: [],
        links: [],
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        features: ['Feature 1'],
      });
      expect(result.id).toBe(1);
      expect(result.title).toBe('Updated Project');
    });

    it('수정 실패 시 에러 메시지를 포함해야 한다', async () => {
      server.use(
        http.put('*/api/v1/projects/:portfolioCode/:projectCode', () => {
          return HttpResponse.json({ detail: '수정 권한이 없습니다.' }, { status: 403 });
        })
      );
      await expect(
        updatePortfolio('test-category', 'test-project', {
          portfolio_id: 1,
          code: 'test',
          title: 'Test',
          summary: '',
          thumbnail: null,
          tags: [],
          order: 0,
          is_public: true,
          description: '',
          tech_stack: [],
          screenshots: [],
          links: [],
          start_date: '',
          end_date: '',
          features: [],
        })
      ).rejects.toThrow('수정 권한이 없습니다.');
    });
  });

  describe('createProject', () => {
    const validRequest = {
      portfolio_code: 'test-portfolio',
      code: 'new-project',
      title: 'New Project',
      summary: 'A new project',
      thumbnail: { file_uuid: 'mock-uuid-1' },
      tags: ['React'],
      order: 0,
      is_public: true,
      description: 'New project description',
      tech_stack: ['React', 'TypeScript'],
      screenshots: [],
      links: [],
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      features: ['Feature 1'],
    };

    it('프로젝트를 생성해야 한다', async () => {
      const result = await createProject(validRequest);
      expect(result.id).toBe(1);
      expect(result.code).toBe('new-project');
      expect(result.title).toBe('New Project');
    });

    it('중복된 코드일 때 에러를 throw해야 한다', async () => {
      server.use(
        http.post('*/api/v1/projects/', () => {
          return HttpResponse.json({ detail: '중복된 프로젝트 코드' }, { status: 400 });
        })
      );
      await expect(createProject(validRequest)).rejects.toThrow('중복된 프로젝트 코드');
    });

    it('포트폴리오가 없을 때 에러를 throw해야 한다', async () => {
      server.use(
        http.post('*/api/v1/projects/', () => {
          return HttpResponse.json({ detail: '포트폴리오 없음' }, { status: 404 });
        })
      );
      await expect(createProject(validRequest)).rejects.toThrow('포트폴리오 없음');
    });
  });

  describe('getPublicPortfolios', () => {
    it('공개 포트폴리오 목록을 가져와야 한다', async () => {
      const result = await getPublicPortfolios('testuser', 'web');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Project');
    });
  });

  describe('getPublicProjectDetail', () => {
    it('공개 프로젝트 상세를 가져와야 한다', async () => {
      const result = await getPublicProjectDetail('testuser', 'web', 'test-project');
      expect(result.title).toBe('Test Project');
    });
  });

  describe('getPublicFileUrl', () => {
    it('공개 파일 URL을 올바르게 생성해야 한다', () => {
      const url = getPublicFileUrl('testuser', 'mock-uuid-123');
      expect(url).toBe(`${API_BASE_URL}/api/v1/public/testuser/file/mock-uuid-123`);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import {
  signup,
  getCurrentUser,
  getPortfolios,
  getPortfolioDetail,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  getPublicPortfolio,
  getPublicProjects,
  getPublicProjectDetail,
  getPublicFileUrl,
  isAllowedUploadImage,
  uploadImage,
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

  describe('signup', () => {
    it('회원가입을 성공적으로 완료해야 한다', async () => {
      const result = await signup({
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
      });
      expect(result.id).toBe(1);
      expect(result.username).toBe('newuser');
      expect(result.email).toBe('newuser@example.com');
    });

    it('중복된 username이면 에러를 throw해야 한다', async () => {
      server.use(
        http.post('*/api/v1/auth/signup', () => {
          return HttpResponse.json({ detail: '중복된 username입니다.' }, { status: 409 });
        })
      );
      await expect(
        signup({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        })
      ).rejects.toThrow('중복된 username입니다.');
    });

    it('중복된 email이면 에러를 throw해야 한다', async () => {
      server.use(
        http.post('*/api/v1/auth/signup', () => {
          return HttpResponse.json({ detail: '중복된 email입니다.' }, { status: 409 });
        })
      );
      await expect(
        signup({
          email: 'test@example.com',
          password: 'password123',
          username: 'newuser',
        })
      ).rejects.toThrow('중복된 email입니다.');
    });

    it('유효성 검증 실패 시 에러를 throw해야 한다', async () => {
      server.use(
        http.post('*/api/v1/auth/signup', () => {
          return HttpResponse.json(
            {
              detail: [
                { msg: '비밀번호는 8자 이상이어야 합니다.' },
                { msg: '이메일 형식이 올바르지 않습니다.' },
              ],
            },
            { status: 422 }
          );
        })
      );
      await expect(
        signup({
          email: 'invalid-email',
          password: '123',
          username: 'newuser',
        })
      ).rejects.toThrow('비밀번호는 8자 이상이어야 합니다., 이메일 형식이 올바르지 않습니다.');
    });
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

  describe('getProjects', () => {
    it('포트폴리오 목록을 가져와야 한다', async () => {
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
      const result = await getPortfolios();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Web Projects');
      expect(result.meta.total).toBe(1);
    });

    it('페이지와 페이지 크기 파라미터를 전달할 수 있어야 한다', async () => {
      const result = await getPortfolios(2, 5);
      expect(result.items).toBeDefined();
    });
  });

  describe('getPortfolioDetail', () => {
    it('코드로 포트폴리오 상세를 가져와야 한다', async () => {
      const result = await getPortfolioDetail('web');
      expect(result.id).toBe(1);
      expect(result.code).toBe('web');
      expect(result.name).toBe('Web Projects');
    });

    it('존재하지 않는 코드이면 에러를 throw해야 한다', async () => {
      await expect(getPortfolioDetail('nonexistent')).rejects.toThrow();
    });
  });

  describe('createPortfolio', () => {
    it('포트폴리오를 생성해야 한다', async () => {
      const result = await createPortfolio({
        code: 'web',
        name: 'Web Projects',
        description: 'Web development projects',
        screenshot: { file_uuid: 'mock-uuid-1' },
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
        createPortfolio({
          code: 'web',
          name: 'Web',
          description: '',
          screenshot: null,
          order: 1,
          is_public: true,
        })
      ).rejects.toThrow('이미 존재하는 코드입니다.');
    });
  });

  describe('updatePortfolio', () => {
    it('코드로 포트폴리오를 업데이트해야 한다', async () => {
      const result = await updatePortfolio('web', {
        code: 'web',
        name: 'Updated Web Projects',
        description: 'Updated',
        screenshot: null,
        order: 1,
        is_public: true,
      });
      expect(result.id).toBe(1);
    });
  });

  describe('deletePortfolio', () => {
    it('코드로 포트폴리오를 삭제해야 한다', async () => {
      await expect(deletePortfolio('web')).resolves.toBeUndefined();
    });

    it('존재하지 않는 코드이면 에러를 throw해야 한다', async () => {
      await expect(deletePortfolio('nonexistent')).rejects.toThrow();
    });
  });

  describe('getPortfolios', () => {
    it('프로젝트 목록을 가져와야 한다', async () => {
      const result = await getProjects('test-portfolio');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Project');
    });

    it('search 파라미터로 필터링해야 한다', async () => {
      const result = await getProjects('test-portfolio', 1, 10, 'React');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tech_stack).toContain('React');
    });

    it('존재하지 않는 search로 필터링하면 빈 목록을 반환해야 한다', async () => {
      const result = await getProjects('test-portfolio', 1, 10, 'NonExistentTag');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getProjectDetail', () => {
    it('프로젝트 상세를 가져와야 한다', async () => {
      const result = await getProjectDetail('test-portfolio', 'test-project');
      expect(result.title).toBe('Test Project');
      expect(result.tech_stack).toContain('React');
    });
  });

  describe('updateProject', () => {
    it('프로젝트를 수정해야 한다', async () => {
      const result = await updateProject('test-portfolio', 'test-project', {
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
        updateProject('test-portfolio', 'test-project', {
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

    it('중복된 코드이면 에러를 throw해야 한다', async () => {
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

  describe('getPublicProjects', () => {
    it('공개 프로젝트 목록을 가져와야 한다', async () => {
      const result = await getPublicProjects('testuser', 'web');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Project');
    });
  });

  describe('getPublicPortfolio', () => {
    it('공개 포트폴리오 정보를 가져와야 한다', async () => {
      const result = await getPublicPortfolio('testuser', 'web');
      expect(result.name).toBe('Web Projects');
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

  describe('uploadImage', () => {
    it('JPG, PNG, WebP만 업로드 가능한 이미지로 허용해야 한다', () => {
      expect(isAllowedUploadImage(new File(['jpg'], 'image.jpg', { type: 'image/jpeg' }))).toBe(
        true
      );
      expect(isAllowedUploadImage(new File(['png'], 'image.png', { type: 'image/png' }))).toBe(
        true
      );
      expect(isAllowedUploadImage(new File(['webp'], 'image.webp', { type: 'image/webp' }))).toBe(
        true
      );
      expect(isAllowedUploadImage(new File(['gif'], 'animated.gif', { type: 'image/gif' }))).toBe(
        false
      );
    });

    it('GIF는 업로드 요청 전에 거절해야 한다', async () => {
      const gif = new File(['gif'], 'animated.gif', { type: 'image/gif' });

      await expect(uploadImage(gif)).rejects.toThrow(
        'JPG, PNG, WebP 이미지만 업로드할 수 있습니다.'
      );
    });
  });
});


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
  getPublicProjects,
  getPublicProjectDetail,
  getPublicFileUrl,
  API_BASE_URL,
} from './api';

describe('API ?좏떥由ы떚', () => {
  beforeEach(() => {
    localStorage.clear();
    // ?몄쬆 ?좏겙 ?ㅼ젙
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
    it('?뚯썝媛?낆쓣 ?깃났?곸쑝濡??꾨즺?댁빞 ?쒕떎', async () => {
      const result = await signup({
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
      });
      expect(result.id).toBe(1);
      expect(result.username).toBe('newuser');
      expect(result.email).toBe('newuser@example.com');
    });

    it('以묐났??username?????먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      server.use(
        http.post('*/api/v1/auth/signup', () => {
          return HttpResponse.json({ detail: '以묐났??username?낅땲??' }, { status: 409 });
        })
      );
      await expect(
        signup({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        })
      ).rejects.toThrow('以묐났??username?낅땲??');
    });

    it('以묐났??email?????먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      server.use(
        http.post('*/api/v1/auth/signup', () => {
          return HttpResponse.json({ detail: '以묐났??email?낅땲??' }, { status: 409 });
        })
      );
      await expect(
        signup({
          email: 'test@example.com',
          password: 'password123',
          username: 'newuser',
        })
      ).rejects.toThrow('以묐났??email?낅땲??');
    });

    it('?좏슚??寃利??ㅽ뙣 ???먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      server.use(
        http.post('*/api/v1/auth/signup', () => {
          return HttpResponse.json(
            {
              detail: [
                { msg: '鍮꾨?踰덊샇??8???댁긽?댁뼱???⑸땲??' },
                { msg: '?대찓???뺤떇???щ컮瑜댁? ?딆뒿?덈떎.' },
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
      ).rejects.toThrow('鍮꾨?踰덊샇??8???댁긽?댁뼱???⑸땲??, ?대찓???뺤떇???щ컮瑜댁? ?딆뒿?덈떎.');
    });
  });

  describe('getCurrentUser', () => {
    it('?꾩옱 ?ъ슜???뺣낫瑜?媛?몄????쒕떎', async () => {
      const user = await getCurrentUser();
      expect(user.id).toBe(1);
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('?붿껌 ?ㅽ뙣 ???먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      server.use(
        http.get('*/api/v1/user/me', () => {
          return HttpResponse.json(null, { status: 500 });
        })
      );
      await expect(getCurrentUser()).rejects.toThrow();
    });
  });

  describe('getProjects', () => {
    it('移댄뀒怨좊━ 紐⑸줉??媛?몄????쒕떎', async () => {
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

    it('?섏씠吏?ㅼ씠???뚮씪誘명꽣瑜??꾨떖?????덉뼱???쒕떎', async () => {
      const result = await getPortfolios(2, 5);
      expect(result.items).toBeDefined();
    });
  });

  describe('getPortfolioDetail', () => {
    it('肄붾뱶濡?移댄뀒怨좊━ ?곸꽭瑜?媛?몄????쒕떎', async () => {
      const result = await getPortfolioDetail('web');
      expect(result.id).toBe(1);
      expect(result.code).toBe('web');
      expect(result.name).toBe('Web Projects');
    });

    it('議댁옱?섏? ?딅뒗 肄붾뱶?????먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      await expect(getPortfolioDetail('nonexistent')).rejects.toThrow();
    });
  });

  describe('createPortfolio', () => {
    it('移댄뀒怨좊━瑜??앹꽦?댁빞 ?쒕떎', async () => {
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

    it('?앹꽦 ?ㅽ뙣 ???먮윭 硫붿떆吏瑜??ы븿?댁빞 ?쒕떎', async () => {
      server.use(
        http.post('*/api/v1/portfolios/', () => {
          return HttpResponse.json({ detail: '?대? 議댁옱?섎뒗 肄붾뱶?낅땲??' }, { status: 400 });
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
      ).rejects.toThrow('?대? 議댁옱?섎뒗 肄붾뱶?낅땲??');
    });
  });

  describe('updatePortfolio', () => {
    it('肄붾뱶濡?移댄뀒怨좊━瑜??낅뜲?댄듃?댁빞 ?쒕떎', async () => {
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
    it('肄붾뱶濡?移댄뀒怨좊━瑜???젣?댁빞 ?쒕떎', async () => {
      await expect(deletePortfolio('web')).resolves.toBeUndefined();
    });

    it('議댁옱?섏? ?딅뒗 肄붾뱶?????먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      await expect(deletePortfolio('nonexistent')).rejects.toThrow();
    });
  });

  describe('getPortfolios', () => {
    it('?ы듃?대━??紐⑸줉??媛?몄????쒕떎', async () => {
      const result = await getProjects('test-portfolio');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Project');
    });

    it('search ?뚮씪誘명꽣濡??꾪꽣留곹빐???쒕떎', async () => {
      const result = await getProjects('test-portfolio', 1, 10, 'React');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tech_stack).toContain('React');
    });

    it('議댁옱?섏? ?딅뒗 search濡??꾪꽣留곹븯硫?鍮?紐⑸줉??諛섑솚?댁빞 ?쒕떎', async () => {
      const result = await getProjects('test-portfolio', 1, 10, 'NonExistentTag');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getProjectDetail', () => {
    it('?ы듃?대━???곸꽭瑜?媛?몄????쒕떎', async () => {
      const result = await getProjectDetail('test-portfolio', 'test-project');
      expect(result.title).toBe('Test Project');
      expect(result.tech_stack).toContain('React');
    });
  });

  describe('updateProject', () => {
    it('?ы듃?대━?ㅻ? ?섏젙?댁빞 ?쒕떎', async () => {
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

    it('?섏젙 ?ㅽ뙣 ???먮윭 硫붿떆吏瑜??ы븿?댁빞 ?쒕떎', async () => {
      server.use(
        http.put('*/api/v1/projects/:portfolioCode/:projectCode', () => {
          return HttpResponse.json({ detail: '?섏젙 沅뚰븳???놁뒿?덈떎.' }, { status: 403 });
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
      ).rejects.toThrow('?섏젙 沅뚰븳???놁뒿?덈떎.');
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

    it('?꾨줈?앺듃瑜??앹꽦?댁빞 ?쒕떎', async () => {
      const result = await createProject(validRequest);
      expect(result.id).toBe(1);
      expect(result.code).toBe('new-project');
      expect(result.title).toBe('New Project');
    });

    it('以묐났??肄붾뱶?????먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      server.use(
        http.post('*/api/v1/projects/', () => {
          return HttpResponse.json({ detail: '以묐났???꾨줈?앺듃 肄붾뱶' }, { status: 400 });
        })
      );
      await expect(createProject(validRequest)).rejects.toThrow('以묐났???꾨줈?앺듃 肄붾뱶');
    });

    it('?ы듃?대━?ㅺ? ?놁쓣 ???먮윭瑜?throw?댁빞 ?쒕떎', async () => {
      server.use(
        http.post('*/api/v1/projects/', () => {
          return HttpResponse.json({ detail: '?ы듃?대━???놁쓬' }, { status: 404 });
        })
      );
      await expect(createProject(validRequest)).rejects.toThrow('?ы듃?대━???놁쓬');
    });
  });

  describe('getPublicProjects', () => {
    it('怨듦컻 ?ы듃?대━??紐⑸줉??媛?몄????쒕떎', async () => {
      const result = await getPublicProjects('testuser', 'web');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Project');
    });
  });

  describe('getPublicProjectDetail', () => {
    it('怨듦컻 ?꾨줈?앺듃 ?곸꽭瑜?媛?몄????쒕떎', async () => {
      const result = await getPublicProjectDetail('testuser', 'web', 'test-project');
      expect(result.title).toBe('Test Project');
    });
  });

  describe('getPublicFileUrl', () => {
    it('怨듦컻 ?뚯씪 URL???щ컮瑜닿쾶 ?앹꽦?댁빞 ?쒕떎', () => {
      const url = getPublicFileUrl('testuser', 'mock-uuid-123');
      expect(url).toBe(`${API_BASE_URL}/api/v1/public/testuser/file/mock-uuid-123`);
    });
  });
});


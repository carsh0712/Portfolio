import { http, HttpResponse } from 'msw';

const mockCategory = {
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
};

const mockPortfolioItem = {
  code: 'test-project',
  title: 'Test Project',
  summary: 'A test project',
  thumbnail: { file_uuid: 'mock-uuid-1' },
  tags: ['frontend'],
  tech_stack: ['React', 'TypeScript'],
  order: 1,
  is_public: true,
};

const mockPublicPortfolioItem = {
  id: 1,
  portfolio_id: 1,
  code: 'test-project',
  title: 'Test Project',
  summary: 'A test project',
  thumbnail: { file_uuid: 'mock-uuid-1' },
  tags: ['frontend'],
  tech_stack: ['React', 'TypeScript'],
  order: 1,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPortfolioDetail = {
  id: 1,
  portfolio_id: 1,
  code: 'test-project',
  title: 'Test Project',
  summary: 'A test project',
  description: 'Detailed description',
  tech_stack: ['React', 'TypeScript'],
  tags: ['frontend'],
  thumbnail: { file_uuid: 'mock-uuid-1' },
  screenshots: [],
  links: [],
  order: 0,
  is_public: true,
  start_date: '2024-01-01',
  end_date: '',
  features: ['Feature 1'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const handlers = [
  // Auth
  http.post('*/api/v1/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { email: string; username: string; password: string };
    return HttpResponse.json(
      {
        id: 1,
        username: body.username,
        email: body.email,
      },
      { status: 201 }
    );
  }),

  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
    });
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'mock-new-access-token',
      token_type: 'Bearer',
    });
  }),

  http.post('*/api/v1/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out' });
  }),

  http.get('*/api/v1/user/me', () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });
  }),

  // Categories (Portfolios 엔드포인트 사용)
  http.get('*/api/v1/portfolios/:code', ({ params }) => {
    if (params.code === mockCategory.code) {
      return HttpResponse.json(mockCategory);
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  http.get('*/api/v1/portfolios/', () => {
    return HttpResponse.json({
      items: [mockCategory],
      meta: { total: 1, page: 1, page_size: 10, total_pages: 1 },
    });
  }),

  http.post('*/api/v1/portfolios/', async ({ request }) => {
    const body = (await request.json()) as { screenshot?: { file_uuid: string } | null };
    return HttpResponse.json(
      {
        ...mockCategory,
        screenshot: body.screenshot || mockCategory.screenshot,
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/portfolios/:code', async ({ request }) => {
    const body = (await request.json()) as { screenshot?: { file_uuid: string } | null };
    return HttpResponse.json({
      ...mockCategory,
      screenshot: body.screenshot || mockCategory.screenshot,
    });
  }),

  http.delete('*/api/v1/portfolios/:code', ({ params }) => {
    if (params.code === mockCategory.code) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  // Projects (portfolio_code 기반 조회)
  http.get('*/api/v1/projects/', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    let items = [mockPortfolioItem];

    if (search) {
      items = items.filter(
        (item) =>
          item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          item.tech_stack.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return HttpResponse.json({
      items,
      meta: { total: items.length, page: 1, page_size: 10, total_pages: 1 },
    });
  }),

  http.get('*/api/v1/projects/:portfolioCode/:projectCode', () => {
    return HttpResponse.json(mockPortfolioDetail);
  }),

  http.post('*/api/v1/projects/', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        ...mockPortfolioDetail,
        ...(body as object),
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/projects/:portfolioCode/:projectCode', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockPortfolioDetail,
      ...(body as object),
    });
  }),

  // Public APIs
  http.get('*/api/v1/public/:username/:categoryCode/', () => {
    return HttpResponse.json([mockPublicPortfolioItem]);
  }),

  http.get('*/api/v1/public/:username/:categoryCode/:portfolioCode/', () => {
    return HttpResponse.json(mockPortfolioDetail);
  }),

  // Public Files
  http.get('*/api/v1/public/:username/file/:fileUuid', () => {
    return new HttpResponse(new Blob(['mock-image'], { type: 'image/png' }), {
      headers: { 'Content-Type': 'image/png' },
    });
  }),
];

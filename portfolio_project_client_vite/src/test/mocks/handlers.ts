import { http, HttpResponse } from 'msw';

const mockPortfolio = {
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

const mockProjectItem = {
  code: 'test-project',
  title: 'Test Project',
  summary: 'A test project',
  thumbnail: { file_uuid: 'mock-uuid-1' },
  tags: ['frontend'],
  tech_stack: ['React', 'TypeScript'],
  order: 1,
  is_public: true,
};

const mockPublicProjectItem = {
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

const mockProjectDetail = {
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

  // Profiles
  http.get('*/api/v1/profiles/', () => {
    return HttpResponse.json({
      items: [],
      meta: { total: 0, page: 1, page_size: 20, total_pages: 0 },
    });
  }),

  // Portfolios
  http.get('*/api/v1/portfolios/:code', ({ params }) => {
    if (params.code === mockPortfolio.code) {
      return HttpResponse.json(mockPortfolio);
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  http.get('*/api/v1/portfolios/', () => {
    return HttpResponse.json({
      items: [mockPortfolio],
      meta: { total: 1, page: 1, page_size: 10, total_pages: 1 },
    });
  }),

  http.post('*/api/v1/portfolios/', async ({ request }) => {
    const body = (await request.json()) as { screenshot?: { file_uuid: string } | null };
    return HttpResponse.json(
      {
        ...mockPortfolio,
        screenshot: body.screenshot || mockPortfolio.screenshot,
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/portfolios/:code', async ({ request }) => {
    const body = (await request.json()) as { screenshot?: { file_uuid: string } | null };
    return HttpResponse.json({
      ...mockPortfolio,
      screenshot: body.screenshot || mockPortfolio.screenshot,
    });
  }),

  http.delete('*/api/v1/portfolios/:code', ({ params }) => {
    if (params.code === mockPortfolio.code) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  // Projects
  http.get('*/api/v1/projects/', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    let items = [mockProjectItem];

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
    return HttpResponse.json(mockProjectDetail);
  }),

  http.post('*/api/v1/projects/', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        ...mockProjectDetail,
        ...(body as object),
      },
      { status: 201 }
    );
  }),

  http.put('*/api/v1/projects/:portfolioCode/:projectCode', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockProjectDetail,
      ...(body as object),
    });
  }),

  http.delete('*/api/v1/projects/:portfolioCode/:projectCode', () => {
    return HttpResponse.json({ message: 'Project deleted successfully' });
  }),

  // Public APIs
  http.get('*/api/v1/public/:username/:portfolioCode/portfolio', () => {
    return HttpResponse.json(mockPortfolio);
  }),

  http.get('*/api/v1/public/:username/:portfolioCode/profile', () => {
    return HttpResponse.json(null);
  }),

  http.get('*/api/v1/public/:username/:portfolioCode/', () => {
    return HttpResponse.json([mockPublicProjectItem]);
  }),

  http.get('*/api/v1/public/:username/:portfolioCode/:projectCode/', () => {
    return HttpResponse.json(mockProjectDetail);
  }),

  // Public Files
  http.get('*/api/v1/files/:fileUuid', () => {
    return new HttpResponse(new Blob(['mock-image'], { type: 'image/png' }), {
      headers: { 'Content-Type': 'image/png' },
    });
  }),

  http.get('*/api/v1/public/:username/file/:fileUuid', () => {
    return new HttpResponse(new Blob(['mock-image'], { type: 'image/png' }), {
      headers: { 'Content-Type': 'image/png' },
    });
  }),
];

import { http, HttpResponse } from 'msw';

const mockCategory = {
  id: 1,
  user_id: 1,
  code: 'web',
  name: 'Web Projects',
  description: 'Web development projects',
  screenshot: { file_id: 1 },
  order: 1,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPortfolioItem = {
  id: 1,
  category_id: 1,
  code: 'test-project',
  title: 'Test Project',
  summary: 'A test project',
  thumbnail: { file_id: 1 },
  tags: ['React', 'TypeScript'],
  order: 1,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPortfolioDetail = {
  id: 1,
  category_id: 1,
  code: 'test-project',
  title: 'Test Project',
  summary: 'A test project',
  description: 'Detailed description',
  tech_stack: ['React', 'TypeScript'],
  tags: ['frontend'],
  thumbnail: { file_id: 1 },
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

  http.get('*/api/v1/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });
  }),

  // Categories
  http.get('*/api/v1/categories/', () => {
    return HttpResponse.json({
      items: [mockCategory],
      meta: { total: 1, page: 1, page_size: 10, total_pages: 1 },
    });
  }),

  http.post('*/api/v1/categories/', () => {
    return HttpResponse.json(mockCategory, { status: 201 });
  }),

  http.put('*/api/v1/categories/:id', () => {
    return HttpResponse.json(mockCategory);
  }),

  // Portfolios
  http.get('*/api/v1/portfolios/', () => {
    return HttpResponse.json({
      items: [mockPortfolioItem],
      meta: { total: 1, page: 1, page_size: 10, total_pages: 1 },
    });
  }),

  http.get('*/api/v1/portfolios/:id', () => {
    return HttpResponse.json(mockPortfolioDetail);
  }),

  http.put('*/api/v1/portfolios/:id', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockPortfolioDetail,
      ...(body as object),
    });
  }),

  // Public APIs
  http.get('*/api/v1/public/:username/:categoryCode/', () => {
    return HttpResponse.json([mockPortfolioItem]);
  }),

  http.get('*/api/v1/public/:username/:categoryCode/:portfolioCode/', () => {
    return HttpResponse.json(mockPortfolioDetail);
  }),

  // Public Files
  http.get('*/api/v1/public/:username/file/:fileId', () => {
    return new HttpResponse(new Blob(['mock-image'], { type: 'image/png' }), {
      headers: { 'Content-Type': 'image/png' },
    });
  }),
];

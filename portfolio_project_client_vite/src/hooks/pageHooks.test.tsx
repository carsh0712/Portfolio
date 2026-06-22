import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { server } from '../test/mocks/server';
import { usePortfolioListPage } from './usePortfolioListPage';
import { useProjectDetailPage } from './useProjectDetailPage';
import { useProjectListPage } from './useProjectListPage';

function mockIntersectionObserver() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
}

function routerWrapper(route: string, path: string, withAuth = false) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const content = withAuth ? <AuthProvider>{children}</AuthProvider> : children;

    return (
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={content} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe('page hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    mockIntersectionObserver();
  });

  it('loads and sorts portfolios without rendering the page', async () => {
    server.use(
      http.get('*/api/v1/portfolios/', () =>
        HttpResponse.json({
          items: [
            {
              id: 2,
              user_id: 1,
              code: 'games',
              name: 'Games',
              description: 'Game projects',
              screenshot: null,
              order: 2,
              is_public: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 1,
              user_id: 1,
              code: 'web',
              name: 'Web',
              description: 'Web projects',
              screenshot: null,
              order: 1,
              is_public: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          meta: { total: 2, page: 1, page_size: 10, total_pages: 1 },
        })
      )
    );

    const { result } = renderHook(() => usePortfolioListPage(), {
      wrapper: routerWrapper('/home', '/home'),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
    expect(result.current.portfolios.map((portfolio) => portfolio.code)).toEqual(['web', 'games']);
  });

  it('loads project list data and refetches with the selected tag', async () => {
    const searches: Array<string | null> = [];

    server.use(
      http.get('*/api/v1/projects/', ({ request }) => {
        const url = new URL(request.url);
        searches.push(url.searchParams.get('search'));

        const allProjects = [
          {
            code: 'alpha',
            title: 'Alpha',
            summary: 'Alpha summary',
            thumbnail: null,
            tags: ['frontend'],
            tech_stack: ['React'],
            order: 1,
            is_public: true,
          },
          {
            code: 'beta',
            title: 'Beta',
            summary: 'Beta summary',
            thumbnail: null,
            tags: ['backend'],
            tech_stack: ['Python'],
            order: 2,
            is_public: true,
          },
        ];

        const search = url.searchParams.get('search');
        const items = search
          ? allProjects.filter((project) => project.tags.includes(search))
          : allProjects;

        return HttpResponse.json({
          items,
          meta: { total: items.length, page: 1, page_size: 100, total_pages: 1 },
        });
      })
    );

    const { result } = renderHook(() => useProjectListPage(), {
      wrapper: routerWrapper('/portfolio/web', '/portfolio/:portfolioCode'),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.portfolio?.code).toBe('web');
    expect(result.current.filters.filteredProjects.map((project) => project.code)).toEqual([
      'alpha',
      'beta',
    ]);
    expect(searches).toEqual([null]);

    act(() => {
      result.current.filters.addTag('frontend');
    });

    await waitFor(() => expect(searches).toEqual([null, 'frontend']));
    await waitFor(() =>
      expect(result.current.filters.filteredProjects.map((project) => project.code)).toEqual([
        'alpha',
      ])
    );
  });

  it('updates a project and exits edit mode after save', async () => {
    let updateBody: unknown = null;

    server.use(
      http.put('*/api/v1/projects/:portfolioCode/:projectCode', async ({ request }) => {
        updateBody = await request.json();

        return HttpResponse.json({
          id: 1,
          portfolio_id: 1,
          code: 'updated-project',
          title: 'Updated Project',
          summary: 'Updated summary',
          description: 'Updated description',
          tech_stack: ['React', 'Vitest'],
          tags: ['frontend', 'tested'],
          thumbnail: { file_uuid: 'new-thumbnail' },
          screenshots: [{ file_uuid: 'shot-1', caption: 'Updated shot' }],
          links: [
            {
              name: 'demo',
              url: 'https://example.com',
              background_color: '#111111',
              text_color: '#ffffff',
            },
          ],
          order: 0,
          is_public: false,
          start_date: '2024-02',
          end_date: '2024-03',
          features: ['Saved feature'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        });
      })
    );

    const { result } = renderHook(() => useProjectDetailPage(), {
      wrapper: routerWrapper(
        '/portfolio/web/project/test-project',
        '/portfolio/:portfolioCode/project/:projectCode',
        true
      ),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.project?.code).toBe('test-project');

    act(() => {
      result.current.setIsEditing(true);
    });
    expect(result.current.isEditing).toBe(true);

    await act(async () => {
      await result.current.saveProject({
        code: 'updated-project',
        title: 'Updated Project',
        summary: 'Updated summary',
        description: 'Updated description',
        techStack: 'React, Vitest',
        tags: 'frontend, tested',
        features: 'Saved feature',
        links: [
          {
            name: 'demo',
            url: 'https://example.com',
            backgroundColor: '#111111',
            textColor: '#ffffff',
          },
        ],
        screenshots: [{ file_uuid: 'shot-1', caption: 'Updated shot' }],
        thumbnailFileUuid: 'new-thumbnail',
        startDate: '2024-02',
        endDate: '2024-03',
        isPublic: false,
      });
    });

    expect(updateBody).toMatchObject({
      portfolio_id: 1,
      code: 'updated-project',
      tags: ['frontend', 'tested'],
      tech_stack: ['React', 'Vitest'],
      features: ['Saved feature'],
      thumbnail: { file_uuid: 'new-thumbnail' },
      is_public: false,
    });
    expect(result.current.project?.title).toBe('Updated Project');
    expect(result.current.project?.isPublic).toBe(false);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

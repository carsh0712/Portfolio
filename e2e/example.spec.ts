import { test, expect } from '@playwright/test';

test.describe('포트폴리오 사이트 E2E 테스트', () => {
  test('로그인 페이지가 정상적으로 렌더링되어야 한다', async ({ page }) => {
    await page.goto('/login');

    // 로그인 페이지 요소 확인
    await expect(page.locator('h1')).toContainText('로그인');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('회원가입 페이지로 이동할 수 있어야 한다', async ({ page }) => {
    await page.goto('/login');

    // 회원가입 링크 클릭
    const registerLink = page.locator('a[href="/register"]');
    await registerLink.click();

    // URL 확인
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1')).toContainText('회원가입');
  });

  test('로그인 후 홈 페이지로 이동해야 한다', async ({ page }) => {
    // API 응답 모킹
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
        }),
      });
    });

    await page.goto('/login');

    // 로그인 폼 작성 및 제출
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 홈 페이지로 이동 확인
    await expect(page).toHaveURL(/.*home/);
  });

  test('프로젝트 카드 클릭 시 상세 페이지로 이동해야 한다', async ({ page }) => {
    // 로그인 상태 시뮬레이션 (localStorage 설정)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'auth_tokens',
        JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          token_type: 'Bearer',
        })
      );
      localStorage.setItem(
        'auth_user',
        JSON.stringify({
          username: 'test@example.com',
          email: 'test@example.com',
        })
      );
    });

    // 카테고리 목록 API 모킹
    await page.route('**/api/v1/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Web Development',
            description: 'Web projects',
          },
        ]),
      });
    });

    // 프로젝트 목록 API 모킹
    await page.route('**/api/v1/categories/*/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            categoryId: '1',
            title: 'Test Project',
            summary: 'Test summary',
            techStack: ['React', 'TypeScript'],
            tags: ['frontend'],
          },
        ]),
      });
    });

    await page.goto('/home');

    // 프로젝트 카드가 나타날 때까지 대기
    const projectCard = page.locator('a').filter({ hasText: 'Test Project' }).first();
    await expect(projectCard).toBeVisible();

    // 프로젝트 카드 클릭
    await projectCard.click();

    // URL 변경 확인
    await expect(page).toHaveURL(/.*\/category\/.*\/project\/.*/);
  });
});

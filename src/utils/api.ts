import type { AuthTokens } from '../types/auth';
import type { CategoryListResponse } from '../types/category';
import type {
  PortfolioListResponse,
  PortfolioItemDetail,
  PublicPortfolioItem,
  PublicProjectDetail,
} from '../types/project';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem('auth_tokens');
  return stored ? JSON.parse(stored) : null;
}

function clearAuth(): void {
  localStorage.removeItem('auth_tokens');
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const tokens = getStoredTokens();

  const headers = new Headers(options.headers);

  if (tokens?.access_token) {
    headers.set('Authorization', `Bearer ${tokens.access_token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
  }

  return response;
}

// Categories API
export async function getCategories(
  page: number = 1,
  pageSize: number = 10
): Promise<CategoryListResponse> {
  const response = await apiFetch(`/api/v1/categories/?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

// Portfolios API
export async function getPortfolios(
  categoryId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PortfolioListResponse> {
  const response = await apiFetch(
    `/api/v1/portfolios/?category_id=${categoryId}&page=${page}&page_size=${pageSize}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolios: ${response.statusText}`);
  }

  return response.json();
}

// Portfolio Item Detail API
export async function getPortfolioItemDetail(itemId: number): Promise<PortfolioItemDetail> {
  const response = await apiFetch(`/api/v1/portfolio/item/${itemId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio item: ${response.statusText}`);
  }

  return response.json();
}

// Public Portfolio APIs (No authentication required)
export async function getPublicPortfolios(
  username: string,
  categoryCode: string
): Promise<PublicPortfolioItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/public/${username}/${categoryCode}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch public portfolios: ${response.statusText}`);
  }

  return response.json();
}

export async function getPublicProjectDetail(
  username: string,
  categoryCode: string,
  portfolioCode: string
): Promise<PublicProjectDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/public/${username}/${categoryCode}/${portfolioCode}/`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch public project: ${response.statusText}`);
  }

  return response.json();
}

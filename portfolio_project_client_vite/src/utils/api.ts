import type { AuthTokens, AuthUser, SignupRequest, SignupResponse } from '../types/auth';
import type {
  Category,
  CategoryListResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from '../types/category';
import type {
  PortfolioListResponse,
  Portfolio,
  PublicPortfolioItem,
  PublicProjectDetail,
  CreateProjectRequest,
  UpdatePortfolioRequest,
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

let refreshPromise: Promise<string> | null = null;

async function tryRefreshToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh_token) throw new Error('No refresh token');

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });

  if (!response.ok) throw new Error('Refresh failed');

  const data: { access_token: string; token_type: string } = await response.json();
  const updatedTokens: AuthTokens = {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    token_type: data.token_type,
  };
  localStorage.setItem('auth_tokens', JSON.stringify(updatedTokens));
  return data.access_token;
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
    // refresh 엔드포인트 자체가 401이면 바로 로그아웃
    if (endpoint.includes('/auth/refresh')) {
      clearAuth();
      return response;
    }

    // refresh 시도 (동시 요청 시 하나의 Promise 공유)
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newAccessToken = await refreshPromise;

      // 새 토큰으로 원래 요청 재시도
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }

      return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    } catch {
      clearAuth();
      return response;
    }
  }

  return response;
}

// Auth API
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '회원가입에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('회원가입에 실패했습니다.');
  }

  return response.json();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch('/api/v1/user/me', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.statusText}`);
  }

  return response.json();
}

// Categories API
export async function getCategories(
  page: number = 1,
  pageSize: number = 10
): Promise<CategoryListResponse> {
  const response = await apiFetch(`/api/v1/portfolios/?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

// Category Creation API
export async function createCategory(data: CreateCategoryRequest): Promise<CreateCategoryResponse> {
  const response = await apiFetch('/api/v1/portfolios/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '카테고리 추가에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('카테고리 추가에 실패했습니다.');
  }

  return response.json();
}

// Category Detail API (by portfolio code)
export async function getCategoryDetail(code: string): Promise<Category> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.statusText}`);
  }

  return response.json();
}

// Category Update API (by portfolio code)
export async function updateCategory(
  code: string,
  data: UpdateCategoryRequest
): Promise<UpdateCategoryResponse> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '카테고리 수정에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('카테고리 수정에 실패했습니다.');
  }

  return response.json();
}

// Category Delete API (by portfolio code)
export async function deleteCategory(code: string): Promise<void> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '카테고리 삭제에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('카테고리 삭제에 실패했습니다.');
  }
}

// File Upload API
export interface UploadFileResponse {
  uuid: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export async function uploadImage(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch('/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '이미지 업로드에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  return response.json();
}

export function getFileUrl(fileUuid: string): string {
  return `${API_BASE_URL}/api/v1/files/${fileUuid}`;
}

export function getPublicFileUrl(username: string, fileUuid: string): string {
  return `${API_BASE_URL}/api/v1/public/${username}/file/${fileUuid}`;
}

export async function fetchFileAsObjectUrl(fileUuid: string): Promise<string> {
  const response = await apiFetch(`/api/v1/files/${fileUuid}`);
  if (!response.ok) {
    throw new Error('파일을 불러오는데 실패했습니다.');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// Portfolios API
export async function getPortfolios(
  categoryCode: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<PortfolioListResponse> {
  const params = new URLSearchParams({
    portfolio_code: categoryCode,
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.append('search', search);

  const response = await apiFetch(`/api/v1/projects/?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolios: ${response.statusText}`);
  }

  return response.json();
}

// Portfolio Detail API
export async function getPortfolioDetail(
  portfolioCode: string,
  projectCode: string
): Promise<Portfolio> {
  const response = await apiFetch(`/api/v1/projects/${portfolioCode}/${projectCode}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio item: ${response.statusText}`);
  }

  return response.json();
}

// Portfolio Update API
export async function updatePortfolio(
  portfolioCode: string,
  projectCode: string,
  data: UpdatePortfolioRequest
): Promise<Portfolio> {
  const response = await apiFetch(`/api/v1/projects/${portfolioCode}/${projectCode}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '포트폴리오 수정에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('포트폴리오 수정에 실패했습니다.');
  }

  return response.json();
}

// Project Create API
export async function createProject(data: CreateProjectRequest): Promise<Portfolio> {
  const response = await apiFetch('/api/v1/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData) {
      const message =
        typeof errorData.detail === 'string'
          ? errorData.detail
          : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
            : '프로젝트 생성에 실패했습니다.';
      throw new Error(message);
    }
    throw new Error('프로젝트 생성에 실패했습니다.');
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

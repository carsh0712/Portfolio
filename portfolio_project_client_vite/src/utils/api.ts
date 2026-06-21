import type { AuthTokens, AuthUser, SignupRequest, SignupResponse } from '../types/auth';
import type {
  PortfolioCategory,
  PortfolioCategoryListResponse,
  CreatePortfolioCategoryRequest,
  CreatePortfolioCategoryResponse,
  UpdatePortfolioCategoryRequest,
  UpdatePortfolioCategoryResponse,
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

  if (response.status !== 401) {
    return response;
  }

  if (endpoint.includes('/auth/refresh')) {
    clearAuth();
    return response;
  }

  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }

  try {
    const newAccessToken = await refreshPromise;
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

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const errorData = await response.json().catch(() => null);
  if (!errorData) return fallback;
  if (typeof errorData.detail === 'string') return errorData.detail;
  if (Array.isArray(errorData.detail)) {
    return errorData.detail.map((detail: { msg?: string }) => detail.msg || String(detail)).join(', ');
  }
  return fallback;
}

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '회원가입에 실패했습니다.'));
  }

  return response.json();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch('/api/v1/user/me', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`현재 사용자 정보를 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

export async function getPortfolioCategories(
  page: number = 1,
  pageSize: number = 10
): Promise<PortfolioCategoryListResponse> {
  const response = await apiFetch(`/api/v1/portfolios/?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`포트폴리오 목록을 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

export async function createPortfolioCategory(
  data: CreatePortfolioCategoryRequest
): Promise<CreatePortfolioCategoryResponse> {
  const response = await apiFetch('/api/v1/portfolios/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '포트폴리오 추가에 실패했습니다.'));
  }

  return response.json();
}

export async function getPortfolioCategoryDetail(code: string): Promise<PortfolioCategory> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`포트폴리오를 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

export async function updatePortfolioCategory(
  code: string,
  data: UpdatePortfolioCategoryRequest
): Promise<UpdatePortfolioCategoryResponse> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '포트폴리오 수정에 실패했습니다.'));
  }

  return response.json();
}

export async function deletePortfolioCategory(code: string): Promise<void> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '포트폴리오 삭제에 실패했습니다.'));
  }
}

export const getCategories = getPortfolioCategories;
export const createCategory = createPortfolioCategory;
export const getCategoryDetail = getPortfolioCategoryDetail;
export const updateCategory = updatePortfolioCategory;
export const deleteCategory = deletePortfolioCategory;

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
    throw new Error(await getErrorMessage(response, '이미지 업로드에 실패했습니다.'));
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
    throw new Error('파일을 불러오지 못했습니다.');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getPortfolios(
  portfolioCode: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<PortfolioListResponse> {
  const params = new URLSearchParams({
    portfolio_code: portfolioCode,
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.append('search', search);

  const response = await apiFetch(`/api/v1/projects/?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`프로젝트 목록을 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

export async function getPortfolioDetail(
  portfolioCode: string,
  projectCode: string
): Promise<Portfolio> {
  const response = await apiFetch(`/api/v1/projects/${portfolioCode}/${projectCode}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`프로젝트 상세 정보를 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

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
    throw new Error(await getErrorMessage(response, '프로젝트 수정에 실패했습니다.'));
  }

  return response.json();
}

export async function createProject(data: CreateProjectRequest): Promise<Portfolio> {
  const response = await apiFetch('/api/v1/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '프로젝트 생성에 실패했습니다.'));
  }

  return response.json();
}

export async function getPublicPortfolios(
  username: string,
  portfolioCode: string
): Promise<PublicPortfolioItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/public/${username}/${portfolioCode}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`공개 프로젝트 목록을 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

export async function getPublicProjectDetail(
  username: string,
  portfolioCode: string,
  projectCode: string
): Promise<PublicProjectDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/public/${username}/${portfolioCode}/${projectCode}/`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`공개 프로젝트 상세 정보를 불러오지 못했습니다: ${response.statusText}`);
  }

  return response.json();
}

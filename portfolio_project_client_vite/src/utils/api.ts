import type { AuthTokens, AuthUser, SignupRequest, SignupResponse } from '../types/auth';
import type {
  Portfolio,
  PortfolioListResponse,
  CreatePortfolioRequest,
  CreatePortfolioResponse,
  UpdatePortfolioRequest,
  UpdatePortfolioResponse,
} from '../types/portfolio';
import type {
  ProjectListResponse,
  ProjectDetailResponse,
  PublicProjectItem,
  PublicProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
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
    throw new Error(await getErrorMessage(response, '?뚯썝媛?낆뿉 ?ㅽ뙣?덉뒿?덈떎.'));
  }

  return response.json();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch('/api/v1/user/me', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`?꾩옱 ?ъ슜???뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
  }

  return response.json();
}

export async function getPortfolios(
  page: number = 1,
  pageSize: number = 10
): Promise<PortfolioListResponse> {
  const response = await apiFetch(`/api/v1/portfolios/?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`?ы듃?대━??紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
  }

  return response.json();
}

export async function createPortfolio(
  data: CreatePortfolioRequest
): Promise<CreatePortfolioResponse> {
  const response = await apiFetch('/api/v1/portfolios/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '?ы듃?대━??異붽????ㅽ뙣?덉뒿?덈떎.'));
  }

  return response.json();
}

export async function getPortfolioDetail(code: string): Promise<Portfolio> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`?ы듃?대━?ㅻ? 遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
  }

  return response.json();
}

export async function updatePortfolio(
  code: string,
  data: UpdatePortfolioRequest
): Promise<UpdatePortfolioResponse> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '?ы듃?대━???섏젙???ㅽ뙣?덉뒿?덈떎.'));
  }

  return response.json();
}

export async function deletePortfolio(code: string): Promise<void> {
  const response = await apiFetch(`/api/v1/portfolios/${code}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '?ы듃?대━????젣???ㅽ뙣?덉뒿?덈떎.'));
  }
}

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
    throw new Error(await getErrorMessage(response, '?대?吏 ?낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.'));
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
    throw new Error('?뚯씪??遺덈윭?ㅼ? 紐삵뻽?듬땲??');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getProjects(
  portfolioCode: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<ProjectListResponse> {
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
    throw new Error(`?꾨줈?앺듃 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
  }

  return response.json();
}

export async function getProjectDetail(
  portfolioCode: string,
  projectCode: string
): Promise<ProjectDetailResponse> {
  const response = await apiFetch(`/api/v1/projects/${portfolioCode}/${projectCode}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`?꾨줈?앺듃 ?곸꽭 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
  }

  return response.json();
}

export async function updateProject(
  portfolioCode: string,
  projectCode: string,
  data: UpdateProjectRequest
): Promise<ProjectDetailResponse> {
  const response = await apiFetch(`/api/v1/projects/${portfolioCode}/${projectCode}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '?꾨줈?앺듃 ?섏젙???ㅽ뙣?덉뒿?덈떎.'));
  }

  return response.json();
}

export async function createProject(data: CreateProjectRequest): Promise<ProjectDetailResponse> {
  const response = await apiFetch('/api/v1/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '?꾨줈?앺듃 ?앹꽦???ㅽ뙣?덉뒿?덈떎.'));
  }

  return response.json();
}

export async function getPublicProjects(
  username: string,
  portfolioCode: string
): Promise<PublicProjectItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/public/${username}/${portfolioCode}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`怨듦컻 ?꾨줈?앺듃 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
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
    throw new Error(`怨듦컻 ?꾨줈?앺듃 ?곸꽭 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${response.statusText}`);
  }

  return response.json();
}


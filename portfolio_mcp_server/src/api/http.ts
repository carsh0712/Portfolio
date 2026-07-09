import { PortfolioApiError } from "./error.js";
import type { AuthMode, RequestOptions } from "./types.js";

const JSON_CONTENT_TYPE = "application/json";

export async function requestJson(
  baseUrl: string,
  endpoint: string,
  options: RequestOptions = {},
  authMode: AuthMode,
  accessToken: string | null
): Promise<unknown> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", JSON_CONTENT_TYPE);
  }
  if (authMode.authenticated && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await safeFetch(buildApiUrl(baseUrl, endpoint), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchAuthed(
  baseUrl: string,
  endpoint: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return safeFetch(buildApiUrl(baseUrl, endpoint), { ...init, headers });
}

export function buildApiUrl(baseUrl: string, endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  return `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    const error = new PortfolioApiError(`Network request failed for ${url}`);
    const typedCause = cause as {
      message?: string;
      code?: string;
      hostname?: string;
      cause?: unknown;
    };
    const nestedCause = typedCause.cause as { code?: string; hostname?: string } | undefined;
    error.cause = cause;
    error.detail = {
      message: typedCause.message ?? String(cause),
      code: nestedCause?.code ?? typedCause.code ?? null,
      hostname: nestedCause?.hostname ?? typedCause.hostname ?? null,
    };
    throw error;
  }
}

export async function buildError(response: Response): Promise<PortfolioApiError> {
  const text = await response.text().catch(() => "");
  let detail: unknown = text;
  try {
    const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
    detail = parsed.detail ?? parsed.message ?? parsed;
  } catch {
    // Keep raw response text.
  }

  const error = new PortfolioApiError(
    `Portfolio API request failed: ${response.status} ${response.statusText}`
  );
  error.status = response.status;
  error.detail = detail;
  return error;
}

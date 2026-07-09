import fs from "node:fs/promises";
import path from "node:path";

const JSON_CONTENT_TYPE = "application/json";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = Record<string, JsonValue | undefined>;

type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
};

type AuthMode = {
  authenticated: boolean;
};

type FileOptions = {
  variant?: string;
  asBase64?: boolean;
};

type PortfolioApiClientOptions = {
  baseUrl: string;
  email: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

type RefreshResponse = {
  access_token: string;
};

export class PortfolioApiError extends Error {
  status: number | null = null;
  detail: unknown = null;
}

export class PortfolioApiClient {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor({ baseUrl, email, password }: PortfolioApiClientOptions) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.email = email;
    this.password = password;
  }

  async login(): Promise<JsonObject> {
    const data = (await this.publicJson("/api/v1/auth/login", {
      method: "POST",
      body: { email: this.email, password: this.password },
    })) as LoginResponse;

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    return { token_type: data.token_type ?? "bearer", authenticated: true };
  }

  async logout(): Promise<unknown> {
    if (!this.refreshToken) {
      return { message: "No active refresh token in memory." };
    }

    const result = await this.authJson("/api/v1/auth/logout", {
      method: "POST",
      body: { refresh_token: this.refreshToken },
    });
    this.accessToken = null;
    this.refreshToken = null;
    return result;
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error("No refresh token is available.");
    }

    const data = (await this.publicJson("/api/v1/auth/refresh", {
      method: "POST",
      body: { refresh_token: this.refreshToken },
    })) as RefreshResponse;

    this.accessToken = data.access_token;
    return data.access_token;
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.login();
    }
  }

  async publicJson(endpoint: string, options: RequestOptions = {}): Promise<unknown> {
    return this.requestJson(endpoint, options, { authenticated: false });
  }

  async authJson(endpoint: string, options: RequestOptions = {}): Promise<unknown> {
    await this.ensureAuthenticated();
    try {
      return await this.requestJson(endpoint, options, { authenticated: true });
    } catch (error) {
      if (!(error instanceof PortfolioApiError) || error.status !== 401) throw error;

      try {
        await this.refreshAccessToken();
      } catch {
        await this.login();
      }
      return this.requestJson(endpoint, options, { authenticated: true });
    }
  }

  async requestJson(
    endpoint: string,
    options: RequestOptions = {},
    { authenticated }: AuthMode
  ): Promise<unknown> {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body !== undefined) {
      headers.set("Content-Type", JSON_CONTENT_TYPE);
    }
    if (authenticated && this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const response = await this.safeFetch(this.url(endpoint), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      throw await this.buildError(response);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async authFile(endpoint: string, { variant = "detail", asBase64 = false }: FileOptions = {}) {
    await this.ensureAuthenticated();
    const query = new URLSearchParams({ variant });
    const response = await this.fetchWithAuth(`${endpoint}?${query.toString()}`);
    if (!response.ok) {
      throw await this.buildError(response);
    }
    return this.fileResponse(response, { asBase64 });
  }

  async publicFile(
    username: string,
    fileUuid: string,
    { variant = "detail", asBase64 = false }: FileOptions = {}
  ) {
    const query = new URLSearchParams({ variant });
    const response = await this.safeFetch(
      this.url(
        `/api/v1/public/${encodeURIComponent(username)}/file/${encodeURIComponent(
          fileUuid
        )}?${query.toString()}`
      )
    );
    if (!response.ok) {
      throw await this.buildError(response);
    }
    return this.fileResponse(response, { asBase64 });
  }

  async fetchWithAuth(endpoint: string, init: RequestInit = {}): Promise<Response> {
    await this.ensureAuthenticated();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.accessToken}`);

    let response = await this.safeFetch(this.url(endpoint), { ...init, headers });
    if (response.status !== 401) return response;

    try {
      await this.refreshAccessToken();
    } catch {
      await this.login();
    }
    headers.set("Authorization", `Bearer ${this.accessToken}`);
    response = await this.safeFetch(this.url(endpoint), { ...init, headers });
    return response;
  }

  async uploadFile(filePath: string): Promise<unknown> {
    const absolutePath = path.resolve(filePath);
    const buffer = await fs.readFile(absolutePath);
    const formData = new FormData();
    formData.set("file", new Blob([new Uint8Array(buffer)]), path.basename(absolutePath));

    const response = await this.fetchWithAuth("/api/v1/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw await this.buildError(response);
    }
    return response.json();
  }

  async fileResponse(response: Response, { asBase64 }: Required<Pick<FileOptions, "asBase64">>) {
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const disposition = response.headers.get("content-disposition") ?? "";
    const result: JsonObject = {
      content_type: contentType,
      content_disposition: disposition || null,
      note: asBase64
        ? "base64 contains the downloaded file content."
        : "Set as_base64 to true to include file content in the MCP response.",
    };

    if (asBase64) {
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      result.base64 = base64;
      result.byte_length = Buffer.byteLength(base64, "base64");
    }

    return result;
  }

  url(endpoint: string): string {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    return `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  }

  async safeFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (cause) {
      const error = new PortfolioApiError(`Network request failed for ${url}`);
      const typedCause = cause as { message?: string; code?: string; hostname?: string; cause?: unknown };
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

  async buildError(response: Response): Promise<PortfolioApiError> {
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
}

import { PortfolioApiError } from "./error.js";
import { buildFileResult, uploadLocalFile } from "./files.js";
import { buildApiUrl, buildError, fetchAuthed, requestJson, safeFetch } from "./http.js";
import type {
  FileOptions,
  JsonObject,
  LoginResponse,
  PortfolioApiClientOptions,
  RefreshResponse,
  RequestOptions,
} from "./types.js";

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
    return requestJson(this.baseUrl, endpoint, options, { authenticated: false }, this.accessToken);
  }

  async authJson(endpoint: string, options: RequestOptions = {}): Promise<unknown> {
    await this.ensureAuthenticated();
    try {
      return await requestJson(this.baseUrl, endpoint, options, { authenticated: true }, this.accessToken);
    } catch (error) {
      if (!(error instanceof PortfolioApiError) || error.status !== 401) throw error;

      await this.restoreAuthentication();
      return requestJson(this.baseUrl, endpoint, options, { authenticated: true }, this.accessToken);
    }
  }

  async authFile(endpoint: string, { variant = "detail", asBase64 = false }: FileOptions = {}) {
    await this.ensureAuthenticated();
    const query = new URLSearchParams({ variant });
    const response = await this.fetchWithAuth(`${endpoint}?${query.toString()}`);
    if (!response.ok) {
      throw await buildError(response);
    }
    return buildFileResult(response, { asBase64 });
  }

  async publicFile(
    username: string,
    fileUuid: string,
    { variant = "detail", asBase64 = false }: FileOptions = {}
  ) {
    const query = new URLSearchParams({ variant });
    const response = await this.safeFetch(
      buildApiUrl(
        this.baseUrl,
        `/api/v1/public/${encodeURIComponent(username)}/file/${encodeURIComponent(
          fileUuid
        )}?${query.toString()}`
      )
    );
    if (!response.ok) {
      throw await buildError(response);
    }
    return buildFileResult(response, { asBase64 });
  }

  async fetchWithAuth(endpoint: string, init: RequestInit = {}): Promise<Response> {
    await this.ensureAuthenticated();
    let response = await fetchAuthed(this.baseUrl, endpoint, this.accessToken!, init);
    if (response.status !== 401) return response;

    await this.restoreAuthentication();
    response = await fetchAuthed(this.baseUrl, endpoint, this.accessToken!, init);
    return response;
  }

  async uploadFile(filePath: string): Promise<unknown> {
    return uploadLocalFile(filePath, (endpoint, init) => this.fetchWithAuth(endpoint, init));
  }

  async safeFetch(url: string, init?: RequestInit): Promise<Response> {
    return safeFetch(url, init);
  }

  private async restoreAuthentication(): Promise<void> {
    try {
      await this.refreshAccessToken();
    } catch {
      await this.login();
    }
  }
}

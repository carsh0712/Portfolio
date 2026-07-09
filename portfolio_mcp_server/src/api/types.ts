export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue | undefined>;

export type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
};

export type AuthMode = {
  authenticated: boolean;
};

export type FileOptions = {
  variant?: string;
  asBase64?: boolean;
};

export type PortfolioApiClientOptions = {
  baseUrl: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type RefreshResponse = {
  access_token: string;
};

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignupResponse {
  id: number;
  username: string;
  email: string;
}

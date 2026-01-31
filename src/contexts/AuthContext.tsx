import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthTokens, AuthUser } from '../types/auth';
import { API_BASE_URL, getCurrentUser } from '../utils/api';

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  TOKENS: 'auth_tokens',
  USER: 'auth_user',
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
    return stored ? JSON.parse(stored) : null;
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!tokens?.access_token;

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          if (errorData) {
            const message =
              typeof errorData.detail === 'string'
                ? errorData.detail
                : Array.isArray(errorData.detail)
                  ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
                  : '로그인에 실패했습니다.';
            throw new Error(message);
          }
          throw new Error('로그인에 실패했습니다.');
        }

        const data: AuthTokens = await response.json();

        localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(data));
        const userData = await getCurrentUser();
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

        setTokens(data);
        setUser(userData);
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    const currentTokens = tokens;

    // Clear local state first
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setTokens(null);
    setUser(null);
    navigate('/login');

    // Call logout API in background (don't wait for response)
    if (currentTokens?.refresh_token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: currentTokens.refresh_token }),
        });
      } catch (error) {
        // Ignore errors - user is already logged out locally
        console.error('Logout API call failed:', error);
      }
    }
  }, [tokens, navigate]);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData) {
          const message =
            typeof errorData.detail === 'string'
              ? errorData.detail
              : Array.isArray(errorData.detail)
                ? errorData.detail.map((d: { msg: string }) => d.msg).join(', ')
                : '토큰 갱신에 실패했습니다.';
          throw new Error(message);
        }
        throw new Error('토큰 갱신에 실패했습니다.');
      }

      const data: { access_token: string; token_type: string } = await response.json();

      // Update tokens with new access token, keep existing refresh token
      const updatedTokens: AuthTokens = {
        access_token: data.access_token,
        refresh_token: tokens.refresh_token,
        token_type: data.token_type,
      };

      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(updatedTokens));
      setTokens(updatedTokens);
    } catch (error) {
      // If refresh fails, logout the user
      localStorage.removeItem(STORAGE_KEYS.TOKENS);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setTokens(null);
      setUser(null);
      navigate('/login');
      throw error;
    }
  }, [tokens, navigate]);

  return (
    <AuthContext.Provider
      value={{ user, tokens, isAuthenticated, isLoading, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

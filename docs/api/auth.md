# Authentication API

## POST /api/v1/auth/login

사용자 로그인을 처리하고 인증 토큰을 발급합니다.

### Endpoint

```
POST /api/v1/auth/login
```

### Request

#### Headers

```
Content-Type: application/json
```

#### Body Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| username  | string | Yes      | 사용자 아이디  |
| password  | string | Yes      | 사용자 비밀번호 |

#### Request Example

```json
{
  "username": "user@example.com",
  "password": "mypassword123"
}
```

### Response

#### Success Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

| Field         | Type   | Description                        |
| ------------- | ------ | ---------------------------------- |
| access_token  | string | API 요청에 사용할 액세스 토큰      |
| refresh_token | string | 액세스 토큰 갱신용 리프레시 토큰   |
| token_type    | string | 토큰 타입 (항상 "bearer")          |

#### Error Response (422 Validation Error)

요청 파라미터 검증 실패 시 반환됩니다.

```json
{
  "detail": [
    {
      "loc": ["body", "username"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

| Field  | Type  | Description                      |
| ------ | ----- | -------------------------------- |
| loc    | array | 에러가 발생한 필드 위치          |
| msg    | string | 에러 메시지                      |
| type   | string | 에러 타입                        |

### Usage Example

#### JavaScript/TypeScript (Fetch API)

```typescript
async function login(username: string, password: string) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  // Store tokens for future API requests
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);

  return data;
}
```

#### Using with axios

```typescript
import axios from 'axios';

async function login(username: string, password: string) {
  try {
    const response = await axios.post('http://localhost:8000/api/v1/auth/login', {
      username,
      password,
    });

    // Store tokens
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Login failed');
    }
    throw error;
  }
}
```

### Notes

- 발급된 `access_token`은 이후 인증이 필요한 API 요청의 `Authorization` 헤더에 포함해야 합니다.
  ```
  Authorization: Bearer {access_token}
  ```
- `access_token`은 만료 시간이 있으므로, 만료 시 `refresh_token`을 사용하여 새로운 `access_token`을 발급받아야 합니다.
- 보안을 위해 토큰은 안전하게 저장해야 하며, XSS 공격에 주의해야 합니다.

---

## POST /api/v1/auth/logout

사용자 로그아웃을 처리하고 리프레시 토큰을 무효화합니다.

### Endpoint

```
POST /api/v1/auth/logout
```

### Request

#### Headers

```
Content-Type: application/json
```

#### Body Parameters

| Parameter     | Type   | Required | Description           |
| ------------- | ------ | -------- | --------------------- |
| refresh_token | string | Yes      | 무효화할 리프레시 토큰 |

#### Request Example

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response

#### Success Response (200 OK)

```json
"string"
```

서버는 성공 시 문자열 메시지를 반환합니다 (예: "Successfully logged out").

#### Error Response (422 Validation Error)

요청 파라미터 검증 실패 시 반환됩니다.

```json
{
  "detail": [
    {
      "loc": ["body", "refresh_token"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

| Field  | Type  | Description                      |
| ------ | ----- | -------------------------------- |
| loc    | array | 에러가 발생한 필드 위치          |
| msg    | string | 에러 메시지                      |
| type   | string | 에러 타입                        |

### Usage Example

#### JavaScript/TypeScript (Fetch API)

```typescript
async function logout(refreshToken: string) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Logout failed');
    }

    const message = await response.json();

    // Clear local tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    return message;
  } catch (error) {
    // Even if API call fails, clear local tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw error;
  }
}
```

#### Using with axios

```typescript
import axios from 'axios';

async function logout(refreshToken: string) {
  try {
    const response = await axios.post('http://localhost:8000/api/v1/auth/logout', {
      refresh_token: refreshToken,
    });

    // Clear local tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    return response.data;
  } catch (error) {
    // Even if API call fails, clear local tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Logout failed');
    }
    throw error;
  }
}
```

### Notes

- 로그아웃 API는 서버에 저장된 리프레시 토큰을 무효화하여 해당 토큰으로 새로운 액세스 토큰을 발급받지 못하도록 합니다.
- 클라이언트는 API 호출과 관계없이 로컬에 저장된 토큰을 반드시 삭제해야 합니다.
- API 호출이 실패하더라도 사용자를 로그아웃 상태로 처리하는 것이 좋습니다.

---

## POST /api/v1/auth/refresh

액세스 토큰이 만료되었을 때 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.

### Endpoint

```
POST /api/v1/auth/refresh
```

### Request

#### Headers

```
Content-Type: application/json
```

#### Body Parameters

| Parameter     | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| refresh_token | string | Yes      | 새 액세스 토큰을 발급받을 리프레시 토큰 |

#### Request Example

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response

#### Success Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

| Field        | Type   | Description                   |
| ------------ | ------ | ----------------------------- |
| access_token | string | 새로 발급된 액세스 토큰        |
| token_type   | string | 토큰 타입 (항상 "bearer")     |

#### Error Response (422 Validation Error)

요청 파라미터 검증 실패 시 반환됩니다.

```json
{
  "detail": [
    {
      "loc": ["body", "refresh_token"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

| Field  | Type  | Description                      |
| ------ | ----- | -------------------------------- |
| loc    | array | 에러가 발생한 필드 위치          |
| msg    | string | 에러 메시지                      |
| type   | string | 에러 타입                        |

### Usage Example

#### JavaScript/TypeScript (Fetch API)

```typescript
async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Token refresh failed');
    }

    const data = await response.json();

    // Update stored access token
    localStorage.setItem('access_token', data.access_token);

    return data;
  } catch (error) {
    // If refresh fails, logout user
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw error;
  }
}
```

#### Using with axios

```typescript
import axios from 'axios';

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });

    // Update stored access token
    localStorage.setItem('access_token', response.data.access_token);

    return response.data;
  } catch (error) {
    // If refresh fails, logout user
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';

    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Token refresh failed');
    }
    throw error;
  }
}
```

#### Automatic Token Refresh (Axios Interceptor)

```typescript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Request interceptor to add access token
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Refresh the token
        const response = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Notes

- 액세스 토큰은 보안을 위해 짧은 만료 시간을 가지며, 리프레시 토큰은 더 긴 만료 시간을 가집니다.
- 리프레시 토큰이 만료되거나 유효하지 않으면 사용자를 로그인 페이지로 리다이렉트해야 합니다.
- API 응답에는 새로운 리프레시 토큰이 포함되지 않으므로, 기존 리프레시 토큰을 계속 사용합니다.
- 자동 토큰 갱신을 구현하면 사용자 경험이 향상됩니다 (401 응답 시 자동으로 토큰 갱신 후 재시도).

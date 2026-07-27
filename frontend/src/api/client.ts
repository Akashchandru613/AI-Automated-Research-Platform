import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ZodType } from 'zod';

const API_BASE_URL = 'http://localhost:8000';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
            `${API_BASE_URL}/api/auth/refresh`,
            { refresh_token: refreshToken },
          );
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return client(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Await an axios request and validate its body against a zod schema.
 *
 * Returns the familiar `{ data }` shape so existing call sites keep working. On a
 * schema mismatch we log in development and fall back to the raw payload rather
 * than throwing — a contract drift should surface as a warning during
 * development, not crash the running app.
 */
export async function parseResponse<T>(
  schema: ZodType<T>,
  request: Promise<AxiosResponse<unknown>>,
): Promise<{ data: T }> {
  const response = await request;
  const result = schema.safeParse(response.data);
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn('[api] Response validation failed:', result.error.issues);
    }
    return { data: response.data as T };
  }
  return { data: result.data };
}

export default client;

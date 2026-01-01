import type { AxiosInstance, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

function isAxiosHeaders(value: unknown): value is AxiosHeaders {
  return typeof value === 'object' && value !== null && typeof (value as { set?: unknown }).set === 'function';
}

function hasAuthorizationHeader(config: InternalAxiosRequestConfig): boolean {
  const headers = config.headers;
  if (!headers) return false;

  if (isAxiosHeaders(headers)) {
    return typeof headers.get('Authorization') === 'string';
  }

  const record = headers as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.some((k) => k.toLowerCase() === 'authorization');
}

function setAuthorizationHeader(config: InternalAxiosRequestConfig, value: string): void {
  const headers = config.headers;
  if (isAxiosHeaders(headers)) {
    headers.set('Authorization', value);
    return;
  }

  const next = (headers ?? {}) as Record<string, unknown>;
  next.Authorization = value;
  config.headers = next;
}

/**
 * 每次请求前从 authService 读取当前有效 token 并注入 Authorization。
 * - 若请求已显式设置 Authorization，则不覆盖。
 * - 若 token 无效/过期（authService.getCurrentAccessToken() 返回 null），则不注入。
 */
export function attachAuthHeaderInterceptor(
  axiosInstance: AxiosInstance,
  getAccessToken: () => string | null
): number {
  return axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (config._fgSkipAuthHeader) return config;
      if (hasAuthorizationHeader(config)) return config;

      const token = getAccessToken();
      if (!token) return config;

      setAuthorizationHeader(config, `Bearer ${token}`);
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );
}



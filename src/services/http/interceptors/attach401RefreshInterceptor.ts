import axios, { type AxiosError, type AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export type OnAuthLost = () => void;
export type RefreshFn = () => Promise<boolean>;

function isAxiosHeaders(value: unknown): value is AxiosHeaders {
  return typeof value === 'object' && value !== null && typeof (value as { set?: unknown }).set === 'function';
}

function removeAuthorizationHeader(config: InternalAxiosRequestConfig): void {
  const headers = config.headers;
  if (!headers) return;

  if (isAxiosHeaders(headers)) {
    headers.delete('Authorization');
    return;
  }

  const record = headers as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.toLowerCase() === 'authorization') {
      delete record[key];
    }
  }
  config.headers = record;
}

function isRefreshTokenRequest(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? '';
  return url.includes('/auth/v1/token');
}

/**
 * 401 时自动 refresh_token 静默刷新，并重试原请求一次（防循环：_fgRetried）。
 * 刷新失败才触发 onAuthLost（统一弹登录提示）。
 */
export function attach401RefreshInterceptor(
  axiosInstance: AxiosInstance,
  refresh: RefreshFn,
  onAuthLost: OnAuthLost
): number {
  return axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const axiosError = error as AxiosError<unknown>;
      const status = axiosError.response?.status;
      const config = axiosError.config as InternalAxiosRequestConfig | undefined;

      if (status !== 401 || !config) {
        return Promise.reject(error);
      }

      // prevent recursion / non-applicable requests
      if (config._fgSkip401Refresh) return Promise.reject(error);
      if (config._fgRetried) return Promise.reject(error);
      if (isRefreshTokenRequest(config)) return Promise.reject(error);

      config._fgRetried = true;

      const didRefresh = await refresh();
      if (!didRefresh) {
        onAuthLost();
        return Promise.reject(error);
      }

      // ensure the retried request doesn't reuse stale Authorization header
      removeAuthorizationHeader(config);

      return axiosInstance.request(config);
    }
  );
}



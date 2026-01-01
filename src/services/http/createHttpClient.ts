import axios, { type AxiosInstance } from 'axios';
import { attachAuthHeaderInterceptor } from './interceptors/attachAuthHeaderInterceptor';
import { attach401RefreshInterceptor, type OnAuthLost, type RefreshFn } from './interceptors/attach401RefreshInterceptor';

export interface CreateHttpClientOptions {
  baseURL: string;
  timeout: number;
  defaultHeaders?: Record<string, string>;
  auth: {
    getAccessToken: () => string | null;
    refresh: RefreshFn;
    onAuthLost: OnAuthLost;
  };
}

export function createHttpClient(options: CreateHttpClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.defaultHeaders ?? {}),
    },
  });

  attachAuthHeaderInterceptor(instance, options.auth.getAccessToken);
  attach401RefreshInterceptor(instance, options.auth.refresh, options.auth.onAuthLost);

  return instance;
}



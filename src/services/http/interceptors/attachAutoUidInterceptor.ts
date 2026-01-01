import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export const AUTO_UID = '__AUTO__' as const;

type AnyObject = Record<string, unknown>;

function isObject(value: unknown): value is AnyObject {
  return typeof value === 'object' && value !== null;
}

function deepReplaceAutoUid(value: unknown, uid: string): unknown {
  if (value === AUTO_UID) return uid;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = deepReplaceAutoUid(value[i], uid);
    }
    return value;
  }

  if (isObject(value)) {
    for (const key of Object.keys(value)) {
      value[key] = deepReplaceAutoUid(value[key], uid);
    }
    return value;
  }

  return value;
}

function needsAutoUid(value: unknown): boolean {
  if (value === AUTO_UID) return true;
  if (Array.isArray(value)) return value.some(needsAutoUid);
  if (isObject(value)) return Object.values(value).some(needsAutoUid);
  return false;
}

function replaceAutoUidInUrl(url: string, uid: string): string {
  // handle both raw and encoded token
  const encodedAuto = encodeURIComponent(AUTO_UID);
  const encodedUid = encodeURIComponent(uid);
  return url.split(encodedAuto).join(encodedUid).split(AUTO_UID).join(uid);
}

/**
 * 若请求 data 中出现 uid/user_id === '__AUTO__'，则自动替换为当前用户 uid。
 * - 支持深度替换：data/params/url 任意嵌套
 * - 若需要替换但 uid 为空，则抛出错误（交由上层引导登录）
 */
export function attachAutoUidInterceptor(
  axiosInstance: AxiosInstance,
  getUid: () => string | null,
  onMissingUid?: () => void
): number {
  return axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (config._fgSkipAutoUid) return config;

      const data = config.data;
      const params = (config as unknown as { params?: unknown }).params;
      const url = typeof config.url === 'string' ? config.url : undefined;

      const needs =
        needsAutoUid(data) || needsAutoUid(params) || (url ? url.includes(AUTO_UID) || url.includes(encodeURIComponent(AUTO_UID)) : false);
      if (!needs) return config;

      const uid = getUid();
      if (!uid) {
        onMissingUid?.();
        throw new Error('MISSING_UID');
      }

      if (data !== undefined) {
        config.data = deepReplaceAutoUid(data, uid);
      }
      if (params !== undefined) {
        (config as unknown as { params?: unknown }).params = deepReplaceAutoUid(params, uid);
      }
      if (url) {
        config.url = replaceAutoUidInUrl(url, uid);
      }
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );
}



import { useCallback, useEffect, useMemo, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_KEYS } from '../types/auth';
import { authService } from '../services/auth/authService';
import type { AuthResponse } from '../types/auth';

const storage = new MMKV();

export interface SessionSnapshot {
  uid: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAnonymous: boolean;
  hasValidAuth: boolean;
  isLoggedInRealUser: boolean;
  tokenExpiringSoon: boolean;
}

function readSessionSnapshot(): SessionSnapshot {
  const uid = authService.getCurrentUserId();
  const accessToken = authService.getCurrentAccessToken();
  const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN) || null;
  const expiresAtRaw = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
  const expiresAt = typeof expiresAtRaw === 'number' && expiresAtRaw > 0 ? expiresAtRaw : null;

  const isAnonymous = authService.isAnonymous();
  const hasValidAuth = authService.hasValidAuth();
  const isLoggedInRealUser = authService.isLoggedIn();
  const tokenExpiringSoon = authService.isTokenExpiringSoon();

  return {
    uid,
    accessToken,
    refreshToken,
    expiresAt,
    isAnonymous,
    hasValidAuth,
    isLoggedInRealUser,
    tokenExpiringSoon,
  };
}

/**
 * 统一 session hook（Phase3）：\n
 * - 登录态权威来源：authService + MMKV（STORAGE_KEYS）\n
 * - 通过 MMKV listener 实时同步 UI\n
 */
export function useSession() {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => readSessionSnapshot());

  useEffect(() => {
    const listener = storage.addOnValueChangedListener((changedKey) => {
      const relevantKeys = new Set<string>([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.UID,
        STORAGE_KEYS.EXPIRES_AT,
        STORAGE_KEYS.IS_ANONYMOUS,
        STORAGE_KEYS.HAS_LOGGED_IN_BEFORE,
      ]);

      if (!changedKey || relevantKeys.has(changedKey)) {
        setSnapshot(readSessionSnapshot());
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  const refresh = useCallback(() => {
    setSnapshot(readSessionSnapshot());
  }, []);

  const ensureAuthenticated = useCallback(async (): Promise<AuthResponse> => {
    const result = await authService.ensureAuthenticated();
    refresh();
    return result;
  }, [refresh]);

  const requireRealUser = useCallback(async (): Promise<AuthResponse> => {
    const result = await authService.requireRealUser();
    refresh();
    return result;
  }, [refresh]);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    refresh();
  }, [refresh]);

  const api = useMemo(
    () => ({
      ...snapshot,
      ensureAuthenticated,
      requireRealUser,
      logout,
      refresh,
    }),
    [snapshot, ensureAuthenticated, requireRealUser, logout, refresh]
  );

  return api;
}



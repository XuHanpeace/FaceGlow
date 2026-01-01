import { useMemo } from 'react';
import { authService } from '../services/auth';
import type { AuthCredentials } from '../types/auth';
import { useSession } from './useSession';

export interface AuthUser {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export const useAuthState = () => {
  const session = useSession();

  const user = useMemo<AuthUser | null>(() => {
    if (!session.uid || !session.accessToken || !session.expiresAt) return null;
    return {
      uid: session.uid,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? '',
      expiresIn: Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)),
      expiresAt: session.expiresAt,
    };
  }, [session.uid, session.accessToken, session.refreshToken, session.expiresAt]);

  const setAuthData = (authData: AuthUser) => {
    const credentials: AuthCredentials = {
      uid: authData.uid,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      expiresIn: authData.expiresIn,
      expiresAt: authData.expiresAt,
      isAnonymous: false,
    };
    authService.setAuthCredentials(credentials);
    session.refresh();
  };

  const checkLoginState = async () => {
    session.refresh();
  };

  return {
    isLoggedIn: session.isLoggedInRealUser,
    user,
    isLoading: false,
    logout: session.logout,
    setAuthData,
    checkLoginState,
  };
};

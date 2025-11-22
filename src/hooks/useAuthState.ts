import { useState, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { authService } from '../services/auth';
import { useTypedSelector } from '../store/hooks';

// 创建MMKV存储实例
const storage = new MMKV();

// 存储键名
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  UID: 'uid',
  EXPIRES_AT: 'expiresAt',
  USER_INFO: 'userInfo',
  HAS_LOGGED_IN_BEFORE: 'hasLoggedInBefore', // 是否曾经登录过（用于决定登录页默认模式）
} as const;

export interface AuthUser {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export const useAuthState = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 从Redux获取认证状态
  const authState = useTypedSelector((state) => state.auth);

  // 检查登录状态
  const checkLoginState = async () => {
    try {
      setIsLoading(true);
      
      // 从本地存储读取认证信息
      const accessToken = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
      const uid = storage.getString(STORAGE_KEYS.UID);
      const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
      
      if (accessToken && refreshToken && uid && expiresAt) {
        // 检查token是否过期
        const now = Date.now();
        if (now < expiresAt) {
          // token有效
          const userInfo: AuthUser = {
            uid,
            accessToken,
            refreshToken,
            expiresIn: expiresAt - now,
            expiresAt,
          };
          setUser(userInfo);
          setIsLoggedIn(true);
        } else {
          // token过期，尝试刷新
          console.log('⏰ Token已过期，尝试刷新...');
          try {
            const result = await authService.refreshAccessToken();
            if (result.success && result.data) {
              console.log('✅ Token刷新成功，更新用户状态');
              setUser(result.data);
              setIsLoggedIn(true);
            } else {
              console.log('❌ Token刷新失败，清除认证数据:', result.error?.message);
              // 刷新失败，清除存储
              clearAuthData();
            }
          } catch (error: any) {
            console.log('❌ Token刷新异常，清除认证数据:', error.message);
            // 刷新失败，清除存储
            clearAuthData();
          }
        }
      } else {
        // 没有认证信息
        clearAuthData();
      }
    } catch (error) {
      console.log('检查登录状态失败:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // 清除认证数据
  const clearAuthData = () => {
    storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
    storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    storage.delete(STORAGE_KEYS.UID);
    storage.delete(STORAGE_KEYS.EXPIRES_AT);
    storage.delete(STORAGE_KEYS.USER_INFO);
    setUser(null);
    setIsLoggedIn(false);
  };

  // 登出
  const logout = async () => {
    try {
      if (user?.accessToken) {
        await authService.logout();
      }
    } catch (error) {
      console.log('登出API调用失败:', error);
    } finally {
      clearAuthData();
    }
  };

  // 设置认证数据
  const setAuthData = (authData: AuthUser) => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    storage.set(STORAGE_KEYS.UID, authData.uid);
    storage.set(STORAGE_KEYS.EXPIRES_AT, authData.expiresAt);
    storage.set(STORAGE_KEYS.USER_INFO, JSON.stringify(authData));
    
    // 标记为曾经登录过（因为 setAuthData 通常用于真实用户登录/注册）
    // 匿名用户通常不会调用 setAuthData
    storage.set(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE, true);
    
    setUser(authData);
    setIsLoggedIn(true);
  };

  // 同步authSlice的状态到本地状态
  useEffect(() => {
    if (authState.uid && authState.token) {
      // 从Redux状态更新本地状态
      const authUser: AuthUser = {
        uid: authState.uid,
        accessToken: authState.token,
        refreshToken: authState.token, // 暂时使用相同token
        expiresIn: 3600, // 1小时
        expiresAt: Date.now() + 3600000, // 1小时后过期
      };
      setUser(authUser);
      setIsLoggedIn(true);
      setIsLoading(false);
    } else {
      // 如果没有Redux状态，检查本地存储
      checkLoginState();
    }
  }, [authState.uid, authState.token]);

  // 初始化时检查登录状态
  useEffect(() => {
    // 只有在没有Redux状态时才检查本地存储
    if (!authState.uid && !authState.token) {
      checkLoginState();
    }
  }, []);

  return {
    isLoggedIn,
    user,
    isLoading,
    logout,
    setAuthData,
    checkLoginState,
  };
};

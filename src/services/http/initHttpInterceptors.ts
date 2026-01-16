import axios, { type AxiosInstance } from 'axios';
import { attachAuthHeaderInterceptor } from './interceptors/attachAuthHeaderInterceptor';
import { attach401RefreshInterceptor } from './interceptors/attach401RefreshInterceptor';
import { authService } from '../auth/authService';

let didInitGlobal = false;

function getLoginPromptService(): { showManually: (reason: 'anonymous' | 'authLost') => void } {
  const mod = require('../loginPromptService') as unknown as {
    loginPromptService: { showManually: (reason: 'anonymous' | 'authLost') => void };
  };
  return mod.loginPromptService;
}

export function attachInterceptorsToAxiosInstance(instance: AxiosInstance): void {
  attachAuthHeaderInterceptor(instance, () => authService.getCurrentAccessToken());
  attach401RefreshInterceptor(
    instance,
    async () => {
      const result = await authService.refreshTokenIfNeeded('force');
      return result.success;
    },
    () => {
      // 不再为 token 刷新失败自动显示登录提示，允许匿名用户继续使用应用（符合 App Store 审核指南 5.1.1）
      // getLoginPromptService().showManually('authLost');
    }
  );
}

/**
 * 初始化全局 axios 的拦截器（用于所有直接 axios.get/post 的调用点）。
 * 幂等：可安全多次调用。
 */
export function initHttpInterceptors(): void {
  if (didInitGlobal) return;
  didInitGlobal = true;
  attachInterceptorsToAxiosInstance(axios);
}



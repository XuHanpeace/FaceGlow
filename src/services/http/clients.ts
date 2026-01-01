import type { AxiosInstance } from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { authService } from '../auth/authService';
import { createHttpClient } from './createHttpClient';
import { attachAutoUidInterceptor } from './interceptors/attachAutoUidInterceptor';

function getLoginPromptService(): { showManually: (reason: 'anonymous' | 'authLost') => void } {
  const mod = require('../loginPromptService') as unknown as {
    loginPromptService: { showManually: (reason: 'anonymous' | 'authLost') => void };
  };
  return mod.loginPromptService;
}

const CLOUDBASE_CONFIG = getCloudbaseConfig();

// 你们目前云函数固定使用的 HTTP 访问域名（项目里多处 hardcode 同一个值）
const CLOUD_FUNCTION_BASE_URL = 'https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com';

const auth = {
  getAccessToken: () => authService.getCurrentAccessToken(),
  refresh: async () => {
    const result = await authService.refreshTokenIfNeeded('force');
    return result.success;
  },
  onAuthLost: () => {
    getLoginPromptService().showManually('authLost');
  },
};

export const dbClient: AxiosInstance = createHttpClient({
  baseURL: `${CLOUDBASE_CONFIG.DATABASE_API.BASE_URL}/${CLOUDBASE_CONFIG.DATABASE_API.VERSION}`,
  timeout: CLOUDBASE_CONFIG.DATABASE_API.TIMEOUT,
  auth,
});
attachAutoUidInterceptor(dbClient, () => authService.getCurrentUserId(), () => {
  getLoginPromptService().showManually('anonymous');
});

export const functionClient: AxiosInstance = createHttpClient({
  baseURL: CLOUD_FUNCTION_BASE_URL,
  timeout: CLOUDBASE_CONFIG.API.TIMEOUT,
  auth,
});
attachAutoUidInterceptor(functionClient, () => authService.getCurrentUserId(), () => {
  getLoginPromptService().showManually('anonymous');
});

export const authClient: AxiosInstance = createHttpClient({
  baseURL: CLOUDBASE_CONFIG.AUTH_API.BASE_URL,
  timeout: CLOUDBASE_CONFIG.API.TIMEOUT,
  auth,
});



import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { MMKV } from 'react-native-mmkv';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { CloudBaseAuthResponse, RegisterRequest, LoginRequest, AuthCredentials, STORAGE_KEYS } from '../../types/auth';
import { userDataService } from '../database/userDataService';
import { aegisService } from '../monitoring/aegisService';
import { attachAuthHeaderInterceptor } from '../http/interceptors/attachAuthHeaderInterceptor';
import { attach401RefreshInterceptor } from '../http/interceptors/attach401RefreshInterceptor';

// 获取腾讯云开发配置
const CLOUDBASE_CONFIG = getCloudbaseConfig();

// 创建MMKV存储实例
const storage = new MMKV();

/**
 * 生成设备ID
 */
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 获取或生成设备ID（缓存到本地）
 */
function getOrCreateDeviceId(): string {
  const cachedDeviceId = storage.getString(CLOUDBASE_CONFIG.STORAGE.KEYS.DEVICE_ID);
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  
  const newDeviceId = generateDeviceId();
  storage.set(CLOUDBASE_CONFIG.STORAGE.KEYS.DEVICE_ID, newDeviceId);
  return newDeviceId;
}

/**
 * 腾讯云官方认证服务
 * 使用官方HTTP API进行用户认证
 */
export class CloudBaseAuthService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${CLOUDBASE_CONFIG.AUTH_API.BASE_URL}`,
      timeout: CLOUDBASE_CONFIG.API.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // 对 auth/verification 相关接口：默认跳过 401 refresh（避免登录失败/验证码失败被误判成 authLost）
    // 同时默认不自动注入 Authorization（这些接口通常不需要 bearer）。
    this.axiosInstance.interceptors.request.use((config) => {
      config._fgSkip401Refresh = true;
      config._fgSkipAuthHeader = true;
      return config;
    });

    // 仍挂载统一拦截器（保持出口点一致）；由于上面的 skip 标记，这里基本不会生效
    attachAuthHeaderInterceptor(this.axiosInstance, () => null);
    attach401RefreshInterceptor(this.axiosInstance, async () => false, () => {});
  }

  /**
   * 用户注册
   * @param requestData 注册请求数据
   * @returns Promise<CloudBaseAuthResponse>
   */
  async signup(requestData: RegisterRequest): Promise<CloudBaseAuthResponse> {
    try {
      // 获取设备ID
      const deviceId = getOrCreateDeviceId();
      
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.SIGNUP,
        requestData,
        {
          headers: {
            'x-device-id': deviceId,
          }
        }
      );

      return response.data;
    } catch (error: any) {
      // 埋点：注册API错误
      const errorMessage = error.response?.data?.error_description || error.response?.data?.error || '注册失败';
      const statusCode = error.response?.status;
      aegisService.reportApiError('/auth/v1/signup', errorMessage, statusCode);
      
      if (error.response?.data) {
        throw new Error(errorMessage);
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 用户登录
   * @param requestData 登录请求数据
   * @returns Promise<CloudBaseAuthResponse>
   */
  async login(requestData: LoginRequest): Promise<CloudBaseAuthResponse> {
    try {
      // 获取设备ID
      const deviceId = getOrCreateDeviceId();
      
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.LOGIN,
        requestData,
        {
          headers: {
            'x-device-id': deviceId,
          }
        }
      );

      // 登录成功后，检查账户状态（是否已被删除）
      // 注意：在查询用户信息之前，需要临时保存 access_token，以便 databaseService 能够使用它
      if (response.data && response.data.sub && response.data.access_token) {
        try {
          // 临时保存 access_token 到存储中，以便 databaseService 的请求拦截器能够获取到
          const originalToken = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
          storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.data.access_token);
          
          try {
            // 临时保存 UID，以便 authService.getCurrentUserId() 能够获取到
            const originalUid = storage.getString(STORAGE_KEYS.UID);
            storage.set(STORAGE_KEYS.UID, response.data.sub);
            
            // uid 已临时写入 storage，service 内部可自动获取，无需显式传 uid
            const userResult = await userDataService.getUserByUid();
            
            // 恢复原始 token 和 UID（如果存在）或清除临时数据
            if (originalToken) {
              storage.set(STORAGE_KEYS.ACCESS_TOKEN, originalToken);
            } else {
              storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
            }
            
            if (originalUid) {
              storage.set(STORAGE_KEYS.UID, originalUid);
            } else {
              storage.delete(STORAGE_KEYS.UID);
            }
            
            if (userResult.success && userResult.data?.record) {
              const accountStatus = userResult.data.record.accountStatus;
              // 如果账户已被删除（accountStatus === '1'），阻止登录
              if (accountStatus === '1') {
                throw new Error('您的账户已被删除。如需恢复账户，请发送邮件至 support@faceglow.app 申请恢复。');
              }
            }
          } catch (checkError: any) {
            // 恢复原始 token 和 UID（如果存在）或清除临时数据
            if (originalToken) {
              storage.set(STORAGE_KEYS.ACCESS_TOKEN, originalToken);
            } else {
              storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
            }
            
            const originalUid = storage.getString(STORAGE_KEYS.UID);
            if (originalUid && originalUid !== response.data.sub) {
              storage.set(STORAGE_KEYS.UID, originalUid);
            } else if (!originalUid) {
              storage.delete(STORAGE_KEYS.UID);
            }
            
            // 如果是账户已删除的错误，直接抛出
            if (checkError.message && checkError.message.includes('账户已被删除')) {
              throw checkError;
            }
            // 其他错误（如用户不存在或网络错误）不影响登录流程
            console.warn('检查账户状态时出错:', checkError);
          }
        } catch (error: any) {
          // 如果是账户已删除的错误，直接抛出
          if (error.message && error.message.includes('账户已被删除')) {
            throw error;
          }
          // 其他错误不影响登录流程
          console.warn('检查账户状态时出错:', error);
        }
      }

      console.log('✅ 登录成功');
      return response.data;
    } catch (error: any) {
      // 如果是账户已删除的错误，直接抛出
      if (error.message && error.message.includes('账户已被删除')) {
        // 埋点：登录失败-账户已删除
        aegisService.reportError('fg_error_login_failed', {
          error_code: 'ACCOUNT_DELETED',
          error_message: error.message,
        });
        throw error;
      }
      
      // 埋点：登录API错误
      const errorData = error.response?.data;
      const errorMessage = errorData?.error_description || errorData?.error || error.message || '登录失败';
      const statusCode = error.response?.status;
      aegisService.reportApiError('/auth/v1/signin', errorMessage, statusCode);
      
      // 增强错误信息，保留错误代码和错误类型
      if (error.response?.data) {
        const errorCode = errorData.error_code;
        const errorType = errorData.error;
        
        // 创建一个增强的错误对象，包含错误代码和类型
        const enhancedError: any = new Error(errorMessage);
        enhancedError.error_code = errorCode;
        enhancedError.error = errorType;
        enhancedError.error_description = errorMessage;
        throw enhancedError;
      }
      throw new Error(error.message || '网络请求失败');
    }
  }

  /**
   * 匿名登录
   * @returns Promise<CloudBaseAuthResponse>
   */
  async anonymousLogin(): Promise<CloudBaseAuthResponse> {
    try {
      const deviceId = getOrCreateDeviceId();
      console.log('🔑 匿名登录使用设备ID:', deviceId);
      
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.ANONYMOUS,
        {},
        {
          headers: {
            'x-device-id': deviceId,
          }
        }
      );

      console.log('✅ 匿名登录成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 匿名登录失败:', error.response?.data || error.message);
      if (error.response?.data) {
        throw new Error(error.response.data.error_description || error.response.data.error || '匿名登录失败');
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @param accessToken 当前访问令牌（用于Authorization头）
   * @returns Promise<CloudBaseAuthResponse>
   */
  async refreshToken(refreshToken: string, accessToken?: string): Promise<CloudBaseAuthResponse> {
    try {
      const deviceId = getOrCreateDeviceId();
      
      const requestData = {
        grant_type: "refresh_token",
        refresh_token: refreshToken
      };
      
      const headers: any = {
        'x-device-id': deviceId,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.REFRESH,
        requestData,
        {
          headers
        }
      );

      console.log('✅ Token刷新成功');
      return response.data;
    } catch (error: any) {
      console.error('❌ Token刷新失败:', error.response?.data || error.message);
      if (error.response?.data) {
        throw new Error(error.response.data.error_description || error.response.data.error || '令牌刷新失败');
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 用户登出
   * @param accessToken 访问令牌
   * @returns Promise<void>
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.LOGOUT,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    } catch (error: any) {
      // 登出失败不影响本地清理
      console.warn('Logout API call failed:', error);
    }
  }

  /**
   * 获取用户信息
   * @param accessToken 访问令牌
   * @returns Promise<any>
   */
  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.axiosInstance.get(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.PROFILE,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error_description || error.response.data.error || '获取用户信息失败');
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 将腾讯云API响应转换为内部格式
   * @param response 腾讯云API响应
   * @param forceAnonymous 是否强制设置为匿名（用于匿名登录）
   * @returns AuthCredentials
   */
  convertToAuthCredentials(response: CloudBaseAuthResponse, forceAnonymous?: boolean): AuthCredentials {
    // 只有明确是匿名登录时才设置为 true
    // 如果 forceAnonymous 没有传值，则根据 scope 判断，但默认为 false
    const isAnonymous = forceAnonymous === true || response.scope === 'anonymous';
    
    return {
      uid: response.sub,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
      expiresAt: Date.now() + (response.expires_in * 1000),
      isAnonymous,
    };
  }
}

// 导出单例实例
export const cloudBaseAuthService = new CloudBaseAuthService();

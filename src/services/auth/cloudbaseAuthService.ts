import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { MMKV } from 'react-native-mmkv';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { CloudBaseAuthResponse, RegisterRequest, LoginRequest, AuthCredentials } from '../../types/auth';

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
      if (error.response?.data) {
        throw new Error(error.response.data.error_description || error.response.data.error || '注册失败');
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

      console.log('✅ 登录成功');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error_description || error.response.data.error || '登录失败');
      }
      throw new Error('网络请求失败');
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

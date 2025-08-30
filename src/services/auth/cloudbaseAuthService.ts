import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { CloudBaseAuthResponse, RegisterRequest, LoginRequest, AuthCredentials } from '../../types/auth';

// 获取腾讯云开发配置
const CLOUDBASE_CONFIG = getCloudbaseConfig();

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
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.SIGNUP,
        requestData
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
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.LOGIN,
        requestData
      );

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
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.ANONYMOUS
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error_description || error.response.data.error || '匿名登录失败');
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @returns Promise<CloudBaseAuthResponse>
   */
  async refreshToken(refreshToken: string): Promise<CloudBaseAuthResponse> {
    try {
      const response: AxiosResponse<CloudBaseAuthResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.REFRESH,
        { refresh_token: refreshToken }
      );

      return response.data;
    } catch (error: any) {
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
   * @returns AuthCredentials
   */
  convertToAuthCredentials(response: CloudBaseAuthResponse): AuthCredentials {
    return {
      uid: response.sub,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
      expiresAt: Date.now() + (response.expires_in * 1000),
    };
  }
}

// 导出单例实例
export const cloudBaseAuthService = new CloudBaseAuthService();

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CLOUDBASE_CONFIG, storage, apiPaths } from './cloudbaseConfig';

/**
 * CloudBase HTTP API 服务类
 */
class CloudBaseHttpApi {
  private env: string;
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.env = CLOUDBASE_CONFIG.env;
    this.baseUrl = CLOUDBASE_CONFIG.baseUrl;
    this.timeout = CLOUDBASE_CONFIG.timeout;
  }

  /**
   * 获取 AccessToken
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(storage.accessTokenKey);
      return token;
    } catch (error) {
      console.error('获取 AccessToken 失败:', error);
      return null;
    }
  }

  /**
   * 设置 AccessToken
   */
  private async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(storage.accessTokenKey, token);
    } catch (error) {
      console.error('保存 AccessToken 失败:', error);
    }
  }

  /**
   * 匿名登录获取 AccessToken
   * 使用 axios 实现，根据您提供的配置
   */
  async anonymousLogin(): Promise<boolean> {
    try {
      const data = JSON.stringify({});
      
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.baseUrl}${apiPaths.anonymousLogin}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-device-id': '1234',
        },
        data: data,
        timeout: this.timeout,
      };

      console.log('匿名登录请求配置:', config);
      const response = await axios(config);
      
      if (response.status === 200 && response.data) {
        // 根据实际响应结构获取 access_token
        const accessToken = response.data.access_token || response.data.token;
        if (accessToken) {
          await this.setAccessToken(accessToken);
          console.log('匿名登录成功，获取到 access token');
          return true;
        }
      }
      
      console.log('匿名登录响应:', response.data);
      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('匿名登录失败 - HTTP错误:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
      } else {
        console.error('匿名登录失败:', error);
      }
      return false;
    }
  }

  /**
   * 调用云函数
   * 根据 CloudBase HTTP API 文档实现
   */
  async callFunction<T>(functionName: string, data: any = {}): Promise<T> {
    try {
      // 确保已登录
      let accessToken = await this.getAccessToken();
      if (!accessToken) {
        const loginSuccess = await this.anonymousLogin();
        if (!loginSuccess) {
          throw new Error('登录失败，无法调用云函数');
        }
        accessToken = await this.getAccessToken();
      }

      // 构建请求体
      const requestBody = {
        data,
        env: this.env,
        // 如果需要其他参数，可以在这里添加
      };
      console.log('requestBody', requestBody);

      const response = await axios({
        method: 'POST',
        url: `https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com/${functionName}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
        data: requestBody,
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('调用云函数失败 - HTTP错误:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw new Error(`HTTP ${error.response?.status}: ${error.response?.data?.message || error.message}`);
      } else {
        console.error('调用云函数失败:', error);
        throw error;
      }
    }
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      // 验证 token 是否有效
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}${apiPaths.authCheck}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        timeout: this.timeout,
      });

      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('检查登录状态失败 - HTTP错误:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
        });
      } else {
        console.error('检查登录状态失败:', error);
      }
      return false;
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(storage.accessTokenKey);
      await AsyncStorage.removeItem(storage.userInfoKey);
    } catch (error) {
      console.error('登出失败:', error);
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<any> {
    try {
      const userInfo = await AsyncStorage.getItem(storage.userInfoKey);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 设置用户信息
   */
  async setUserInfo(userInfo: any): Promise<void> {
    try {
      await AsyncStorage.setItem(storage.userInfoKey, JSON.stringify(userInfo));
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }
}

// 创建单例实例
export const cloudbaseHttpApi = new CloudBaseHttpApi();

// 导出便捷方法
export const {
  anonymousLogin,
  callFunction,
  checkLoginStatus,
  logout,
  getUserInfo,
  setUserInfo,
} = cloudbaseHttpApi;

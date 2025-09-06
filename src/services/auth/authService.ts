import { MMKV } from 'react-native-mmkv';
import { cloudBaseAuthService } from './cloudbaseAuthService';
import { verificationService } from './verificationService';
import { AuthCredentials, RegisterRequest, LoginRequest, AuthResponse, CloudBaseAuthResponse, SendVerificationResponse, STORAGE_KEYS } from '../../types/auth';
import { userDataService } from '../database/userDataService';

// 创建MMKV存储实例
const storage = new MMKV();

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @returns string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成匿名用户名
 * @returns string
 */
function generateAnonymousUsername(): string {
  const randomSuffix = generateRandomString(6);
  return `Anonymous_${randomSuffix}`;
}

/**
 * 用户认证服务
 * 使用腾讯云官方HTTP API
 */
export class AuthService {
  /**
   * 发送手机验证码
   * @param phoneNumber 手机号
   * @returns Promise<SendVerificationResponse>
   */
  async sendPhoneVerification(phoneNumber: string): Promise<SendVerificationResponse> {
    try {
      const response = await verificationService.sendPhoneVerification(phoneNumber, 'NOT_USER');
      return response;
    } catch (error: any) {
      throw new Error(error.message || '发送验证码失败');
    }
  }

  /**
   * 发送邮箱验证码
   * @param email 邮箱地址
   * @returns Promise<SendVerificationResponse>
   */
  async sendEmailVerification(email: string): Promise<SendVerificationResponse> {
    try {
      const response = await verificationService.sendEmailVerification(email, 'NOT_USER');
      return response;
    } catch (error: any) {
      throw new Error(error.message || '发送验证码失败');
    }
  }

  /**
   * 使用手机号注册
   * @param phoneNumber 手机号
   * @param username 用户名
   * @param verificationCode 验证码
   * @param verificationId 验证码ID（从发送验证码响应中获取）
   * @param password 密码（可选）
   * @returns Promise<AuthResponse>
   */
  async registerWithPhone(
    phoneNumber: string,
    username: string,
    verificationCode: string,
    verificationId: string,
    password?: string
  ): Promise<AuthResponse> {
    try {
      // 验证用户名格式
      const usernameRegex = /^$|^[a-z][0-9a-z_-]{5,24}$/;
      if (!usernameRegex.test(username)) {
        return {
          success: false,
          error: {
            code: 'INVALID_USERNAME',
            message: '用户名格式不正确，必须以小写字母开头，长度6-25位，只能包含小写字母、数字、下划线和连字符',
          },
        };
      }
      
      // 验证验证码
      const verificationToken = await verificationService.verifyCode(verificationId, verificationCode);
      
      // 构建注册请求数据
      const requestData: RegisterRequest = {
        phone_number: phoneNumber.startsWith('+86') ? phoneNumber : `+86 ${phoneNumber}`,
        username,
        verification_token: verificationToken, // 使用验证码验证后返回的token
        password,
      };

      // 调用腾讯云官方注册API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.signup(requestData);

      // 转换为内部格式
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response);

      // 保存认证信息到本地存储
      this.saveAuthCredentials(credentials);

      // 注册成功后，自动创建用户信息
      try {
        await userDataService.createUser({
          uid: credentials.uid,
          username: username,
          phone_number: phoneNumber.startsWith('+86') ? phoneNumber : `+86 ${phoneNumber}`,
          name: username, // 默认使用用户名作为昵称
        });
      } catch (error) {
        console.warn('Failed to create user info:', error);
        // 不影响注册流程
      }

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REGISTER_ERROR',
          message: error.message || '注册失败',
        },
      };
    }
  }

  /**
   * 使用用户名和密码登录
   * @param username 用户名
   * @param password 密码
   * @returns Promise<AuthResponse>
   */
  async loginWithPassword(username: string, password: string): Promise<AuthResponse> {
    try {
      const requestData: LoginRequest = { username, password };
      
      // 调用腾讯云官方登录API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.login(requestData);

      // 转换为内部格式
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response);

      // 保存认证信息到本地存储
      this.saveAuthCredentials(credentials);

      // // 登录成功后，获取用户信息并更新登录时间
      // try {
      //   // 获取用户信息
      //   const userInfo = await userDataService.getUserByUid(credentials.uid);
      //   if (userInfo.success && userInfo.data) {
      //     // 用户存在，更新登录信息
      //    console.log('frog.userInfo', userInfo);
      //   } 
      // } catch (error) {
      //   console.warn('Failed to get/update user info:', error);
      //   // 不影响登录流程
      // }

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: error.message || '登录失败',
        },
      };
    }
  }

  /**
   * 匿名登录
   * @returns Promise<AuthResponse>
   */
  async anonymousLogin(): Promise<AuthResponse> {
    try {
      // 调用腾讯云官方匿名登录API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.anonymousLogin();

      // 转换为内部格式
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response);

      // 保存认证信息到本地存储
      this.saveAuthCredentials(credentials);

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ANONYMOUS_LOGIN_ERROR',
          message: error.message || '匿名登录失败',
        },
      };
    }
  }

  /**
   * 刷新访问令牌
   * @returns Promise<AuthResponse>
   */
  async refreshAccessToken(): Promise<AuthResponse> {
    try {
      console.log('🔄 开始刷新AccessToken...');
      
      const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        console.log('❌ 刷新失败: 没有可用的刷新令牌');
        return {
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: '没有可用的刷新令牌',
          },
        };
      }

      console.log('📡 调用CloudBase刷新API...');
      
      // 调用腾讯云官方刷新API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.refreshToken(refreshToken);

      console.log('✅ CloudBase刷新API调用成功:', {
        tokenType: response.token_type,
        expiresIn: response.expires_in,
        scope: response.scope,
        sub: response.sub,
      });

      // 转换为内部格式
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response);

      console.log('🔄 更新本地存储的认证信息...');

      // 更新本地存储
      this.saveAuthCredentials(credentials);

      console.log('🎉 AccessToken刷新成功!');

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      console.log('❌ AccessToken刷新失败:', error.message);
      return {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: error.message || '令牌刷新失败',
        },
      };
    }
  }

  /**
   * 登出
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      const accessToken = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        // 调用腾讯云官方登出API
        await cloudBaseAuthService.logout(accessToken);
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // 清除本地存储的认证信息
      this.clearAuthCredentials();
    }
  }

  /**
   * 检查用户是否已登录
   * @returns boolean
   */
  isLoggedIn(): boolean {
    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
    
    if (!token || !expiresAt) {
      console.log('❌ 用户未登录: 缺少token或过期时间');
      return false;
    }

    const currentTime = Date.now();
    const isExpired = currentTime >= expiresAt;
    
    if (isExpired) {
      console.log('⏰ Token已过期:', {
        currentTime: new Date(currentTime).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        expiredMinutes: Math.round((currentTime - expiresAt) / 60000),
      });
      return false;
    }

    const remainingMinutes = Math.round((expiresAt - currentTime) / 60000);
    console.log('✅ Token有效，剩余时间:', `${remainingMinutes}分钟`);
    
    return true;
  }

  /**
   * 获取当前用户ID
   * @returns string | null
   */
  getCurrentUserId(): string | null {
    const uid = storage.getString(STORAGE_KEYS.UID);
    return uid || null;
  }

  /**
   * 获取当前访问令牌
   * @returns string | null
   */
  getCurrentAccessToken(): string | null {
    if (!this.isLoggedIn()) {
      return null;
    }
    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    return token || null;
  }

  /**
   * 保存认证信息到本地存储
   * @param credentials 认证信息
   */
  private saveAuthCredentials(credentials: AuthCredentials): void {
    console.log('🔐 保存认证信息到本地存储:', {
      uid: credentials.uid,
      expiresAt: new Date(credentials.expiresAt).toISOString(),
      expiresIn: credentials.expiresIn,
    });
    
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, credentials.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, credentials.refreshToken);
    storage.set(STORAGE_KEYS.UID, credentials.uid);
    storage.set(STORAGE_KEYS.EXPIRES_AT, credentials.expiresAt);
  }

  /**
   * 清除本地存储的认证信息
   */
  private clearAuthCredentials(): void {
    console.log('🗑️ 清除本地存储的认证信息');
    storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
    storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    storage.delete(STORAGE_KEYS.UID);
    storage.delete(STORAGE_KEYS.EXPIRES_AT);
    storage.delete(STORAGE_KEYS.USER_INFO);
    console.log('✅ 认证信息清除完成');
  }

  /**
   * 检查令牌是否即将过期（30分钟内）
   * @returns boolean
   */
  isTokenExpiringSoon(): boolean {
    const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) {
      console.log('⚠️ Token即将过期检查: 缺少过期时间，认为即将过期');
      return true;
    }

    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    const isExpiringSoon = currentTime >= (expiresAt - thirtyMinutes);
    
    const remainingMinutes = Math.round((expiresAt - currentTime) / 60000);
    
    if (isExpiringSoon) {
      console.log('⚠️ Token即将过期:', {
        remainingMinutes,
        expiresAt: new Date(expiresAt).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
      });
    } else {
      console.log('✅ Token未即将过期，剩余时间:', `${remainingMinutes}分钟`);
    }

    return isExpiringSoon;
  }

  /**
   * 自动刷新令牌（如果即将过期）
   * @returns Promise<boolean>
   */
  async autoRefreshTokenIfNeeded(): Promise<boolean> {
    console.log('🔍 检查是否需要自动刷新Token...');
    
    if (this.isTokenExpiringSoon()) {
      console.log('🚀 Token即将过期，开始自动刷新...');
      try {
        const result = await this.refreshAccessToken();
        if (result.success) {
          console.log('✅ 自动刷新Token成功');
          return true;
        } else {
          console.log('❌ 自动刷新Token失败:', result.error?.message);
          return false;
        }
      } catch (error: any) {
        console.error('❌ 自动刷新Token异常:', error.message);
        return false;
      }
    } else {
      console.log('✅ Token未即将过期，无需刷新');
      return true;
    }
  }

  /**
   * 手动检查并刷新token（如果过期）
   * @returns Promise<AuthResponse>
   */
  async checkAndRefreshToken(): Promise<AuthResponse> {
    console.log('🔍 手动检查Token状态...');
    
    if (!this.isLoggedIn()) {
      console.log('❌ Token无效或已过期，尝试刷新...');
      return await this.refreshAccessToken();
    } else {
      console.log('✅ Token有效，无需刷新');
      const token = this.getCurrentAccessToken();
      const uid = this.getCurrentUserId();
      const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
      
      if (token && uid && expiresAt) {
        return {
          success: true,
          data: {
            uid,
            accessToken: token,
            refreshToken: storage.getString(STORAGE_KEYS.REFRESH_TOKEN) || '',
            expiresIn: Math.round((expiresAt - Date.now()) / 1000),
            expiresAt,
          },
        };
      } else {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN_DATA',
            message: 'Token数据不完整',
          },
        };
      }
    }
  }
}

// 导出单例实例
export const authService = new AuthService();

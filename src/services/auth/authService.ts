import { MMKV } from 'react-native-mmkv';
import { cloudBaseAuthService } from './cloudbaseAuthService';
import { verificationService } from './verificationService';
import { AuthCredentials, RegisterRequest, LoginRequest, AuthResponse, CloudBaseAuthResponse, SendVerificationResponse, STORAGE_KEYS } from '../../types/auth';
import { userDataService } from '../database/userDataService';
import { longTermAuthService } from './longTermAuthService';
import { aegisService } from '../monitoring/aegisService';

// 创建MMKV存储实例
const storage = new MMKV();

/**
 * 用户认证服务
 * 使用腾讯云官方HTTP API
 */
export class AuthService {
  // Token刷新防重复机制
  private isRefreshing = false;
  private refreshPromise: Promise<AuthResponse> | null = null;
  /**
   * 发送手机验证码
   * @param phoneNumber 手机号
   * @returns Promise<SendVerificationResponse>
   */
  async sendPhoneVerification(phoneNumber: string): Promise<SendVerificationResponse> {
    try {
      const response = await verificationService.sendPhoneVerification(phoneNumber, 'NOT_USER');
      
      // 埋点：发送手机验证码成功
      aegisService.reportUserAction('send_verification_success', {
        type: 'phone',
        phone_number: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // 脱敏处理
      });
      
      return response;
    } catch (error: any) {
      // 埋点：发送手机验证码失败
      aegisService.reportError(`fg_error_send_verification_failed: ${error.message}`, {
        type: 'phone',
        error_message: error.message || '发送验证码失败',
      });
      
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
        // 埋点：注册失败-用户名格式错误
        aegisService.reportError('fg_error_register_failed', {
          error_code: 'INVALID_USERNAME',
          error_type: 'validation',
        });
        
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

      // 转换为内部格式（注册的用户不是匿名用户）
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response, false);

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

      // 埋点：注册成功
      aegisService.reportUserAction('register_success', {
        register_type: 'phone',
        username: username,
      });
      
      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      // 埋点：注册失败
      aegisService.reportError('fg_error_register_failed', {
        register_type: 'phone',
        error_code: error.code || 'REGISTER_ERROR',
        error_message: error.message || '注册失败',
      });
      
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

      // 转换为内部格式（登录的用户不是匿名用户）
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response, false);

      // 保存认证信息到本地存储
      this.saveAuthCredentials(credentials);

      // 埋点：密码登录成功
      aegisService.reportUserAction('login_success', {
        login_type: 'password',
        username: username,
      });

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      // 埋点：密码登录失败
      aegisService.reportError('fg_error_login_failed', {
        login_type: 'password',
        error_code: error.code || 'LOGIN_ERROR',
        error_message: error.message || '登录失败',
      });
      
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
   * 使用手机号和验证码登录
   * @param phoneNumber 手机号
   * @param verificationCode 验证码
   * @param verificationId 验证码ID
   * @returns Promise<AuthResponse>
   */
  async loginWithPhone(
    phoneNumber: string,
    verificationCode: string,
    verificationId: string
  ): Promise<AuthResponse> {
    try {
      // 验证验证码
      const verificationToken = await verificationService.verifyCode(verificationId, verificationCode);
      
      // 构建登录请求数据
      const requestData: LoginRequest = {
        phone_number: phoneNumber.startsWith('+86') ? phoneNumber : `+86${phoneNumber}`,
        verification_token: verificationToken,
      };
      
      // 调用腾讯云官方登录API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.login(requestData);

      // 转换为内部格式（登录的用户不是匿名用户）
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response, false);

      // 保存认证信息到本地存储
      this.saveAuthCredentials(credentials);

      // 埋点：手机号登录成功
      aegisService.reportUserAction('login_success', {
        login_type: 'phone',
        phone_number: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // 脱敏处理
      });

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      // 检查是否是用户不存在的错误
      const errorCode = error.error_code;
      const errorType = error.error;
      const errorMessage = error.message || error.error_description || '登录失败';
      
      // 埋点：手机号登录失败
      aegisService.reportError('fg_error_login_failed', {
        login_type: 'phone',
        error_code: errorCode || 'LOGIN_ERROR',
        error_type: errorType,
        error_message: errorMessage,
      });
      
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: errorMessage,
          error_code: errorCode,
          error_type: errorType,
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
      console.log('🎭 执行匿名登录...');
      
      // 调用腾讯云官方匿名登录API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.anonymousLogin();

      console.log('📊 匿名登录响应:', {
        scope: response.scope,
        sub: response.sub,
        token_type: response.token_type
      });

      // 确保匿名登录响应有正确的scope
      if (response.scope !== 'anonymous') {
        console.log('⚠️ 匿名登录响应缺少scope=anonymous，手动设置');
        response.scope = 'anonymous';
      }

      // 转换为内部格式（明确标记为匿名用户）
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(response, true);

      console.log('🔄 转换后的credentials:', {
        isAnonymous: credentials.isAnonymous,
        uid: credentials.uid
      });

      // 保存认证信息到本地存储
      this.saveAuthCredentials(credentials);

      console.log('✅ 匿名登录成功并保存');

      // 埋点：匿名登录成功
      aegisService.reportUserAction('anonymous_login_success', {});

      return {
        success: true,
        data: credentials,
      };
    } catch (error: any) {
      console.error('❌ 匿名登录失败:', error);
      
      // 埋点：匿名登录失败
      aegisService.reportError('fg_error_anonymous_login_failed', {
        error_code: error.code || 'ANONYMOUS_LOGIN_ERROR',
        error_message: error.message || '匿名登录失败',
      });
      
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
   * 刷新访问令牌（核心方法，带防重复刷新机制）
   * @param forceRefresh 是否强制刷新（忽略防重复机制）
   * @returns Promise<AuthResponse>
   */
  async refreshAccessToken(forceRefresh: boolean = false): Promise<AuthResponse> {
    // 如果正在刷新且不是强制刷新，返回正在进行的刷新Promise
    if (this.isRefreshing && !forceRefresh && this.refreshPromise) {
      console.log('🔄 Token正在刷新中，返回现有刷新Promise');
      return this.refreshPromise;
    }

    // 创建新的刷新Promise
    this.refreshPromise = this._doRefreshAccessToken();
    this.isRefreshing = true;

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行实际的Token刷新逻辑（内部方法）
   * @returns Promise<AuthResponse>
   */
  private async _doRefreshAccessToken(): Promise<AuthResponse> {
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

      // 保存刷新前的匿名用户状态
      const wasAnonymous = this.isAnonymous();
      
      // 获取当前的access_token用于Authorization头
      const currentAccessToken = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
      
      // 调用腾讯云官方刷新API
      const response: CloudBaseAuthResponse = await cloudBaseAuthService.refreshToken(refreshToken, currentAccessToken);

      console.log('✅ CloudBase刷新API调用成功');

      // 转换为内部格式，保持原有的匿名状态
      // 刷新token时，用户类型不会改变
      const credentials: AuthCredentials = cloudBaseAuthService.convertToAuthCredentials(
        response, 
        wasAnonymous  // 传递原来的匿名状态
      );

      console.log('🔄 更新本地存储的认证信息...', { isAnonymous: credentials.isAnonymous });

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
    }
    // 注意：不删除storage中的认证信息，因为新账号登录时会重写这些数据
  }

  /**
   * 检查用户是否已登录（仅真实用户，不包括匿名用户）
   * @returns boolean
   */
  isLoggedIn(): boolean {
    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
    const isAnonymous = storage.getBoolean(STORAGE_KEYS.IS_ANONYMOUS);
    
    console.log('🔍 isLoggedIn 检查:', { 
      hasToken: !!token, 
      hasExpiresAt: !!expiresAt,
      isAnonymous,
      rawIsAnonymous: storage.getBoolean(STORAGE_KEYS.IS_ANONYMOUS)
    });
    
    if (!token || !expiresAt) {
      console.log('❌ 用户未登录: 缺少token或过期时间');
      return false;
    }

    // 如果是匿名用户，返回 false
    if (isAnonymous === true) {
      console.log('❌ 当前是匿名用户，不算真实登录');
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
    console.log('✅ 真实用户已登录，剩余时间:', `${remainingMinutes}分钟`, { isAnonymous });
    
    return true;
  }

  /**
   * 检查是否有有效的认证态（包括匿名用户）
   * @returns boolean
   */
  hasValidAuth(): boolean {
    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
    
    if (!token || !expiresAt) {
      return false;
    }

    const currentTime = Date.now();
    const isExpired = currentTime >= expiresAt;
    
    return !isExpired;
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
    // 使用 hasValidAuth 检查，包括匿名用户
    if (!this.hasValidAuth()) {
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
      isAnonymous: credentials.isAnonymous,
    });
    
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, credentials.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, credentials.refreshToken);
    storage.set(STORAGE_KEYS.UID, credentials.uid);
    storage.set(STORAGE_KEYS.EXPIRES_AT, credentials.expiresAt);
    
    // 确保匿名标记被正确保存
    const isAnonymousValue = credentials.isAnonymous === true;
    storage.set(STORAGE_KEYS.IS_ANONYMOUS, isAnonymousValue);
    
    // 如果不是匿名用户，标记为曾经登录过
    if (!isAnonymousValue) {
      storage.set(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE, true);
    }
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
    storage.delete(STORAGE_KEYS.IS_ANONYMOUS);
    console.log('✅ 认证信息清除完成');
  }

  /**
   * 检查令牌是否即将过期
   * Access Token 有效期 24 小时，在剩余时间少于 2 小时时认为即将过期
   * @returns boolean
   */
  isTokenExpiringSoon(): boolean {
    const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) {
      console.log('⚠️ Token即将过期检查: 缺少过期时间，认为即将过期');
      return true;
    }

    const currentTime = Date.now();
    // Access Token 有效期 24 小时，提前 2 小时刷新（剩余时间少于 2 小时时刷新）
    const refreshAheadHours = 2;
    const refreshAheadTime = refreshAheadHours * 60 * 60 * 1000;
    const isExpiringSoon = currentTime >= (expiresAt - refreshAheadTime);
    
    const remainingHours = (expiresAt - currentTime) / (1000 * 60 * 60);
    const remainingMinutes = Math.round((expiresAt - currentTime) / 60000);
    
    if (isExpiringSoon) {
      console.log('⚠️ Token即将过期:', {
        remainingHours: remainingHours.toFixed(2),
        remainingMinutes,
        expiresAt: new Date(expiresAt).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
      });
    } else {
      console.log('✅ Token未即将过期，剩余时间:', `${remainingHours.toFixed(2)}小时 (${remainingMinutes}分钟)`);
    }

    return isExpiringSoon;
  }

  /**
   * 统一Token刷新入口
   * 根据策略自动判断是否需要刷新，并执行刷新
   * @param strategy 刷新策略：'auto'（自动，即将过期时刷新）| 'force'（强制刷新）| 'check'（检查，过期时刷新）
   * @returns Promise<AuthResponse>
   */
  async refreshTokenIfNeeded(strategy: 'auto' | 'force' | 'check' = 'auto'): Promise<AuthResponse> {
    console.log(`🔍 [Token刷新] 策略: ${strategy}`);
    
    // 强制刷新策略：直接刷新
    if (strategy === 'force') {
      console.log('🚀 [Token刷新] 强制刷新模式');
      return await this.refreshAccessToken(true);
    }

    // 检查策略：如果已过期或无效，则刷新
    if (strategy === 'check') {
      if (!this.hasValidAuth()) {
        console.log('❌ [Token刷新] Token已过期或无效，开始刷新...');
        return await this.refreshAccessToken();
        } else {
        console.log('✅ [Token刷新] Token有效，无需刷新');
        return this._getCurrentAuthResponse();
        }
      }

    // 自动策略（默认）：如果即将过期，则刷新
    if (this.isTokenExpiringSoon()) {
      console.log('🚀 [Token刷新] Token即将过期，开始自动刷新...');
      return await this.refreshAccessToken();
    } else {
      console.log('✅ [Token刷新] Token未即将过期，无需刷新');
      return this._getCurrentAuthResponse();
    }
  }

  /**
   * 获取当前认证态的响应（内部辅助方法）
   * @returns AuthResponse
   */
  private _getCurrentAuthResponse(): AuthResponse {
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
          isAnonymous: this.isAnonymous(),
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

  /**
   * 自动刷新令牌（如果即将过期）
   * @deprecated 使用 refreshTokenIfNeeded('auto') 代替
   * @returns Promise<boolean>
   */
  async autoRefreshTokenIfNeeded(): Promise<boolean> {
    const result = await this.refreshTokenIfNeeded('auto');
    return result.success;
  }

  /**
   * 手动检查并刷新token（如果过期）
   * @deprecated 使用 refreshTokenIfNeeded('check') 代替
   * @returns Promise<AuthResponse>
   */
  async checkAndRefreshToken(): Promise<AuthResponse> {
    return await this.refreshTokenIfNeeded('check');
  }

  /**
   * 检查当前用户是否是匿名用户
   * @returns boolean
   */
  isAnonymous(): boolean {
    const isAnonymousValue = storage.getBoolean(STORAGE_KEYS.IS_ANONYMOUS);
    console.log('🔍 检查匿名用户状态:', { 
      isAnonymous: isAnonymousValue,
      storageValue: isAnonymousValue 
    });
    return isAnonymousValue === true;
  }

  /**
   * 检查当前用户是否是真实用户（非匿名）
   * @returns boolean
   */
  isRealUser(): boolean {
    // isLoggedIn() 已经排除了匿名用户，所以直接返回
    return this.isLoggedIn();
  }

  /**
   * 确保有有效的登录态（如果没有则自动匿名登录）
   * ⚠️ 注意：此方法允许匿名登录，仅用于不需要真实用户的场景（如浏览activity）
   * @returns Promise<AuthResponse>
   */
  async ensureAuthenticated(): Promise<AuthResponse> {
    console.log('🔐 确保登录态（允许匿名）...');
    
    // 检查是否已经有有效的认证态（包括匿名用户和真实用户）
    if (this.hasValidAuth()) {
      console.log('✅ 已有有效认证态');
      const token = this.getCurrentAccessToken();
      const uid = this.getCurrentUserId();
      const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
      const isAnonymous = this.isAnonymous();
      
      console.log('🔍 检查现有认证态:', { token: !!token, uid, isAnonymous });
      
      // 如果有完整的认证信息，直接返回（不管是真实用户还是匿名用户）
      if (token && uid && expiresAt) {
        console.log('✅ 返回现有认证态:', { isAnonymous, uid });
        return {
          success: true,
          data: {
            uid,
            accessToken: token,
            refreshToken: storage.getString(STORAGE_KEYS.REFRESH_TOKEN) || '',
            expiresIn: Math.round((expiresAt - Date.now()) / 1000),
            expiresAt,
            isAnonymous,
          },
        };
      }
    }
    
    // 尝试刷新token
    const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      console.log('🔄 尝试刷新token...');
      const refreshResult = await this.refreshTokenIfNeeded('check');
      if (refreshResult.success) {
        console.log('✅ Token刷新成功');
        return refreshResult;
      }
      console.log('⚠️ Token刷新失败，尝试匿名登录...');
    }
    
    // 没有登录态或刷新失败，进行匿名登录
    console.log('🎭 没有有效登录态，执行匿名登录...');
    return await this.anonymousLogin();
  }

  /**
   * 调试方法：打印当前存储状态
   */
  debugStorageState(): void {
    console.log('🔍 存储状态调试:', {
      accessToken: !!storage.getString(STORAGE_KEYS.ACCESS_TOKEN),
      refreshToken: !!storage.getString(STORAGE_KEYS.REFRESH_TOKEN),
      uid: storage.getString(STORAGE_KEYS.UID),
      expiresAt: storage.getNumber(STORAGE_KEYS.EXPIRES_AT),
      isAnonymous: storage.getBoolean(STORAGE_KEYS.IS_ANONYMOUS),
      storageKeys: Object.values(STORAGE_KEYS)
    });
  }

  /**
   * 临时调试方法：清除所有认证数据
   */
  debugClearAllAuth(): void {
    console.log('🧹 清除所有认证数据...');
    this.clearAuthCredentials();
    console.log('✅ 认证数据已清除');
  }

  /**
   * 检查用户是否曾经登录过
   * @returns boolean
   */
  hasLoggedInBefore(): boolean {
    return storage.getBoolean(STORAGE_KEYS.HAS_LOGGED_IN_BEFORE) || false;
  }

  /**
   * 要求真实用户登录（不允许匿名用户）
   * 如果当前是匿名用户或未登录，返回失败
   * ⚠️ 注意：此方法只做判断，不会尝试刷新token
   * @returns Promise<AuthResponse>
   */
  async requireRealUser(): Promise<AuthResponse> {
    console.log('👤 检查真实用户登录态（仅判断，不刷新token）...');
    
    // 调试存储状态
    this.debugStorageState();
    
    // 检查是否是匿名用户
    if (this.isAnonymous()) {
      console.log('❌ 当前是匿名用户，需要真实用户登录');
      return {
        success: false,
        error: {
          code: 'ANONYMOUS_USER',
          message: '此功能需要登录账号',
        },
      };
    }
    
    // 检查是否已登录（isLoggedIn 已经排除了匿名用户）
    if (!this.isLoggedIn()) {
      console.log('❌ 用户未登录');
      return {
        success: false,
        error: {
          code: 'NOT_LOGGED_IN',
          message: '请先登录',
        },
      };
    }
    
    // 直接返回当前真实用户的登录态（不再尝试刷新token）
    console.log('✅ 真实用户登录态有效');
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
          isAnonymous: false,
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'INVALID_AUTH_STATE',
        message: '登录状态异常',
      },
    };
  }
}

// 导出单例实例
export const authService = new AuthService();

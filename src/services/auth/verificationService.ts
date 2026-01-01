import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { SendVerificationRequest, SendVerificationResponse } from '../../types/auth';
import { aegisService } from '../monitoring/aegisService';
import { attachAuthHeaderInterceptor } from '../http/interceptors/attachAuthHeaderInterceptor';
import { attach401RefreshInterceptor } from '../http/interceptors/attach401RefreshInterceptor';

// 获取腾讯云开发配置
const CLOUDBASE_CONFIG = getCloudbaseConfig();

/**
 * 验证码服务
 * 实现发送和验证短信/邮箱验证码
 */
export class VerificationService {
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

    // 验证码相关接口：不需要 Authorization，且 401 不应触发 refresh-retry
    this.axiosInstance.interceptors.request.use((config) => {
      config._fgSkip401Refresh = true;
      config._fgSkipAuthHeader = true;
      return config;
    });

    // 保持出口点一致（skip 标记会让拦截器基本不生效）
    attachAuthHeaderInterceptor(this.axiosInstance, () => null);
    attach401RefreshInterceptor(this.axiosInstance, async () => false, () => {});
  }

  /**
   * 发送手机验证码
   * @param phoneNumber 手机号
   * @param target 验证目标类型
   * @returns Promise<SendVerificationResponse>
   */
  async sendPhoneVerification(
    phoneNumber: string, 
    target: 'ANY' | 'USER' | 'NOT_USER' = 'ANY'
  ): Promise<SendVerificationResponse> {
    try {
      // 确保手机号格式正确
      const formattedPhone = phoneNumber.startsWith('+86') ? phoneNumber : `+86 ${phoneNumber}`;
      
      const requestData: SendVerificationRequest = {
        phone_number: formattedPhone,
        target,
      };

      const response: AxiosResponse<SendVerificationResponse> = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.SEND_VERIFICATION,
        requestData
      );

      return response.data;
    } catch (error: any) {
      // 埋点：发送手机验证码API错误
      const errorMessage = error.response?.data?.error_description || error.response?.data?.error || '发送验证码失败';
      const statusCode = error.response?.status;
      aegisService.reportApiError('/auth/v1/verification', errorMessage, statusCode);
      
      if (error.response?.data) {
        throw new Error(errorMessage);
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 验证验证码
   * @param verificationId 验证码ID
   * @param verificationCode 验证码
   * @returns Promise<string> 返回verification_token
   */
  async verifyCode(verificationId: string, verificationCode: string): Promise<string> {
    try {
      const requestData = {
        verification_id: verificationId,
        verification_code: verificationCode, // 修正参数名称
      };

      const response: AxiosResponse = await this.axiosInstance.post(
        CLOUDBASE_CONFIG.AUTH_API.ENDPOINTS.VERIFY_VERIFICATION,
        requestData
      );

      // 根据腾讯云API文档，返回verification_token
      if (response.data && response.data.verification_token) {
        // 埋点：验证码验证成功
        aegisService.reportUserAction('verify_code_success', {});
        return response.data.verification_token;
      } else {
        // 埋点：验证码验证失败-未返回token
        aegisService.reportError('fg_error_verify_code_failed', {
          error_message: '验证码验证成功但未返回verification_token',
        });
        throw new Error('验证码验证成功但未返回verification_token');
      }
    } catch (error: any) {
      // 埋点：验证码验证API错误
      const errorMessage = error.response?.data?.error_description || error.response?.data?.error || '验证码验证失败';
      const statusCode = error.response?.status;
      aegisService.reportApiError('/auth/v1/verification/verify', errorMessage, statusCode);
      
      if (error.response?.data) {
        throw new Error(errorMessage);
      }
      throw new Error('网络请求失败');
    }
  }

  /**
   * 检查验证码是否过期
   * @param expiresIn 过期时间（秒）
   * @returns boolean
   */
  isVerificationExpired(expiresIn: number): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= expiresIn;
  }

  /**
   * 获取验证码剩余时间（秒）
   * @param expiresIn 过期时间（秒）
   * @returns number
   */
  getVerificationRemainingTime(expiresIn: number): number {
    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = expiresIn - currentTime;
    return remaining > 0 ? remaining : 0;
  }

  /**
   * 格式化剩余时间为可读格式
   * @param remainingSeconds 剩余秒数
   * @returns string
   */
  formatRemainingTime(remainingSeconds: number): string {
    if (remainingSeconds <= 0) {
      return '已过期';
    }
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    
    return `${seconds}秒`;
  }
}

// 导出单例实例
export const verificationService = new VerificationService();

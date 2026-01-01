import axios from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { authService } from '../auth/authService';
import { aegisService } from '../monitoring/aegisService';
import { functionClient } from '../http/clients';

// 获取腾讯云开发配置
const CLOUDBASE_CONFIG = getCloudbaseConfig();

interface GenerateResponse<T> {
  code: number;
  message: string;
  data?: T;
  error?: string;
  currentBalance?: number;
  requiredAmount?: number;
}

interface FusionParams {
  /** 人脸融合活动ID @see https://console.cloud.tencent.com/facefusion/activities*/
  projectId: string;
  /** 人脸融合模板ID 
   * @see https://console.cloud.tencent.com/facefusion/activities/at_1888958525505814528
  */
  modelId: string;
  imageUrl: string;
  /** 用户ID（价格>0时必填） */
  user_id?: string;
  /** 模板价格（美美币），0表示免费 */
  price?: number;
}

interface FusionResult { 
  FusedImage: string;
}

export const callFaceFusionCloudFunction = async (params: FusionParams): Promise<GenerateResponse<FusionResult>> => {
  try {
    console.log('🔄 调用人脸融合云函数:', params);
    
    const response = await functionClient.post(
      '/fusion',
      {
        data: {
          projectId: params.projectId,
          modelId: params.modelId,
          imageUrl: params.imageUrl,
          user_id: '__AUTO__',
          price: params.price || 0,
        },
      },
      {
        timeout: CLOUDBASE_CONFIG.API.TIMEOUT * 2, // 增加超时时间，因为融合可能需要更长时间
      }
    );

    console.log('✅ 人脸融合云函数响应:', response.data);

    // 处理云函数返回的数据结构
    let fusedImage: string | undefined;
    
    const rawData: unknown = response.data;

    // 如果响应是 body 字符串，需要解析
    if (typeof rawData === 'string') {
      try {
        const parsed: unknown = JSON.parse(rawData);
        if (typeof parsed === 'object' && parsed !== null) {
          const parsedObj = parsed as Record<string, unknown>;
          const resp = parsedObj.Response;
          const respObj = typeof resp === 'object' && resp !== null ? (resp as Record<string, unknown>) : null;
          const fromResponse = respObj?.FusedImage;
          const fromRoot = parsedObj.FusedImage;
          fusedImage = typeof fromResponse === 'string' ? fromResponse : typeof fromRoot === 'string' ? fromRoot : undefined;
        }
      } catch (e: unknown) {
        console.error('解析响应数据失败:', e);
      }
    } else {
      // 如果响应是对象，直接获取
      if (typeof rawData === 'object' && rawData !== null) {
        const obj = rawData as Record<string, unknown>;
        const resp = obj.Response;
        const respObj = typeof resp === 'object' && resp !== null ? (resp as Record<string, unknown>) : null;
        const fromResponse = respObj?.FusedImage;
        const fromRoot = obj.FusedImage;
        fusedImage = typeof fromResponse === 'string' ? fromResponse : typeof fromRoot === 'string' ? fromRoot : undefined;
      }
    }

    if (fusedImage) {
      return {
        code: 0,
        message: 'success',
        data: {
          FusedImage: fusedImage
        },
      };
    } else {
      return {
        code: -1,
        message: '人脸融合失败：未返回结果图片',
      };
    }
  } catch (error: unknown) {
    console.error('❌ 人脸融合云函数调用失败:', error);
    
    // 上报接口错误到 Aegis
    const apiUrl = `/fusion`;
    const errorMessage =
      axios.isAxiosError(error) && error.response
        ? (typeof error.response.data === 'object' &&
            error.response.data !== null &&
            typeof (error.response.data as Record<string, unknown>).message === 'string' &&
            (error.response.data as Record<string, unknown>).message) ||
          (error.message || '人脸融合调用失败')
        : error instanceof Error
          ? error.message
          : '人脸融合调用失败';
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    aegisService.reportApiError(apiUrl, errorMessage, statusCode);
    
    // 处理axios错误
    if (axios.isAxiosError(error) && error.response) {
      // 服务器响应了错误状态码
      const errorData: unknown = error.response.data;
      // 处理余额不足错误
      if (
        typeof errorData === 'object' &&
        errorData !== null &&
        (((errorData as Record<string, unknown>).code === -2) ||
          ((errorData as Record<string, unknown>).error === 'INSUFFICIENT_BALANCE'))
      ) {
        const currentBalance =
          typeof (errorData as Record<string, unknown>).currentBalance === 'number'
            ? (errorData as Record<string, unknown>).currentBalance
            : undefined;
        const requiredAmount =
          typeof (errorData as Record<string, unknown>).requiredAmount === 'number'
            ? (errorData as Record<string, unknown>).requiredAmount
            : undefined;
        return {
          code: -2,
          message: '余额不足',
          error: 'INSUFFICIENT_BALANCE',
          currentBalance,
          requiredAmount,
        };
      }
      return {
        code:
          typeof errorData === 'object' &&
          errorData !== null &&
          typeof (errorData as Record<string, unknown>).code === 'number'
            ? ((errorData as Record<string, unknown>).code as number)
            : error.response.status,
        message:
          typeof errorData === 'object' &&
          errorData !== null &&
          typeof (errorData as Record<string, unknown>).message === 'string'
            ? ((errorData as Record<string, unknown>).message as string)
            : `服务器错误: ${error.response.status}`,
      };
    } else if (axios.isAxiosError(error) && error.request) {
      // 请求已发出但没有收到响应
      return {
        code: -1,
        message: '网络连接失败，请检查网络后重试',
      };
    } else {
      // 其他错误
      return {
        code: -1,
        message: error instanceof Error ? error.message : '人脸融合调用失败',
      };
    }
  }
};

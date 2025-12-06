import axios, { AxiosResponse } from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { authService } from '../auth/authService';
import { aegisService } from '../monitoring/aegisService';

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
    
    const token = authService.getCurrentAccessToken();
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 使用axios调用本地CloudBase云函数
    const baseUrl = 'https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com';
    const response: AxiosResponse<any> = await axios.post(
      `${baseUrl}/fusion`,
      {
        data: {
          projectId: params.projectId,
          modelId: params.modelId,
          imageUrl: params.imageUrl,
          user_id: params.user_id,
          price: params.price || 0,
        }
      },
      {
        timeout: CLOUDBASE_CONFIG.API.TIMEOUT * 2, // 增加超时时间，因为融合可能需要更长时间
        headers,
      }
    );

    console.log('✅ 人脸融合云函数响应:', response.data);

    // 处理云函数返回的数据结构
    let fusedImage: string | undefined;
    
    // 如果响应是 body 字符串，需要解析
    if (typeof response.data === 'string') {
      try {
        const parsedData = JSON.parse(response.data);
        fusedImage = parsedData.Response?.FusedImage || parsedData.FusedImage;
      } catch (e) {
        console.error('解析响应数据失败:', e);
      }
    } else {
      // 如果响应是对象，直接获取
      fusedImage = response.data?.Response?.FusedImage || response.data?.FusedImage;
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
  } catch (error: any) {
    console.error('❌ 人脸融合云函数调用失败:', error);
    
    // 上报接口错误到 Aegis
    const apiUrl = `/fusion`;
    const errorMessage = error.response?.data?.message || error.message || '人脸融合调用失败';
    const statusCode = error.response?.status;
    aegisService.reportApiError(apiUrl, errorMessage, statusCode);
    
    // 处理axios错误
    if (error.response) {
      // 服务器响应了错误状态码
      const errorData = error.response.data;
      // 处理余额不足错误
      if (errorData?.code === -2 || errorData?.error === 'INSUFFICIENT_BALANCE') {
        return {
          code: -2,
          message: '余额不足',
          error: 'INSUFFICIENT_BALANCE',
          currentBalance: errorData.currentBalance,
          requiredAmount: errorData.requiredAmount,
        };
      }
      return {
        code: errorData?.code || error.response.status,
        message: errorData?.message || `服务器错误: ${error.response.status}`,
      };
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return {
        code: -1,
        message: '网络连接失败，请检查网络后重试',
      };
    } else {
      // 其他错误
      return {
        code: -1,
        message: error.message || '人脸融合调用失败',
      };
    }
  }
};

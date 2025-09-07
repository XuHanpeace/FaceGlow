import axios, { AxiosResponse } from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';

// 获取腾讯云开发配置
const CLOUDBASE_CONFIG = getCloudbaseConfig();

interface GenerateResponse<T> {
  code: number;
  message: string;
  data?: T;
}

interface FusionParams {
  /** 人脸融合活动ID @see https://console.cloud.tencent.com/facefusion/activities*/
  projectId: string;
  /** 人脸融合模板ID 
   * @see https://console.cloud.tencent.com/facefusion/activities/at_1888958525505814528
  */
  modelId: string;
  imageUrl: string;
}

interface FusionResult { 
  FusedImage: string;
}

export const callFaceFusionCloudFunction = async (params: FusionParams): Promise<GenerateResponse<FusionResult>> => {
  try {
    console.log('🔄 调用人脸融合云函数:', params);
    
    // 使用axios调用CloudBase云函数
    const response: AxiosResponse<FusionResult> = await axios.post(
      'https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com/fusion',
      {
        data: {
          projectId: params.projectId,
          modelId: params.modelId,
          imageUrl: params.imageUrl,
        }
      },
      {
        timeout: CLOUDBASE_CONFIG.API.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log('✅ 人脸融合云函数响应:', response.data);

    if (response.data.FusedImage) {
      return {
        code: 0,
        message: 'success',
        data: {
          FusedImage: response.data.FusedImage
        },
      };
    } else {
      return {
        code: -1,
        message: '人脸融合失败',
      };
    }
  } catch (error: any) {
    console.error('❌ 人脸融合云函数调用失败:', error);
    
    // 处理axios错误
    if (error.response) {
      // 服务器响应了错误状态码
      const errorData = error.response.data;
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

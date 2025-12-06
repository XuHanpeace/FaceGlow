import axios from 'axios';
import { authService } from '../auth/authService';
import { aegisService } from '../monitoring/aegisService';

/**
 * 阿里云百炼异步任务参数
 */
export interface BailianParams {
  prompt: string;
  images: string[];
  params?: {
    n?: number;
    size?: string;
    seed?: number;
    negative_prompt?: string;
    watermark?: boolean;
  };
  /** 用户ID（价格>0时必填） */
  user_id?: string;
  /** 模板价格（美美币），0表示免费 */
  price?: number;
}

/**
 * 阿里云百炼异步任务响应
 */
export interface BailianResponse {
  success: boolean;
  taskId?: string;
  message?: string;
  requestId?: string;
  error?: string;
}

/**
 * 任务查询响应
 */
export interface TaskQueryResponse {
  success: boolean;
  taskId: string;
  taskStatus: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
  results?: Array<{
    orig_prompt?: string;
    url: string;
  }>;
  error?: string;
  submitTime?: string;
  endTime?: string;
}

class AsyncTaskService {
  // 使用环境ID构建云函数URL
  // 注意：HTTP 访问需使用 HTTP 访问域名，通常格式为：https://<env-id>-<app-id>.<region>.app.tcloudbase.com
  // 参考 tcb.ts 中的 fusion 调用
  private readonly baseUrl = `https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com`;

  /**
   * 调用 callBailian 云函数发起异步任务
   */
  async callBailian(params: BailianParams): Promise<BailianResponse> {
    try {
      console.log('🔄 调用 callBailian 云函数:', params);
      
      const token = authService.getCurrentAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(`${this.baseUrl}/callBailian`, {
        data: {
          ...params,
          user_id: params.user_id,
          price: params.price || 0,
        }
      }, {
        headers,
        timeout: 60000, // 60秒超时
      });

      console.log('✅ callBailian 响应:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ callBailian 调用失败:', error);
      
      // 上报接口错误到 Aegis
      const apiUrl = `${this.baseUrl}/callBailian`;
      const errorMessage = error.response?.data?.error || error.message || '调用云函数失败';
      const statusCode = error.response?.status;
      aegisService.reportApiError(apiUrl, errorMessage, statusCode);
      
      // 处理余额不足错误
      if (error.response?.data?.errorCode === 'INSUFFICIENT_BALANCE') {
        return {
          success: false,
          error: '余额不足',
          errorCode: 'INSUFFICIENT_BALANCE',
          currentBalance: error.response.data.currentBalance,
          requiredAmount: error.response.data.requiredAmount,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || '调用云函数失败',
      };
    }
  }

  /**
   * 调用 queryTask 云函数查询任务状态
   */
  async queryTask(taskId: string): Promise<TaskQueryResponse> {
    try {
      const token = authService.getCurrentAccessToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(`${this.baseUrl}/queryTask`, {
        data: { taskId }
      }, {
        headers,
        timeout: 15000,
      });

      // console.log('🔍 queryTask 响应:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ queryTask 调用失败:', error);
      
      // 上报接口错误到 Aegis
      const apiUrl = `${this.baseUrl}/queryTask`;
      const errorMessage = error.response?.data?.error || error.message || '查询任务失败';
      const statusCode = error.response?.status;
      aegisService.reportApiError(apiUrl, errorMessage, statusCode);
      
      return {
        success: false,
        taskId,
        taskStatus: 'UNKNOWN',
        error: error.message || '查询任务失败',
      };
    }
  }
}

export const asyncTaskService = new AsyncTaskService();


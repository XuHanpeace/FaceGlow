import axios from 'axios';
import { CLOUDBASE_CONFIG } from '../../config/cloudbase';

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
  private readonly baseUrl = `https://${CLOUDBASE_CONFIG.ENV_ID}.service.tcloudbase.com`;

  /**
   * 调用 callBailian 云函数发起异步任务
   */
  async callBailian(params: BailianParams): Promise<BailianResponse> {
    try {
      console.log('🔄 调用 callBailian 云函数:', params);
      const response = await axios.post(`${this.baseUrl}/callBailian`, params, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60秒超时
      });

      console.log('✅ callBailian 响应:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ callBailian 调用失败:', error);
      return {
        success: false,
        error: error.message || '调用云函数失败',
      };
    }
  }

  /**
   * 调用 queryTask 云函数查询任务状态
   */
  async queryTask(taskId: string): Promise<TaskQueryResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/queryTask`, { taskId }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      // console.log('🔍 queryTask 响应:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ queryTask 调用失败:', error);
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


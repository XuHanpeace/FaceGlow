import axios from 'axios';
import { authService } from '../auth/authService';
import { aegisService } from '../monitoring/aegisService';

/**
 * 任务类型枚举
 */
export enum TaskType {
  IMAGE_TO_IMAGE = 'image_to_image', // 图生图
  IMAGE_TO_VIDEO = 'image_to_video', // 图生视频
  VIDEO_EFFECT = 'video_effect', // 视频特效
  PORTRAIT_STYLE_REDRAW = 'portrait_style_redraw', // 人像风格重绘
}

/**
 * 阿里云百炼异步任务参数（通用）
 */
export interface BailianParams {
  /** 任务类型 */
  task_type: TaskType;
  /** 提示词文本 */
  prompt: string;
  /** 图片URL数组（图生图、图生视频使用） */
  images?: string[];
  /** 视频URL（视频特效使用） */
  video_url?: string;
  /** 音频URL（图生视频使用，可选，仅wan2.5-i2v-preview支持） */
  audio_url?: string;
  params?: {
    n?: number;
    size?: string;
    seed?: number;
    negative_prompt?: string;
    watermark?: boolean;
    /** 视频时长（秒），图生视频使用（已废弃，改用resolution） */
    duration?: number;
    /** 视频帧率，图生视频使用（已废弃，改用resolution） */
    fps?: number;
    /** 视频分辨率，图生视频和视频特效使用：480P、720P、1080P，默认720P */
    resolution?: string;
    /** 风格类型/模板，视频特效使用（如 "flying", "frenchkiss"） */
    style_type?: string;
    /** 视频特效模板，视频特效使用（与style_type相同，推荐使用template） */
    template?: string;
    /** 风格索引，人像风格重绘使用（0-9为预设风格，-1为自定义风格） */
    style_index?: number;
    /** 风格参考图URL，人像风格重绘使用（当style_index=-1时必填） */
    style_ref_url?: string;
  };
  /** 用户ID（价格>0时必填） */
  user_id?: string;
  /** 模板价格（美美币），0表示免费 */
  price?: number;
}

/**
 * 阿里云百炼异步任务响应（统一返回体结构）
 * 
 * 统一格式：{ success, data, errCode, errorMsg }
 */
export interface BailianResponse {
  /** 是否成功 */
  success: boolean;
  
  /** 
   * 数据对象
   * - 成功时：包含 taskId, requestId, message
   * - 失败时（余额不足）：包含 currentBalance, requiredAmount
   * - 失败时（其他错误）：可能为 null 或包含错误详情（statusCode, details, requestUrl）
   */
  data?: {
    /** 成功时返回 */
    taskId?: string;
    requestId?: string;
    message?: string;
    /** 余额不足时返回 */
    currentBalance?: number;
    requiredAmount?: number;
    /** 其他错误时可能返回 */
    statusCode?: number;
    details?: any;
    requestUrl?: string;
  } | null;
  
  /** 
   * 错误代码（失败时返回）
   * - 'MISSING_API_KEY': 缺少API Key
   * - 'MISSING_PROMPT': 缺少提示词
   * - 'MISSING_IMAGES': 缺少图片
   * - 'MISSING_USER_ID': 价格>0但缺少user_id
   * - 'USER_NOT_FOUND': 用户不存在
   * - 'INSUFFICIENT_BALANCE': 余额不足（此时data中包含currentBalance和requiredAmount）
   * - 'INVALID_TASK_TYPE': 无效的任务类型
   * - 'HTTP_XXX': HTTP状态码错误
   * - 'InvalidParameter.XXX': API参数错误
   * - 其他API返回的错误代码
   */
  errCode?: string | null;
  
  /** 
   * 错误信息（失败时返回）
   * - 当 success 为 false 时，此字段包含错误描述
   */
  errorMsg?: string | null;
}

/**
 * 任务查询响应（统一返回体结构）
 * 
 * 统一格式：{ success, data, errCode, errorMsg }
 * output 和 usage 结构原样透传在 data 中，客户端需要从 data.output 中读取具体字段
 */
export interface TaskQueryResponse {
  /** 是否成功 */
  success: boolean;
  
  /** 
   * 数据对象（成功时返回）
   * - taskId: 任务ID
   * - taskStatus: 任务状态
   * - output: output 结构原样透传
   * - usage: usage 结构原样透传（图生视频、图片特效）
   * - results: 格式化后的结果数组（向后兼容）
   * - submitTime, scheduledTime, endTime: 任务时间信息
   * - requestId: 请求ID
   */
  data?: {
    taskId?: string;
    taskStatus?: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
    output?: {
      task_id?: string;
      task_status?: string;
      submit_time?: string;
      scheduled_time?: string;
      end_time?: string;
      video_url?: string;
      orig_prompt?: string;
      actual_prompt?: string;
      results?: Array<{
        url?: string;
        orig_prompt?: string;
      }>;
      [key: string]: any;
    };
    usage?: {
      duration?: number;
      video_count?: number;
      SR?: number;
      video_duration?: number;
      video_ratio?: string;
      image_count?: number;
      [key: string]: any;
    };
    results?: Array<{
      orig_prompt?: string | null;
      url: string;
    }> | null;
    submitTime?: string | null;
    scheduledTime?: string | null;
    endTime?: string | null;
    requestId?: string;
  } | null;
  
  /** 
   * 错误代码（失败时返回）
   * - 'MISSING_API_KEY': 缺少API Key
   * - 'MISSING_TASK_ID': 缺少taskId
   * - 'HTTP_XXX': HTTP状态码错误
   * - 其他API返回的错误代码
   */
  errCode?: string | null;
  
  /** 
   * 错误信息（失败时返回）
   * - 当 success 为 false 时，此字段包含错误描述
   */
  errorMsg?: string | null;
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
      if (error.response?.data?.errCode === 'INSUFFICIENT_BALANCE') {
        return {
          success: false,
          data: error.response.data.data || null,
          errCode: 'INSUFFICIENT_BALANCE',
          errorMsg: error.response.data.errorMsg || '余额不足',
        };
      }
      
      return {
        success: false,
        data: error.response?.data?.data || null,
        errCode: error.response?.data?.errCode || 'API_ERROR',
        errorMsg: error.response?.data?.errorMsg || error.message || '调用云函数失败',
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
        data: {
          taskId: taskId,
          taskStatus: 'UNKNOWN'
        },
        errCode: error.response?.data?.errCode || 'QUERY_ERROR',
        errorMsg: error.response?.data?.errorMsg || error.message || '查询任务失败',
      };
    }
  }
}

export const asyncTaskService = new AsyncTaskService();


import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CLOUDBASE_CONFIG } from '../../config/cloudbase';
import { authService } from '../auth/authService';
import { attachAuthHeaderInterceptor } from '../http/interceptors/attachAuthHeaderInterceptor';
import { attach401RefreshInterceptor } from '../http/interceptors/attach401RefreshInterceptor';
import { attachAutoUidInterceptor } from '../http/interceptors/attachAutoUidInterceptor';

// 数据库操作响应接口
export interface DatabaseResponse<T> {
  success: boolean;
  data?: {
    record?: T;
    records?: T;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface DatabaseUpdateResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}


interface RequestData {
  filter?: {
    where: {
      [key: string]: {
        $eq: string | number | boolean
      }
    }
  },
  data?: any,
  select?: {
    [key: string]: boolean
  },
  create?: any,
  update?: any,
  // GET请求的查询参数
  pageSize?: number,
  pageNumber?: number,
  getCount?: boolean
}

// 数据库操作错误
export class DatabaseError extends Error {
  public code: string;
  public statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// 基础数据库服务类
export class DatabaseService {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = `${CLOUDBASE_CONFIG.DATABASE_API.BASE_URL}/${CLOUDBASE_CONFIG.DATABASE_API.VERSION}`;
    
    // 创建axios实例
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: CLOUDBASE_CONFIG.DATABASE_API.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 统一拦截器：自动注入 Authorization + 401 refresh-retry
    attachAuthHeaderInterceptor(this.axiosInstance, () => authService.getCurrentAccessToken());
    attach401RefreshInterceptor(
      this.axiosInstance,
      async () => {
        const result = await authService.refreshTokenIfNeeded('force');
        return result.success;
      },
      () => {
        // 不再为 token 刷新失败自动显示登录提示，允许匿名用户继续使用应用（符合 App Store 审核指南 5.1.1）
        // const mod = require('../loginPromptService') as unknown as {
        //   loginPromptService: { showManually: (reason: 'anonymous' | 'authLost') => void };
        // };
        // mod.loginPromptService.showManually('authLost');
      }
    );

    // 请求拦截器：自动替换 data/params/url 中的 __AUTO__ 为当前 uid
    // 不再为匿名用户自动显示登录提示，允许匿名用户使用应用（符合 App Store 审核指南 5.1.1）
    attachAutoUidInterceptor(this.axiosInstance, () => authService.getCurrentUserId(), () => {
      // const mod = require('../loginPromptService') as unknown as {
      //   loginPromptService: { showManually: (reason: 'anonymous' | 'authLost') => void };
      // };
      // mod.loginPromptService.showManually('anonymous');
    });

    // 响应拦截器：统一错误处理
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        // 请求在发出前（request interceptor）失败的场景
        if (error instanceof Error && error.message === 'MISSING_UID') {
          throw new DatabaseError('请先登录', 'MISSING_UID');
        }

        if (error.response) {
          // 服务器响应了错误状态码
          const errorData = error.response.data || {};
          throw new DatabaseError(
            errorData.message || `HTTP ${error.response.status}`,
            errorData.code || 'HTTP_ERROR',
            error.response.status
          );
        } else if (error.request) {
          // 请求已发出但没有收到响应（网络不通，不触发登录提示）
          throw new DatabaseError(
            '网络请求失败，请检查网络连接',
            'NETWORK_ERROR'
          );
        } else {
          // 其他错误
          throw new DatabaseError(
            error.message || '未知错误',
            'UNKNOWN_ERROR'
          );
        }
      }
    );
  }

  // 通用请求方法
  private async request<T>(
    config: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      // 统一：数据库层不要抛出异常导致 RN 红屏，转为标准返回体交由上层处理
      if (error instanceof DatabaseError) {
        // @ts-ignore
        return {
          success: false,
          error: {
            code: error.code || 'DATABASE_ERROR',
            message: error.message || '数据库请求失败',
          },
        };
      }

      // @ts-ignore
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error instanceof Error ? error.message : '未知错误',
        },
      };
    }
  }

  // GET请求
  public async get<T>(endpoint: string, params?: RequestData) {
    return this.request<T>({
      method: 'GET',
      url: endpoint,
      params,
    });
  }

  // POST请求
  public async post<T>(endpoint: string, data?: RequestData) {
    return this.request<T>({
      method: 'POST',
      url: endpoint,
      data,
    });
  }

  // PUT请求
  public async put<T>(endpoint: string, data?: RequestData) {
    return this.request<T>({
      method: 'PUT',
      url: endpoint,
      data,
    });
  }

  // UPSERT请求 - 创建或更新单条数据
  public async upsert<T>(
    modelName: string, 
    filter: RequestData, 
    createData: any,
    updateData: any
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url: `/model/prod/${modelName}/upsert`,
      data: {
        filter,
        create: createData,
        update: updateData,
      },
    });
  }
}

// 创建数据库服务实例
export const databaseService = new DatabaseService();

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CLOUDBASE_CONFIG } from '../../config/cloudbase';
import { authService } from '../auth/authService';

// 数据库操作响应接口
export interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
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

    // 请求拦截器：添加认证头
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 自动获取当前有效的accessToken
        const currentToken = authService.getCurrentAccessToken();
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：统一错误处理
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response) {
          // 服务器响应了错误状态码
          const errorData = error.response.data || {};
          throw new DatabaseError(
            errorData.message || `HTTP ${error.response.status}`,
            errorData.code || 'HTTP_ERROR',
            error.response.status
          );
        } else if (error.request) {
          // 请求已发出但没有收到响应
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
  ): Promise<DatabaseResponse<T>> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

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
  public async get<T>(endpoint: string, params?: any): Promise<DatabaseResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: endpoint,
      params,
    });
  }

  // POST请求
  public async post<T>(endpoint: string, data?: any): Promise<DatabaseResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: endpoint,
      data,
    });
  }

  // PUT请求
  public async put<T>(endpoint: string, data?: any): Promise<DatabaseResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: endpoint,
      data,
    });
  }

  // DELETE请求
  public async delete<T>(endpoint: string): Promise<DatabaseResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url: endpoint,
    });
  }

  // UPSERT请求 - 创建或更新单条数据
  public async upsert<T>(
    modelName: string, 
    filter: any, 
    createData: any,
    updateData: any
  ): Promise<DatabaseResponse<T>> {
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

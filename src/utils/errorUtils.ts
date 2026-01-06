import axios from 'axios';

/**
 * 检查是否为 axios 错误
 */
export function isAxiosError(error: unknown): error is { response?: { data?: unknown; status?: number }; message?: string } {
  return axios.isAxiosError(error);
}

/**
 * 从错误中提取消息
 */
export function getErrorMessage(error: unknown, defaultMessage: string = '操作失败'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isAxiosError(error)) {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as { message?: string; error?: string; errorMsg?: string };
      return data.message || data.error || data.errorMsg || error.message || defaultMessage;
    }
    return error.message || defaultMessage;
  }
  
  return defaultMessage;
}

/**
 * 从 axios 错误中提取响应数据
 */
export function getAxiosErrorData(error: unknown): { data?: unknown; status?: number } | null {
  if (isAxiosError(error)) {
    return {
      data: error.response?.data,
      status: error.response?.status,
    };
  }
  return null;
}



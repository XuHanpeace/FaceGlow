import { DatabaseError, DatabaseResponse, DatabaseUpdateResponse } from './databaseService';

/**
 * 标准服务响应格式
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 处理数据库响应并转换为标准格式
 * @param response 数据库响应
 * @param defaultErrorCode 默认错误代码
 * @param defaultErrorMessage 默认错误消息
 * @param dataExtractor 数据提取函数，用于从响应中提取所需数据
 */
export function handleDatabaseResponse<T, R = T>(
  response: DatabaseResponse<T> | DatabaseUpdateResponse<T>,
  defaultErrorCode: string,
  defaultErrorMessage: string,
  dataExtractor?: (response: DatabaseResponse<T> | DatabaseUpdateResponse<T>) => R | undefined
): ServiceResponse<R> {
  if (response.success && response.data) {
    const extractedData = dataExtractor ? dataExtractor(response) : (response.data as unknown as R);
    if (extractedData !== undefined) {
      return {
        success: true,
        data: extractedData,
      };
    }
  }

  return {
    success: false,
    error: {
      code: response.error?.code || defaultErrorCode,
      message: response.error?.message || defaultErrorMessage,
    },
  };
}

/**
 * 处理数据库服务异常并转换为标准格式
 * @param error 异常对象
 * @param defaultErrorCode 默认错误代码
 * @param defaultErrorMessage 默认错误消息
 */
export function handleDatabaseError(
  error: unknown,
  defaultErrorCode: string,
  defaultErrorMessage: string
): ServiceResponse<never> {
  return {
    success: false,
    error: {
      code: error instanceof DatabaseError ? error.code : defaultErrorCode,
      message: error instanceof Error ? error.message : defaultErrorMessage,
    },
  };
}



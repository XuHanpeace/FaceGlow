/**
 * 云函数响应解析工具
 * 统一处理多种云函数响应格式：
 * 1. HTTP 包装格式：{ statusCode: 200, body: string | object }
 * 2. 直接数据格式：{ code: number, data: T, message: string }
 * 3. 字符串格式：JSON 字符串
 */

export interface CloudFunctionResponse<T = unknown> {
  code?: number;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
  body?: string | T;
  [key: string]: unknown;
}

/**
 * 解析云函数响应
 * @param rawResponse 原始响应数据
 * @returns 解析后的响应对象
 */
export function parseCloudFunctionResponse<T = unknown>(
  rawResponse: unknown
): CloudFunctionResponse<T> {
  // 如果响应是字符串，尝试解析为 JSON
  if (typeof rawResponse === 'string') {
    try {
      const parsed = JSON.parse(rawResponse);
      return parsed as CloudFunctionResponse<T>;
    } catch (e) {
      console.error('解析云函数响应字符串失败:', e);
      return {
        code: -1,
        message: '响应格式错误',
      };
    }
  }

  // 如果响应是对象
  if (typeof rawResponse === 'object' && rawResponse !== null) {
    const response = rawResponse as Record<string, unknown>;

    // 处理 HTTP 包装格式：{ statusCode: 200, body: string | object }
    if (response.statusCode === 200 && response.body !== undefined) {
      const body = typeof response.body === 'string' 
        ? JSON.parse(response.body) 
        : response.body;
      
      return body as CloudFunctionResponse<T>;
    }

    // 处理直接数据格式：{ code: number, data: T, message: string }
    return response as CloudFunctionResponse<T>;
  }

  // 未知格式
  return {
    code: -1,
    message: '未知的响应格式',
  };
}

/**
 * 从云函数响应中提取数据字段
 * 支持多种嵌套路径：Response.FusedImage, FusedImage, data 等
 * @param response 解析后的响应对象
 * @param fieldPaths 字段路径数组，按优先级顺序尝试
 * @returns 提取的字段值，如果未找到返回 undefined
 */
export function extractFieldFromResponse<T = unknown>(
  response: CloudFunctionResponse,
  fieldPaths: string[]
): T | undefined {
  for (const path of fieldPaths) {
    const keys = path.split('.');
    let value: unknown = response;
    
    for (const key of keys) {
      if (typeof value === 'object' && value !== null && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = undefined;
        break;
      }
    }
    
    if (value !== undefined) {
      return value as T;
    }
  }
  
  return undefined;
}

/**
 * 检查云函数响应是否成功
 * @param response 解析后的响应对象
 * @returns 是否成功
 */
export function isCloudFunctionSuccess(response: CloudFunctionResponse): boolean {
  return response.code === 0 || response.code === 200;
}


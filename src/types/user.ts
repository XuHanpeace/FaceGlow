// 用户相关类型定义

// 用户基本信息
export interface User {
  id: string;                    // 用户唯一标识
  deviceId: string;              // 设备ID（用于匿名登录）
  nickname?: string;             // 用户昵称（可选）
  avatar?: string;               // 头像URL（可选）
  createdAt: number;             // 创建时间戳
  lastLoginAt: number;           // 最后登录时间戳
  isAnonymous: boolean;          // 是否为匿名用户
  status: 'active' | 'inactive'; // 用户状态
}

// 换脸记录
export interface FaceSwapRecord {
  id: string;                    // 记录唯一标识
  userId: string;                // 用户ID
  templateId: string;            // 使用的模板ID
  templateName: string;          // 模板名称
  originalImageUrl: string;      // 原始用户照片URL
  resultImageUrl: string;        // 换脸结果图片URL
  status: 'processing' | 'completed' | 'failed'; // 处理状态
  createdAt: number;             // 创建时间戳
  completedAt?: number;          // 完成时间戳
  errorMessage?: string;         // 错误信息（如果有）
  metadata?: {                   // 元数据
    processingTime?: number;      // 处理耗时（毫秒）
    imageSize?: number;          // 图片大小（字节）
    quality?: number;            // 图片质量评分
  };
}

// 模板信息
export interface Template {
  id: string;                    // 模板ID
  name: string;                  // 模板名称
  description?: string;          // 模板描述
  imageUrl: string;              // 模板图片URL
  category: string;              // 模板分类
  tags: string[];                // 标签
  isActive: boolean;             // 是否可用
  createdAt: number;             // 创建时间
  usageCount: number;            // 使用次数
}

// 用户统计信息
export interface UserStats {
  userId: string;                // 用户ID
  totalSwaps: number;            // 总换脸次数
  successfulSwaps: number;       // 成功次数
  failedSwaps: number;           // 失败次数
  totalStorageUsed: number;      // 总存储使用量（字节）
  lastSwapAt?: number;           // 最后一次换脸时间
  favoriteTemplates: string[];   // 收藏的模板ID列表
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  errorMessage?: string;
}

// 换脸请求参数
export interface FaceSwapRequest {
  userId: string;
  templateId: string;
  originalImageUrl: string;
  projectId: string;
}

// 换脸响应
export interface FaceSwapResponse {
  success: boolean;
  recordId?: string;
  resultImageUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// 分页查询参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查询结果
export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 作品状态枚举
 */
export enum WorkStatus {
  /** 处理中 */
  PROCESSING = 'processing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 处理失败 */
  FAILED = 'failed',
  /** 已删除 */
  DELETED = 'deleted'
}

/**
 * 作品可见性枚举
 */
export enum WorkVisibility {
  /** 公开 */
  PUBLIC = 'public',
  /** 私密 */
  PRIVATE = 'private',
  /** 仅关注者可见 */
  FOLLOWERS_ONLY = 'followers_only'
}

/**
 * AI模型类型枚举
 */
export enum AIModelType {
  /** 人脸融合 */
  FACE_FUSION = 'face_fusion',
  /** 风格迁移 */
  STYLE_TRANSFER = 'style_transfer',
  /** 图像增强 */
  IMAGE_ENHANCEMENT = 'image_enhancement',
  /** 背景替换 */
  BACKGROUND_REPLACEMENT = 'background_replacement'
}

/**
 * 作品元数据接口
 */
export interface WorkMetadata {
  /** 处理耗时（毫秒） */
  processing_time: number;
  /** 使用的AI模型 */
  ai_model: AIModelType;
  /** 模型版本 */
  model_version?: string;
  /** 质量评分（0-100） */
  quality_score?: number;
  /** 图片尺寸信息 */
  image_info: {
    /** 原始图片宽度 */
    original_width: number;
    /** 原始图片高度 */
    original_height: number;
    /** 结果图片宽度 */
    result_width: number;
    /** 结果图片高度 */
    result_height: number;
    /** 文件大小（字节） */
    file_size: number;
    /** 文件格式 */
    format: string;
  };
  /** 处理参数 */
  processing_params?: {
    /** 风格强度 */
    style_strength?: number;
    /** 保真度 */
    fidelity?: number;
    /** 其他参数 */
    [key: string]: any;
  };
}

/**
 * 用户作品数据模型接口
 * 对应CloudBase数据库中的user_works集合
 */
export interface UserWorkModel {
  /** 文档ID（CloudBase自动生成） */
  _id?: string;
  /** 作品唯一标识 */
  work_id: string;
  /** 用户ID */
  uid: string;
  /** 使用的素材ID */
  material_id: string;
  /** 使用的模板ID */
  template_id?: string;
  /** 原始自拍照URL */
  original_image: string;
  /** AI生成结果图片URL */
  result_image: string;
  /** 作品标题 */
  title?: string;
  /** 作品描述 */
  description?: string;
  /** 作品标签 */
  tags?: string[];
  /** 作品可见性 */
  visibility: WorkVisibility;
  /** 作品状态 */
  status: WorkStatus;
  /** 点赞数 */
  likes: number;
  /** 下载次数 */
  downloads: number;
  /** 分享次数 */
  shares: number;
  /** 收藏次数 */
  favorites: number;
  /** 评论数 */
  comments: number;
  /** 作品元数据 */
  metadata?: WorkMetadata;
  /** 创建时间戳 */
  created_at: number;
  /** 更新时间戳 */
  updated_at: number;
  /** 处理完成时间戳 */
  completed_at?: number;
  /** 是否置顶 */
  is_pinned: boolean;
  /** 是否推荐 */
  is_recommended: boolean;
  /** 审核状态 */
  review_status: 'pending' | 'approved' | 'rejected';
  /** 审核备注 */
  review_note?: string;
  /** 地理位置信息 */
  location?: {
    /** 国家 */
    country?: string;
    /** 省份 */
    province?: string;
    /** 城市 */
    city?: string;
    /** 详细地址 */
    address?: string;
    /** 经度 */
    longitude?: number;
    /** 纬度 */
    latitude?: number;
  };
  /** 设备信息 */
  device_info?: {
    /** 设备类型 */
    device_type: string;
    /** 操作系统 */
    os: string;
    /** 应用版本 */
    app_version: string;
    /** 设备型号 */
    device_model?: string;
  };
}

/**
 * 创建作品请求参数接口
 */
export interface CreateWorkRequest {
  /** 用户ID */
  uid: string;
  /** 使用的素材ID */
  material_id: string;
  /** 使用的模板ID */
  template_id?: string;
  /** 原始自拍照URL */
  original_image: string;
  /** 作品标题 */
  title?: string;
  /** 作品描述 */
  description?: string;
  /** 作品标签 */
  tags?: string[];
  /** 作品可见性 */
  visibility?: WorkVisibility;
  /** 地理位置信息 */
  location?: {
    country?: string;
    province?: string;
    city?: string;
    address?: string;
    longitude?: number;
    latitude?: number;
  };
  /** 设备信息 */
  device_info?: {
    device_type: string;
    os: string;
    app_version: string;
    device_model?: string;
  };
}

/**
 * 更新作品请求参数接口
 */
export interface UpdateWorkRequest {
  /** 作品标题 */
  title?: string;
  /** 作品描述 */
  description?: string;
  /** 作品标签 */
  tags?: string[];
  /** 作品可见性 */
  visibility?: WorkVisibility;
  /** 是否置顶 */
  is_pinned?: boolean;
}

/**
 * 作品查询参数接口
 */
export interface WorkQueryParams {
  /** 用户ID */
  uid?: string;
  /** 作品ID */
  work_id?: string;
  /** 素材ID */
  material_id?: string;
  /** 模板ID */
  template_id?: string;
  /** 作品状态 */
  status?: WorkStatus;
  /** 作品可见性 */
  visibility?: WorkVisibility;
  /** 审核状态 */
  review_status?: 'pending' | 'approved' | 'rejected';
  /** 是否置顶 */
  is_pinned?: boolean;
  /** 是否推荐 */
  is_recommended?: boolean;
  /** 创建时间范围开始 */
  created_at_start?: number;
  /** 创建时间范围结束 */
  created_at_end?: number;
  /** 排序字段 */
  sort_by?: 'created_at' | 'likes' | 'downloads' | 'shares';
  /** 排序方向 */
  sort_order?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
}

/**
 * 作品列表响应接口
 */
export interface WorkListResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 作品数据列表 */
  data: UserWorkModel[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  page_size: number;
}

/**
 * 作品详情响应接口
 */
export interface WorkDetailResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 作品数据 */
  data: UserWorkModel;
}

/**
 * 作品统计信息接口
 */
export interface WorkStatistics {
  /** 总作品数 */
  total_works: number;
  /** 公开作品数 */
  public_works: number;
  /** 私密作品数 */
  private_works: number;
  /** 总点赞数 */
  total_likes: number;
  /** 总下载数 */
  total_downloads: number;
  /** 总分享数 */
  total_shares: number;
  /** 总收藏数 */
  total_favorites: number;
  /** 总评论数 */
  total_comments: number;
  /** 平均质量评分 */
  average_quality_score: number;
  /** 本月新增作品数 */
  monthly_new_works: number;
  /** 本周新增作品数 */
  weekly_new_works: number;
}

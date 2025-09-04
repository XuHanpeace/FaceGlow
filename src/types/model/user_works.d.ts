/**
 * 用户作品数据模型接口
 * 对应CloudBase数据库中的user_works集合
 * 基于test.json数据结构
 */
export interface UserWorkModel {
  /** 文档ID（CloudBase自动生成） */
  _id?: string;
  /** 用户ID */
  uid: string;
  /** 活动ID */
  activity_id: string;
  /** 活动标题 */
  activity_title: string;
  /** 活动描述 */
  activity_description: string;
  /** 活动图片 */
  activity_image: string;
  /** 相册ID */
  album_id: string;
  /** 点赞数 */
  likes: string;
  /** 是否公开 */
  is_public: string;
  /** 下载次数 */
  download_count: string;
  /** 结果数据数组 */
  result_data: ResultData[];
  /** 扩展数据（JSON字符串） */
  ext_data: string;
  /** 创建时间戳 */
  created_at?: number;
  /** 更新时间戳 */
  updated_at?: number;
}

/**
 * 结果数据接口
 */
export interface ResultData {
  /** 模板ID */
  template_id: string;
  /** 模板图片URL */
  template_image: string;
  /** 结果图片URL */
  result_image: string;
}

/**
 * 扩展数据接口
 */
export interface ExtData {
  /** 测试字段 */
  test: string;
  /** 其他扩展字段 */
  [key: string]: any;
}

/**
 * 创建用户作品请求参数接口
 */
export interface CreateUserWorkRequest {
  /** 用户ID */
  uid: string;
  /** 活动ID */
  activity_id: string;
  /** 活动标题 */
  activity_title: string;
  /** 活动描述 */
  activity_description: string;
  /** 活动图片 */
  activity_image: string;
  /** 相册ID */
  album_id: string;
  /** 是否公开 */
  is_public: string;
  /** 结果数据数组 */
  result_data: ResultData[];
  /** 扩展数据 */
  ext_data?: string;
}

/**
 * 更新用户作品请求参数接口
 */
export interface UpdateUserWorkRequest {
  /** 活动标题 */
  activity_title?: string;
  /** 活动描述 */
  activity_description?: string;
  /** 活动图片 */
  activity_image?: string;
  /** 是否公开 */
  is_public?: string;
  /** 结果数据数组 */
  result_data?: ResultData[];
  /** 扩展数据 */
  ext_data?: string;
}

/**
 * 用户作品查询参数接口
 */
export interface UserWorkQueryParams {
  /** 用户ID */
  uid?: string;
  /** 活动ID */
  activity_id?: string;
  /** 相册ID */
  album_id?: string;
  /** 是否公开 */
  is_public?: string;
  /** 创建时间范围开始 */
  created_at_start?: number;
  /** 创建时间范围结束 */
  created_at_end?: number;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
}

/**
 * 用户作品列表响应接口
 */
export interface UserWorkListResponse {
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
 * 用户作品详情响应接口
 */
export interface UserWorkDetailResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 作品数据 */
  data: UserWorkModel;
}

/**
 * 用户作品统计信息接口
 */
export interface UserWorkStatistics {
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
  /** 本月新增作品数 */
  monthly_new_works: number;
  /** 本周新增作品数 */
  weekly_new_works: number;
}

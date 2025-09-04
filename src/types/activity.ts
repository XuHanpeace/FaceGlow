/**
 * 活动类型枚举
 */
export enum ActivityType {
  /** 相册类型活动 */
  ALBUM = 'album',
  /** 其他类型活动 */
  OTHER = 'other'
}

/**
 * 活动状态枚举
 */
export enum ActivityStatus {
  /** 未开始 */
  UPCOMING = '0',
  /** 进行中 */
  ACTIVE = '1',
  /** 已结束 */
  ENDED = '2'
}

/**
 * 相册等级枚举
 */
export enum AlbumLevel {
  /** 免费等级 */
  FREE = '0',
  /** 付费等级 */
  PREMIUM = '1',
  /** VIP等级 */
  VIP = '2'
}

/**
 * 模板信息接口
 */
export interface Template {
  /** 模板唯一标识 */
  template_id: string;
  /** 模板图片URL */
  template_url: string;
  /** 模板名称 */
  template_name: string;
  /** 模板描述 */
  template_description: string;
}

/**
 * 相册信息接口
 */
export interface Album {
  /** 相册唯一标识 */
  album_id: string;
  /** 相册名称 */
  album_name: string;
  /** 相册描述 */
  album_description: string;
  /** 相册封面图片 */
  album_image: string;
  /** 相册等级 (0:免费, 1:付费, 2:VIP) */
  level: AlbumLevel;
  /** 相册价格（分） */
  price: number;
  /** 相册包含的模板列表 */
  template_list: Template[];
}

/**
 * 活动信息接口
 */
export interface Activity {
  /** 活动类型 (album: 相册类型) */
  activity_type: ActivityType;
  /** 活动状态 (0:未开始, 1:进行中, 2:已结束) */
  activity_status: ActivityStatus;
  /** 活动唯一标识 */
  activiy_id: string;
  /** 活动包含的相册列表 */
  album_id_list: Album[];
}

/**
 * 活动列表响应接口
 */
export interface ActivityListResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 活动数据 */
  data: Activity;
}

/**
 * 活动查询参数接口
 */
export interface ActivityQueryParams {
  /** 活动ID */
  activity_id?: string;
  /** 活动类型 */
  activity_type?: ActivityType;
  /** 活动状态 */
  activity_status?: ActivityStatus;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
}

/**
 * 相册查询参数接口
 */
export interface AlbumQueryParams {
  /** 相册ID */
  album_id?: string;
  /** 相册等级 */
  level?: AlbumLevel;
  /** 价格范围最小值 */
  min_price?: number;
  /** 价格范围最大值 */
  max_price?: number;
}

/**
 * 模板查询参数接口
 */
export interface TemplateQueryParams {
  /** 模板ID */
  template_id?: string;
  /** 所属相册ID */
  album_id?: string;
  /** 模板名称关键词 */
  name_keyword?: string;
}

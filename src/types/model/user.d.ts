/**
 * 用户状态枚举
 */
export enum UserStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 非活跃状态 */
  INACTIVE = 'inactive',
  /** 被封禁状态 */
  BANNED = 'banned'
}

/**
 * 用户性别枚举
 */
export enum UserGender {
  /** 男性 */
  MALE = 'male',
  /** 女性 */
  FEMALE = 'female',
  /** 其他 */
  OTHER = 'other',
  /** 保密 */
  SECRET = 'secret'
}

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  /** 语言偏好 */
  language: string;
  /** 主题偏好 */
  theme: string;
  /** 通知设置 */
  notification: boolean;
  /** 隐私设置 */
  privacy: {
    /** 是否公开作品 */
    public_works: boolean;
    /** 是否显示在线状态 */
    show_online_status: boolean;
    /** 是否允许陌生人私信 */
    allow_direct_message: boolean;
  };
}

/**
 * 用户数据模型接口
 * 对应CloudBase数据库中的users集合
 */
export interface User {
  /** 文档ID（CloudBase自动生成） */
  _id?: string;
  /** 用户唯一标识（来自CloudBase认证） */
  uid: string;
  /** 用户名 */
  username: string;
  /** 手机号 */
  phone_number: string;
  /** 昵称 */
  name?: string;
  /** 性别 */
  gender?: UserGender;
  /** 头像URL */
  picture?: string;
  /** 最新自拍照URL */
  selfie_url?: string;
  /** 自拍照列表（URL数组，最多存储10张） */
  selfie_list?: string[];
  /** 作品列表（作品ID数组，关联到user_works表） */
  work_list?: string[];
  /** 用户余额（分） */
  balance: number;
  /** 是否VIP用户 */
  is_premium: boolean;
  /** VIP到期时间戳 */
  premium_expires_at?: number;
  /** 用户偏好设置 */
  preferences?: UserPreferences;
  /** 用户状态 */
  status: UserStatus;
  /** 创建时间戳 */
  created_at: number;
  /** 更新时间戳 */
  updated_at: number;
  /** 最后登录时间戳 */
  last_login_at: number;
  /** 注册IP地址 */
  register_ip?: string;
  /** 最后登录IP地址 */
  last_login_ip?: string;
  /** 设备信息 */
  device_info?: {
    /** 设备类型 */
    device_type: string;
    /** 操作系统 */
    os: string;
    /** 应用版本 */
    app_version: string;
  };
  /** 统计信息 */
  statistics?: {
    /** 作品总数 */
    total_works: number;
    /** 获得点赞总数 */
    total_likes: number;
    /** 作品被下载总数 */
    total_downloads: number;
    /** 连续登录天数 */
    consecutive_login_days: number;
  };
}

/**
 * 创建用户请求参数接口
 */
export interface CreateUserRequest {
  /** 用户唯一标识 */
  uid: string;
  /** 用户名 */
  username: string;
  /** 手机号 */
  phone_number: string;
  /** 昵称 */
  name?: string;
  /** 性别 */
  gender?: UserGender;
  /** 头像URL */
  picture?: string;
  /** 注册IP地址 */
  register_ip?: string;
  /** 设备信息 */
  device_info?: {
    device_type: string;
    os: string;
    app_version: string;
  };
}

/**
 * 更新用户信息请求参数接口
 */
export interface UpdateUserRequest {
  /** 昵称 */
  name?: string;
  /** 性别 */
  gender?: UserGender;
  /** 头像URL */
  picture?: string;
  /** 用户偏好设置 */
  preferences?: Partial<UserPreferences>;
}

/**
 * 更新用户自拍照请求参数接口
 */
export interface UpdateUserSelfieRequest {
  /** 自拍照URL */
  selfie_url: string;
  /** 是否添加到自拍照列表 */
  add_to_list?: boolean;
}

/**
 * 用户查询参数接口
 */
export interface UserQueryParams {
  /** 用户ID */
  uid?: string;
  /** 用户名 */
  username?: string;
  /** 手机号 */
  phone_number?: string;
  /** 用户状态 */
  status?: UserStatus;
  /** 是否VIP用户 */
  is_premium?: boolean;
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
 * 用户列表响应接口
 */
export interface UserListResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 用户数据列表 */
  data: User[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  page_size: number;
}

/**
 * 用户详情响应接口
 */
export interface UserDetailResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 用户数据 */
  data: User;
}

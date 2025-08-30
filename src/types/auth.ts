// 腾讯云官方认证API响应格式
export interface CloudBaseAuthResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  sub: string;
  groups: string[];
}

// 用户认证信息（适配后的格式）
export interface AuthCredentials {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number; // 计算得出的过期时间戳
}

// 发送验证码请求参数
export interface SendVerificationRequest {
  phone_number?: string;        // 手机号（+86开头）
  email?: string;               // 邮箱地址
  target: 'ANY' | 'USER' | 'NOT_USER';  // 验证目标类型
}

// 发送验证码响应
export interface SendVerificationResponse {
  verification_id: string;      // 验证码ID，用于后续验证
  expires_in: number;          // 验证码过期时间（秒）
  is_user: boolean;            // 用户是否已存在
}

// 注册请求参数（腾讯云官方格式）
export interface RegisterRequest {
  phone_number: string;         // 手机号（必传，+86开头）
  username: string;             // 用户名（5-24位，支持中英文、数字、特殊字符_-）
  verification_token: string;   // 验证码Token（必传）
  password?: string;            // 密码（可选）
  name?: string;                // 昵称（可选）
  gender?: string;              // 性别（可选）
  avatar_url?: string;             // 头像（可选）
  locale?: string;              // 地区（可选）
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 认证响应
export interface AuthResponse {
  success: boolean;
  data?: AuthCredentials;
  error?: {
    code: string;
    message: string;
  };
}

// 更新登录信息请求
export interface UpdateLoginInfoRequest {
  uid: string;                    // 用户唯一ID
  last_login_at: number;          // 最后登录时间
}

// 存储键名
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  UID: 'uid',
  EXPIRES_AT: 'expiresAt',
  USER_INFO: 'userInfo',
} as const;

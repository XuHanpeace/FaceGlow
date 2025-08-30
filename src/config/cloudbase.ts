// 腾讯云开发配置文件

// 生成随机客户端ID
const generateClientId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const CLOUDBASE_CONFIG = {
  // 环境ID - 请替换为您的实际环境ID
  ENV_ID: 'startup-2gn33jt0ca955730',
  
  // 随机生成的客户端ID
  CLIENT_ID: generateClientId(),
  
  // API配置
  API: {
    BASE_URL: 'https://startup-2gn33jt0ca955730.service.tcloudbase.com',
    VERSION: 'v1',
    TIMEOUT: 15000, // 15秒
    MAX_RETRIES: 2,
  },
  
  // 数据库API配置 - 使用tcloudbasegateway.com域名
  DATABASE_API: {
    BASE_URL: 'https://startup-2gn33jt0ca955730.api.tcloudbasegateway.com',
    VERSION: 'v1',
    TIMEOUT: 15000, // 15秒
    MAX_RETRIES: 2,
  },
  
  // 腾讯云官方认证API端点
  AUTH_API: {
    BASE_URL: 'https://startup-2gn33jt0ca955730.api.tcloudbasegateway.com',
    VERSION: 'v1',
    ENDPOINTS: {
      SIGNUP: '/auth/v1/signup',           // 用户注册
      LOGIN: '/auth/v1/signin',             // 用户登录
      ANONYMOUS: '/auth/v1/anonymous',     // 匿名登录
      REFRESH: '/auth/v1/refresh',         // 刷新令牌
      LOGOUT: '/auth/v1/logout',           // 用户登出
      PROFILE: '/auth/v1/profile',         // 获取用户信息
      SEND_VERIFICATION: '/auth/v1/verification',  // 发送验证码
      VERIFY_VERIFICATION: '/auth/v1/verification/verify',  // 验证验证码
    }
  },
  
  // 云函数配置（保留原有配置，用于其他业务逻辑）
  FUNCTIONS: {
    // 用户认证相关
    REGISTER_USER: 'registerUser',
    LOGIN_USER: 'loginUser',
    ANONYMOUS_AUTH: 'anonymousAuth',
    REFRESH_TOKEN: 'refreshToken',
    LOGOUT: 'logout',
    
    // 其他业务云函数
    GET_USER_INFO: 'getUserInfo',
    UPDATE_USER_INFO: 'updateUserInfo',
  },
  
  // 认证配置
  AUTH: {
    TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5分钟缓冲时间
    REFRESH_THRESHOLD: 30 * 60 * 1000,   // 30分钟内自动刷新
    VERIFICATION_CODE_EXPIRY: 10 * 60 * 1000, // 验证码过期时间（10分钟）
  },
  
  // 存储配置
  STORAGE: {
    // MMKV存储键名
    KEYS: {
      ACCESS_TOKEN: 'accessToken',
      REFRESH_TOKEN: 'refreshToken',
      UID: 'uid',
      EXPIRES_AT: 'expiresAt',
      USER_INFO: 'userInfo',
      VERIFICATION_ID: 'verificationId',  // 验证码ID
      VERIFICATION_EXPIRES_AT: 'verificationExpiresAt', // 验证码过期时间
    },
  },
} as const;

// 环境变量配置（开发/生产环境）
export const getCloudbaseConfig = () => {
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    return {
      ...CLOUDBASE_CONFIG,
    };
  }
  
  return {
    ...CLOUDBASE_CONFIG,
  };
};

// 导出默认配置
export default CLOUDBASE_CONFIG;

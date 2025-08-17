// CloudBase HTTP API 配置
export const CLOUDBASE_CONFIG = {
  // 环境ID
  env: 'startup-2gn33jt0ca955730',
  
  // HTTP API 基础URL
  // 注意：这里需要根据您的实际环境配置正确的URL
  baseUrl: 'https://startup-2gn33jt0ca955730.api.tcloudbasegateway.com',
  
  // 请求超时时间（毫秒）
  timeout: 30000,
  
  // 应用标识
  appSign: 'meiyanhuanhuan',
  
  // 存储相关配置
  storage: {
    // AccessToken 存储的 key
    accessTokenKey: 'cloudbase_access_token',
    // 用户信息存储的 key
    userInfoKey: 'cloudbase_user_info',
  },
  
  // 云函数配置
  functions: {
    // 默认云函数名称
    defaultFunction: 'fusion',
    // 云函数调用超时时间
    timeout: 60000,
  },
  
  // 认证配置
  auth: {
    // 是否自动刷新 token
    autoRefreshToken: true,
    // token 过期前多少秒开始刷新
    refreshTokenBeforeExpire: 300, // 5分钟
  },
  
  // API 路径配置
  apiPaths: {
    // 匿名登录路径
    anonymousLogin: '/auth/v1/signin/anonymously',
    // 云函数调用路径
    functions: '/v1/functions',
    // 认证检查路径
    authCheck: '/auth/check',
  },
};

// 导出配置常量
export const {
  env,
  baseUrl,
  timeout,
  appSign,
  storage,
  functions,
  auth,
  apiPaths,
} = CLOUDBASE_CONFIG;
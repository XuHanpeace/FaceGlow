// CloudBase HTTP API 配置
export const CLOUDBASE_CONFIG = {
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
  apiPaths,
} = CLOUDBASE_CONFIG;

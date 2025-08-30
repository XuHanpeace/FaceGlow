// 服务模块导出

// 认证服务
export { authService, cloudBaseAuthService, verificationService } from './auth';

// 数据库服务
export { userDataService, databaseService } from './database';

// 腾讯云开发配置
export { CLOUDBASE_CONFIG, getCloudbaseConfig } from '../config/cloudbase';

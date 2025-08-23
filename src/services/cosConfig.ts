import { COSConfig, UploadConfig } from './cosUploadService';

/**
 * 腾讯云COS配置
 * 请根据实际情况修改以下配置
 */

// 生产环境配置
export const productionCOSConfig: COSConfig = {
  region: 'ap-guangzhou',                    // 存储桶所在地域简称
  bucket: 'your-bucket-name-1250000000',     // 存储桶名称，格式：bucketname-appid
  secretId: 'your-secret-id',                // 腾讯云API密钥SecretId
  secretKey: 'your-secret-key',              // 腾讯云API密钥SecretKey
  cdnDomain: 'your-cdn-domain.com',          // CDN域名（可选）
  isHttps: true,                             // 是否使用HTTPS
  isDebuggable: false,                       // 生产环境关闭调试模式
};

// 开发环境配置
export const developmentCOSConfig: COSConfig = {
  region: 'ap-guangzhou',                    // 存储桶所在地域简称
  bucket: 'your-dev-bucket-1250000000',      // 开发环境存储桶
  secretId: 'your-dev-secret-id',            // 开发环境SecretId
  secretKey: 'your-dev-secret-key',          // 开发环境SecretKey
  cdnDomain: 'your-dev-cdn-domain.com',      // 开发环境CDN域名
  isHttps: true,                             // 开发环境使用HTTPS
  isDebuggable: true,                        // 开发环境开启调试模式
};

// 根据环境选择配置
export const cosConfig: COSConfig = __DEV__ 
  ? developmentCOSConfig 
  : productionCOSConfig;

// 文件路径配置
export const COS_PATHS = {
  // 用户照片路径
  USER_PHOTOS: 'user_photos',
  
  // 换脸结果路径
  FACE_SWAP_RESULTS: 'face_swap_results',
  
  // 模板图片路径
  TEMPLATES: 'templates',
  
  // 临时文件路径
  TEMP: 'temp',
  
  // 头像路径
  AVATARS: 'avatars',
} as const;

// 文件类型限制
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
] as const;

// 文件大小限制
export const FILE_SIZE_LIMITS = {
  // 用户照片最大大小：10MB
  USER_PHOTO: 10 * 1024 * 1024,
  
  // 换脸结果最大大小：20MB
  FACE_SWAP_RESULT: 20 * 1024 * 1024,
  
  // 模板图片最大大小：5MB
  TEMPLATE: 5 * 1024 * 1024,
  
  // 头像最大大小：2MB
  AVATAR: 2 * 1024 * 1024,
} as const;

// 图片质量配置
export const IMAGE_QUALITY_CONFIG = {
  // 压缩质量（0-1）
  COMPRESSION_QUALITY: 0.8,
  
  // 最大宽度
  MAX_WIDTH: 1920,
  
  // 最大高度
  MAX_HEIGHT: 1080,
  
  // 缩略图宽度
  THUMBNAIL_WIDTH: 300,
  
  // 缩略图高度
  THUMBNAIL_HEIGHT: 300,
} as const;

// 上传配置
export const UPLOAD_CONFIG: UploadConfig = {
  // 启用分块上传的最小文件大小：2MB
  divisionForUpload: 2 * 1024 * 1024,
  
  // 分块大小：1MB
  sliceSizeForUpload: 1 * 1024 * 1024,
  
  // 是否强制使用简单上传
  forceSimpleUpload: true, // 目前只支持简单上传
  
  // 分片上传时是否整体校验
  enableVerification: true,
  
  // 上传超时时间：5分钟
  // 注意：这个配置在SDK中通过COS实例的Timeout参数设置
};

// 错误码定义
export const COS_ERROR_CODES = {
  // 文件过大
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // 文件类型不支持
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  
  // 上传失败
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // 权限不足
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // 存储桶不存在
  BUCKET_NOT_FOUND: 'BUCKET_NOT_FOUND',
  
  // 密钥错误
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const;

// 错误信息映射
export const COS_ERROR_MESSAGES = {
  [COS_ERROR_CODES.FILE_TOO_LARGE]: '文件大小超出限制',
  [COS_ERROR_CODES.UNSUPPORTED_FILE_TYPE]: '不支持的文件类型',
  [COS_ERROR_CODES.UPLOAD_FAILED]: '文件上传失败',
  [COS_ERROR_CODES.NETWORK_ERROR]: '网络连接错误',
  [COS_ERROR_CODES.PERMISSION_DENIED]: '权限不足',
  [COS_ERROR_CODES.BUCKET_NOT_FOUND]: '存储桶不存在',
  [COS_ERROR_CODES.INVALID_CREDENTIALS]: 'API密钥无效',
} as const;

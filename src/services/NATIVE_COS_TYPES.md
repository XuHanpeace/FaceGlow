# 原生COS模块接口类型定义

## 概述
本文档定义了原生COS模块的所有接口类型和参数，确保类型安全和代码质量。

## 核心接口类型

### COSConfig
```typescript
export interface COSConfig {
  secretId: string;        // 腾讯云API密钥ID
  secretKey: string;       // 腾讯云API密钥Key
  bucket: string;          // COS存储桶名称
  region: string;          // COS地域
  appId: string;           // 腾讯云应用ID
  // 可选：临时密钥
  tmpSecretId?: string;    // 临时密钥ID
  tmpSecretKey?: string;   // 临时密钥Key
  sessionToken?: string;   // 临时密钥Token
}
```

### UploadProgress
```typescript
export interface UploadProgress {
  filePath: string;        // 文件路径
  fileName: string;        // 文件名
  progress: number;        // 上传进度 (0-1)
  bytesSent: number;       // 已发送字节数
  totalBytes: number;      // 总字节数
}
```

### UploadResult
```typescript
export interface UploadResult {
  filePath: string;        // 文件路径
  fileName: string;        // 文件名
  success: boolean;        // 是否成功
  url?: string;            // 文件访问URL
  etag?: string;           // 文件ETag
  fileKey?: string;        // 文件在COS中的Key
  error?: string;          // 错误信息
}
```

### COSResponse
```typescript
export interface COSResponse {
  success: boolean;        // 操作是否成功
  message?: string;        // 响应消息
  initialized?: boolean;   // 是否已初始化
  config?: COSConfig;      // 配置信息
}
```

## 方法接口

### 1. 初始化COS服务
```typescript
async initialize(config: COSConfig): Promise<COSResponse>
```
**参数：**
- `config: COSConfig` - COS配置信息

**返回值：**
- `Promise<COSResponse>` - 初始化结果

**使用示例：**
```typescript
const result = await nativeCOSService.initialize({
  secretId: 'your_secret_id',
  secretKey: 'your_secret_key',
  bucket: 'your_bucket',
  region: 'ap-nanjing',
  appId: 'your_app_id'
});
```

### 2. 上传文件
```typescript
async uploadFile(
  filePath: string,        // 文件本地路径
  fileName: string,        // 文件名
  folder: string = 'uploads' // 存储文件夹，默认'uploads'
): Promise<UploadResult>
```
**参数：**
- `filePath: string` - 文件的本地路径
- `fileName: string` - 文件名
- `folder: string` - 存储文件夹，可选，默认为 'uploads'

**返回值：**
- `Promise<UploadResult>` - 上传结果

**使用示例：**
```typescript
const result = await nativeCOSService.uploadFile(
  '/path/to/image.jpg',
  'image.jpg',
  'photos'
);
```

### 3. 检查初始化状态
```typescript
async isInitialized(): Promise<boolean>
```
**参数：** 无

**返回值：**
- `Promise<boolean>` - 是否已初始化

**使用示例：**
```typescript
const initialized = await nativeCOSService.isInitialized();
if (initialized) {
  console.log('COS服务已初始化');
}
```

### 4. 获取当前配置
```typescript
async getConfig(): Promise<COSConfig>
```
**参数：** 无

**返回值：**
- `Promise<COSConfig>` - 当前配置信息

**使用示例：**
```typescript
const config = await nativeCOSService.getConfig();
console.log('当前配置:', config);
```

### 5. 清理配置
```typescript
async cleanup(): Promise<COSResponse>
```
**参数：** 无

**返回值：**
- `Promise<COSResponse>` - 清理结果

**使用示例：**
```typescript
const result = await nativeCOSService.cleanup();
if (result.success) {
  console.log('配置已清理');
}
```

## 事件监听器

### 1. 上传进度监听
```typescript
onUploadProgress(callback: (progress: UploadProgress) => void): {
  remove: () => void;
}
```
**参数：**
- `callback: (progress: UploadProgress) => void` - 进度回调函数

**返回值：**
- 监听器对象，包含 `remove()` 方法用于移除监听

**使用示例：**
```typescript
const listener = nativeCOSService.onUploadProgress((progress) => {
  console.log(`上传进度: ${progress.progress * 100}%`);
});

// 移除监听器
listener.remove();
```

### 2. 上传完成监听
```typescript
onUploadComplete(callback: (result: UploadResult) => void): {
  remove: () => void;
}
```
**参数：**
- `callback: (result: UploadResult) => void` - 完成回调函数

**返回值：**
- 监听器对象，包含 `remove()` 方法用于移除监听

**使用示例：**
```typescript
const listener = nativeCOSService.onUploadComplete((result) => {
  if (result.success) {
    console.log('上传成功:', result.url);
  } else {
    console.error('上传失败:', result.error);
  }
});

// 移除监听器
listener.remove();
```

## 错误处理

### 常见错误类型
1. **NOT_INITIALIZED** - COS服务未初始化
2. **INVALID_CONFIG** - 配置信息无效
3. **UPLOAD_ERROR** - 上传过程中发生错误
4. **INIT_ERROR** - 初始化过程中发生错误

### 错误处理示例
```typescript
try {
  const result = await nativeCOSService.uploadFile(filePath, fileName);
  if (result.success) {
    console.log('上传成功');
  }
} catch (error) {
  if (error.message.includes('NOT_INITIALIZED')) {
    console.error('请先初始化COS服务');
  } else if (error.message.includes('INVALID_CONFIG')) {
    console.error('配置信息无效');
  } else {
    console.error('上传失败:', error.message);
  }
}
```

## 注意事项

1. **初始化顺序**：使用任何功能前必须先调用 `initialize()` 方法
2. **文件路径**：确保文件路径存在且可访问
3. **权限**：确保应用有相机和相册访问权限
4. **网络**：上传需要网络连接
5. **配置**：确保所有必需的配置参数都已提供

## 完整使用示例

```typescript
import nativeCOSService, { COSConfig } from './nativeCOS';

// 1. 初始化COS服务
const initCOS = async () => {
  try {
    const config: COSConfig = {
      secretId: 'your_secret_id',
      secretKey: 'your_secret_key',
      bucket: 'your_bucket',
      region: 'ap-nanjing',
      appId: 'your_app_id'
    };
    
    const result = await nativeCOSService.initialize(config);
    if (result.success) {
      console.log('COS服务初始化成功');
    }
  } catch (error) {
    console.error('初始化失败:', error);
  }
};

// 2. 设置事件监听器
const setupListeners = () => {
  // 进度监听
  const progressListener = nativeCOSService.onUploadProgress((progress) => {
    console.log(`进度: ${progress.progress * 100}%`);
  });
  
  // 完成监听
  const completeListener = nativeCOSService.onUploadComplete((result) => {
    if (result.success) {
      console.log('上传成功:', result.url);
    } else {
      console.error('上传失败:', result.error);
    }
  });
  
  return { progressListener, completeListener };
};

// 3. 上传文件
const uploadFile = async (filePath: string, fileName: string) => {
  try {
    const result = await nativeCOSService.uploadFile(filePath, fileName, 'uploads');
    return result;
  } catch (error) {
    console.error('上传失败:', error);
    throw error;
  }
};
```

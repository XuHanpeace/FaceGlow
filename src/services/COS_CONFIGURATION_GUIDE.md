# COS 配置指南

## 基础配置

### 必需参数

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `secretId` | string | 腾讯云API密钥ID | `'AKIDxxxxxxxxxxxxxxxxxxxxxxxx'` |
| `secretKey` | string | 腾讯云API密钥Key | `'xxxxxxxxxxxxxxxxxxxxxxxxxxxx'` |
| `bucket` | string | COS存储桶名称 | `'my-bucket'` |
| `region` | string | COS地域 | `'ap-nanjing'` |
| `appId` | string | 腾讯云应用ID | `'1257391807'` |

### 临时密钥（可选）

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `tmpSecretId` | string | 临时密钥ID | `'AKIDxxxxxxxxxxxxxxxxxxxxxxxx'` |
| `tmpSecretKey` | string | 临时密钥Key | `'xxxxxxxxxxxxxxxxxxxxxxxxxxxx'` |
| `sessionToken` | string | 临时密钥Token | `'xxxxxxxxxxxxxxxxxxxxxxxxxxxx'` |

## 高级配置选项

### 网络配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `useHTTPS` | boolean | `true` | 是否使用HTTPS协议 |
| `timeoutInterval` | number | `30` | 请求超时时间（秒） |

### 日志配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enableLogging` | boolean | `false` | 是否启用详细日志 |

## 服务配置

### 功能开关

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enableOCR` | boolean | `false` | 是否启用OCR服务 |
| `enableImageProcessing` | boolean | `false` | 是否启用图像处理服务 |
| `enableVideoProcessing` | boolean | `false` | 是否启用视频处理服务 |

## 配置示例

### 基础配置
```typescript
const basicConfig: COSConfig = {
  secretId: 'your-secret-id',
  secretKey: 'your-secret-key',
  bucket: 'my-bucket',
  region: 'ap-nanjing',
  appId: '1257391807',
};
```

### 完整配置
```typescript
const fullConfig: COSConfig = {
  secretId: 'your-secret-id',
  secretKey: 'your-secret-key',
  bucket: 'my-bucket',
  region: 'ap-nanjing',
  appId: '1257391807',
  
  // 高级选项
  useHTTPS: true,
  enableLogging: true,
  timeoutInterval: 60,
  
  // 服务配置
  enableOCR: false,
  enableImageProcessing: false,
  enableVideoProcessing: false,
};
```

### 临时密钥配置
```typescript
const stsConfig: COSConfig = {
  secretId: 'your-secret-id',
  secretKey: 'your-secret-key',
  bucket: 'my-bucket',
  region: 'ap-nanjing',
  appId: '1257391807',
  
  // 临时密钥
  tmpSecretId: 'tmp-secret-id',
  tmpSecretKey: 'tmp-secret-key',
  sessionToken: 'session-token',
};
```

## 注意事项

1. **安全性**：不要在客户端代码中硬编码真实的密钥，建议使用临时密钥或环境变量
2. **地域选择**：选择离用户最近的地域以获得最佳性能
3. **HTTPS**：生产环境建议始终启用HTTPS
4. **超时设置**：根据网络环境调整超时时间
5. **服务开关**：只启用需要的服务功能，避免不必要的资源消耗

## 错误处理

常见配置错误及解决方案：

- **`Missing required configuration parameters`**：检查必需参数是否完整
- **`Invalid region`**：确认地域名称正确
- **`Bucket not found`**：检查存储桶名称和权限
- **`Authentication failed`**：验证密钥是否正确

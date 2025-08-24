# 腾讯云COS服务模块使用说明

## 概述

本模块提供了完整的腾讯云COS（对象存储）服务封装，支持文件上传、下载、删除等核心功能。

## 文件结构

```
src/services/
├── cosService.ts          # COS服务核心类
├── cosConfig.ts           # COS配置管理
└── COS_README.md         # 本说明文档
```

## 快速开始

### 1. 配置COS服务

在 `src/services/cosConfig.ts` 中配置您的腾讯云COS信息：

```typescript
export const COS_CONFIG: COSConfig = {
  secretId: 'AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',      // 您的SecretId
  secretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',      // 您的SecretKey
  bucket: 'my-bucket-name',                          // 存储桶名称
  region: 'ap-beijing',                              // 存储桶地域
  appId: '1250000000',                               // 您的AppId
};
```

### 2. 初始化服务

```typescript
import { cosService } from './services/cosService';

// 初始化COS服务
cosService.initialize(COS_CONFIG);
```

### 3. 使用服务

```typescript
// 上传文件
const result = await cosService.uploadFile(
  filePath,           // 本地文件路径
  fileName,           // 文件名
  'uploads',          // 存储文件夹
  (progress) => {     // 进度回调
    console.log(`上传进度: ${progress}%`);
  }
);

if (result.success) {
  console.log('上传成功:', result.url);
} else {
  console.log('上传失败:', result.error);
}
```

## 主要功能

### 文件上传
- 支持本地文件路径
- 自动生成唯一文件名
- 进度监控
- 错误处理

### 文件下载
- 支持指定本地保存路径
- 错误处理

### 文件管理
- 删除文件
- 获取文件列表
- 生成预签名URL

## API参考

### COSService类

#### 方法

##### `initialize(config: COSConfig)`
初始化COS服务

**参数:**
- `config`: COS配置信息

##### `uploadFile(filePath: string, fileName: string, folder?: string, onProgress?: Function)`
上传文件到COS

**参数:**
- `filePath`: 本地文件路径
- `fileName`: 文件名
- `folder`: 存储文件夹（可选，默认为'uploads'）
- `onProgress`: 进度回调函数（可选）

**返回值:**
```typescript
{
  success: boolean;
  url?: string;
  error?: string;
  etag?: string;
}
```

##### `downloadFile(fileKey: string, localPath: string)`
下载文件

**参数:**
- `fileKey`: COS中的文件键
- `localPath`: 本地保存路径

**返回值:**
```typescript
{
  success: boolean;
  localPath?: string;
  error?: string;
}
```

##### `deleteFile(fileKey: string)`
删除文件

**参数:**
- `fileKey`: COS中的文件键

**返回值:**
```typescript
{
  success: boolean;
  error?: string;
}
```

##### `listFiles(prefix?: string, maxKeys?: number)`
获取文件列表

**参数:**
- `prefix`: 文件前缀（可选）
- `maxKeys`: 最大返回数量（可选，默认100）

**返回值:**
```typescript
{
  success: boolean;
  files?: string[];
  error?: string;
}
```

## 配置说明

### 地域选择

支持的地域包括：
- `ap-beijing`: 北京（华北）
- `ap-nanjing`: 南京（华东）
- `ap-guangzhou`: 广州（华南）
- `ap-hongkong`: 香港（港澳台）
- `ap-singapore`: 新加坡（东南亚）
- 更多地域请参考腾讯云文档

### 权限配置

确保您的腾讯云账号具有以下权限：
- COS服务访问权限
- 存储桶读写权限
- API密钥权限

## 安全注意事项

1. **不要将密钥硬编码在代码中**
   - 生产环境应使用环境变量或配置服务
   - 定期轮换密钥

2. **使用临时密钥**
   - 推荐使用临时密钥进行授权
   - 设置合理的过期时间

3. **权限最小化**
   - 只授予必要的权限
   - 使用子账号和策略管理

## 错误处理

常见错误及解决方案：

### 配置错误
- 检查SecretId和SecretKey是否正确
- 确认存储桶名称和地域
- 验证AppId格式

### 权限错误
- 检查API密钥权限
- 确认存储桶访问权限
- 验证网络访问策略

### 网络错误
- 检查网络连接
- 确认防火墙设置
- 验证DNS解析

## 测试页面

项目包含一个完整的测试页面 `COSUploadTestScreen`，可以测试：
- 拍照上传
- 相册选择上传
- 上传进度显示
- 结果预览

## 示例代码

更多使用示例请参考：
- `src/screens/COSUploadTestScreen.tsx` - 完整的上传测试页面
- `src/services/cosService.ts` - 服务实现代码

## 技术支持

如遇到问题，请：
1. 检查控制台错误日志
2. 验证配置信息
3. 参考腾讯云COS官方文档
4. 查看项目中的错误处理代码

## 更新日志

- v1.0.0: 初始版本，支持基础的上传下载功能
- 支持进度监控和错误处理
- 提供完整的配置管理
- 包含测试页面和文档

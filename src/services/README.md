# CloudBase HTTP API 服务

## 概述

本项目已从 `@cloudbase/js-sdk` 迁移到 CloudBase HTTP API 方式，提供更直接、更灵活的云开发服务调用。

## 文件结构

```
src/services/
├── cloudbaseConfig.ts      # 配置文件
├── cloudbaseHttpApi.ts     # HTTP API 服务实现
├── tcb.ts                  # 兼容性接口（保持原有 API 不变）
└── README.md               # 本说明文档
```

## 主要特性

### 1. 直接 HTTP 调用
- 不依赖 js-sdk 的复杂适配器
- 更轻量级的实现
- 更好的错误处理和调试

### 2. 保持兼容性
- 原有的 `app.callFunction()` 接口保持不变
- 原有的 `auth.anonymousAuthProvider()` 接口保持不变
- 无需修改现有业务代码

### 3. 配置化管理
- 所有配置集中在 `cloudbaseConfig.ts` 中
- 易于环境切换和配置管理

## 使用方法

### 基本用法

```typescript
import { callGenerateFunction } from './services/tcb';

// 调用云函数
  const result = await callGenerateFunction({
  prompt: '生成一张图片',
  style: 'realistic'
});
```

### 直接使用 HTTP API

```typescript
import { cloudbaseHttpApi } from './services/cloudbaseHttpApi';

// 匿名登录
await cloudbaseHttpApi.anonymousLogin();

// 调用云函数
const result = await cloudbaseHttpApi.callFunction('performFusion', {
  prompt: '生成一张图片',
  style: 'realistic'
});
```

## 配置说明

### 环境配置

在 `cloudbaseConfig.ts` 中修改以下配置：

```typescript
export const CLOUDBASE_CONFIG = {
  env: 'your-env-id',           // 您的环境ID
  baseUrl: 'https://api.cloudbase.net', // API 基础URL
  appSign: 'your-app-sign',     // 应用标识
  // ... 其他配置
};
```

### 重要配置项

- `env`: CloudBase 环境ID
- `baseUrl`: HTTP API 的基础URL（需要根据实际环境调整）
- `appSign`: 应用标识
- `timeout`: 请求超时时间

## 认证流程

1. **匿名登录**: 自动获取 AccessToken
2. **Token 管理**: 自动存储和刷新 AccessToken
3. **请求认证**: 所有 API 请求自动携带认证信息

## 错误处理

所有 API 调用都包含完善的错误处理：

```typescript
try {
  const result = await callGenerateFunction(params);
  // 处理成功结果
} catch (error) {
  console.error('调用失败:', error.message);
  // 处理错误
}
```

## 注意事项

1. **URL 配置**: 确保 `baseUrl` 指向正确的 CloudBase HTTP API 端点
2. **环境ID**: 确保 `env` 配置正确
3. **网络权限**: 确保应用有网络访问权限
4. **错误处理**: 建议在所有 API 调用中添加 try-catch 错误处理

## 迁移说明

从 js-sdk 迁移到 HTTP API 的优势：

- ✅ 更轻量级，减少依赖
- ✅ 更直接的错误处理
- ✅ 更好的调试体验
- ✅ 不依赖复杂的适配器
- ✅ 保持原有 API 兼容性

## 技术支持

如果遇到问题，请检查：

1. 网络连接是否正常
2. 配置是否正确
3. 环境ID 是否有效
4. 控制台错误信息

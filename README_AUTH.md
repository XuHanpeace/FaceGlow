# FaceGlow 认证模块使用说明

## 概述

本项目基于React Native和腾讯云开发HTTP API实现了完整的用户认证系统，包括用户名密码注册/登录、匿名登录、令牌管理等功能。

## 核心模块

### 1. 类型定义 (`src/types/auth.ts`)

定义了所有认证相关的TypeScript类型，确保类型安全：

- `AuthCredentials`: 用户认证信息
- `RegisterRequest`/`LoginRequest`: 注册/登录请求参数
- `AuthResponse`: 认证响应
- `CloudFunctionResponse`: 云函数响应
- `STORAGE_KEYS`: 存储键名常量

### 2. 云函数请求模块 (`src/services/cloudFunction.ts`)

封装了与腾讯云开发HTTP API的通信：

- **自动认证**: 自动添加Authorization头
- **请求重试**: 最多重试2次，支持指数退避
- **超时处理**: 15秒请求超时
- **令牌刷新**: 401错误时自动刷新访问令牌
- **错误处理**: 统一的错误处理机制

### 3. 用户认证服务 (`src/services/authService.ts`)

提供完整的用户认证功能：

- `registerWithPassword()`: 用户名密码注册
- `loginWithPassword()`: 用户名密码登录
- `anonymousLogin()`: 匿名登录（自动生成用户名）
- `refreshAccessToken()`: 刷新访问令牌
- `logout()`: 用户登出
- `isLoggedIn()`: 检查登录状态
- `autoRefreshTokenIfNeeded()`: 自动令牌刷新

### 4. 认证Hook (`src/hooks/useAuth.ts`)

React Hook封装，提供状态管理和认证方法：

```typescript
const { 
  isLoggedIn, 
  isLoading, 
  user, 
  error,
  register, 
  login, 
  anonymousLogin, 
  logout 
} = useAuth();
```

### 5. 配置文件 (`src/config/cloudbase.ts`)

腾讯云开发环境配置，支持开发/生产环境切换。

## 使用方法

### 基本使用

```typescript
import { useAuth } from '../hooks/useAuth';

const LoginScreen = () => {
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    const result = await login('username', 'password');
    if (result.success) {
      // 登录成功，跳转到主页面
      navigation.navigate('Home');
    }
  };

  return (
    // 登录表单UI
  );
};
```

### 匿名登录

```typescript
const { anonymousLogin } = useAuth();

const handleAnonymousLogin = async () => {
  const result = await anonymousLogin();
  if (result.success) {
    // 匿名登录成功
    console.log('匿名用户ID:', result.data?.uid);
  }
};
```

### 注册新用户

```typescript
const { register } = useAuth();

const handleRegister = async () => {
  const result = await register('newuser', 'password123');
  if (result.success) {
    // 注册成功，自动登录
    console.log('用户ID:', result.data?.uid);
  }
};
```

### 检查登录状态

```typescript
const { isLoggedIn, user } = useAuth();

useEffect(() => {
  if (isLoggedIn) {
    console.log('当前用户:', user?.uid);
  }
}, [isLoggedIn, user]);
```

## 云函数配置

需要在腾讯云开发控制台创建以下云函数：

### 1. registerUser
```javascript
// 用户注册云函数
exports.main = async (event, context) => {
  const { username, password } = event;
  
  // 验证用户名密码
  // 创建用户记录
  // 生成访问令牌和刷新令牌
  
  return {
    code: 0,
    message: '注册成功',
    data: {
      uid: 'user_123',
      accessToken: 'access_token_xxx',
      refreshToken: 'refresh_token_xxx',
      expiresIn: 7200
    }
  };
};
```

### 2. loginUser
```javascript
// 用户登录云函数
exports.main = async (event, context) => {
  const { username, password } = event;
  
  // 验证用户名密码
  // 生成新的访问令牌和刷新令牌
  
  return {
    code: 0,
    message: '登录成功',
    data: {
      uid: 'user_123',
      accessToken: 'access_token_xxx',
      refreshToken: 'refresh_token_xxx',
      expiresIn: 7200
    }
  };
};
```

### 3. anonymousAuth
```javascript
// 匿名认证云函数
exports.main = async (event, context) => {
  const { username } = event;
  
  // 创建匿名用户记录
  // 生成访问令牌和刷新令牌
  
  return {
    code: 0,
    message: '匿名登录成功',
    data: {
      uid: 'anon_123',
      accessToken: 'access_token_xxx',
      refreshToken: 'refresh_token_xxx',
      expiresIn: 7200
    }
  };
};
```

### 4. refreshToken
```javascript
// 令牌刷新云函数
exports.main = async (event, context) => {
  const { refreshToken } = event;
  
  // 验证刷新令牌
  // 生成新的访问令牌
  
  return {
    code: 0,
    message: '令牌刷新成功',
    data: {
      accessToken: 'new_access_token_xxx',
      refreshToken: 'new_refresh_token_xxx',
      expiresIn: 7200
    }
  };
};
```

## 环境配置

### 1. 更新配置文件

编辑 `src/config/cloudbase.ts`，替换为您的实际环境ID：

```typescript
export const CLOUDBASE_CONFIG = {
  ENV_ID: 'your-actual-env-id', // 替换为您的环境ID
  API: {
    BASE_URL: 'https://your-actual-env-id.service.tcloudbase.com',
    // ... 其他配置
  },
  // ... 其他配置
};
```

### 2. 环境变量（可选）

创建 `.env` 文件：

```bash
CLOUDBASE_ENV_ID=your-env-id
CLOUDBASE_API_URL=https://your-env-id.service.tcloudbase.com
```

## 存储机制

使用MMKV进行本地存储，存储以下信息：

- `accessToken`: 访问令牌
- `refreshToken`: 刷新令牌  
- `uid`: 用户ID
- `expiresAt`: 令牌过期时间戳
- `userInfo`: 用户信息（可选）

## 安全特性

1. **自动令牌刷新**: 令牌即将过期时自动刷新
2. **安全存储**: 使用MMKV进行本地存储
3. **请求重试**: 网络错误时自动重试
4. **错误处理**: 统一的错误处理机制
5. **类型安全**: 完整的TypeScript类型定义

## 注意事项

1. 确保在腾讯云开发控制台正确配置云函数
2. 更新配置文件中的环境ID和API地址
3. 在生产环境中使用HTTPS
4. 定期检查令牌过期时间
5. 处理网络异常和认证失败的情况

## 故障排除

### 常见问题

1. **401错误**: 检查令牌是否过期，尝试手动刷新
2. **网络超时**: 检查网络连接和API地址配置
3. **存储失败**: 检查MMKV是否正确安装和配置
4. **类型错误**: 确保所有导入的类型定义正确

### 调试方法

1. 启用详细日志记录
2. 检查网络请求和响应
3. 验证存储的认证信息
4. 测试云函数是否正常工作

## 更新日志

- v1.0.0: 初始版本，实现基本认证功能
- 支持用户名密码注册/登录
- 支持匿名登录
- 实现自动令牌刷新
- 完整的TypeScript类型支持

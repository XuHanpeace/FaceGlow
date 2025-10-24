# 长期登录态保持解决方案

## 概述

为了解决 access token 24小时有效期限制，实现30天登录态保持，我们设计了一个完整的长期认证解决方案。

## 核心组件

### 1. LongTermAuthService (长期认证服务)

**文件位置**: `src/services/auth/longTermAuthService.ts`

**主要功能**:
- 30天登录态保持
- 自动token刷新（提前2小时）
- 定期检查（30分钟间隔）
- 失败重试机制
- 应用前后台状态管理

**关键配置**:
```typescript
const LONG_TERM_AUTH_CONFIG = {
  MAX_IDLE_DAYS: 30,           // 30天登录态保持
  REFRESH_AHEAD_HOURS: 2,      // 提前2小时刷新
  CHECK_INTERVAL_MINUTES: 30,  // 30分钟检查间隔
}
```

### 2. AppLifecycleManager (应用生命周期管理器)

**文件位置**: `src/services/auth/appLifecycleManager.ts`

**主要功能**:
- 监听应用前后台切换
- 集成长期认证服务
- 自动处理登录态恢复

## 工作流程

### 应用启动时
1. 初始化应用生命周期管理器
2. 检查是否在30天内
3. 尝试使用 refresh token 恢复登录态
4. 启动定期检查定时器

### 应用前台时
1. 更新最后活跃时间
2. 检查并恢复登录态
3. 重置失败计数

### 应用后台时
1. 更新最后活跃时间
2. 保持定时器运行

### 定期检查
1. 每30分钟检查一次
2. 验证是否在30天内
3. 检查token是否需要刷新
4. 自动刷新即将过期的token

## 使用方法

### 1. 自动集成（推荐）

应用启动时自动初始化，无需手动调用：

```typescript
// App.tsx 中已自动集成
import { appLifecycleManager } from './src/services/auth/appLifecycleManager';

// 应用启动时自动初始化
await appLifecycleManager.initialize();
```

### 2. 手动检查登录态

```typescript
import { appLifecycleManager } from './src/services/auth/appLifecycleManager';

// 手动触发登录态检查
const isAuthValid = await appLifecycleManager.manualAuthCheck();
if (!isAuthValid) {
  // 需要重新登录
  navigation.navigate('Login');
}
```

### 3. 获取服务状态

```typescript
import { appLifecycleManager } from './src/services/auth/appLifecycleManager';

// 获取当前状态
const status = appLifecycleManager.getStatus();
console.log('应用状态:', status);
```

## 存储机制

### 本地存储键
- `lastActiveTime`: 最后活跃时间戳
- `refreshFailureCount`: 刷新失败次数
- `backgroundRefreshEnabled`: 后台刷新开关

### 认证信息存储
- `accessToken`: 访问令牌
- `refreshToken`: 刷新令牌
- `expiresAt`: 过期时间戳
- `isAnonymous`: 是否匿名用户

## 错误处理

### 失败重试机制
- 刷新失败时增加失败计数
- 连续失败5次后清除认证信息
- 自动降级到匿名登录

### 超时处理
- 超过30天未使用自动清除认证
- 提供手动检查接口
- 优雅降级处理

## 性能优化

### 定时器管理
- 应用卸载时自动清理定时器
- 避免内存泄漏
- 智能检查间隔

### 网络优化
- 提前2小时刷新token
- 避免频繁网络请求
- 失败时指数退避

## 调试功能

### 状态监控
```typescript
// 获取详细状态
const status = appLifecycleManager.getStatus();
console.log('生命周期状态:', status.isInitialized);
console.log('应用状态:', status.appState);
console.log('认证状态:', status.authStatus);
```

### 手动触发
```typescript
// 手动检查登录态
const result = await appLifecycleManager.manualAuthCheck();
console.log('检查结果:', result);
```

## 注意事项

1. **网络依赖**: 需要网络连接才能刷新token
2. **存储安全**: 敏感信息存储在MMKV中，相对安全
3. **电池优化**: 定期检查可能影响电池寿命
4. **隐私保护**: 30天后自动清除用户数据

## 配置调整

如需调整配置，修改 `longTermAuthService.ts` 中的常量：

```typescript
const LONG_TERM_AUTH_CONFIG = {
  MAX_IDLE_DAYS: 30,           // 可调整为其他天数
  REFRESH_AHEAD_HOURS: 2,      // 可调整提前刷新时间
  CHECK_INTERVAL_MINUTES: 30,   // 可调整检查间隔
}
```

## 测试建议

1. **正常流程测试**: 验证30天内自动保持登录
2. **超时测试**: 验证30天后自动清除
3. **网络异常测试**: 验证网络断开时的处理
4. **应用重启测试**: 验证应用重启后状态恢复
5. **前后台切换测试**: 验证状态正确更新

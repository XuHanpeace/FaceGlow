# 匿名登录与用户认证指南

本文档说明如何在项目中正确使用匿名登录和真实用户认证。

## 📋 概述

项目现在支持两种登录方式：
1. **匿名登录** - 用于浏览公开内容（如activity数据）
2. **真实用户登录** - 用于个人功能（创作、购买、个人资料等）

## 🎯 使用场景

### ✅ 允许匿名用户访问
- 浏览activity活动
- 查看公开模板
- 浏览公开内容

### ⛔ 需要真实用户登录
- 创作作品
- 购买金币/会员
- 查看/编辑个人资料
- 上传自拍照片
- 查看订单/交易记录
- 任何涉及个人数据的操作

## 🔧 API使用说明

### 1. 检查用户状态

```typescript
import { authService } from './services/auth/authService';

// 检查是否已登录（仅真实用户，不包括匿名）
const isLoggedIn = authService.isLoggedIn();

// 检查是否有有效认证态（包括匿名用户）
const hasValidAuth = authService.hasValidAuth();

// 检查是否是匿名用户
const isAnonymous = authService.isAnonymous();

// 检查是否是真实用户（非匿名）- 等同于 isLoggedIn()
const isRealUser = authService.isRealUser();
```

### 2. 在服务中使用

#### 场景A: 允许匿名访问（如activityService）

```typescript
import { authService } from '../auth/authService';

export class ActivityService {
  async getActivities() {
    // 使用 ensureAuthenticated() - 如果没有登录态，会自动匿名登录
    const authResult = await authService.ensureAuthenticated();
    
    if (!authResult.success) {
      return {
        code: 401,
        message: '认证失败',
        data: []
      };
    }
    
    // 继续业务逻辑...
    // 可以是真实用户，也可以是匿名用户
  }
}
```

#### 场景B: 需要真实用户（如创作服务）

```typescript
import { authService } from '../auth/authService';

export class CreationService {
  async createWork(data: Record<string, unknown>) {
    // 使用 requireRealUser() - 只允许真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      // 需要跳转到登录页面
      return {
        success: false,
        needLogin: true,  // 标记需要登录
        error: authResult.error,
      };
    }
    
    // 只有真实用户才能执行到这里
    // 继续创作逻辑...
  }
}
```

### 3. 在Screen/Component中使用

```typescript
import React, { useEffect } from 'react';
import { authService } from '../services/auth/authService';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    // 检查是否是真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      // 如果是匿名用户或未登录，跳转到登录页
      if (authResult.error?.code === 'ANONYMOUS_USER' || 
          authResult.error?.code === 'NOT_LOGGED_IN') {
        Alert.alert(
          '需要登录',
          '此功能需要登录账号',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '去登录', 
              onPress: () => navigation.navigate('Login') 
            }
          ]
        );
      }
      return;
    }
    
    // 真实用户，继续加载页面数据...
  };
  
  // ... 页面其他逻辑
};
```

### 4. 处理需要登录的操作

```typescript
const handlePurchase = async () => {
  // 检查是否是真实用户
  const authResult = await authService.requireRealUser();
  
  if (!authResult.success) {
    // 提示需要登录
    Alert.alert(
      '需要登录',
      authResult.error?.message || '此功能需要登录',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '去登录', 
          onPress: () => navigation.navigate('Login') 
        }
      ]
    );
    return;
  }
  
  // 继续购买流程...
};
```

## 📊 认证错误码说明

| 错误码 | 说明 | 处理方式 |
|--------|------|---------|
| `NOT_LOGGED_IN` | 用户未登录 | 跳转到登录页 |
| `ANONYMOUS_USER` | 当前是匿名用户 | 提示需要登录，跳转到登录页 |
| `TOKEN_REFRESH_FAILED` | Token刷新失败 | 提示重新登录 |
| `INVALID_AUTH_STATE` | 登录状态异常 | 清除缓存，重新登录 |

## 🔄 工作流程

### 首次访问流程
```
用户打开App 
  ↓
访问activity数据
  ↓
调用 ensureAuthenticated()
  ↓
没有登录态 → 自动匿名登录
  ↓
返回activity数据（匿名用户）
```

### 需要登录功能的流程
```
用户点击"创作"按钮
  ↓
调用 requireRealUser()
  ↓
检查登录状态
  ↓
是匿名用户/未登录 → 提示需要登录
  ↓
用户点击"去登录"
  ↓
跳转到登录页面
  ↓
登录成功 → 返回原页面
  ↓
继续之前的操作
```

## 💡 最佳实践

### ✅ 推荐做法

1. **在服务层进行认证检查**
   ```typescript
   // ✅ 好
   class UserService {
     async updateProfile() {
       const auth = await authService.requireRealUser();
       if (!auth.success) return { success: false, needLogin: true };
       // ...
     }
   }
   ```

2. **在UI层处理登录跳转**
   ```typescript
   // ✅ 好
   const result = await userService.updateProfile();
   if (result.needLogin) {
     navigation.navigate('Login');
   }
   ```

3. **区分公开和私有功能**
   - 公开功能：使用 `ensureAuthenticated()`（允许匿名）
   - 私有功能：使用 `requireRealUser()`（仅真实用户）

### ❌ 避免做法

1. **不要在多个地方重复认证检查**
   ```typescript
   // ❌ 不好
   async function someFunction() {
     if (!authService.isRealUser()) { /* ... */ }
     // ...业务逻辑
     if (!authService.isRealUser()) { /* ... */ } // 重复检查
   }
   ```

2. **不要跳过认证检查**
   ```typescript
   // ❌ 不好 - 直接使用userId而不检查认证
   async function updateProfile(userId: string) {
     // 直接操作，没有检查是否是真实用户
   }
   ```

## 🔑 关键方法总结

| 方法 | 用途 | 包含匿名用户 |
|------|------|------------|
| `isLoggedIn()` | 检查是否是真实用户登录 | ❌ |
| `hasValidAuth()` | 检查是否有有效认证态 | ✅ |
| `isAnonymous()` | 检查是否是匿名用户 | ✅ |
| `isRealUser()` | 检查是否是真实用户（等同于isLoggedIn） | ❌ |
| `ensureAuthenticated()` | 确保有认证态（允许匿名） | ✅ |
| `requireRealUser()` | 要求真实用户登录 | ❌ |

## 📝 注意事项

1. **设备ID缓存**: 匿名登录使用设备ID，会自动缓存到本地，同一设备始终使用相同的匿名用户
2. **登录升级**: 匿名用户登录后会自动转换为真实用户
3. **Token刷新**: 系统会自动处理token刷新，无需手动调用
4. **错误处理**: 所有认证方法都返回统一的`AuthResponse`格式，便于错误处理

## 🎨 完整示例

查看 `src/services/auth/authUsageExample.ts` 获取更多完整的使用示例。


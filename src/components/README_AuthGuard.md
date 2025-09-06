# AuthGuard 认证守卫组件

## 功能说明

AuthGuard 是一个认证守卫组件，用于在应用初始化时自动检查用户的登录状态。如果检测到用户未登录，会自动拉起登录页面。

## 工作原理

1. **初始化检查**: 应用启动时，AuthGuard 会调用 `useAuthState` hook 检查登录状态
2. **加载状态**: 在检查登录状态期间，显示加载指示器
3. **自动导航**: 如果检测到未登录状态，使用 `navigation.reset()` 重置导航栈并导航到登录页面
4. **渲染内容**: 如果用户已登录，正常渲染子组件（StackNavigator）

## 使用方式

```tsx
<AuthGuard>
  <StackNavigator />
</AuthGuard>
```

## 技术实现

- 使用 `useAuthState` hook 获取登录状态和加载状态
- 使用 `navigation.reset()` 确保用户无法返回到未登录状态
- 在加载期间显示友好的加载指示器

## 相关文件

- `src/components/AuthGuard.tsx` - 认证守卫组件
- `src/hooks/useAuthState.ts` - 登录状态管理 hook
- `App.tsx` - 应用入口，集成 AuthGuard
- `src/navigation/StackNavigator.tsx` - 导航配置

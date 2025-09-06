# Redux Store 使用指南

本项目使用 Redux Toolkit (RTK) 来管理应用的所有状态数据，**严格禁止使用 `any` 类型**。

## 正确的使用方式

### 1. 使用类型化的hooks（推荐）

```typescript
import { useAppDispatch, useTypedSelector } from '../store/hooks';

const MyComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // 完全类型安全，无需手动指定类型
  const balance = useTypedSelector((state) => state.user.profile?.balance || 0);
  const templates = useTypedSelector((state) => state.templates.templates);
  const selfies = useTypedSelector((state) => state.selfies.selfies);
  
  return <div>余额: {balance}</div>;
};
```

### 2. 直接使用useSelector（需要手动指定类型）

```typescript
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const MyComponent: React.FC = () => {
  // 必须手动指定RootState类型
  const balance = useSelector((state: RootState) => state.user.profile?.balance || 0);
  
  return <div>余额: {balance}</div>;
};
```

## 状态结构

### Auth State (认证状态)
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
```

### Template State (模板状态)
```typescript
interface TemplateState {
  templates: Record<string, Template[]>;
  loading: boolean;
  error: string | null;
  selectedTemplate: Template | null;
}
```

### Selfie State (自拍照状态)
```typescript
interface SelfieState {
  selfies: SelfieItem[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadProgress: number;
}
```

### User State (用户状态)
```typescript
interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
  preferences: UserPreferences;
}
```

## 主要Actions

### Auth Actions
- `loginSuccess(user, token)` - 登录成功
- `logout()` - 登出
- `updateUser(userData)` - 更新用户信息

### Template Actions
- `setTemplates(categoryId, templates)` - 设置模板数据
- `setSelectedTemplate(template)` - 选择模板
- `likeTemplate(templateId)` - 点赞模板

### Selfie Actions
- `addSelfie(selfie)` - 添加自拍照
- `setUploading(boolean)` - 设置上传状态
- `setUploadProgress(progress)` - 设置上传进度

### User Actions
- `updateBalance(amount)` - 更新余额
- `setPremium(boolean)` - 设置会员状态
- `updatePreferences(preferences)` - 更新用户偏好

## 异步操作 (createAsyncThunk)

### 可用的异步操作

#### 1. 用户认证
- `loginUser(credentials)` - 用户登录
- `registerUser(credentials)` - 用户注册
- `sendVerificationCode(phoneNumber)` - 发送验证码
- `logoutUser()` - 用户登出

#### 2. 用户信息
- `fetchUserProfile(userId)` - 获取用户信息
- `updateUserBalance(amount)` - 更新用户余额

#### 3. 自拍照
- `uploadSelfie(imageData)` - 上传自拍照
- `fetchUserSelfies(userId)` - 获取用户自拍照列表
- `deleteSelfie(selfieId)` - 删除自拍照

#### 4. 模板
- `fetchTemplates(categoryId)` - 获取模板列表
- `likeTemplate(templateId)` - 点赞模板

### 使用异步操作

```typescript
import { useAppDispatch } from '../store/hooks';
import { loginUser, fetchTemplates } from '../store/middleware/asyncMiddleware';

const MyComponent = () => {
  const dispatch = useAppDispatch();

  // 方式1：使用 .unwrap() 获取结果
  const handleLogin = async () => {
    try {
      const result = await dispatch(loginUser({
        username: 'testuser',
        password: 'password123'
      })).unwrap();
      
      console.log('登录成功:', result);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  // 方式2：直接dispatch，通过状态监听结果
  const handleFetchTemplates = () => {
    dispatch(fetchTemplates({ categoryId: 'art-branding' }));
  };

  return (
    <div>
      <button onClick={handleLogin}>登录</button>
      <button onClick={handleFetchTemplates}>获取模板</button>
    </div>
  );
};
```

### 监听异步状态

```typescript
const MyComponent = () => {
  const loading = useTypedSelector((state) => state.auth.loading);
  const error = useTypedSelector((state) => state.auth.error);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  return (
    <div>
      {loading && <p>加载中...</p>}
      {error && <p style={{color: 'red'}}>错误: {error}</p>}
      {isAuthenticated ? <p>已登录</p> : <p>未登录</p>}
    </div>
  );
};
```

## 类型安全规则

1. **禁止使用 `any` 类型**
2. **优先使用 `useTypedSelector`** 而不是手动指定类型
3. **使用 `useAppDispatch`** 进行类型安全的dispatch
4. **导入 `RootState` 类型** 当需要手动指定类型时
5. **使用 `.unwrap()`** 处理异步操作的错误

## 错误示例 ❌

```typescript
// 错误：使用any类型
const balance = useSelector((state: any) => state.user.balance);

// 错误：没有类型安全
const dispatch = useDispatch();

// 错误：没有处理异步错误
const result = await dispatch(loginUser(credentials));
```

## 正确示例 ✅

```typescript
// 正确：使用类型化的hooks
const balance = useTypedSelector((state) => state.user.profile?.balance || 0);
const dispatch = useAppDispatch();

// 正确：手动指定类型
const balance = useSelector((state: RootState) => state.user.profile?.balance || 0);

// 正确：处理异步错误
try {
  const result = await dispatch(loginUser(credentials)).unwrap();
  console.log('成功:', result);
} catch (error) {
  console.error('失败:', error);
}
```

# 用户系统架构设计文档

## 🏗️ 整体架构

本系统采用分层架构设计，将用户管理、图片上传、换脸功能等模块解耦，通过服务层统一管理业务逻辑。

```
┌─────────────────────────────────────────────────────────────┐
│                    UI 组件层 (Components)                    │
├─────────────────────────────────────────────────────────────┤
│                    Hook 层 (Hooks)                         │
├─────────────────────────────────────────────────────────────┤
│                   上下文层 (Contexts)                       │
├─────────────────────────────────────────────────────────────┤
│                   服务层 (Services)                         │
├─────────────────────────────────────────────────────────────┤
│                   类型层 (Types)                           │
├─────────────────────────────────────────────────────────────┤
│                   存储层 (AsyncStorage + Cloud)             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 文件结构

```
src/
├── types/
│   └── user.ts                 # 用户相关类型定义
├── services/
│   ├── userService.ts          # 用户管理服务
│   ├── imageUploadService.ts   # 图片上传服务
│   ├── faceSwapService.ts      # 换脸业务服务
│   └── cloudbaseHttpApi.ts     # CloudBase HTTP API
├── contexts/
│   └── UserContext.tsx         # 用户上下文管理
└── components/
    └── ControlPanel.tsx        # 控制面板组件
```

## 🔧 核心服务

### 1. UserService (用户管理服务)

**主要功能：**
- 匿名用户创建和管理
- 用户信息存储和更新
- 换脸记录管理
- 用户统计信息管理

**核心方法：**
```typescript
// 获取或创建匿名用户
async getOrCreateAnonymousUser(): Promise<User>

// 创建换脸记录
async createFaceSwapRecord(
  userId: string,
  templateId: string,
  templateName: string,
  originalImageUrl: string
): Promise<FaceSwapRecord>

// 获取用户换脸历史
async getUserFaceSwapRecords(
  userId: string,
  pagination?: PaginationParams
): Promise<QueryResult<FaceSwapRecord>>
```

### 2. ImageUploadService (图片上传服务)

**主要功能：**
- 图片格式和大小验证
- 云存储上传
- CDN URL 生成
- 图片压缩（可选）

**核心方法：**
```typescript
// 上传用户照片
async uploadImage(
  imageUri: string, 
  userId: string, 
  category: string = 'user_photos'
): Promise<string>

// 上传换脸结果
async uploadResultImage(
  imageUri: string, 
  userId: string, 
  recordId: string
): Promise<string>
```

### 3. FaceSwapService (换脸业务服务)

**主要功能：**
- 整合用户管理和图片上传
- 调用换脸云函数
- 管理换脸流程
- 提供换脸历史查询

**核心方法：**
```typescript
// 执行换脸操作
async performFaceSwap(
  templateId: string,
  originalImageUri: string
): Promise<FaceSwapResponse>

// 获取换脸历史
async getUserFaceSwapHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20
)
```

## 👤 用户模型设计

### User (用户基本信息)
```typescript
interface User {
  id: string;                    // 用户唯一标识
  deviceId: string;              // 设备ID（用于匿名登录）
  nickname?: string;             // 用户昵称（可选）
  avatar?: string;               // 头像URL（可选）
  createdAt: number;             // 创建时间戳
  lastLoginAt: number;           // 最后登录时间戳
  isAnonymous: boolean;          // 是否为匿名用户
  status: 'active' | 'inactive'; // 用户状态
}
```

### FaceSwapRecord (换脸记录)
```typescript
interface FaceSwapRecord {
  id: string;                    // 记录唯一标识
  userId: string;                // 用户ID
  templateId: string;            // 使用的模板ID
  templateName: string;          // 模板名称
  originalImageUrl: string;      // 原始用户照片URL
  resultImageUrl: string;        // 换脸结果图片URL
  status: 'processing' | 'completed' | 'failed';
  createdAt: number;             // 创建时间戳
  completedAt?: number;          // 完成时间戳
  errorMessage?: string;         // 错误信息
  metadata?: {                   // 元数据
    processingTime?: number;      // 处理耗时
    imageSize?: number;          // 图片大小
    quality?: number;            // 图片质量评分
  };
}
```

### UserStats (用户统计信息)
```typescript
interface UserStats {
  userId: string;                // 用户ID
  totalSwaps: number;            // 总换脸次数
  successfulSwaps: number;       // 成功次数
  failedSwaps: number;           // 失败次数
  totalStorageUsed: number;      // 总存储使用量
  lastSwapAt?: number;           // 最后一次换脸时间
  favoriteTemplates: string[];   // 收藏的模板ID列表
}
```

## 🔄 换脸流程

### 完整换脸流程
```
1. 用户选择模板和照片
   ↓
2. 创建匿名用户（如果不存在）
   ↓
3. 上传原始照片到云存储
   ↓
4. 创建换脸记录（状态：processing）
   ↓
5. 调用换脸云函数
   ↓
6. 上传结果图片到云存储
   ↓
7. 更新换脸记录（状态：completed）
   ↓
8. 更新用户统计信息
```

### 错误处理流程
```
换脸失败 → 更新记录状态为 failed → 记录错误信息 → 更新失败统计
```

## 💾 数据存储策略

### 本地存储 (AsyncStorage)
- **用户信息**: `current_user`
- **换脸记录**: `user_face_swap_records`
- **用户统计**: `user_stats_{userId}`

### 云存储 (CloudBase)
- **用户照片**: `user_photos/{userId}/{timestamp}_{random}.jpg`
- **换脸结果**: `results/{userId}/{recordId}_{timestamp}.jpg`

### 数据同步
- 本地存储用于离线访问和快速查询
- 云存储用于数据持久化和跨设备同步
- 通过云函数实现数据一致性

## 🚀 使用方法

### 1. 在 App 根组件中包装 UserProvider
```typescript
import { UserProvider } from './contexts/UserContext';

const App = () => {
  return (
    <UserProvider>
      {/* 其他组件 */}
    </UserProvider>
  );
};
```

### 2. 在组件中使用用户上下文
```typescript
import { useUser } from '../contexts/UserContext';

const MyComponent = () => {
  const { currentUser, login, isLoggedIn } = useUser();
  
  useEffect(() => {
    if (!isLoggedIn) {
      login();
    }
  }, [isLoggedIn]);
  
  return (
    <View>
      {currentUser && <Text>用户ID: {currentUser.id}</Text>}
    </View>
  );
};
```

### 3. 执行换脸操作
```typescript
import { faceSwapService } from '../services/faceSwapService';

const handleFaceSwap = async () => {
  try {
    const result = await faceSwapService.performFaceSwap(
      templateId,
      imageUri
    );
    
    if (result.success) {
      console.log('换脸成功:', result.resultImageUrl);
    }
  } catch (error) {
    console.error('换脸失败:', error);
  }
};
```

## 🔒 安全考虑

### 1. 用户身份验证
- 使用设备ID作为匿名用户标识
- 通过 CloudBase 的 AccessToken 进行API调用认证

### 2. 数据权限控制
- 用户只能访问自己的换脸记录
- 图片上传时验证用户身份
- 删除操作时验证权限

### 3. 图片安全
- 限制图片大小和格式
- 使用云存储的安全策略
- 通过CDN提供安全的图片访问

## 📈 扩展性设计

### 1. 支持多种登录方式
- 当前：匿名登录
- 未来：微信登录、手机号登录等

### 2. 支持多种存储后端
- 当前：CloudBase + AsyncStorage
- 未来：其他云服务商、本地数据库等

### 3. 支持多种图片处理
- 当前：基础验证
- 未来：AI质量检测、自动优化等

## 🐛 常见问题

### 1. 用户数据丢失
- 检查 AsyncStorage 权限
- 验证云存储连接
- 查看错误日志

### 2. 图片上传失败
- 检查网络连接
- 验证图片格式和大小
- 确认云存储配置

### 3. 换脸功能异常
- 检查云函数状态
- 验证模板ID有效性
- 查看云函数日志

## 🔮 未来规划

### 短期目标
- [ ] 完善错误处理机制
- [ ] 添加图片压缩功能
- [ ] 实现换脸进度显示

### 中期目标
- [ ] 支持用户注册登录
- [ ] 添加换脸模板收藏
- [ ] 实现数据云同步

### 长期目标
- [ ] 支持多种AI模型
- [ ] 添加社区功能
- [ ] 实现跨平台数据同步

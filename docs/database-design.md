# 数据库设计文档

## 概述

本文档描述了FaceGlow应用的数据库表结构设计，包括用户表、素材表、作品表等核心数据模型。

## 🗄️ 用户表 (users)

### 表结构设计

```typescript
interface UserDocument {
  _id?: string;                   // 文档ID（CloudBase自动生成）
  uid: string;                    // 用户唯一标识（来自CloudBase认证）
  username: string;               // 用户名
  phone_number: string;           // 手机号
  name?: string;                  // 昵称
  gender?: string;                // 性别
  picture?: string;               // 头像URL
  selfie_url?: string;            // 最新自拍照URL
  selfie_list?: string[];         // 自拍照列表（URL数组）
  work_list?: string[];           // 作品列表（作品ID数组）
  balance: number;                // 用户余额
  is_premium: boolean;            // 是否VIP用户
  preferences?: {                  // 用户偏好设置
    language: string;             // 语言偏好
    theme: string;                // 主题偏好
    notification: boolean;         // 通知设置
  };
  created_at: number;             // 创建时间戳
  updated_at: number;             // 更新时间戳
  last_login_at: number;          // 最后登录时间戳
  status: 'active' | 'inactive' | 'banned'; // 用户状态
}
```

### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| uid | string | ✅ | 用户唯一标识，来自CloudBase认证 |
| username | string | ✅ | 用户名，用于登录和显示 |
| phone_number | string | ✅ | 手机号，用于验证和找回密码 |
| selfie_list | string[] | ❌ | 自拍照URL数组，最多存储10张 |
| work_list | string[] | ❌ | 作品ID数组，关联到works表 |
| balance | number | ✅ | 用户余额，默认0 |
| is_premium | boolean | ✅ | VIP状态，默认false |
| status | string | ✅ | 用户状态，默认'active' |

### 索引设计

```sql
-- 主要索引
CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

---

## 🎨 素材表 (materials)

### 表结构设计

```typescript
interface MaterialDocument {
  _id?: string;                   // 文档ID（CloudBase自动生成）
  material_id: string;            // 素材唯一标识
  title: string;                  // 素材标题
  description?: string;           // 素材描述
  category: string;               // 素材分类（art-branding, community等）
  activity_id: string;            // 所属活动ID
  image_url: string;              // 素材图片URL
  thumbnail_url?: string;         // 缩略图URL
  preview_url?: string;           // 预览图URL
  tags?: string[];                // 标签数组
  is_premium: boolean;            // 是否VIP素材
  likes: number;                  // 点赞数
  downloads: number;               // 下载次数
  usage_count: number;            // 使用次数
  status: 'active' | 'inactive' | 'deleted'; // 素材状态
  created_at: number;             // 创建时间戳
  updated_at: number;             // 更新时间戳
  created_by: string;             // 创建者ID
  metadata?: {                    // 素材元数据
    width: number;                // 图片宽度
    height: number;               // 图片高度
    file_size: number;            // 文件大小
    format: string;               // 文件格式
    ai_model?: string;            // AI模型信息
  };
}
```

### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_id | string | ✅ | 素材唯一标识，业务主键 |
| activity_id | string | ✅ | 所属活动ID，关联到activities表 |
| image_url | string | ✅ | 素材图片URL，主要展示图片 |
| category | string | ✅ | 素材分类，用于筛选和展示 |
| is_premium | boolean | ✅ | VIP素材标识，默认false |
| status | string | ✅ | 素材状态，默认'active' |
| metadata | object | ❌ | 素材元数据，包含图片信息 |

### 索引设计

```sql
-- 主要索引
CREATE INDEX idx_materials_activity_id ON materials(activity_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_materials_is_premium ON materials(is_premium);
CREATE INDEX idx_materials_created_at ON materials(created_at);
CREATE INDEX idx_materials_likes ON materials(likes DESC);
CREATE INDEX idx_materials_usage_count ON materials(usage_count DESC);

-- 复合索引
CREATE INDEX idx_materials_category_status ON materials(category, status);
CREATE INDEX idx_materials_activity_status ON materials(activity_id, status);
```

---

## 🖼️ 作品表 (works)

### 表结构设计

```typescript
interface WorkDocument {
  _id?: string;                   // 文档ID（CloudBase自动生成）
  work_id: string;                // 作品唯一标识
  uid: string;                    // 用户ID
  material_id: string;            // 使用的素材ID
  original_image: string;          // 原始自拍照URL
  result_image: string;           // AI生成结果图片URL
  template_id?: string;           // 使用的模板ID
  title?: string;                 // 作品标题
  description?: string;           // 作品描述
  is_public: boolean;             // 是否公开
  likes: number;                  // 点赞数
  downloads: number;              // 下载次数
  shares: number;                 // 分享次数
  status: 'processing' | 'completed' | 'failed'; // 处理状态
  created_at: number;             // 创建时间戳
  updated_at: number;             // 更新时间戳
  metadata?: {                    // 作品元数据
    processing_time: number;      // 处理耗时（毫秒）
    ai_model: string;             // 使用的AI模型
    quality_score?: number;       // 质量评分
  };
}
```

### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| work_id | string | ✅ | 作品唯一标识，业务主键 |
| uid | string | ✅ | 用户ID，关联到users表 |
| material_id | string | ✅ | 素材ID，关联到materials表 |
| original_image | string | ✅ | 原始自拍照URL |
| result_image | string | ✅ | AI生成结果图片URL |
| status | string | ✅ | 处理状态，默认'processing' |
| is_public | boolean | ✅ | 公开状态，默认true |

### 索引设计

```sql
-- 主要索引
CREATE INDEX idx_works_uid ON works(uid);
CREATE INDEX idx_works_material_id ON works(material_id);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_created_at ON works(created_at DESC);
CREATE INDEX idx_works_likes ON works(likes DESC);
CREATE INDEX idx_works_is_public ON works(is_public);

-- 复合索引
CREATE INDEX idx_works_uid_status ON works(uid, status);
CREATE INDEX idx_works_uid_created ON works(uid, created_at DESC);
```

---

## 🎯 活动表 (activities)

### 表结构设计

```typescript
interface ActivityDocument {
  _id?: string;                   // 文档ID（CloudBase自动生成）
  activity_id: string;            // 活动唯一标识
  title: string;                  // 活动标题
  description?: string;           // 活动描述
  banner_url?: string;            // 活动横幅图片URL
  start_time: number;             // 开始时间戳
  end_time: number;               // 结束时间戳
  status: 'upcoming' | 'active' | 'ended'; // 活动状态
  material_count: number;         // 素材数量
  participant_count: number;      // 参与人数
  created_at: number;             // 创建时间戳
  updated_at: number;             // 更新时间戳
  created_by: string;             // 创建者ID
}
```

---

## 🔄 数据关系设计

### 关系图

```
users (用户表)
├── selfie_list → 自拍照URL数组
├── work_list → works.work_id 数组
└── 1:N → works (作品表)

activities (活动表)
└── 1:N → materials (素材表)

materials (素材表)
├── activity_id → activities.activity_id
└── 1:N → works (作品表)

works (作品表)
├── uid → users.uid
├── material_id → materials.material_id
└── template_id → materials.material_id
```

### 数据一致性

1. **用户自拍照更新**: 当用户上传新自拍照时，更新`users.selfie_list`
2. **作品创建**: 当创建新作品时，更新`users.work_list`
3. **素材统计**: 当素材状态变更时，更新`activities.material_count`
4. **活动参与**: 当用户使用活动素材时，更新`activities.participant_count`

---

## 📊 性能优化建议

### 1. 分页查询
- 使用`limit`和`offset`实现分页
- 对时间戳字段建立降序索引
- 避免使用`skip`进行大偏移量查询

### 2. 缓存策略
- 热门素材缓存到Redis
- 用户作品列表缓存
- 活动信息缓存

### 3. 数据清理
- 定期清理已删除的素材
- 清理过期的用户作品
- 归档历史活动数据

---

## 🚀 实现建议

### 1. 注册流程优化
```typescript
// 注册成功后创建用户记录
const createUserRecord = async (userData: RegisterData) => {
  const userDoc = {
    uid: userData.uid,
    username: userData.username,
    phone_number: userData.phone_number,
    selfie_list: [],
    work_list: [],
    balance: 0,
    is_premium: false,
    status: 'active',
    created_at: Date.now(),
    updated_at: Date.now(),
    last_login_at: Date.now(),
  };
  
  return await userDataService.createUser(userDoc);
};
```

### 2. 素材管理
```typescript
// 按活动获取素材列表
const getMaterialsByActivity = async (activityId: string) => {
  return await materialService.getMaterials({
    activity_id: activityId,
    status: 'active',
    is_premium: false, // 或根据用户VIP状态筛选
  });
};
```

### 3. 作品创建
```typescript
// 创建用户作品
const createUserWork = async (workData: WorkData) => {
  const work = await workService.createWork(workData);
  
  // 更新用户作品列表
  await userDataService.addWorkToList(workData.uid, work.work_id);
  
  // 更新素材使用次数
  await materialService.incrementUsageCount(workData.material_id);
  
  return work;
};
```

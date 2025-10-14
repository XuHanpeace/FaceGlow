# 📊 Activity数据结构完整文档

## 🏗️ 核心数据结构

### 1. Activity 主接口
```typescript
interface Activity {
  /** 活动类型 (album: 相册类型) */
  activity_type: ActivityType;
  /** 活动状态 (0:未开始, 1:进行中, 2:已结束) */
  activity_status: ActivityStatus;
  /** 活动唯一标识 */
  activiy_id: string;  // 注意：这里有个拼写错误，应该是activity_id
  /** 活动名称 */
  activity_title: string;
  /** 活动包含的相册列表 */
  album_id_list: Album[];
}
```

### 2. Album 相册接口
```typescript
interface Album {
  /** 相册唯一标识 */
  album_id: string;
  /** 相册名称 */
  album_name: string;
  /** 相册描述 */
  album_description: string;
  /** 相册封面图片 */
  album_image: string;
  /** 相册等级 (0:免费, 1:付费, 2:VIP) */
  level: AlbumLevel;
  /** 相册价格（分） */
  price: number;
  /** 相册包含的模板列表 */
  template_list: Template[];
}
```

### 3. Template 模板接口
```typescript
interface Template {
  /** 模板唯一标识 */
  template_id: string;
  /** 模板图片URL */
  template_url: string;
  /** 模板名称 */
  template_name: string;
  /** 模板描述 */
  template_description: string;
  /** 模板价格（金币） */
  price: number;
}
```

## 📋 枚举定义

### ActivityType 活动类型
```typescript
enum ActivityType {
  ALBUM = 'album',    // 相册类型活动
  OTHER = 'other'     // 其他类型活动
}
```

### ActivityStatus 活动状态
```typescript
enum ActivityStatus {
  UPCOMING = '0',     // 未开始
  ACTIVE = '1',       // 进行中
  ENDED = '2'         // 已结束
}
```

### AlbumLevel 相册等级
```typescript
enum AlbumLevel {
  FREE = '0',         // 免费等级
  PREMIUM = '1',      // 付费等级
  VIP = '2'           // VIP等级
}
```

## 📄 实际数据示例

### Mock数据示例
```json
[
  {
    "activity_type": "album",
    "activity_status": "1",
    "activiy_id": "act_001",
    "album_id_list": [
      {
        "album_id": "album_001",
        "album_name": "春日写真集",
        "album_description": "充满春天气息的写真模板合集，适合拍摄清新自然的照片",
        "album_image": "https://example.com/images/spring_album_cover.jpg",
        "level": "0",
        "price": 0,
        "template_list": [
          {
            "template_id": "template_001",
            "template_url": "https://example.com/templates/spring_template_1.jpg",
            "template_name": "樱花飞舞",
            "template_description": "粉色樱花背景，营造浪漫春日氛围"
          },
          {
            "template_id": "template_002",
            "template_url": "https://example.com/templates/spring_template_2.jpg",
            "template_name": "绿意盎然",
            "template_description": "清新绿色背景，展现自然生机"
          }
        ]
      },
      {
        "album_id": "album_002",
        "album_name": "时尚街拍",
        "album_description": "都市时尚风格模板，适合街拍和时尚写真",
        "album_image": "https://example.com/images/street_album_cover.jpg",
        "level": "1",
        "price": 2999,
        "template_list": [
          {
            "template_id": "template_003",
            "template_url": "https://example.com/templates/street_template_1.jpg",
            "template_name": "都市霓虹",
            "template_description": "霓虹灯背景，营造都市夜生活氛围"
          },
          {
            "template_id": "template_004",
            "template_url": "https://example.com/templates/street_template_2.jpg",
            "template_name": "工业风格",
            "template_description": "工业风背景，展现现代都市魅力"
          }
        ]
      }
    ]
  }
]
```

## 🔍 数据层级关系

```
Activity (活动)
├── activity_type: "album" | "other"
├── activity_status: "0" | "1" | "2"
├── activiy_id: string
├── activity_title: string
└── album_id_list: Album[]
    ├── album_id: string
    ├── album_name: string
    ├── album_description: string
    ├── album_image: string
    ├── level: "0" | "1" | "2"
    ├── price: number
    └── template_list: Template[]
        ├── template_id: string
        ├── template_url: string
        ├── template_name: string
        ├── template_description: string
        └── price: number
```

## 📁 相关文件位置

- **类型定义**: `src/types/model/activity.ts`
- **示例数据**: `src/types/activity.example.ts`
- **Mock数据**: `src/types/model/activity.mock.json`
- **Redux状态**: `src/store/slices/activitySlice.ts`
- **服务层**: `src/services/database/activityService.ts`

## ⚠️ 注意事项

1. **拼写错误**: `activiy_id` 应该是 `activity_id`
2. **价格单位**: Album的price单位是"分"，Template的price单位是"金币"
3. **状态值**: 所有状态值都是字符串类型，不是数字
4. **图片URL**: 模板和相册都使用完整的HTTP URL

## 🛠️ 查询参数接口

### ActivityQueryParams 活动查询参数
```typescript
interface ActivityQueryParams {
  /** 活动ID */
  activity_id?: string;
  /** 活动类型 */
  activity_type?: ActivityType;
  /** 活动状态 */
  activity_status?: ActivityStatus;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
}
```

### AlbumQueryParams 相册查询参数
```typescript
interface AlbumQueryParams {
  /** 相册ID */
  album_id?: string;
  /** 相册等级 */
  level?: AlbumLevel;
  /** 价格范围最小值 */
  min_price?: number;
  /** 价格范围最大值 */
  max_price?: number;
}
```

### TemplateQueryParams 模板查询参数
```typescript
interface TemplateQueryParams {
  /** 模板ID */
  template_id?: string;
  /** 所属相册ID */
  album_id?: string;
  /** 模板名称关键词 */
  name_keyword?: string;
}
```

## 📊 响应接口

### ActivityListResponse 活动列表响应
```typescript
interface ActivityListResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 活动数据 */
  data: Activity[];
}
```

## 🔧 实用工具函数

```typescript
// 获取免费相册
export const getFreeAlbums = (activity: Activity) => {
  return activity.album_id_list.filter(album => album.level === AlbumLevel.FREE);
};

// 获取付费相册
export const getPremiumAlbums = (activity: Activity) => {
  return activity.album_id_list.filter(album => album.level === AlbumLevel.PREMIUM);
};

// 根据模板ID查找相册
export const findAlbumByTemplateId = (activity: Activity, templateId: string) => {
  return activity.album_id_list.find(album => 
    album.template_list.some(template => template.template_id === templateId)
  );
};

// 获取所有模板
export const getAllTemplates = (activity: Activity) => {
  return activity.album_id_list.flatMap(album => album.template_list);
};
```

## 📝 使用示例

```typescript
import { Activity, ActivityType, ActivityStatus, AlbumLevel } from './types/model/activity';

// 创建活动数据
const activity: Activity = {
  activity_type: ActivityType.ALBUM,
  activity_status: ActivityStatus.ACTIVE,
  activiy_id: 'at_1888958525505814528',
  activity_title: '春季写真活动',
  album_id_list: [
    {
      album_id: 'album_001',
      album_name: '春日写真集',
      album_description: '充满春天气息的写真模板合集',
      album_image: 'https://example.com/album_cover.jpg',
      level: AlbumLevel.FREE,
      price: 0,
      template_list: [
        {
          template_id: 'template_001',
          template_url: 'https://example.com/template.jpg',
          template_name: '樱花飞舞',
          template_description: '粉色樱花背景',
          price: 10
        }
      ]
    }
  ]
};

// 查询操作
const freeAlbums = getFreeAlbums(activity);
const allTemplates = getAllTemplates(activity);
const album = findAlbumByTemplateId(activity, 'template_001');
```

---

**文档创建时间**: 2024年10月12日  
**项目**: FaceGlow  
**版本**: 1.0

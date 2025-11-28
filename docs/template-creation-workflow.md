# 写真模板创建与发布流程

本文档详细记录了 FaceGlow 项目中创建和发布新写真模板的完整业务流程。

## 核心概念

项目中的内容层级结构为：
**Activity (活动/分类)** -> **Album (相册)** -> **Template (具体模板)**

- **Activity**: 对应腾讯云人脸融合控制台中的“活动”，也是 APP 首页的一级分类。
- **Album**: 对应一组风格相似的模板集合，是 APP 展示和购买的基本单元。
- **Template**: 具体的单张模板图片，对应腾讯云人脸融合控制台中的“素材/模板”。

## 详细操作流程

### 1. 平台配置 (Activity)
在腾讯云“人脸融合”控制台手动创建活动。
- **目的**: 确立活动主题风格。
- **产出**: `activityId` (对应代码中的 `projectId`)。

### 2. 素材生产 (AI Generation)
根据确定的主题风格，利用文生图 AI 工具（如 Midjourney, Stable Diffusion 等）批量生成模板底图。
- **策略**: 按 Album 维度进行区分和整理。

### 3. 算法绑定 (Template ID)
将生成的模板图片上传至“人脸融合”控制台。
- **目的**: 让算法后台对图片进行预处理和特征提取。
- **产出**: `templateId` (对应代码中的 `modelId`)。

### 4. 资源托管 (COS)
1. **重命名**: 将本地图片文件以步骤 3 获得的 `templateId` 重命名（例如 `template_12345.jpg`），以便于管理。
2. **上传**: 在 COS (对象存储) 平台创建与 Activity 同名的文件夹。
3. **获取 URL**: 将重命名后的图片上传至该文件夹，并获取其公开访问的资源 URL。
   - **产出**: `template_url`。

### 5. 数据库录入 (Database)
将上述步骤获得的所有数据合并，写入 Cloudbase 数据库的 `activity` 集合。

#### 数据结构示例
```json
{
  "activiy_id": "步骤1的activityId",
  "activity_name": "活动名称",
  "album_id_list": [
    {
      "album_id": "自定义唯一ID",
      "album_name": "风格相册名称",
      "album_description": "描述文案",
      "cover_url": "封面图URL",
      "template_list": [
        {
          "template_id": "步骤3的templateId",
          "template_url": "步骤4的template_url",
          "template_name": "模板名称",
          "price": 10,          // 价格 (美美币)
          "is_premium": true,   // 是否付费
          "template_description": "描述"
        }
      ]
    }
  ]
}
```

## 技术关联

- **换脸服务**: `src/services/tcb/tcb.ts` -> `callFaceFusionCloudFunction`
  - `projectId` = `activityId`
  - `modelId` = `templateId`
- **数据获取**: `src/services/database/activityService.ts`
  - 接口: `/model/prod/activity/list`
- **前端展示**: 
  - `NewHomeScreen` (首页)
  - `AlbumMarketScreen` (市场页)
  - `BeforeCreationScreen` (预览页)


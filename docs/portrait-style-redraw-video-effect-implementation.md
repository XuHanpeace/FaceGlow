# 人像风格重绘与视频特效功能实现文档

## 概述

本文档记录了在 FaceGlow 项目中实现阿里云百炼 API 的两个新功能：
1. **人像风格重绘**（Portrait Style Redraw）
2. **图生视频（视频特效）**（Video Effect）

## 需求分析

### 功能需求

1. **callBailian 云函数支持**
   - 支持调用人像风格重绘 API
   - 支持调用图生视频（视频特效）API（已部分支持，需完善）

2. **管理后台支持**
   - 支持创建和编辑人像风格重绘类型的 album
   - 支持创建和编辑视频特效类型的 album
   - 支持配置预设模板参数（style_index 和 template）

3. **数据结构扩展**
   - Album 数据结构需要支持新字段
   - Category 功能类型需要确认或新增

## 技术方案设计

### 1. API 接口设计

#### 1.1 人像风格重绘 API

**端点：** `https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation`

**模型：** `wanx-style-repaint-v1`

**请求参数：**
```json
{
  "model": "wanx-style-repaint-v1",
  "input": {
    "image_url": "图片URL",
    "style_index": 0,  // 0-9为预设风格，-1为自定义风格
    "style_ref_url": "风格参考图URL（当style_index=-1时必填）"
  }
}
```

**预设风格索引：**
- `0`: 复古漫画
- `1`: 3D童话
- `2`: 二次元
- `3`: 小清新
- `4`: 未来科技
- `5`: 国画古风
- `6`: 将军百战
- `7`: 炫彩卡通
- `8`: 清雅国风
- `9`: 喜迎新年
- `-1`: 自定义风格（需要提供 style_ref_url）

#### 1.2 视频特效 API

**端点：** `https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis`

**模型：** `wanx2.1-i2v-turbo` 或 `wanx2.1-i2v-plus`

**请求参数：**
```json
{
  "model": "wanx2.1-i2v-turbo",
  "input": {
    "img_url": "首帧图片URL",
    "template": "flying"  // 特效模板名称
  },
  "parameters": {
    "resolution": "720P"  // 可选：480P, 720P, 1080P
  }
}
```

**常用特效模板：**
- 通用特效：`flying`（魔法悬浮）、`squish`（解压捏捏）、`rotation`（转圈圈）等
- 单人特效：`carousel`（时光木马）、`singleheart`（爱你哟）、`dance1-5`（各种舞蹈）等
- 双人特效：`hug`（爱的抱抱）、`frenchkiss`（唇齿相依）、`coupleheart`（双倍心动）等

### 2. 数据结构设计

#### 2.1 Album 数据结构扩展

在 `AlbumRecord` 接口中新增字段：

```typescript
interface AlbumRecord {
  // ... 现有字段
  
  // 视频特效相关
  video_effect_template?: string  // 特效模板名称（已存在）
  
  // 人像风格重绘相关（新增）
  style_index?: number  // 风格索引（0-9为预设风格，-1为自定义风格）
  style_ref_url?: string  // 风格参考图URL（当style_index=-1时使用）
}
```

#### 2.2 FunctionType 枚举扩展

```typescript
export enum FunctionType {
  PORTRAIT = 'portrait',
  GROUP_PHOTO = 'group_photo',
  IMAGE_TO_IMAGE = 'image_to_image',
  IMAGE_TO_VIDEO = 'image_to_video',  // 图生视频
  VIDEO_EFFECT = 'video_effect',  // 视频特效
  PORTRAIT_STYLE_REDRAW = 'portrait_style_redraw',  // 人像风格重绘（新增）
}
```

### 3. 云函数实现

#### 3.1 callBailian 云函数扩展

**新增任务类型：** `portrait_style_redraw`

**主要修改：**

1. **参数验证函数** (`validateParams`)
   - 添加对 `portrait_style_redraw` 任务类型的验证
   - 验证 `style_index` 参数（必填）
   - 当 `style_index = -1` 时，验证 `style_ref_url` 参数（必填）

2. **请求构建函数** (`buildPortraitStyleRedrawRequest`)
   - 构建人像风格重绘 API 请求
   - 处理预设风格和自定义风格两种情况

3. **任务类型描述** (`taskTypeDescriptions`)
   - 添加 `portrait_style_redraw` 的描述

4. **异步任务头** (`X-DashScope-Async`)
   - 添加对 `portrait_style_redraw` 的支持

#### 3.2 createAlbum 云函数扩展

在创建 album 时，支持新字段：
- `style_index`
- `style_ref_url`

### 4. 管理后台实现

#### 4.1 编辑表单扩展

在 `AlbumListPage.tsx` 中新增两个配置区域：

1. **视频特效配置区域**
   - 特效模板选择器（下拉选择，包含所有可用模板）
   - 首帧图片上传/URL输入
   - 预览视频URL输入

2. **人像风格重绘配置区域**
   - 风格索引选择器（0-9预设风格，-1自定义风格）
   - 风格参考图URL输入（当选择-1时显示）
   - 原始图片上传/URL输入
   - 结果图上传/URL输入

#### 4.2 保存逻辑扩展

在 `handleSaveEdit` 函数中，根据 `function_type` 保存对应的字段：

- `VIDEO_EFFECT`: 保存 `video_effect_template`、`src_image`、`preview_video_url`
- `PORTRAIT_STYLE_REDRAW`: 保存 `style_index`、`style_ref_url`、`src_image`、`result_image`

## 实现细节

### 1. callBailian 云函数修改

**文件：** `/Users/hanksxu/Desktop/project/cloud-func/functions/callBailian/index.js`

**主要修改点：**

1. **参数验证**（第73-107行）
   ```javascript
   // 验证prompt（视频特效和人像风格重绘不需要prompt）
   if (taskType !== 'video_effect' && taskType !== 'portrait_style_redraw' && !prompt) {
     return createErrorResponse('MISSING_PROMPT', '请提供 prompt 参数（文本提示词）');
   }
   
   // 人像风格重绘参数验证
   else if (taskType === 'portrait_style_redraw') {
     if (!images) {
       return createErrorResponse('MISSING_IMAGES', '人像风格重绘任务需要提供 images 参数');
     }
     const styleIndex = payload.params?.style_index;
     if (styleIndex === undefined || styleIndex === null) {
       return createErrorResponse('MISSING_STYLE_INDEX', '需要提供 style_index 参数');
     }
     if (styleIndex === -1 && !payload.params?.style_ref_url) {
       return createErrorResponse('MISSING_STYLE_REF_URL', '使用自定义风格时需要提供 style_ref_url');
     }
   }
   ```

2. **请求构建函数**（新增，约第280-320行）
   ```javascript
   function buildPortraitStyleRedrawRequest(payload, images) {
     const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation';
     const model = 'wanx-style-repaint-v1';
     
     const imageUrl = Array.isArray(images) ? images[0] : images;
     const input = {
       image_url: imageUrl,
       style_index: payload.params?.style_index !== undefined ? payload.params.style_index : 0
     };
     
     if (input.style_index === -1) {
       if (!payload.params?.style_ref_url) {
         return { error: createErrorResponse('MISSING_STYLE_REF_URL', '...') };
       }
       input.style_ref_url = payload.params.style_ref_url;
     }
     
     return { apiUrl, requestData: { model, input } };
   }
   ```

3. **任务类型路由**（第285-297行）
   ```javascript
   function buildRequestParams(payload, taskType, prompt, images, videoUrl, audioUrl) {
     // ... 其他类型
     else if (taskType === 'portrait_style_redraw') {
       return buildPortraitStyleRedrawRequest(payload, images);
     }
   }
   ```

### 2. 数据结构修改

**文件：** `/Users/hanksxu/Desktop/project/faceglow-admin/src/types/album.ts`

1. **FunctionType 枚举扩展**
   ```typescript
   export enum FunctionType {
     // ... 现有类型
     PORTRAIT_STYLE_REDRAW = 'portrait_style_redraw',
   }
   ```

2. **AlbumRecord 接口扩展**
   ```typescript
   interface AlbumRecord {
     // ... 现有字段
     style_index?: number;
     style_ref_url?: string;
   }
   ```

### 3. 管理后台修改

**文件：** `/Users/hanksxu/Desktop/project/faceglow-admin/src/pages/AlbumListPage.tsx`

1. **保存逻辑扩展**（第236-280行）
   ```typescript
   // 视频特效类型
   if (editingAlbum.function_type === FunctionType.VIDEO_EFFECT) {
     if (editingAlbum.video_effect_template !== undefined) {
       updates.video_effect_template = editingAlbum.video_effect_template;
     }
     // ...
   }
   
   // 人像风格重绘类型
   if (editingAlbum.function_type === FunctionType.PORTRAIT_STYLE_REDRAW) {
     if (editingAlbum.style_index !== undefined) {
       updates.style_index = editingAlbum.style_index;
     }
     // ...
   }
   ```

2. **表单UI扩展**（第603-850行）
   - 视频特效配置区域（约第603-680行）
   - 人像风格重绘配置区域（约第682-850行）

## 测试说明

### 1. 云函数测试

#### 1.1 人像风格重绘测试

**测试用例：**

```javascript
// 测试预设风格
{
  task_type: 'portrait_style_redraw',
  images: 'https://example.com/portrait.jpg',
  params: {
    style_index: 3  // 小清新风格
  }
}

// 测试自定义风格
{
  task_type: 'portrait_style_redraw',
  images: 'https://example.com/portrait.jpg',
  params: {
    style_index: -1,
    style_ref_url: 'https://example.com/style_ref.jpg'
  }
}
```

**预期结果：**
- 返回 `taskId` 用于查询任务状态
- 任务状态为 `PENDING` 或 `RUNNING`
- 最终任务状态为 `SUCCEEDED`，包含生成的结果图片URL

#### 1.2 视频特效测试

**测试用例：**

```javascript
{
  task_type: 'video_effect',
  images: 'https://example.com/first_frame.jpg',
  params: {
    template: 'flying',  // 魔法悬浮特效
    resolution: '720P'
  }
}
```

**预期结果：**
- 返回 `taskId`
- 最终生成特效视频URL

### 2. 管理后台测试

#### 2.1 创建人像风格重绘 Album

1. 进入相册管理页面
2. 点击"编辑"某个相册
3. 选择功能类型为"人像风格重绘"
4. 配置风格索引（选择预设风格或自定义风格）
5. 上传原始图片
6. 保存并验证数据是否正确保存

#### 2.2 创建视频特效 Album

1. 进入相册管理页面
2. 点击"编辑"某个相册
3. 选择功能类型为"视频特效"
4. 选择特效模板（如"魔法悬浮"）
5. 上传首帧图片
6. 保存并验证数据是否正确保存

### 3. 集成测试

1. **端到端测试流程：**
   - 在管理后台创建人像风格重绘类型的 album
   - 配置 `style_index` 和 `src_image`
   - 前端调用 callBailian 云函数，传入对应参数
   - 验证任务提交成功，获得 `taskId`
   - 使用 `queryTask` 查询任务状态
   - 验证最终结果正确

2. **错误处理测试：**
   - 测试缺少必填参数的情况
   - 测试 `style_index = -1` 但未提供 `style_ref_url` 的情况
   - 验证错误信息是否正确返回

## 部署说明

### 1. 云函数部署

```bash
cd /Users/hanksxu/Desktop/project/cloud-func
# 部署 callBailian 云函数
tcb fn deploy callBailian
# 部署 createAlbum 云函数（如果修改了）
tcb fn deploy createAlbum
```

### 2. 前端部署

管理后台的修改会自动在开发环境中生效，生产环境需要重新构建和部署。

## 注意事项

1. **API Key 配置**
   - 确保在云函数环境变量中配置了 `DASHSCOPE_API_KEY`
   - 本地测试时可以通过环境变量传入

2. **数据迁移**
   - 现有 album 数据不需要迁移
   - 新字段为可选字段，不影响现有功能

3. **Category 配置**
   - 需要在数据库的 `category_config` 集合中添加对应的功能类型配置
   - 功能类型代码：`portrait_style_redraw`、`video_effect`、`image_to_video`

4. **模板参数**
   - 视频特效模板列表可能会更新，需要及时同步
   - 人像风格重绘的预设风格索引固定为 0-9

## 参考资料

- [阿里云百炼 - 人像风格重绘 API](https://help.aliyun.com/zh/model-studio/portrait-style-redraw-api-reference)
- [阿里云百炼 - 图生视频（视频特效）](https://help.aliyun.com/zh/model-studio/wanx-video-effects)
- [通义万相 - 视频特效模板列表](https://help.aliyun.com/zh/model-studio/wanx-video-effects#section-8x9-8kq-5bq)

## 更新日志

- **2025-01-XX**: 初始实现
  - 扩展 callBailian 云函数支持人像风格重绘
  - 扩展 Album 数据结构
  - 扩展管理后台编辑表单
  - 添加 FunctionType 枚举值

# 人像风格重绘与视频特效功能测试指南

## 测试前准备

### 1. 环境配置

确保以下环境变量已配置：
- `DASHSCOPE_API_KEY`: 阿里云百炼 API Key

### 2. 部署云函数

```bash
cd /Users/hanksxu/Desktop/project/cloud-func
tcb fn deploy callBailian
tcb fn deploy createAlbum
tcb fn deploy updateAlbum
```

## 测试用例

### 测试 1: 人像风格重绘 - 预设风格

**测试步骤：**

1. 调用 callBailian 云函数：
```javascript
{
  task_type: 'portrait_style_redraw',
  images: 'https://example.com/test-portrait.jpg',
  params: {
    style_index: 3  // 小清新风格
  },
  user_id: 'test_user_id',
  price: 10
}
```

2. 验证响应：
   - 返回 `success: true`
   - 包含 `taskId`
   - 无错误信息

3. 查询任务状态：
```javascript
// 使用返回的 taskId 调用 queryTask
{
  task_id: '<返回的taskId>'
}
```

4. 验证结果：
   - 任务状态最终为 `SUCCEEDED`
   - 包含生成的结果图片URL

**预期结果：** ✅ 成功生成小清新风格的人像图片

---

### 测试 2: 人像风格重绘 - 自定义风格

**测试步骤：**

1. 调用 callBailian 云函数：
```javascript
{
  task_type: 'portrait_style_redraw',
  images: 'https://example.com/test-portrait.jpg',
  params: {
    style_index: -1,
    style_ref_url: 'https://example.com/style-reference.jpg'
  },
  user_id: 'test_user_id',
  price: 10
}
```

2. 验证响应和结果（同测试1）

**预期结果：** ✅ 成功使用自定义风格生成人像图片

---

### 测试 3: 人像风格重绘 - 错误处理

**测试用例 3.1: 缺少 style_index**

```javascript
{
  task_type: 'portrait_style_redraw',
  images: 'https://example.com/test-portrait.jpg',
  params: {}
}
```

**预期结果：** ❌ 返回错误 `MISSING_STYLE_INDEX`

**测试用例 3.2: 自定义风格缺少 style_ref_url**

```javascript
{
  task_type: 'portrait_style_redraw',
  images: 'https://example.com/test-portrait.jpg',
  params: {
    style_index: -1
  }
}
```

**预期结果：** ❌ 返回错误 `MISSING_STYLE_REF_URL`

---

### 测试 4: 视频特效

**测试步骤：**

1. 调用 callBailian 云函数：
```javascript
{
  task_type: 'video_effect',
  images: 'https://example.com/first-frame.jpg',
  params: {
    template: 'flying',  // 魔法悬浮特效
    resolution: '720P'
  },
  user_id: 'test_user_id',
  price: 10
}
```

2. 验证响应和结果（同测试1）

**预期结果：** ✅ 成功生成魔法悬浮特效视频

---

### 测试 5: 管理后台 - 创建人像风格重绘 Album

**测试步骤：**

1. 打开管理后台：`http://localhost:5173/albums`（或对应地址）

2. 点击"编辑"某个相册

3. 选择功能类型为"人像风格重绘"（需要在 category 配置中添加此类型）

4. 配置以下字段：
   - 风格索引：选择 `3`（小清新）
   - 原始图片：上传或输入图片URL
   - 结果图：上传或输入结果图URL（可选）

5. 点击"保存"

6. 验证数据库：
   - 检查 `album_list` 集合中对应记录
   - 验证 `function_type` 为 `portrait_style_redraw`
   - 验证 `style_index` 为 `3`
   - 验证 `src_image` 和 `result_image` 已保存

**预期结果：** ✅ Album 数据正确保存

---

### 测试 6: 管理后台 - 创建视频特效 Album

**测试步骤：**

1. 打开管理后台

2. 点击"编辑"某个相册

3. 选择功能类型为"视频特效"

4. 配置以下字段：
   - 特效模板：选择 `flying`（魔法悬浮）
   - 首帧图片：上传或输入图片URL
   - 预览视频URL：输入预览视频URL（可选）

5. 点击"保存"

6. 验证数据库：
   - 验证 `function_type` 为 `video_effect`
   - 验证 `video_effect_template` 为 `flying`
   - 验证 `src_image` 已保存

**预期结果：** ✅ Album 数据正确保存

---

### 测试 7: 管理后台 - 自定义风格配置

**测试步骤：**

1. 编辑相册，选择功能类型为"人像风格重绘"

2. 选择风格索引为 `-1`（自定义风格）

3. 验证：
   - 显示"风格参考图URL"输入框
   - 输入框为必填（UI提示）

4. 输入风格参考图URL并保存

5. 验证数据库：
   - 验证 `style_index` 为 `-1`
   - 验证 `style_ref_url` 已保存

**预期结果：** ✅ 自定义风格配置正确保存

---

## 集成测试

### 端到端测试流程

1. **在管理后台创建 Album**
   - 创建一个人像风格重绘类型的 album
   - 配置 `style_index = 3`，`src_image = 'https://example.com/portrait.jpg'`

2. **前端调用云函数**
   ```javascript
   // 从前端调用 callBailian
   const response = await callBailian({
     task_type: 'portrait_style_redraw',
     images: album.src_image,
     params: {
       style_index: album.style_index
     },
     user_id: currentUser.id,
     price: album.price
   });
   ```

3. **验证任务提交**
   - 检查返回的 `taskId`
   - 验证用户余额已扣减（如果 price > 0）

4. **查询任务结果**
   ```javascript
   const taskResult = await queryTask({
     task_id: response.data.taskId
   });
   ```

5. **验证最终结果**
   - 任务状态为 `SUCCEEDED`
   - 包含生成的结果图片URL
   - 可以正常显示结果图片

**预期结果：** ✅ 完整流程正常工作

---

## 性能测试

### 响应时间测试

1. **任务提交响应时间**
   - 目标：< 2秒
   - 测试方法：记录调用 callBailian 到返回 taskId 的时间

2. **任务完成时间**
   - 目标：< 30秒（取决于图片大小和复杂度）
   - 测试方法：轮询 queryTask 直到任务完成

---

## 错误场景测试

### 1. 网络错误
- 模拟 API 调用超时
- 验证错误处理和重试机制

### 2. API 错误
- 使用无效的 API Key
- 验证错误信息是否正确返回

### 3. 参数错误
- 缺少必填参数
- 参数类型错误
- 参数值超出范围

### 4. 余额不足
- 设置用户余额为 0
- 尝试调用需要付费的功能
- 验证错误提示

---

## 测试检查清单

### 云函数测试
- [ ] 人像风格重绘 - 预设风格（0-9）
- [ ] 人像风格重绘 - 自定义风格（-1）
- [ ] 视频特效 - 各种模板
- [ ] 参数验证 - 缺少必填参数
- [ ] 参数验证 - 自定义风格缺少 style_ref_url
- [ ] 余额检查 - 余额充足
- [ ] 余额检查 - 余额不足
- [ ] 余额扣减 - 正确扣减
- [ ] 交易流水 - 正确创建

### 管理后台测试
- [ ] 创建人像风格重绘 Album
- [ ] 创建视频特效 Album
- [ ] 编辑 Album - 修改风格索引
- [ ] 编辑 Album - 切换预设/自定义风格
- [ ] 表单验证 - 必填字段
- [ ] 图片上传 - 原始图
- [ ] 图片上传 - 结果图
- [ ] 数据保存 - 验证数据库

### 集成测试
- [ ] 端到端流程 - 人像风格重绘
- [ ] 端到端流程 - 视频特效
- [ ] 错误处理 - 网络错误
- [ ] 错误处理 - API 错误
- [ ] 性能测试 - 响应时间

---

## 测试数据

### 测试图片URL（需要替换为实际可访问的URL）

- 人像图片：`https://example.com/test-portrait.jpg`
- 风格参考图：`https://example.com/style-reference.jpg`
- 首帧图片：`https://example.com/first-frame.jpg`

### 测试用户ID

- 测试用户：`test_user_123`
- 确保测试用户有足够的余额（如 1000 美美币）

---

## 问题排查

### 常见问题

1. **任务一直处于 PENDING 状态**
   - 检查 API Key 是否正确
   - 检查网络连接
   - 查看云函数日志

2. **返回错误 "MISSING_STYLE_INDEX"**
   - 检查是否在 params 中提供了 style_index
   - 检查 style_index 的值是否有效（0-9 或 -1）

3. **自定义风格不生效**
   - 检查 style_ref_url 是否为有效的图片URL
   - 检查图片是否可以正常访问
   - 确认 style_index 设置为 -1

4. **管理后台保存失败**
   - 检查云函数是否已部署
   - 检查网络连接
   - 查看浏览器控制台错误信息

---

## 测试报告模板

```
测试日期：YYYY-MM-DD
测试人员：XXX
测试环境：开发/生产

测试结果：
- 人像风格重绘 - 预设风格：✅/❌
- 人像风格重绘 - 自定义风格：✅/❌
- 视频特效：✅/❌
- 管理后台创建 Album：✅/❌
- 集成测试：✅/❌

发现问题：
1. [问题描述]
2. [问题描述]

修复状态：
- [ ] 已修复
- [ ] 待修复
```

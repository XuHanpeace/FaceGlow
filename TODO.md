# TODO 待实现接口

## 云函数接口

### 1. faceFusion云函数
- **位置**: `src/services/tcb/tcb.ts`
- **状态**: 已创建模拟实现
- **需要实现**: 
  - 调用CloudBase的faceFusion云函数
  - 传递templateId、selfieUrl、userId参数
  - 处理返回的AI生成图片URL

### 2. 人脸融合API
- **位置**: `src/services/tcb/tcb.ts` - `callFusion`函数
- **状态**: 已创建模拟实现
- **需要实现**:
  - 调用腾讯云人脸融合API
  - 传递projectId、modelId、imageUrl参数
  - 处理返回的融合结果

## 数据库接口

### 3. 更新用户自拍照信息
- **位置**: `src/services/database/userDataService.ts` - `updateUserSelfie`方法
- **状态**: ✅ 已实现
- **功能**: 更新用户的selfie_url字段

### 4. 用户作品管理
- **位置**: `src/services/database/userDataService.ts`
- **状态**: 待实现
- **需要实现**:
  - `createUserWork`: 创建用户作品记录
  - `getUserWorks`: 获取用户作品列表
  - `updateUserWork`: 更新用户作品信息
  - `deleteUserWork`: 删除用户作品

## 前端功能

### 5. 结果展示页面
- **位置**: 需要创建新的页面
- **状态**: 待实现
- **功能**:
  - 展示AI生成的图片
  - 提供保存、分享功能
  - 显示处理进度

### 6. 模板数据获取
- **位置**: `src/screens/BeforeCreationScreen.tsx`
- **状态**: 使用模拟数据
- **需要实现**:
  - 从API获取真实模板数据
  - 包含projectId、modelId等信息

## 配置更新

### 7. CloudBase配置
- **位置**: `src/config/cloudbase.ts`
- **状态**: 待更新
- **需要添加**:
  - faceFusion云函数配置
  - 人脸融合API配置

## 优先级

1. **高优先级**: faceFusion云函数实现
2. **中优先级**: 用户作品管理接口
3. **低优先级**: 结果展示页面

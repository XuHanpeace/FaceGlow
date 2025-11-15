# Apple 审核反馈解读与解决方案

## 📅 审核信息
- **审核日期**: 2025年11月10日
- **审核版本**: 1.2
- **提交ID**: beae0ddb-1f0d-45ac-b3ff-3fbaa452b9fc

---

## ❌ 问题一：相机权限说明不够详细

### 问题描述
**Guideline 5.1.1 - Legal - Privacy - Data Collection and Storage**

Apple 认为相机权限的说明字符串不够详细，需要：
1. 清楚说明应用如何使用相机数据
2. 提供具体的使用例子

### 当前状态
```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机来拍摄照片</string>
```

### 问题分析
当前说明太简单，Apple 要求更详细的说明，包括：
- 为什么需要相机权限
- 如何使用拍摄的照片
- 具体的使用场景示例

### 解决方案
需要更新 `ios/MyCrossPlatformApp/Info.plist` 中的 `NSCameraUsageDescription`，改为更详细的说明。

**建议的新内容**：
```
FaceGlow 需要访问相机来拍摄您的自拍照片，用于 AI 人脸融合功能。例如：当您选择"拍照"功能时，应用会使用相机拍摄您的照片，然后将您的面部特征应用到艺术模板上，生成个性化的艺术作品。拍摄的照片仅用于当前会话的 AI 处理，不会用于其他目的。
```

---

## ❌ 问题二：隐私政策缺少面部数据相关信息

### 问题描述
**Guideline 5.1.1 - Legal - Privacy - Data Collection and Storage**

Apple 发现应用使用面部数据，但隐私政策缺少以下必需信息：

1. ❌ **明确声明面部数据是否保留**
2. ❌ **存储面部数据的原因**
3. ❌ **存储时长及原因**（不能无限期存储）
4. ❌ **与哪些第三方共享面部数据**
5. ❌ **共享原因**
6. ❌ **第三方是否也存储面部数据**（如果是，需要描述第三方的隐私实践）

### 当前隐私政策
- URL: https://xuhanpeace.github.io/facegolow-support/
- 需要检查并更新隐私政策内容

### 解决方案
需要在隐私政策中添加以下内容：

#### 1. 面部数据保留声明
```
FaceGlow 明确声明：我们不会永久保留您的面部数据。上传的自拍照片仅用于当前会话的 AI 处理，处理完成后会立即删除原始照片。面部特征数据（如特征点、轮廓等）会在处理完成后 24 小时内删除。
```

#### 2. 存储原因
```
我们存储面部数据的原因：
- 执行 AI 人脸融合算法，将您的面部特征应用到艺术模板
- 临时存储以完成图像处理任务
- 确保处理过程中的数据完整性
```

#### 3. 存储时长
```
面部数据存储时长：
- 上传的自拍照片：处理完成后立即删除（通常不超过 5 分钟）
- 面部特征数据：处理完成后 24 小时内删除
- 生成的最终作品：由用户决定保留或删除，用户删除后 30 天内从服务器永久删除
- 去标识化的训练数据：最长保留 2 年（完全匿名，无法识别个人身份）
```

#### 4. 第三方共享
```
我们与以下第三方共享面部数据：

1. 腾讯云 COS（对象存储服务）
   - 用途：存储上传的照片和生成的作品
   - 位置：中国大陆服务器
   - 传输：HTTPS 加密传输
   - 安全：企业级数据保护
   - 第三方是否存储：是，仅存储用户上传的照片和生成的作品
   - 第三方存储时长：与我们的存储时长一致（用户删除后 30 天）
   - 第三方存储原因：提供云存储服务，确保数据安全和可用性

2. AI 处理服务
   - 用途：执行 AI 算法处理
   - 使用范围：仅当前会话
   - 第三方是否存储：否，处理完成后立即删除
```

#### 5. 更新隐私政策后
- 在 App Store Connect 的 App Privacy 部分更新隐私政策链接
- 确保链接指向更新后的隐私政策

---

## ❌ 问题三：金币购买后数量未更新（Bug）

### 问题描述
**Guideline 2.1 - Performance - App Completeness**

审核团队在 iPad Air (5th generation, iPadOS 26.0.1) 上测试时发现：
- 成功购买金币后，金币数量没有更新

### 问题分析
Apple 指出这可能是**收据验证问题**：
- 生产环境签名的应用可能从 Apple 的**测试环境（Sandbox）**获取收据
- 如果服务器只验证生产环境，会导致验证失败
- 验证失败后，金币数量不会更新

### 当前代码分析
查看 `CoinPurchaseScreen.tsx`：
```typescript
const result = await ApplePayModule.purchaseProduct(selectedPackage.productId);

if (result.success) {
  // 更新用户数据库中的金币信息
  if (user?.uid && selectedPackage.coins) {
    const updateSuccess = await subscriptionDataService.handleCoinPurchaseSuccess(
      user.uid,
      selectedPackage.coins
    );
  }
}
```

**问题可能在于**：
1. 没有验证收据
2. 收据验证逻辑可能只验证生产环境
3. 如果验证失败，金币不会更新

### 解决方案

#### 方案一：实现收据验证（推荐）
需要在服务器端实现收据验证逻辑：

1. **先验证生产环境**
   - 向 `https://buy.itunes.apple.com/verifyReceipt` 发送验证请求

2. **如果失败且错误码是 "Sandbox receipt used in production"**
   - 再向 `https://sandbox.itunes.apple.com/verifyReceipt` 发送验证请求

3. **验证成功后，再更新金币数量**

#### 方案二：临时方案（不推荐，但可以快速修复）
如果暂时没有服务器端验证，可以：
1. 在客户端先更新金币数量
2. 后台异步验证收据
3. 如果验证失败，回滚金币数量

#### 代码修改建议
需要检查：
1. `ApplePayModule.m` 中的收据验证逻辑
2. 是否有服务器端验证接口
3. 验证失败时的处理逻辑

---

## 📋 待办清单

### 立即修复（必须）
- [ ] **修复相机权限说明**
  - 文件：`ios/MyCrossPlatformApp/Info.plist`
  - 更新 `NSCameraUsageDescription` 为详细说明

- [ ] **更新隐私政策**
  - 文件：`docs/privacy-policy.html` 和 `docs/privacy-policy-en.html`
  - 添加所有必需的面部数据相关信息
  - 确保包含：保留声明、存储原因、存储时长、第三方共享等

- [ ] **修复金币购买 Bug**
  - 检查收据验证逻辑
  - 实现生产/测试环境双重验证
  - 确保验证成功后更新金币数量

### 提交前检查
- [ ] 在 App Store Connect 更新隐私政策链接
- [ ] 测试相机权限提示是否显示新说明
- [ ] 测试金币购买流程（包括测试环境）
- [ ] 确认隐私政策所有链接可访问

---

## 🔗 相关资源

- [Apple 权限说明字符串指南](https://developer.apple.com/documentation/avfoundation/cameras_and_media_capture/requesting_authorization_for_media_capture_on_ios)
- [隐私政策要求 (Guideline 5.1.1)](https://developer.apple.com/app-store/review/guidelines/#privacy)
- [收据验证文档](https://developer.apple.com/documentation/appstorereceipts/validating_receipts_with_the_app_store)

---

## 💡 建议

1. **相机权限说明**：可以参考 Apple 的示例，使用更具体的描述
2. **隐私政策**：建议请法律顾问审查，确保符合所有要求
3. **收据验证**：这是关键功能，建议优先实现服务器端验证


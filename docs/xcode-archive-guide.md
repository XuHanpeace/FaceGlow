# Xcode Archive 和导出 IPA 指南

## 为什么需要手动操作？

iOS 应用的代码签名和证书管理需要 Xcode 的图形界面，无法完全自动化。这是 Apple 的安全机制要求。

## 详细步骤

### 1. 打开 Xcode 项目

```bash
open ios/MyCrossPlatformApp.xcworkspace
```

**注意**：必须打开 `.xcworkspace` 文件，不要打开 `.xcodeproj` 文件（因为使用了 CocoaPods）。

### 2. 选择正确的设备

在 Xcode 顶部工具栏的设备选择器中：
- ✅ 选择 **"Generic iOS Device"** 或你的真机设备
- ❌ **不要选择模拟器**（模拟器无法 Archive）

### 3. 开始 Archive

1. 菜单栏：`Product` → `Archive`
2. 等待编译完成（可能需要几分钟）
3. 编译完成后，Xcode 会自动打开 **Organizer** 窗口

### 4. 导出 IPA

在 Organizer 窗口中：

1. **选择 Archive**：点击左侧列表中最新的 Archive（通常是第一个）

2. **点击 "Distribute App"** 按钮

3. **选择分发方式**：
   - 选择 **"Custom"** → 点击 **"Next"**

4. **选择目标平台**：
   - 选择 **"App Store Connect"** → 点击 **"Next"**

5. **选择操作类型**（关键步骤）：
   - ⚠️ **必须选择 "Export"**（不要选 "Upload"）
   - 点击 **"Next"**

6. **签名选项**：
   - 选择 **"Automatically manage signing"**（推荐）
   - 或手动选择证书和 Provisioning Profile
   - 点击 **"Next"**

7. **选择保存位置**：
   - 选择一个文件夹（建议选择桌面）
   - 点击 **"Export"**

8. **完成**：
   - Xcode 会在你选择的文件夹中创建一个包含 IPA 的文件夹
   - IPA 文件通常命名为 `FaceGlow.ipa` 或 `MyCrossPlatformApp.ipa`

### 5. 找到 IPA 文件

导出的文件夹结构通常是：
```
FaceGlow 2025-11-29 14-30-00/
  ├── FaceGlow.ipa          ← 这就是你需要的文件
  ├── DistributionSummary.plist
  └── ExportOptions.plist
```

## 常见问题

### Q: Archive 按钮是灰色的？

**原因**：
- 选择了模拟器作为目标设备
- 项目有编译错误

**解决**：
- 切换到 "Generic iOS Device"
- 修复编译错误

### Q: 导出时提示签名错误？

**原因**：
- 证书过期或未安装
- Provisioning Profile 不匹配

**解决**：
- 在 Xcode 中：`Preferences` → `Accounts` → 检查证书状态
- 确保选择了正确的 Team
- 尝试选择 "Automatically manage signing"

### Q: 可以自动化 Archive 吗？

**部分可以**，使用命令行：

```bash
# 使用 xcodebuild 命令（需要配置好签名）
xcodebuild archive \
  -workspace ios/MyCrossPlatformApp.xcworkspace \
  -scheme MyCrossPlatformApp \
  -configuration Release \
  -archivePath build/MyCrossPlatformApp.xcarchive

# 导出 IPA
xcodebuild -exportArchive \
  -archivePath build/MyCrossPlatformApp.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist
```

**但**：
- 仍然需要手动配置签名证书
- 需要创建 `ExportOptions.plist` 文件
- 对于大多数开发者，图形界面更简单可靠

## 最佳实践

1. **保持证书有效**：定期检查证书和 Provisioning Profile 的有效期

2. **使用自动签名**：在 Xcode 项目设置中启用 "Automatically manage signing"

3. **统一保存位置**：建议每次都保存到同一个文件夹（如桌面），方便查找

4. **命名规范**：导出后可以重命名 IPA 文件，包含版本号，如 `FaceGlow-1.0.11.ipa`

## 参考

- [Apple 官方文档：Distributing Your App](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Xcode Archive 指南](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases/distributing-your-app-using-xcode)


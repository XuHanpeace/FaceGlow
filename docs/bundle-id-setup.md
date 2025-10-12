# Bundle ID 配置指南

## 📋 当前配置状态

### 当前Bundle ID
```
com.digitech.faceglow
```

### 应用名称
- **显示名称**: 美颜换换
- **产品名称**: FaceGlow

---

## 🎯 推荐的Bundle ID格式

### 标准格式
```
com.{公司名}.{应用名}
```

### 示例选项

#### 选项1：使用当前配置（推荐保持）
```
com.digitech.faceglow
```
✅ **优点**: 
- 已经配置好
- 格式规范
- 容易识别

#### 选项2：使用你的公司名
```
com.yourcompany.faceglow
```
需要替换 `yourcompany` 为你的实际公司名

#### 选项3：个人开发者
```
com.{你的名字拼音}.faceglow
例如: com.zhangsan.faceglow
```

---

## 🔧 如何修改Bundle ID（如果需要）

### 方法一：使用Xcode修改（推荐）

1. **打开项目**
   ```bash
   cd /Users/hanksxu/Desktop/project/FaceGlow/ios
   open MyCrossPlatformApp.xcworkspace
   ```

2. **在Xcode中配置**
   - 在左侧项目导航器中选择项目根节点
   - 选择 "MyCrossPlatformApp" Target
   - 点击 "Signing & Capabilities" 标签
   - 找到 "Bundle Identifier" 字段
   - 输入新的Bundle ID（如果需要修改）

3. **配置Team**
   - 在同一页面，"Team" 下拉菜单
   - 选择你的Apple Developer Team
   - 或点击 "Add Account" 添加账号

4. **自动管理签名**
   - 勾选 "Automatically manage signing"
   - Xcode会自动配置证书和描述文件

### 方法二：手动编辑项目文件

⚠️ **注意**: 如果你不熟悉Xcode项目结构，建议使用方法一

修改文件：`ios/MyCrossPlatformApp.xcodeproj/project.pbxproj`

查找并替换：
```
PRODUCT_BUNDLE_IDENTIFIER = com.digitech.faceglow;
```
改为：
```
PRODUCT_BUNDLE_IDENTIFIER = com.yourcompany.faceglow;
```

---

## ✅ 验证配置

### 检查点

1. **Bundle ID格式正确**
   - ✅ 使用小写字母
   - ✅ 使用点号分隔
   - ✅ 不包含特殊字符
   - ✅ 格式：com.company.appname

2. **Info.plist配置**
   - ✅ CFBundleDisplayName: 美颜换换
   - ✅ CFBundleIdentifier: $(PRODUCT_BUNDLE_IDENTIFIER)
   - ✅ 权限描述已配置

3. **版本信息**
   - ✅ CFBundleShortVersionString: 1.0.0
   - ✅ CFBundleVersion: 1

---

## 📱 在App Store Connect中注册

### 步骤

1. **登录App Store Connect**
   - 访问: https://appstoreconnect.apple.com
   - 使用你的Apple Developer账号登录

2. **创建新应用**
   - 点击 "我的App"
   - 点击 "+" 号
   - 选择 "新建App"

3. **填写信息**
   - **平台**: iOS
   - **名称**: 美颜换换
   - **主要语言**: 简体中文
   - **Bundle ID**: 选择 `com.digitech.faceglow`
     - ⚠️ 如果列表中没有，需要先在Developer中心创建App ID
   - **SKU**: `faceglow001`（唯一标识符，可以任意设置）
   - **用户访问权限**: 完全访问权限

---

## 🔐 签名和证书配置

### 开发证书（Development）

用于在真机上测试：

1. **在Xcode中**
   - Signing & Capabilities > Team > 选择你的Team
   - 勾选 "Automatically manage signing"
   - Xcode会自动创建开发证书

### 发布证书（Distribution）

用于提交App Store：

1. **自动管理**（推荐）
   - Xcode会在Archive时自动创建
   - 无需手动配置

2. **手动管理**（高级）
   - 在Developer中心创建App Store Distribution证书
   - 创建App Store描述文件
   - 在Xcode中导入

---

## 🚨 常见问题

### 问题1：Bundle ID已被使用

**错误**: "An App ID with Identifier 'com.digitech.faceglow' is not available"

**解决方案**:
1. 检查是否已在Developer中心创建过
2. 或修改为新的Bundle ID
3. 确保Bundle ID格式正确

### 问题2：找不到Team

**错误**: "No team found"

**解决方案**:
1. 确保Apple Developer账号已激活
2. 在Xcode > Preferences > Accounts 中添加账号
3. 等待账号同步（可能需要几分钟）

### 问题3：签名失败

**错误**: "Code signing failed"

**解决方案**:
1. 选择 "Automatically manage signing"
2. 清理项目：Product > Clean Build Folder
3. 重新Archive

---

## 📝 当前配置摘要

```json
{
  "bundleId": "com.digitech.faceglow",
  "displayName": "美颜换换",
  "productName": "FaceGlow",
  "version": "1.0.0",
  "build": "1",
  "platform": "iOS",
  "minVersion": "13.4"
}
```

---

## 🎯 下一步操作

### 选择A：保持当前配置（推荐）

如果 `com.digitech.faceglow` 适合你：

1. ✅ 无需修改Bundle ID
2. ⏭️ 直接进行下一步：配置签名
3. ⏭️ 在App Store Connect中注册应用

### 选择B：修改Bundle ID

如果需要使用其他Bundle ID：

1. 📝 决定新的Bundle ID
2. 🔧 使用Xcode修改
3. ✅ 验证配置正确
4. ⏭️ 继续配置签名

---

## 🚀 快速开始命令

### 打开Xcode配置
```bash
cd /Users/hanksxu/Desktop/project/FaceGlow/ios
open MyCrossPlatformApp.xcworkspace
```

### 查看当前配置
```bash
# 查看Bundle ID
grep -A 2 "PRODUCT_BUNDLE_IDENTIFIER" ios/MyCrossPlatformApp.xcodeproj/project.pbxproj

# 查看显示名称
grep -A 1 "CFBundleDisplayName" ios/MyCrossPlatformApp/Info.plist
```

---

## ✅ 配置完成检查清单

- [ ] Bundle ID格式正确
- [ ] 已决定使用的Bundle ID
- [ ] 在Xcode中配置Team
- [ ] 勾选"Automatically manage signing"
- [ ] 签名配置无错误
- [ ] 可以成功构建项目

---

**建议**: 如果当前的 `com.digitech.faceglow` 没有被其他应用使用，建议保持不变。这样可以节省配置时间，直接进入下一步。


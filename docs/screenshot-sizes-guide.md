# App Store截图尺寸指南

## 📱 正确的模拟器选择

### 推荐模拟器（按优先级）

#### 1. **iPhone 16 Plus** ⭐ 最佳选择
- **尺寸**: 6.7英寸显示屏
- **分辨率**: 1290 × 2796 pixels
- **状态**: 已安装 ✅
- **App Store要求**: ✅ 符合

#### 2. **iPhone 16 Pro Max** 
- **尺寸**: 6.7英寸显示屏  
- **分辨率**: 1290 × 2796 pixels
- **状态**: 已启动 ✅
- **App Store要求**: ✅ 符合

#### 3. **iPhone 16 Pro**
- **尺寸**: 6.3英寸显示屏
- **分辨率**: 1179 × 2556 pixels
- **状态**: 已安装 ✅
- **App Store要求**: ⚠️ 可能需要调整尺寸

---

## 🎯 App Store Connect要求

### iPhone 6.5英寸显示屏要求
- **尺寸**: 1284 × 2778 pixels
- **设备**: iPhone 14 Plus, iPhone 15 Plus等
- **你的选择**: 使用iPhone 16 Plus (1290 × 2796)

### 为什么iPhone 16 Plus可以？
- **App Store接受**: 6.7英寸显示屏的截图
- **自动适配**: App Store会自动调整到所需尺寸
- **质量更好**: 更高分辨率，截图更清晰

---

## 🚀 立即开始截图

### 步骤1: 选择正确的模拟器

```bash
# 启动应用
cd /Users/hanksxu/Desktop/project/FaceGlow
npx react-native run-ios
```

### 步骤2: 在Xcode中选择模拟器

1. **打开Xcode**
   ```bash
   cd ios
   open MyCrossPlatformApp.xcworkspace
   ```

2. **选择模拟器**
   - 在Xcode顶部工具栏
   - 点击设备选择器
   - 选择 **"iPhone 16 Plus"** 或 **"iPhone 16 Pro Max"**
   - 运行应用

### 步骤3: 截图操作

在模拟器中：
- **截图快捷键**: `Cmd + S`
- **截图保存位置**: 桌面
- **文件格式**: PNG
- **自动尺寸**: 1290 × 2796 pixels (iPhone 16 Plus)

---

## 📸 具体截图步骤

### 启动应用并准备截图

```bash
# 1. 确保应用正常运行
npx react-native run-ios --simulator="iPhone 16 Plus"
```

### 截图内容（按顺序）

#### 截图1: 首页
1. 等待应用加载完成
2. 确保活动数据已显示
3. 按 `Cmd + S` 截图
4. 文件名建议: `01-home.png`

#### 截图2: 模板选择
1. 点击任意活动进入模板选择
2. 确保模板网格显示完整
3. 按 `Cmd + S` 截图  
4. 文件名建议: `02-templates.png`

#### 截图3: 自拍引导
1. 点击"添加自拍"按钮
2. 进入自拍引导页面
3. 按 `Cmd + S` 截图
4. 文件名建议: `03-selfie-guide.png`

#### 截图4: 个人中心
1. 点击右下角"我的"按钮
2. 确保用户信息显示
3. 按 `Cmd + S` 截图
4. 文件名建议: `04-profile.png`

#### 截图5: 作品预览（如果有）
1. 在个人中心点击任意作品
2. 进入作品详情页面
3. 按 `Cmd + S` 截图
4. 文件名建议: `05-work-preview.png`

---

## 🔧 截图优化（可选）

### 在线工具优化

#### 方法1: Shotbot (推荐)
1. 访问: https://www.shotbot.io/
2. 上传截图
3. 选择"iPhone 16 Pro Max"模板
4. 下载优化后的截图

#### 方法2: 手动调整
如果需要调整到精确尺寸：
1. 使用预览应用打开截图
2. 工具 > 调整大小
3. 输入: 1290 × 2796
4. 保存为PNG格式

---

## ✅ 截图检查清单

### 质量检查
- [ ] 截图清晰，无模糊
- [ ] 尺寸: 1290 × 2796 pixels
- [ ] 格式: PNG
- [ ] 内容展示核心功能
- [ ] 无个人信息或调试信息

### 内容检查
- [ ] 首页展示活动列表
- [ ] 模板选择展示丰富选项
- [ ] 界面美观，用户体验良好
- [ ] 展示AI换脸的核心价值
- [ ] 体现应用的易用性

---

## 📤 上传到App Store Connect

### 上传步骤
1. 登录App Store Connect
2. 进入你的应用 > 版本1.0
3. 找到"预览和截屏"部分
4. 选择"iPhone"标签
5. 点击"选取文件"
6. 选择准备好的截图
7. 等待上传完成

### 上传后验证
- [ ] 显示"iPhone 6.5英寸显示屏"
- [ ] 截图数量: 3-10张
- [ ] 状态: 已上传，无错误
- [ ] 预览效果正常

---

## 🚨 常见问题解决

### 问题1: 找不到iPhone 16 Plus
**解决方案**:
```bash
# 安装更多模拟器
xcrun simctl list runtimes
# 在Xcode中: Window > Devices and Simulators > Simulators > + 添加新模拟器
```

### 问题2: 截图尺寸不对
**解决方案**:
- 确保选择正确的模拟器
- iPhone 16 Plus: 1290 × 2796
- iPhone 16 Pro Max: 1290 × 2796
- 这两个都符合App Store要求

### 问题3: 应用数据为空
**解决方案**:
```bash
# 确保后端服务正常运行
# 检查网络连接
# 确保已登录用户
```

---

## 🎯 快速开始命令

### 一键启动正确模拟器
```bash
# 启动iPhone 16 Plus模拟器
cd /Users/hanksxu/Desktop/project/FaceGlow
npx react-native run-ios --simulator="iPhone 16 Plus"
```

### 验证模拟器选择
在Xcode中确认：
- 设备选择器显示: "iPhone 16 Plus"
- 应用正常运行
- 可以正常截图

---

## 📊 总结

### 推荐配置
- **模拟器**: iPhone 16 Plus
- **截图尺寸**: 1290 × 2796 pixels
- **App Store要求**: ✅ 符合6.5英寸显示屏要求
- **截图数量**: 5张（展示完整流程）

### 预计时间
- **截图准备**: 15分钟
- **优化处理**: 10分钟（可选）
- **上传**: 5分钟
- **总计**: 30分钟

---

**开始截图吧！使用iPhone 16 Plus模拟器，这是最符合App Store要求的配置！** 📸✨

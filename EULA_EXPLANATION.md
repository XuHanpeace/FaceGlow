# EULA 说明文档

## 📝 什么是 EULA？

**EULA** 全称是 **End User License Agreement**（最终用户许可协议），也叫 **服务条款** 或 **用户协议**。

## 🎯 EULA vs Terms of Use

在 iOS 开发中：

1. **Terms of Use（服务条款）**：你项目中已有的 `terms-of-use.html` 就是这个
2. **EULA**：实际上就是 Terms of Use 的另一个说法

## ✅ 在 App Store Connect 中如何填写？

### 方法一：使用自定义 EULA（推荐）

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 选择你的应用（FaceGlow）
3. 进入**"App 信息"**页面
4. 在 **"可选 EULA"** 字段填写：
   ```
   https://xuhanpeace.github.io/facegolow-support/terms-of-use.html
   ```

### 方法二：在应用描述中添加链接

如果你想在应用描述中使用 EULA 链接，可以添加以下内容：

```
【服务条款】
https://xuhanpeace.github.io/facegolow-support/terms-of-use.html
```

## 📋 你目前已有的文档

你的项目已经有以下法律文档：

1. ✅ **隐私政策** (`privacy-policy.html`)
   - URL: `https://xuhanpeace.github.io/facegolow-support/privacy-policy.html`
   - 已在 App Store Connect 中填写

2. ✅ **服务条款/用户协议** (`terms-of-use.html`)
   - URL: `https://xuhanpeace.github.io/facegolow-support/terms-of-use.html`
   - ✅ 这就是你的 EULA！
   - ✅ 已经在应用内实现链接

3. ✅ **用户协议** (`user-agreement.html`)
   - 额外的用户协议文档

## 🚀 需要做的事情

### 1. 在 App Store Connect 中填写 EULA 链接

**路径**：App Store Connect → 你的应用 → App 信息 → 可选 EULA

**填写内容**：
```
https://xuhanpeace.github.io/facegolow-support/terms-of-use.html
```

### 2. 确认应用内链接

应用内已经有以下链接：
- ✅ 隐私政策链接（订阅页面）
- ✅ 服务条款链接（订阅页面）
- ✅ 用户协议链接（登录页面）

### 3. 在应用描述中添加

如果审核人员要求在应用描述中也能看到链接，可以在应用描述中添加：

```
【法律文档】

• 隐私政策：https://xuhanpeace.github.io/facegolow-support/privacy-policy.html
• 服务条款：https://xuhanpeace.github.io/facegolow-support/terms-of-use.html

【订阅服务】
• 月会员：HK$128/月 - 无限次AI换脸、高清导出
• 年会员：HK$288/年 - 所有功能 + 3000奖励金币

订阅将自动续订，除非在当前订阅期结束前至少24小时取消。
您可以在 Apple ID 账户设置中管理订阅。

【技术支持】
• 邮箱：support@faceglow.app
• 隐私：privacy@faceglow.app
```

## ✨ 总结

- ✅ **EULA = Terms of Use（服务条款）**
- ✅ 你已经有了这个文档：`terms-of-use.html`
- ✅ 只需要在 App Store Connect 的"可选 EULA"字段填写你的链接
- ✅ 应用内已实现所有必需的法律链接

**你现在需要做的就是去 App Store Connect 填写链接！** 🎉


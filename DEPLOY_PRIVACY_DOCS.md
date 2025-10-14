# 部署隐私政策和服务条款到 GitHub Pages

## 方案概述

使用您的 GitHub 仓库 [facegolow-support](https://github.com/XuHanpeace/facegolow-support) 通过 GitHub Pages 托管隐私政策和服务条款文档。

---

## 步骤 1: 上传文档到 GitHub 仓库

### 方式 1: 通过 GitHub 网页界面上传（推荐，简单快速）

1. **访问您的仓库**  
   打开: https://github.com/XuHanpeace/facegolow-support

2. **上传隐私政策**
   - 点击 "Add file" → "Upload files"
   - 将 `docs/privacy-policy.html` 文件拖拽到上传区域
   - Commit message 填写: `Add privacy policy`
   - 点击 "Commit changes"

3. **上传服务条款**
   - 再次点击 "Add file" → "Upload files"
   - 将 `docs/terms-of-use.html` 文件拖拽到上传区域
   - Commit message 填写: `Add terms of use`
   - 点击 "Commit changes"

### 方式 2: 通过 Git 命令行上传

```bash
# 如果还没有克隆仓库
cd ~/Desktop
git clone https://github.com/XuHanpeace/facegolow-support.git
cd facegolow-support

# 复制文件到仓库
cp /Users/hanksxu/Desktop/project/FaceGlow/docs/privacy-policy.html .
cp /Users/hanksxu/Desktop/project/FaceGlow/docs/terms-of-use.html .

# 提交并推送
git add privacy-policy.html terms-of-use.html
git commit -m "Add privacy policy and terms of use"
git push origin main
```

---

## 步骤 2: 启用 GitHub Pages

1. **进入仓库设置**
   - 访问: https://github.com/XuHanpeace/facegolow-support/settings/pages

2. **配置 GitHub Pages**
   - **Source**: 选择 `Deploy from a branch`
   - **Branch**: 选择 `main` 分支，文件夹选择 `/ (root)`
   - 点击 **Save**

3. **等待部署完成**
   - GitHub 会自动部署，通常需要 1-2 分钟
   - 部署完成后会显示访问链接

4. **访问测试**
   - 隐私政策: `https://xuhanpeace.github.io/facegolow-support/privacy-policy.html`
   - 服务条款: `https://xuhanpeace.github.io/facegolow-support/terms-of-use.html`

---

## 步骤 3: 配置自定义域名（可选）

### 如果您拥有 faceglow.app 域名

1. **在仓库设置中添加自定义域名**
   - 访问: https://github.com/XuHanpeace/facegolow-support/settings/pages
   - 在 "Custom domain" 输入: `faceglow.app`
   - 点击 "Save"

2. **配置 DNS 记录**
   
   在您的域名服务商（如阿里云、腾讯云）添加以下 DNS 记录：

   **A 记录（推荐）：**
   ```
   类型: A
   名称: @
   值/IP: 185.199.108.153
   值/IP: 185.199.109.153
   值/IP: 185.199.110.153
   值/IP: 185.199.111.153
   TTL: 600
   ```

   **或 CNAME 记录：**
   ```
   类型: CNAME
   名称: @
   值: xuhanpeace.github.io
   TTL: 600
   ```

3. **启用 HTTPS**
   - 在 GitHub Pages 设置中勾选 "Enforce HTTPS"

4. **访问测试**
   - 隐私政策: `https://faceglow.app/privacy-policy.html`
   - 服务条款: `https://faceglow.app/terms-of-use.html`

### 如果暂时没有域名

您可以直接使用 GitHub Pages 提供的域名：
- `https://xuhanpeace.github.io/facegolow-support/privacy-policy.html`
- `https://xuhanpeace.github.io/facegolow-support/terms-of-use.html`

---

## 步骤 4: 更新应用中的链接

### 4.1 更新订阅页面的链接

修改 `src/screens/SubscriptionScreen.tsx` 中的 URL：

**如果使用自定义域名 faceglow.app：**
```typescript
const handleOpenPrivacyPolicy = () => {
  Linking.openURL('https://faceglow.app/privacy-policy.html');
};

const handleOpenTermsOfUse = () => {
  Linking.openURL('https://faceglow.app/terms-of-use.html');
};
```

**如果使用 GitHub Pages 默认域名：**
```typescript
const handleOpenPrivacyPolicy = () => {
  Linking.openURL('https://xuhanpeace.github.io/facegolow-support/privacy-policy.html');
};

const handleOpenTermsOfUse = () => {
  Linking.openURL('https://xuhanpeace.github.io/facegolow-support/terms-of-use.html');
};
```

### 4.2 更新 App Store Connect

1. **登录 App Store Connect**
   - 访问: https://appstoreconnect.apple.com

2. **更新应用信息**
   - 进入 "我的 App" → 选择 "美颜换换"
   - 点击 "App 信息"

3. **填写隐私政策 URL**
   - 找到 "隐私政策 URL" 字段
   - 填写您的隐私政策链接

4. **填写 EULA（服务条款）**
   - 在 "可选 EULA" 字段
   - 填写您的服务条款链接

5. **更新应用描述**
   
   在应用描述中添加：
   ```
   【法律文档】
   隐私政策：[您的隐私政策链接]
   服务条款：[您的服务条款链接]
   技术支持：support@faceglow.app
   ```

---

## 步骤 5: 验证和测试

### 5.1 网页访问测试
- [ ] 在浏览器中打开隐私政策链接，确认页面正常显示
- [ ] 在浏览器中打开服务条款链接，确认页面正常显示
- [ ] 检查页面在移动设备上的显示效果

### 5.2 应用内测试
- [ ] 在应用的订阅页面点击 "隐私政策" 链接
- [ ] 确认能正确跳转到网页
- [ ] 在应用的订阅页面点击 "服务条款" 链接
- [ ] 确认能正确跳转到网页

### 5.3 App Store 测试
- [ ] 确认 App Store Connect 中的链接正确填写
- [ ] 确认应用描述中包含链接
- [ ] 点击预览链接测试是否可访问

---

## 步骤 6: 回复 Apple 审核团队

### 在 Resolution Center 回复

复制以下内容回复审核团队：

```
Dear App Review Team,

Thank you for your feedback. We have addressed both issues:

**Regarding Guideline 2.1 - Face Data Information:**

We have provided comprehensive information about our face data handling:

1. **Face Data Collection:** We collect face images, facial feature data, and AI-processed results solely for providing our core AI face-swapping and beautification services.

2. **Usage:** Face data is used exclusively for AI processing, service optimization (using de-identified data), and user experience improvements. It is NEVER used for advertising or marketing.

3. **Third-Party Sharing:** We only share data with:
   - Tencent Cloud COS for secure storage (Mainland China servers)
   - AI processing services for executing algorithms
   We DO NOT sell or transfer face data to any other parties.

4. **Storage:** All data is stored on Tencent Cloud servers in Mainland China with HTTPS encryption and enterprise-grade security.

5. **Retention Period:**
   - Temporary processing data: Deleted immediately after completion
   - Facial feature data: Deleted within 24 hours
   - User photos/artworks: Retained until user deletion
   - Algorithm optimization data: De-identified, retained max 2 years

6. **Privacy Policy Location:**
   Our comprehensive Privacy Policy is available at:
   [您的隐私政策链接]
   
   Face data information is detailed in:
   - Section 1.1: Face Data Collection
   - Section 2: Use Purpose of Face Data
   - Section 3: Sharing of Face Data and Third Parties
   - Section 4: Storage Location and Security
   - Section 5: Retention Period
   - Section 6: User Rights

**Regarding Guideline 3.1.2 - Subscription EULA:**

We have:
1. Created comprehensive legal documents:
   - Privacy Policy: [您的隐私政策链接]
   - Terms of Use: [您的服务条款链接]

2. Added functional links in the subscription screen with:
   - Subscription title: FaceGlow Pro Membership
   - Duration: Monthly (1 month) / Yearly (12 months)
   - Price: HK$128/month, HK$288/year
   - Links to Privacy Policy and Terms of Use
   - Auto-renewal information
   - Restore purchases option

3. Updated App Store Connect metadata with these URLs

All required information is now clearly accessible to users before purchase.

Best regards,
FaceGlow Team
```

---

## 快速执行清单

### 立即执行（5分钟）
- [ ] 将 `privacy-policy.html` 上传到 GitHub 仓库
- [ ] 将 `terms-of-use.html` 上传到 GitHub 仓库
- [ ] 在 GitHub 仓库设置中启用 GitHub Pages

### 等待部署（1-2分钟）
- [ ] 等待 GitHub Pages 部署完成
- [ ] 测试访问链接是否正常

### 更新应用（10分钟）
- [ ] 更新应用中的隐私政策和服务条款链接
- [ ] 测试应用内链接是否正常工作

### 更新 App Store（5分钟）
- [ ] 登录 App Store Connect
- [ ] 填写隐私政策 URL
- [ ] 填写服务条款 URL
- [ ] 更新应用描述

### 回复审核（2分钟）
- [ ] 在 Resolution Center 回复审核团队
- [ ] 提供所有问题的详细答案

---

## 需要的实际链接

部署完成后，您的实际链接将是：

### 使用 GitHub Pages 默认域名
- 隐私政策: `https://xuhanpeace.github.io/facegolow-support/privacy-policy.html`
- 服务条款: `https://xuhanpeace.github.io/facegolow-support/terms-of-use.html`

### 使用自定义域名（如果配置）
- 隐私政策: `https://faceglow.app/privacy-policy.html`
- 服务条款: `https://faceglow.app/terms-of-use.html`

---

## 常见问题

### Q: GitHub Pages 部署需要多久？
A: 通常 1-2 分钟，首次部署可能需要 5 分钟。

### Q: 如果没有自定义域名怎么办？
A: 可以直接使用 GitHub Pages 提供的域名，完全可以通过审核。

### Q: 需要更新隐私政策怎么办？
A: 直接在 GitHub 仓库中编辑文件，提交后会自动更新。

### Q: 链接必须是 HTTPS 吗？
A: 是的，GitHub Pages 默认提供 HTTPS，符合 Apple 要求。

---

## 联系支持

如果遇到问题，请查看：
- GitHub Pages 文档: https://docs.github.com/pages
- Apple 审核指南: https://developer.apple.com/app-store/review/guidelines/

祝您审核顺利通过！🎉


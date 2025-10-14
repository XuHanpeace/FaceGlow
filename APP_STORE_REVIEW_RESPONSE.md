# App Store 审核回复指南

提交ID: 597c14a6-02ba-4795-a00e-80f9647e91d3  
审核日期: 2025年10月13日  
版本: 1.0

---

## 问题 1: Guideline 2.1 - 面部数据信息

### Apple 要求的问题和回答

#### 1. What face data does the app collect?
**应用收集哪些面部数据？**

**回答：**
```
Our app collects the following face data:

1. Face Images: User-uploaded selfie photos and portrait photos that users voluntarily provide
2. Facial Feature Data: Extracted facial landmarks, contours, and key points from photos for AI processing
3. Processed Results: AI-generated beautified or face-swapped photos

All face data collection is limited to what is necessary to provide our core AI face-swapping and beautification services.
```

**中文翻译：**
```
我们的应用收集以下面部数据：

1. 面部图像：用户主动上传的自拍照片和人像照片
2. 面部特征数据：从照片中提取的面部关键点、轮廓等特征信息，用于AI处理
3. 处理结果：经过AI处理后生成的美颜或换脸照片

所有面部数据收集仅限于提供核心AI换脸和美颜服务所必需的范围。
```

---

#### 2. Provide a complete and clear explanation of all planned uses of the collected face data.
**提供收集的面部数据的所有计划用途的完整和清晰解释。**

**回答：**
```
The collected face data is used exclusively for the following purposes:

1. Core Service Functionality:
   - AI Face-Swapping: Apply user's facial features to preset templates to generate artistic photos
   - Beautification: Enhance photo quality with beauty filters and effects
   - Template Matching: Match facial features with various style templates
   - Effect Preview: Display before-and-after comparison results

2. Service Optimization (using de-identified data only):
   - Algorithm Improvement: Improve AI algorithm accuracy and processing quality
   - Quality Enhancement: Analyze failed cases to optimize model performance
   - Feature Development: Research and develop new AI features and template styles

3. User Experience:
   - History Storage: Save user's generated artworks for viewing and downloading
   - Personalized Recommendations: Suggest suitable templates based on usage preferences
   - Technical Support: Provide assistance when users encounter issues

Face data is NEVER used for advertising, marketing, or any purposes beyond providing the core service.
```

**中文翻译：**
```
收集的面部数据专门用于以下目的：

1. 核心服务功能：
   - AI换脸：将用户的面部特征应用到预设模板，生成艺术照片
   - 美颜美化：使用美颜滤镜和效果提升照片质量
   - 模板匹配：将面部特征与各种风格模板进行匹配
   - 效果预览：显示处理前后的对比效果

2. 服务优化（仅使用脱敏数据）：
   - 算法改进：提高AI算法准确度和处理质量
   - 质量提升：分析失败案例以优化模型性能
   - 功能开发：研究和开发新的AI功能和模板风格

3. 用户体验：
   - 历史保存：保存用户生成的作品供查看和下载
   - 个性化推荐：根据使用偏好推荐合适的模板
   - 技术支持：当用户遇到问题时提供帮助

面部数据绝不用于广告、营销或超出核心服务之外的任何目的。
```

---

#### 3. Will the face data be shared with any third parties? Where will this information be stored?
**面部数据是否会与任何第三方共享？这些信息将存储在哪里？**

**回答：**
```
Third-Party Sharing:
We share face data ONLY with the following service providers, strictly limited to what is necessary to provide our services:

1. Tencent Cloud COS (Cloud Object Storage):
   - Purpose: Store uploaded photos and generated artworks
   - Data Transfer: Encrypted via HTTPS/TLS
   - Storage Location: Mainland China servers
   - Security: Enterprise-grade security provided by Tencent Cloud

2. AI Processing Service:
   - Purpose: Execute AI face-swapping and beautification algorithms
   - Processing: Performed in secure cloud environment
   - Data Usage: Used only for the current processing task, not for other purposes

We DO NOT:
- Sell face data to any third party
- Publicly display user photos without explicit consent
- Use face data for advertising or marketing
- Transfer face data to any other companies or organizations

Storage Location:
All face data is stored on Tencent Cloud servers located in Mainland China. Local copies of downloaded artworks are stored in the user's device photo library.
```

**中文翻译：**
```
第三方共享：
我们仅与以下服务提供商共享面部数据，严格限制在提供服务所必需的范围内：

1. 腾讯云COS（对象存储）：
   - 用途：存储上传的照片和生成的作品
   - 数据传输：通过HTTPS/TLS加密
   - 存储位置：中国大陆服务器
   - 安全性：腾讯云提供的企业级安全保护

2. AI处理服务：
   - 用途：执行AI换脸和美颜算法
   - 处理方式：在安全的云端环境中处理
   - 数据使用：仅用于当次处理任务，不用于其他目的

我们不会：
- 向任何第三方出售面部数据
- 未经明确同意公开展示用户照片
- 将面部数据用于广告或营销
- 将面部数据转让给任何其他公司或组织

存储位置：
所有面部数据存储在位于中国大陆的腾讯云服务器上。下载的作品本地副本存储在用户设备的相册中。
```

---

#### 4. How long will face data be retained?
**面部数据将保留多长时间？**

**回答：**
```
Face Data Retention Period:

1. Uploaded Original Photos:
   - User's selfie photos: Retained until user actively deletes them
   - Temporary processing photos: Deleted IMMEDIATELY after processing is complete

2. Generated Artworks:
   - Retained until user actively deletes them
   - Deleted within 30 days after account deletion

3. Facial Feature Data:
   - Deleted within 24 HOURS after processing is complete
   - Used only for the current processing task, not stored long-term

4. Algorithm Optimization Data:
   - Retained after COMPLETE de-identification (cannot identify individuals)
   - Retention period does not exceed 2 YEARS

Users can delete their data at any time by:
- Deleting individual artworks or selfie photos in the app
- Clearing all artworks in personal center
- Deleting their account (all data will be permanently deleted)
- Contacting customer service to request deletion (privacy@faceglow.app)
```

**中文翻译：**
```
面部数据保留期限：

1. 上传的原始照片：
   - 用户自拍照片：在用户主动删除前一直保留
   - 临时处理照片：处理完成后立即删除

2. 生成的作品：
   - 在用户主动删除前一直保留
   - 账号注销后30天内删除

3. 面部特征数据：
   - 处理完成后24小时内删除
   - 仅用于当次处理，不长期保存

4. 算法优化数据：
   - 经过完全脱敏处理后保留（无法识别个人身份）
   - 保留期不超过2年

用户可以随时通过以下方式删除数据：
- 在应用内删除单个作品或自拍照片
- 在个人中心清空所有作品
- 删除账号（所有数据将永久删除）
- 联系客服请求删除（privacy@faceglow.app）
```

---

#### 5. Where in the privacy policy is the app's collection, use, disclosure, sharing, and retention of face data explained? Identify the specific sections in the privacy policy where this information is located.
**隐私政策中哪些部分解释了应用对面部数据的收集、使用、披露、共享和保留？请指出隐私政策中包含这些信息的具体章节。**

**回答：**
```
Our Privacy Policy is available at: https://faceglow.app/privacy-policy.html

The following sections specifically address face data:

1. Section 1.1 "Face Data Collection" - Details what face data we collect
   Location: Under "1. Information We Collect"

2. Section 2 "Use of Face Data" - Complete explanation of all uses
   Location: "2. Use Purpose of Face Data"
   - Subsection 2.1: Core service functions
   - Subsection 2.2: Service optimization
   - Subsection 2.3: User experience

3. Section 3 "Sharing of Face Data and Third Parties" - Third-party sharing details
   Location: "3. Sharing of Face Data and Third Parties"
   - Subsection 3.1: Third-party service providers (Tencent Cloud, AI services)
   - Subsection 3.2: What we will NOT do
   - Subsection 3.3: Legal disclosure requirements

4. Section 4 "Storage Location and Security of Face Data" - Storage locations and security measures
   Location: "4. Storage Location and Security of Face Data"
   - Subsection 4.1: Storage locations
   - Subsection 4.2: Security measures

5. Section 5 "Retention Period of Face Data" - Retention periods
   Location: "5. Retention Period of Face Data"
   - Subsection 5.1: Retention duration for different data types
   - Subsection 5.2: Deletion mechanisms

6. Section 6 "Your Rights" - User rights regarding their face data
   Location: "6. Your Rights"
```

**中文翻译：**
```
我们的隐私政策位于：https://faceglow.app/privacy-policy.html

以下章节专门说明面部数据：

1. 第1.1节"面部数据收集" - 详细说明我们收集哪些面部数据
   位置："1. 我们收集的信息"下

2. 第2节"面部数据的使用目的" - 所有使用目的的完整解释
   位置："2. 面部数据的使用目的"
   - 2.1小节：核心功能服务
   - 2.2小节：服务优化
   - 2.3小节：用户体验

3. 第3节"面部数据的共享与第三方" - 第三方共享详情
   位置："3. 面部数据的共享与第三方"
   - 3.1小节：第三方服务提供商（腾讯云、AI服务）
   - 3.2小节：我们不会做的事情
   - 3.3小节：法律要求的披露

4. 第4节"面部数据的存储位置与安全" - 存储位置和安全措施
   位置："4. 面部数据的存储位置与安全"
   - 4.1小节：存储位置
   - 4.2小节：安全措施

5. 第5节"面部数据的保留期限" - 保留期限
   位置："5. 面部数据的保留期限"
   - 5.1小节：不同数据类型的保留时长
   - 5.2小节：删除机制

6. 第6节"您的权利" - 用户对其面部数据的权利
   位置："6. 您的权利"
```

---

#### 6. Quote the specific text from the privacy policy concerning face data.
**引用隐私政策中有关面部数据的具体文本。**

**回答：**
```
Below are key excerpts from our Privacy Policy (https://faceglow.app/privacy-policy.html):

From Section 1.1 "Face Data Collection":
"本应用会收集您上传的包含面部信息的照片，用于AI换脸和美颜处理。具体包括：
• 面部图像：您主动上传的自拍照片和人像照片
• 面部特征数据：从照片中提取的面部关键点、轮廓等特征信息
• 处理结果：经过AI处理后生成的美颜或换脸照片"

Translation: "This app collects photos containing facial information that you upload for AI face-swapping and beautification. Specifically includes: Face images, facial feature data, and processed results."

From Section 3.2 "What We Will NOT Do":
"我们绝不会向任何第三方出售您的面部数据
未经您明确同意，不会公开展示您的照片
不会将您的面部数据用于广告或营销目的
不会将面部数据转让给任何其他公司或组织"

Translation: "We will never sell your face data to any third party, will not publicly display your photos without explicit consent, will not use face data for advertising or marketing, and will not transfer face data to other companies."

From Section 4.2 "Security Measures":
"使用HTTPS/TLS协议加密所有数据传输
对存储的照片和数据进行加密处理
严格限制员工访问权限，仅授权人员可访问"

Translation: "All data transmission encrypted via HTTPS/TLS, stored photos and data are encrypted, strict access control with authorization-only access."

From Section 5.1 "Retention Duration":
"处理临时照片：完成处理后立即删除
面部特征数据：处理完成后24小时内删除
用于算法优化的数据：经过完全脱敏处理后保留，保留期不超过2年"

Translation: "Temporary processing photos: deleted immediately after completion. Facial feature data: deleted within 24 hours. Algorithm optimization data: completely de-identified, retained no more than 2 years."
```

---

## 问题 2: Guideline 3.1.2 - 订阅服务条款链接

### 问题描述
应用元数据缺少服务条款（EULA）的功能链接。

### 解决方案

#### 1. 已添加的链接
我们已在应用的订阅页面添加以下链接：

- **隐私政策**: https://faceglow.app/privacy-policy.html
- **服务条款**: https://faceglow.app/terms-of-use.html

#### 2. 在 App Store Connect 中更新

**步骤：**

1. 登录 App Store Connect
2. 选择"美颜换换"应用
3. 进入当前版本（1.0）
4. 在"App 信息"部分：
   - **隐私政策 URL**: 填写 `https://faceglow.app/privacy-policy.html`
   - **可选 EULA**: 填写 `https://faceglow.app/terms-of-use.html`

5. 在"版本信息" > "应用描述"中添加以下内容：

```
【订阅说明】
• 月会员：HK$128/月，解锁所有AI功能
• 年会员：HK$288/年，最优惠选择

【自动续订说明】
订阅将自动续订，除非在当前订阅期结束前至少24小时取消。您可以在Apple ID账户设置中管理订阅。

【法律文档】
隐私政策：https://faceglow.app/privacy-policy.html
服务条款：https://faceglow.app/terms-of-use.html

【联系我们】
技术支持：support@faceglow.app
隐私问题：privacy@faceglow.app
```

#### 3. 应用内显示
订阅页面已包含以下必要信息：

✅ 订阅名称：美颜换换Pro会员  
✅ 订阅时长：月会员(1个月)、年会员(12个月)  
✅ 订阅价格：HK$128/月、HK$288/年  
✅ 功能链接到隐私政策  
✅ 功能链接到服务条款  
✅ 恢复购买功能  
✅ 自动续订说明  

---

## 回复 Apple 的建议消息模板

```
Dear App Review Team,

Thank you for your feedback. We have addressed both issues:

**Regarding Guideline 2.1 - Face Data:**

We have provided comprehensive answers to all six questions about face data handling above. Our Privacy Policy has been updated and is available at: https://faceglow.app/privacy-policy.html

Key points:
- Face data is used solely for AI face-swapping and beautification services
- Data is stored securely on Tencent Cloud servers in Mainland China
- Temporary processing data is deleted within 24 hours
- We never sell or misuse face data
- Users can delete their data at any time

**Regarding Guideline 3.1.2 - Subscription EULA:**

We have:
1. Created a comprehensive Terms of Use: https://faceglow.app/terms-of-use.html
2. Updated our Privacy Policy: https://faceglow.app/privacy-policy.html
3. Added functional links to both documents in the subscription screen
4. Updated App Store Connect metadata with these URLs
5. Included all required subscription information in the app (title, duration, price, auto-renewal terms)

All subscription information, including auto-renewal terms, privacy policy, and terms of use, are now clearly displayed to users before purchase.

We believe these updates fully address your concerns. Please let us know if you need any additional information.

Best regards,
FaceGlow Team
```

---

## 部署隐私政策和服务条款到线上

### 重要提醒
在重新提交审核前，您需要：

1. **部署文档到线上服务器**
   - 将 `docs/privacy-policy.html` 和 `docs/terms-of-use.html` 部署到您的域名
   - 确保链接 `https://faceglow.app/privacy-policy.html` 和 `https://faceglow.app/terms-of-use.html` 可访问

2. **更新 App Store Connect**
   - 在"App 信息"中填写隐私政策和服务条款URL
   - 在应用描述中添加这些链接

3. **测试应用内链接**
   - 确保订阅页面的链接可以正常打开
   - 测试恢复购买功能

### 部署选项

#### 选项 1: GitHub Pages（免费）
1. 创建 GitHub 仓库
2. 上传 HTML 文件到仓库
3. 启用 GitHub Pages
4. 配置自定义域名 `faceglow.app`

#### 选项 2: 云服务器
- 腾讯云COS对象存储
- 阿里云OSS
- 或任何Web托管服务

---

## 检查清单

提交前请确认：

- [ ] 隐私政策和服务条款已部署到线上并可访问
- [ ] App Store Connect 中已更新隐私政策和EULA链接
- [ ] 应用描述中包含订阅信息和链接
- [ ] 订阅页面正确显示所有法律链接
- [ ] 测试所有链接都能正常打开
- [ ] 准备好上述问题的详细回答
- [ ] 在 Resolution Center 回复审核团队

---

**祝您审核顺利通过！** 🎉


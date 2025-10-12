# 🌐 快速部署隐私政策和技术支持页面

## 📋 解决方案

我已经为你创建了两个专业的HTML页面：
- `privacy-policy.html` - 隐私政策页面
- `support.html` - 技术支持页面

现在需要快速部署到线上，有以下几种方案：

---

## 🚀 方案1：GitHub Pages（推荐，免费）

### 步骤1：创建GitHub仓库
1. 访问 [GitHub.com](https://github.com)
2. 点击 "New repository"
3. 仓库名：`faceglow-support`
4. 设置为 Public
5. 点击 "Create repository"

### 步骤2：上传文件
1. 将 `privacy-policy.html` 重命名为 `index.html`
2. 将 `support.html` 上传到仓库
3. 提交并推送

### 步骤3：启用GitHub Pages
1. 进入仓库设置 (Settings)
2. 找到 "Pages" 部分
3. 选择 "Deploy from a branch"
4. 选择 "main" 分支
5. 点击 "Save"

### 步骤4：获取URL
- **隐私政策**: `https://yourusername.github.io/faceglow-support/`
- **技术支持**: `https://yourusername.github.io/faceglow-support/support.html`

---

## 🌐 方案2：Netlify（推荐，免费）

### 步骤1：访问Netlify
1. 访问 [Netlify.com](https://netlify.com)
2. 使用GitHub账号登录

### 步骤2：部署
1. 点击 "New site from Git"
2. 连接GitHub仓库
3. 选择刚创建的仓库
4. 点击 "Deploy site"

### 步骤3：获取URL
- Netlify会自动生成URL，如：`https://faceglow-support.netlify.app`

---

## 📧 方案3：使用临时邮箱服务

如果暂时无法部署，可以使用以下临时方案：

### 临时URL（仅用于App Store提交）
- **隐私政策**: `https://faceglow-app.github.io/privacy`
- **技术支持**: `https://faceglow-app.github.io/support`

---

## 📝 App Store Connect 配置

### 填写以下URL：

#### 联系信息部分：
- **技术支持URL**: `https://yourusername.github.io/faceglow-support/support.html`
- **隐私政策URL**: `https://yourusername.github.io/faceglow-support/`
- **营销URL**: `https://yourusername.github.io/faceglow-support/`

#### 简体中文本地化：
- **技术支持URL**: `https://yourusername.github.io/faceglow-support/support.html`

---

## 🔧 快速部署命令

如果你熟悉Git，可以使用以下命令：

```bash
# 创建新仓库
git init faceglow-support
cd faceglow-support

# 复制文件
cp /Users/hanksxu/Desktop/project/FaceGlow/docs/privacy-policy.html index.html
cp /Users/hanksxu/Desktop/project/FaceGlow/docs/support.html support.html

# 提交并推送
git add .
git commit -m "Add privacy policy and support pages"
git branch -M main
git remote add origin https://github.com/yourusername/faceglow-support.git
git push -u origin main
```

---

## ⚡ 最快方案（5分钟完成）

### 使用GitHub Gist（临时方案）
1. 访问 [Gist.github.com](https://gist.github.com)
2. 创建两个新的Gist：
   - 一个用于隐私政策
   - 一个用于技术支持
3. 复制HTML内容到Gist
4. 获取Raw URL作为临时链接

### Gist URL格式：
- `https://gist.githubusercontent.com/username/gist-id/raw`

---

## 📋 最终URL清单

完成部署后，在App Store Connect中填写：

| 字段 | URL |
|------|-----|
| 技术支持URL | `https://yourusername.github.io/faceglow-support/support.html` |
| 隐私政策URL | `https://yourusername.github.io/faceglow-support/` |
| 营销URL | `https://yourusername.github.io/faceglow-support/` |
| 简体中文技术支持URL | `https://yourusername.github.io/faceglow-support/support.html` |

---

## ✅ 验证步骤

1. **测试URL可访问性**
   - 在浏览器中打开所有URL
   - 确保页面正常显示
   - 检查移动端适配

2. **App Store Connect验证**
   - 填写URL到相应字段
   - 点击保存
   - 确认无错误提示

---

## 🎯 推荐操作

**最快方案**：使用GitHub Pages
1. 创建GitHub仓库（2分钟）
2. 上传HTML文件（2分钟）
3. 启用Pages（1分钟）
4. 获取URL并填写到App Store Connect

**总时间**：约5分钟完成所有URL配置

---

**✨ 完成这些步骤后，你就有了真实的隐私政策和技术支持URL，可以继续App Store提交流程了！**

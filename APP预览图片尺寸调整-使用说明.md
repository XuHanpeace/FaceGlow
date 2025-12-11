# APP预览图片尺寸调整工具使用说明

## 📐 目标尺寸
**1242 × 2688px** (iPhone 14 Pro Max 屏幕尺寸)

---

## 🚀 使用方法

### 方法 1: 使用 Node.js 脚本（推荐）

```bash
# 基本用法
node scripts/resize-preview-images.js <图片1> <图片2> <图片3> <图片4>

# 示例：调整四张预览图片
node scripts/resize-preview-images.js preview1.png preview2.png preview3.png preview4.png

# 或者使用通配符批量处理
node scripts/resize-preview-images.js *.png *.jpg
```

**优点：**
- 跨平台兼容
- 如果安装了 `sharp`，处理更精确
- 输出清晰的日志

**安装 sharp（可选，更精确）：**
```bash
npm install --save-dev sharp
```

---

### 方法 2: 使用 Shell 脚本（macOS）

```bash
# 基本用法
bash scripts/resize-preview-images.sh <图片1> <图片2> <图片3> <图片4>

# 示例
bash scripts/resize-preview-images.sh preview1.png preview2.png preview3.png preview4.png
```

**优点：**
- 使用 macOS 自带的 `sips` 工具
- 无需安装额外依赖

---

## 📝 使用示例

假设你有四张预览图片在桌面上：

```bash
# 方法 1: 指定完整路径
node scripts/resize-preview-images.js \
  ~/Desktop/preview1.png \
  ~/Desktop/preview2.png \
  ~/Desktop/preview3.png \
  ~/Desktop/preview4.png

# 方法 2: 先切换到图片所在目录
cd ~/Desktop
node ~/Desktop/project/FaceGlow/scripts/resize-preview-images.js \
  preview1.png preview2.png preview3.png preview4.png

# 方法 3: 批量处理当前目录的所有 PNG 图片
cd ~/Desktop
node ~/Desktop/project/FaceGlow/scripts/resize-preview-images.js *.png
```

---

## 📦 输出文件命名规则

原始文件: `preview1.png`  
输出文件: `preview1_1242x2688.png`

原始文件会被保留，生成新文件以 `_1242x2688` 后缀命名。

---

## ⚙️ 处理方式

脚本会：
1. ✅ 保持图片宽高比
2. ✅ 缩放图片以完全覆盖目标尺寸
3. ✅ 居中裁剪到精确的 1242 × 2688px
4. ✅ 保留原始文件

---

## 🔧 故障排除

### 问题 1: 尺寸不完全匹配
**原因：** macOS 的 `sips` 工具在某些情况下可能无法精确裁剪  
**解决：** 安装 `sharp` 库以获得更精确的处理
```bash
npm install --save-dev sharp
```

### 问题 2: 找不到图片文件
**解决：** 使用完整路径或先切换到图片所在目录

### 问题 3: 处理后的图片变形
**原因：** 原始图片宽高比与目标尺寸差异太大  
**解决：** 脚本会自动裁剪，确保最终尺寸正确。如果变形严重，可能需要手动调整原始图片

---

## 💡 提示

1. **备份原图：** 虽然脚本不会覆盖原图，但建议先备份
2. **批量处理：** 可以一次性处理多张图片
3. **检查结果：** 处理完成后检查输出文件的尺寸是否正确
4. **质量优化：** 如果需要更高质量，考虑使用专业的图片处理工具如 Photoshop、GIMP 或在线工具

---

## 📱 App Store 预览图要求

根据你的目标尺寸 1242 × 2688px，这是：
- iPhone 14 Pro Max / iPhone 13 Pro Max 屏幕尺寸
- 适合作为 App Store 的预览截图
- 竖屏方向（Portrait）

---

**准备好你的四张预览图片，然后运行脚本即可！** 🎉

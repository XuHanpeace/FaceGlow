#!/bin/bash
# Pushy 完整发布流程脚本
# 1. 版本号+1
# 2. Git 提交和打 Tag
# 3. Pod Install
# 4. 提示用户 Archive 并上传 IPA
# 5. 发布热更新

set -e

echo "🚀 开始完整发布流程..."

# 步骤 1: 版本号+1
echo ""
echo "📦 步骤 1: 更新版本号..."
node scripts/bump-version.js
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ 版本号已更新到: $NEW_VERSION"

# 步骤 2: Git 提交和打 Tag
echo ""
echo "🏷️  步骤 2: Git 提交和打 Tag..."
git add .
git commit -m "chore: bump version to $NEW_VERSION" || echo "⚠️  Git 提交失败（可能没有变更）"
git tag "v$NEW_VERSION" || echo "⚠️  Git Tag 已存在"
echo "✅ Git 操作完成"

# 步骤 3: Pod Install
echo ""
echo "🥥 步骤 3: Pod Install..."
cd ios
pod install
cd ..
echo "✅ Pod Install 完成"

# 步骤 4: 提示用户 Archive 并上传 IPA
echo ""
echo "📲 步骤 4: 请在 Xcode 中 Archive 并导出 IPA"
echo ""
echo "   ⚠️  重要提示："
echo "   - iOS 代码签名需要 Xcode 图形界面，无法完全自动化"
echo "   - 必须手动完成 Archive 和 Export 操作"
echo ""
echo "   📋 操作步骤："
echo "   1. 打开 Xcode:"
echo "      open ios/MyCrossPlatformApp.xcworkspace"
echo ""
echo "   2. 选择设备："
echo "      - 在顶部设备选择器中选择 'Generic iOS Device' 或你的真机"
echo "      - 不要选择模拟器"
echo ""
echo "   3. 开始 Archive："
echo "      - 菜单: Product -> Archive"
echo "      - 等待编译完成（可能需要几分钟）"
echo ""
echo "   4. 导出 IPA："
echo "      - 在 Organizer 窗口中，选择刚生成的 Archive"
echo "      - 点击 'Distribute App' 按钮"
echo "      - 选择 'Custom' -> Next"
echo "      - 选择 'App Store Connect' -> Next"
echo "      - 选择 'Export'（不要选 Upload）-> Next"
echo "      - 一路 Next，最后选择保存位置"
echo ""
echo "   5. 找到导出的 IPA 文件（通常在桌面或你选择的文件夹）"
echo ""
read -p "📝 请输入 IPA 文件的完整路径（或按 Enter 跳过上传）: " IPA_PATH

if [ -z "$IPA_PATH" ] || [ ! -f "$IPA_PATH" ]; then
  echo ""
  echo "⚠️  IPA 文件未提供或不存在，跳过上传"
  echo "💡 你可以稍后手动上传 IPA："
  echo "   npm run pushy:upload-ipa <ipa-path>"
  echo ""
  read -p "是否继续发布热更新? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "❌ 已取消"
    exit 1
  fi
else
  # 上传 IPA
  echo ""
  echo "📤 上传 IPA 到 Pushy..."
  npm run pushy:upload-ipa "$IPA_PATH"
  echo ""
  echo "✅ IPA 上传完成！"
  echo "💡 接下来会自动发布热更新并绑定到版本 $NEW_VERSION"
fi

# 步骤 5: 发布热更新
echo ""
echo "📦 步骤 5: 发布热更新..."
npm run pushy:hot-update -- --packageVersion "$NEW_VERSION"

echo ""
echo "🎉🎉🎉 完整发布流程完成！ 🎉🎉🎉"
echo "📊 版本信息:"
echo "   - 原生版本: $NEW_VERSION"
echo "   - JS 版本: $NEW_VERSION"


#!/bin/bash
# Pushy 上传 IPA 脚本
# 使用方法: npm run pushy:upload-ipa <ipa-path>

set -e

echo "💡 提示: 如果未登录，请先执行: npm run pushy:login"

IPA_PATH="$1"

if [ -z "$IPA_PATH" ]; then
  echo "❌ 错误: 请提供 IPA 文件路径"
  echo "使用方法: npm run pushy:upload-ipa <ipa-path>"
  exit 1
fi

if [ ! -f "$IPA_PATH" ]; then
  echo "❌ 错误: IPA 文件不存在: $IPA_PATH"
  exit 1
fi

echo "🚀 开始上传 IPA 到 Pushy..."
echo "📦 IPA 路径: $IPA_PATH"

# 使用 Pushy CLI 上传 IPA
npx react-native-update-cli uploadIpa --platform ios --ipaPath "$IPA_PATH"

echo "✅ IPA 上传完成！"


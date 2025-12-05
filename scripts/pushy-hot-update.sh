#!/bin/bash
# Pushy 发布热更新脚本
# 使用方法: npm run pushy:hot-update [--name <version>] [--description <desc>] [--packageVersion <version>]

set -e

echo "💡 提示: 如果未登录，请先执行: npm run pushy:login"

# 读取 package.json 获取版本号
PACKAGE_VERSION=$(node -p "require('./package.json').version")

# 读取 src/config/version.ts 获取 JS 版本（如果存在）
JS_VERSION=$(node -e "
  try {
    const fs = require('fs');
    const content = fs.readFileSync('src/config/version.ts', 'utf8');
    const match = content.match(/export const jsVersion = ['\"](.*)['\"]/);
    if (match) {
      console.log(match[1]);
    } else {
      console.log('$PACKAGE_VERSION');
    }
  } catch (e) {
    console.log('$PACKAGE_VERSION');
  }
")

# 默认使用 package.json 的版本号
JS_VERSION="${JS_VERSION:-$PACKAGE_VERSION}"
PACKAGE_VERSION="${PACKAGE_VERSION:-$JS_VERSION}"

# 解析命令行参数
NAME=""
DESCRIPTION=""
META_INFO="none"
PACKAGE_VERSION_ARG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --name)
      NAME="$2"
      shift 2
      ;;
    --description)
      DESCRIPTION="$2"
      shift 2
      ;;
    --metaInfo)
      META_INFO="$2"
      shift 2
      ;;
    --packageVersion)
      PACKAGE_VERSION_ARG="$2"
      shift 2
      ;;
    *)
      echo "❌ 未知参数: $1"
      exit 1
      ;;
  esac
done

# 设置默认值
NAME="${NAME:-$JS_VERSION}"
DESCRIPTION="${DESCRIPTION:-Hot update for JS version $JS_VERSION}"
PACKAGE_VERSION_ARG="${PACKAGE_VERSION_ARG:-$PACKAGE_VERSION}"

echo "🚀 开始发布热更新..."
echo "📦 热更版本: $NAME"
echo "📝 描述: $DESCRIPTION"
echo "🔗 绑定到原生版本: $PACKAGE_VERSION_ARG"

# 使用 Pushy CLI 打包、上传、发布、绑定（一次性完成）
# 使用 --rncli 参数强制使用原生 React Native CLI 而不是 expo CLI
pushy bundle \
  --platform ios \
  --rncli \
  --name "$NAME" \
  --description "$DESCRIPTION" \
  --metaInfo "$META_INFO" \
  --packageVersion "$PACKAGE_VERSION_ARG"

echo "✅ 热更新发布完成！"


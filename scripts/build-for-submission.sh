#!/bin/bash

# FaceGlow 提审版本构建脚本

echo "🚀 开始构建 iOS 提审版本..."

# 进入项目目录
cd "$(dirname "$0")/.."

# 清理之前的构建
echo "🧹 清理旧的构建文件..."
rm -rf ios/build
rm -rf ios/DerivedData
cd ios && xcodebuild clean

# 安装 Pod 依赖
echo "📦 安装 CocoaPods 依赖..."
pod install

# 回到项目根目录
cd ..

# 构建 Release 版本
echo "🔨 构建 Release 版本..."
npx react-native run-ios --configuration Release --device

echo "✅ 构建完成！"
echo ""
echo "📋 下一步："
echo "1. 在 Xcode 中选择 Product > Archive"
echo "2. 等待归档完成"
echo "3. 点击 Distribute App"
echo "4. 选择 App Store Connect"
echo "5. 上传到 App Store Connect"


#!/bin/bash

# Bundle ID配置检查脚本
# 用于验证iOS项目的Bundle ID和签名配置

echo "🔍 检查Bundle ID配置..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/Users/hanksxu/Desktop/project/FaceGlow"
IOS_DIR="$PROJECT_DIR/ios"
PBXPROJ="$IOS_DIR/MyCrossPlatformApp.xcodeproj/project.pbxproj"
INFO_PLIST="$IOS_DIR/MyCrossPlatformApp/Info.plist"

# 检查文件是否存在
if [ ! -f "$PBXPROJ" ]; then
    echo -e "${RED}❌ 找不到project.pbxproj文件${NC}"
    exit 1
fi

if [ ! -f "$INFO_PLIST" ]; then
    echo -e "${RED}❌ 找不到Info.plist文件${NC}"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 应用配置信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 读取Bundle ID
BUNDLE_ID=$(grep "PRODUCT_BUNDLE_IDENTIFIER" "$PBXPROJ" | head -n 1 | sed 's/.*= \(.*\);/\1/')
echo -e "📦 Bundle ID: ${GREEN}$BUNDLE_ID${NC}"

# 读取显示名称
DISPLAY_NAME=$(grep -A 1 "CFBundleDisplayName" "$INFO_PLIST" | tail -n 1 | sed 's/.*<string>\(.*\)<\/string>/\1/')
echo -e "🏷️  显示名称: ${GREEN}$DISPLAY_NAME${NC}"

# 读取版本号
VERSION=$(grep "MARKETING_VERSION" "$PBXPROJ" | head -n 1 | sed 's/.*= \(.*\);/\1/')
echo -e "🔢 版本号: ${GREEN}$VERSION${NC}"

# 读取Build号
BUILD=$(grep "CURRENT_PROJECT_VERSION" "$PBXPROJ" | head -n 1 | sed 's/.*= \(.*\);/\1/')
echo -e "🔨 Build号: ${GREEN}$BUILD${NC}"

# 读取Team ID
TEAM_ID=$(grep "DEVELOPMENT_TEAM" "$PBXPROJ" | head -n 1 | sed 's/.*= \(.*\);/\1/')
if [ -n "$TEAM_ID" ]; then
    echo -e "👥 Team ID: ${GREEN}$TEAM_ID${NC}"
else
    echo -e "👥 Team ID: ${YELLOW}未配置${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 权限配置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查相册权限
if grep -q "NSPhotoLibraryAddUsageDescription" "$INFO_PLIST"; then
    echo -e "${GREEN}✅${NC} NSPhotoLibraryAddUsageDescription (保存到相册)"
else
    echo -e "${RED}❌${NC} NSPhotoLibraryAddUsageDescription 未配置"
fi

if grep -q "NSPhotoLibraryUsageDescription" "$INFO_PLIST"; then
    echo -e "${GREEN}✅${NC} NSPhotoLibraryUsageDescription (访问相册)"
else
    echo -e "${YELLOW}⚠️${NC}  NSPhotoLibraryUsageDescription 未配置"
fi

# 检查相机权限
if grep -q "NSCameraUsageDescription" "$INFO_PLIST"; then
    echo -e "${GREEN}✅${NC} NSCameraUsageDescription (相机访问)"
else
    echo -e "${YELLOW}⚠️${NC}  NSCameraUsageDescription 未配置"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Bundle ID格式验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 验证Bundle ID格式
if [[ $BUNDLE_ID =~ ^[a-z0-9]+(\.[a-z0-9]+){2,}$ ]]; then
    echo -e "${GREEN}✅ Bundle ID格式正确${NC}"
else
    echo -e "${RED}❌ Bundle ID格式可能不正确${NC}"
    echo "   应该格式: com.company.appname"
fi

# 检查是否包含大写字母
if [[ $BUNDLE_ID =~ [A-Z] ]]; then
    echo -e "${YELLOW}⚠️  Bundle ID包含大写字母（建议使用小写）${NC}"
fi

# 检查是否包含特殊字符
if [[ $BUNDLE_ID =~ [^a-zA-Z0-9.] ]]; then
    echo -e "${RED}❌ Bundle ID包含特殊字符${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 配置建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否需要修改
if [ "$BUNDLE_ID" == "com.digitech.faceglow" ]; then
    echo -e "${GREEN}✅ 当前Bundle ID配置良好${NC}"
    echo ""
    echo "建议操作："
    echo "  1. 在App Store Connect中注册此Bundle ID"
    echo "  2. 在Xcode中配置签名"
    echo "  3. 准备应用素材和截图"
else
    echo -e "${YELLOW}ℹ️  当前Bundle ID: $BUNDLE_ID${NC}"
    echo ""
    echo "如需修改Bundle ID："
    echo "  1. 使用Xcode打开项目"
    echo "  2. 在Signing & Capabilities中修改"
    echo "  3. 重新运行此脚本验证"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 下一步操作"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. 打开Xcode配置签名："
echo "   ${YELLOW}cd $IOS_DIR && open MyCrossPlatformApp.xcworkspace${NC}"
echo ""

echo "2. 在App Store Connect中注册："
echo "   ${YELLOW}https://appstoreconnect.apple.com${NC}"
echo ""

echo "3. 查看详细指南："
echo "   ${YELLOW}docs/bundle-id-setup.md${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查完成！✨"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


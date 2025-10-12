#!/bin/bash

# App Icon 创建脚本
# 使用macOS自带的sips工具创建App Icon

echo "🎨 开始创建App Icon..."

# 创建临时目录
TEMP_DIR="/tmp/faceglow_icon"
mkdir -p "$TEMP_DIR"

# 图标目录
ICON_DIR="/Users/hanksxu/Desktop/project/FaceGlow/ios/MyCrossPlatformApp/Images.xcassets/AppIcon.appiconset"

echo "📁 创建临时设计文件..."

# 创建基础的SVG设计文件
cat > "$TEMP_DIR/icon.svg" << 'EOF'
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#A855F7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="face" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0.7" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="512" cy="512" r="512" fill="url(#bg)"/>
  
  <!-- 人脸轮廓 -->
  <g transform="translate(512, 512)">
    <!-- 脸部 -->
    <ellipse cx="0" cy="-20" rx="120" ry="140" fill="url(#face)"/>
    
    <!-- 眼睛 -->
    <circle cx="-40" cy="-60" r="15" fill="#333333"/>
    <circle cx="40" cy="-60" r="15" fill="#333333"/>
    
    <!-- 鼻子 -->
    <ellipse cx="0" cy="-20" rx="8" ry="15" fill="#333333"/>
    
    <!-- 嘴巴 -->
    <path d="M -30 20 Q 0 40 30 20" stroke="#333333" stroke-width="6" fill="none"/>
    
    <!-- AI装饰元素 -->
    <g transform="translate(0, 80)">
      <!-- 魔法棒 -->
      <rect x="-2" y="-40" width="4" height="80" fill="#FFFFFF" opacity="0.8"/>
      <circle cx="0" cy="-50" r="8" fill="#FFD700"/>
      
      <!-- 星星装饰 -->
      <g opacity="0.6">
        <polygon points="0,-20 -6,-8 -18,-8 -9,2 -15,14 0,8 15,14 9,2 18,-8 6,-8" fill="#FFFFFF"/>
        <polygon points="-60,-10 -64,-6 -68,-10 -66,-2 -70,2 -62,0 -58,4 -60,-2 -56,-6" fill="#FFFFFF"/>
        <polygon points="60,-10 64,-6 68,-10 66,-2 70,2 62,0 58,4 60,-2 56,-6" fill="#FFFFFF"/>
      </g>
    </g>
  </g>
  
  <!-- 品牌文字 (小) -->
  <text x="512" y="950" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF" opacity="0.8">美颜换换</text>
</svg>
EOF

echo "🖼️ 转换SVG为PNG..."

# 检查是否有rsvg-convert工具
if command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 1024 -h 1024 "$TEMP_DIR/icon.svg" -o "$TEMP_DIR/icon_1024.png"
else
    echo "⚠️ 需要安装librsvg工具来转换SVG"
    echo "请运行: brew install librsvg"
    echo "或者手动创建PNG图标文件"
    
    # 创建简单的渐变背景作为临时图标
    echo "📝 创建临时渐变图标..."
    sips -s format png -s formatOptions 100 -z 1024 1024 --setProperty format png --setProperty formatOptions 100 /System/Library/Desktop\ Pictures/Solid\ Colors/Solid\ Gray\ Pro\ Ultra\ Dark.png --out "$TEMP_DIR/icon_1024.png" 2>/dev/null || {
        # 如果上面的命令失败，创建一个纯色图标
        echo "🎨 创建纯色图标..."
        convert -size 1024x1024 gradient:#FF6B9D-#A855F7 "$TEMP_DIR/icon_1024.png" 2>/dev/null || {
            echo "❌ 无法创建图标，请手动设计"
            exit 1
        }
    }
fi

echo "📏 生成所有尺寸..."

# 生成所有需要的尺寸
sizes=("1024:1024" "180:180" "167:167" "152:152" "120:120" "87:87" "80:80" "76:76" "60:60" "58:58" "40:40" "29:29" "20:20")

for size in "${sizes[@]}"; do
    size_parts=(${size//:/ })
    width=${size_parts[0]}
    height=${size_parts[1]}
    
    echo "生成 ${width}x${height}..."
    sips -z $height $width "$TEMP_DIR/icon_1024.png" --out "$TEMP_DIR/icon_${width}x${height}.png"
done

echo "📁 复制到项目目录..."

# 复制到项目目录
cp "$TEMP_DIR/icon_1024.png" "$ICON_DIR/4b5c194393332.png"
cp "$TEMP_DIR/icon_180.png" "$ICON_DIR/4b5c194393332 (1).png"
cp "$TEMP_DIR/icon_120.png" "$ICON_DIR/4b5c194393332 (2).png"
cp "$TEMP_DIR/icon_87.png" "$ICON_DIR/4b5c194393332 (3).png"

echo "✅ App Icon 创建完成！"
echo "📱 图标已更新到: $ICON_DIR"
echo "🔄 请在Xcode中刷新Images.xcassets查看效果"

# 清理临时文件
rm -rf "$TEMP_DIR"

echo "🎉 完成！现在可以构建应用了。"

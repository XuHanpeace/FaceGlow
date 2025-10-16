#!/bin/bash

# 合成最终图标：背景 + 斜体文字
# 使用 ImageMagick 或 sips 进行图像合成

BACKGROUND="/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-background.png"
TEXT="/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-text-resized.png"
OUTPUT="/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-final.png"

# 检查是否安装了 ImageMagick
if command -v convert &> /dev/null; then
    echo "使用 ImageMagick 合成图像..."
    convert "$BACKGROUND" "$TEXT" -composite "$OUTPUT"
    echo "合成完成: $OUTPUT"
else
    echo "ImageMagick 未安装，尝试使用 sips..."
    # 使用 sips 进行简单的覆盖合成
    # 注意：sips 的合成功能有限，这里先复制背景作为基础
    cp "$BACKGROUND" "$OUTPUT"
    echo "已复制背景作为基础，建议手动合成或安装 ImageMagick"
fi

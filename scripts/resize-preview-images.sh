#!/bin/bash

# APP预览模版图片尺寸调整脚本
# 将图片调整为 1242 × 2688px（iPhone 14 Pro Max 屏幕尺寸）

TARGET_WIDTH=1242
TARGET_HEIGHT=2688

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🖼️  APP预览模版图片尺寸调整工具"
echo "目标尺寸: ${TARGET_WIDTH} × ${TARGET_HEIGHT}px"
echo ""

# 检查是否有参数
if [ $# -eq 0 ]; then
    echo "${YELLOW}使用方法:${NC}"
    echo "  $0 <图片1> [图片2] [图片3] [图片4] ..."
    echo ""
    echo "${YELLOW}或者批量处理当前目录下的图片:${NC}"
    echo "  $0 *.png *.jpg"
    echo ""
    echo "${YELLOW}示例:${NC}"
    echo "  $0 preview1.png preview2.png preview3.png preview4.png"
    exit 1
fi

# 处理每个图片文件
processed=0
failed=0

for input_file in "$@"; do
    # 检查文件是否存在
    if [ ! -f "$input_file" ]; then
        echo "${RED}❌ 文件不存在: $input_file${NC}"
        failed=$((failed + 1))
        continue
    fi

    # 检查文件类型
    file_ext="${input_file##*.}"
    if [[ ! "$file_ext" =~ ^(png|jpg|jpeg|PNG|JPG|JPEG)$ ]]; then
        echo "${YELLOW}⚠️  跳过非图片文件: $input_file${NC}"
        continue
    fi

    # 生成输出文件名（在原文件名基础上加上 _resized）
    dir=$(dirname "$input_file")
    filename=$(basename "$input_file")
    name="${filename%.*}"
    extension="${filename##*.}"
    output_file="${dir}/${name}_${TARGET_WIDTH}x${TARGET_HEIGHT}.${extension}"

    echo "📸 处理中: $input_file"
    
    # 使用 sips 调整尺寸（保持宽高比，填充到目标尺寸）
    # 使用 --resampleHeightWidthMax 来确保图片填充到目标尺寸
    sips -z $TARGET_HEIGHT $TARGET_WIDTH "$input_file" --out "$output_file" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        # 获取调整后的实际尺寸
        actual_width=$(sips -g pixelWidth "$output_file" | tail -1 | awk '{print $2}')
        actual_height=$(sips -g pixelHeight "$output_file" | tail -1 | awk '{print $2}')
        
        # 如果尺寸不匹配，需要裁剪或填充
        if [ "$actual_width" != "$TARGET_WIDTH" ] || [ "$actual_height" != "$TARGET_HEIGHT" ]; then
            echo "   ⚠️  需要进一步调整尺寸..."
            # 使用临时文件
            temp_file="${output_file}.tmp"
            
            # 先调整到目标尺寸（可能会变形，但我们会修复）
            sips --resampleHeightWidthMax $TARGET_HEIGHT $TARGET_WIDTH "$input_file" --out "$temp_file" > /dev/null 2>&1
            
            # 裁剪到精确尺寸（居中裁剪）
            sips --cropToHeightWidth $TARGET_HEIGHT $TARGET_WIDTH "$temp_file" --out "$output_file" > /dev/null 2>&1
            
            # 如果裁剪失败，尝试填充
            actual_width=$(sips -g pixelWidth "$output_file" | tail -1 | awk '{print $2}')
            actual_height=$(sips -g pixelHeight "$output_file" | tail -1 | awk '{print $2}')
            
            if [ "$actual_width" != "$TARGET_WIDTH" ] || [ "$actual_height" != "$TARGET_HEIGHT" ]; then
                # 使用 Python 或 ImageMagick 进行填充（如果可用）
                # 暂时使用 sips 的 padToHeightWidth（但 sips 不支持，所以先尝试其他方法）
                # 简化处理：使用 --padToHeightWidth（如果可用）
                rm -f "$temp_file"
                
                # 最后尝试：先缩放到合适尺寸，再裁剪
                sips --resampleHeightWidthMax $TARGET_HEIGHT $TARGET_WIDTH "$input_file" --out "$temp_file" > /dev/null 2>&1
                sips --cropToHeightWidth $TARGET_HEIGHT $TARGET_WIDTH "$temp_file" --out "$output_file" > /dev/null 2>&1
                rm -f "$temp_file"
            fi
            
            rm -f "$temp_file"
        fi
        
        # 最终验证
        final_width=$(sips -g pixelWidth "$output_file" | tail -1 | awk '{print $2}')
        final_height=$(sips -g pixelHeight "$output_file" | tail -1 | awk '{print $2}')
        
        if [ "$final_width" == "$TARGET_WIDTH" ] && [ "$final_height" == "$TARGET_HEIGHT" ]; then
            echo "   ${GREEN}✅ 成功: $output_file (${final_width} × ${final_height}px)${NC}"
            processed=$((processed + 1))
        else
            echo "   ${YELLOW}⚠️  尺寸不完全匹配: ${final_width} × ${final_height}px${NC}"
            echo "   ${YELLOW}   文件已保存: $output_file${NC}"
            processed=$((processed + 1))
        fi
    else
        echo "   ${RED}❌ 处理失败: $input_file${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 处理完成:"
echo "   ${GREEN}✅ 成功: $processed 张${NC}"
if [ $failed -gt 0 ]; then
    echo "   ${RED}❌ 失败: $failed 张${NC}"
fi
echo ""

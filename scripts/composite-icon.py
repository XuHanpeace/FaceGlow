#!/usr/bin/env python3

from PIL import Image, ImageEnhance
import os

# 文件路径
background_path = "/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-background.png"
text_path = "/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-text-resized.png"
output_path = "/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-final.png"

try:
    # 打开背景图像
    background = Image.open(background_path).convert("RGBA")
    
    # 打开文字图像
    text_img = Image.open(text_path).convert("RGBA")
    
    # 调整文字图像大小以匹配背景
    if text_img.size != background.size:
        text_img = text_img.resize(background.size, Image.Resampling.LANCZOS)
    
    # 创建白色背景上的文字蒙版（只保留文字部分）
    # 将黑色背景的文字图像转换为透明背景
    text_data = text_img.getdata()
    new_data = []
    for item in text_data:
        # 如果像素是黑色（背景），设为透明
        if item[0] < 50 and item[1] < 50 and item[2] < 50:
            new_data.append((0, 0, 0, 0))  # 透明
        else:
            new_data.append(item)  # 保留白色文字
    
    text_img.putdata(new_data)
    
    # 合成图像
    final_img = Image.alpha_composite(background, text_img)
    
    # 保存最终图像
    final_img.save(output_path, "PNG")
    print(f"图标合成完成: {output_path}")
    
except ImportError:
    print("PIL (Pillow) 未安装，请运行: pip3 install Pillow")
except Exception as e:
    print(f"合成失败: {e}")
    # 备用方案：直接复制背景
    import shutil
    shutil.copy(background_path, output_path)
    print(f"已复制背景作为基础: {output_path}")

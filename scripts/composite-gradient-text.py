#!/usr/bin/env python3

from PIL import Image, ImageEnhance
import os

# 文件路径
background_path = "/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-gradient-only.png"
text_path = "/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-italic.png"
output_path = "/Users/hanksxu/Desktop/project/FaceGlow/docs/brand/icon-gradient-final.png"

try:
    # 打开纯渐变背景图像
    background = Image.open(background_path).convert("RGBA")
    print(f"背景图像尺寸: {background.size}")
    
    # 打开斜体文字图像
    text_img = Image.open(text_path).convert("RGBA")
    print(f"文字图像尺寸: {text_img.size}")
    
    # 调整文字图像大小以匹配背景 (1024x1024)
    if text_img.size != background.size:
        text_img = text_img.resize(background.size, Image.Resampling.LANCZOS)
        print(f"文字图像已调整到: {text_img.size}")
    
    # 创建透明背景的文字蒙版
    text_data = text_img.getdata()
    new_data = []
    for item in text_data:
        # 如果像素是黑色或接近黑色（背景），设为透明
        if item[0] < 50 and item[1] < 50 and item[2] < 50:
            new_data.append((0, 0, 0, 0))  # 透明
        else:
            # 保留白色文字，确保完全不透明
            new_data.append((255, 255, 255, 255))
    
    text_img.putdata(new_data)
    
    # 合成图像：将文字叠加到渐变背景上
    final_img = Image.alpha_composite(background, text_img)
    
    # 保存最终图像
    final_img.save(output_path, "PNG")
    print(f"渐变图标合成完成: {output_path}")
    
except ImportError:
    print("PIL (Pillow) 未安装，请运行: pip3 install Pillow")
except Exception as e:
    print(f"合成失败: {e}")
    # 备用方案：直接复制背景
    import shutil
    shutil.copy(background_path, output_path)
    print(f"已复制背景作为基础: {output_path}")

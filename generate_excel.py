import os
import json
from openpyxl import Workbook

# Configuration
base_dir = "/Users/hanksxu/Downloads/活动素材"
output_file = os.path.join(base_dir, "activity_data_generated.xlsx")

# Pinyin Map
style_map = {
    "复古拍立得": "fugupailide",
    "慢快门": "mankuaimen",
    "氛围感": "fenweigan",
    "纯欲风": "chunyufeng"
}

# Helper to parse folder name
def parse_folder_name(folder_name):
    parts = folder_name.split("-")
    if len(parts) >= 2:
        style = parts[0]
        activity_id = parts[1]
        return style, activity_id
    return None, None

# Initialize Workbook
wb = Workbook()
ws = wb.active
ws.title = "Activity Data"

# Write Header
headers = ["活动状态", "活动类型", "活动id", "专辑列表", "活动标题", "活动描述", "activity_data"]
ws.append(headers)

# Process Directories
for folder_name in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder_name)
    if not os.path.isdir(folder_path) or folder_name.startswith("."):
        continue
    
    style, activity_id = parse_folder_name(folder_name)
    if not style or not activity_id:
        print(f"Skipping folder {folder_name}: Invalid format")
        continue
        
    style_pinyin = style_map.get(style)
    if not style_pinyin:
        print(f"Skipping folder {folder_name}: Unknown style pinyin")
        continue
        
    # Collect Albums (One per image)
    albums = []
    files = sorted([f for f in os.listdir(folder_path) if f.endswith(".png") or f.endswith(".jpg") or f.endswith(".jpeg")])
    
    for file_name in files:
        template_id = os.path.splitext(file_name)[0]
        # URL Construction
        # https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/{style_pinyin}/{templateId}.png
        # Note: Assuming .png extension for URL as per example. Using original extension if different? 
        # Example used .png. User said "file naming is templateId". Files have extensions.
        # I'll use the extension from the file.
        ext = os.path.splitext(file_name)[1]
        image_url = f"https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/{style_pinyin}/{template_id}{ext}"
        
        # Create Template Object
        template = {
            "template_id": template_id,
            "template_url": image_url,
            "template_name": style, # Using style name as template name
            "template_description": style
        }
        
        # Create Album Object
        album = {
            "album_id": template_id, # Using templateId as albumId
            "album_name": style,
            "album_description": style,
            "album_image": image_url,
            "level": "0", # Default to Free
            "price": 0,
            "template_list": [template]
        }
        
        albums.append(album)
    
    if not albums:
        print(f"No images found in {folder_name}")
        continue
        
    # Construct Row
    # A: 活动状态 -> "1"
    # B: 活动类型 -> "album"
    # C: 活动id
    # D: 专辑列表 -> JSON
    # E: 活动标题
    # F: 活动描述
    # G: activity_data -> 1
    
    row = [
        "1", # Activity Status
        "album", # Activity Type
        activity_id,
        json.dumps(albums, ensure_ascii=False), # Album List JSON
        style, # Title
        style, # Description
        1 # activity_data
    ]
    
    ws.append(row)

# Save
wb.save(output_file)
print(f"Successfully generated {output_file}")


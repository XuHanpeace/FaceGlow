import { AlbumRecord, AlbumLevel } from '../types/model/album';
import { CategoryConfigRecord } from '../types/model/config';

export const mockAlbumList: AlbumRecord[] = [
  // 复古拍立得 -> 拆分为多个 Album
  {
    album_id: "mt_1994252946407661568",
    album_name: "牛仔白T",
    album_description: "经典胶片质感，捕捉随性自然的街头风采",
    album_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/fugu/mt_1994252946407661568.png",
    theme_styles: ["polaroid", "retro"],
    function_type: "portrait",
    activity_tags: ["new"],
    task_execution_type: "sync",
    level: AlbumLevel.FREE,
    price: 9,
    original_price: 19,
    activity_tag_type: 'discount',
    activity_tag_text: '限时5折',
    template_list: [
      {
        template_url: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/fugu/mt_1994252946407661568.png",
        template_name: "复古拍立得",
        template_id: "mt_1994252946407661568",
        template_description: "经典胶片质感，捕捉随性自然的街头风采",
        price: 0
      }
    ],
    likes: 120,
    sort_weight: 100,
    created_at: 1764315069889,
    updated_at: 1764334372947
  },
  {
    album_id: "mt_1994264167695904768",
    album_name: "萌宠时刻",
    album_description: "与爱宠的亲密合影，定格治愈系的温暖瞬间",
    album_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/fugu/mt_1994264167695904768.png",
    theme_styles: ["polaroid", "playful"],
    function_type: "group_photo",
    activity_tags: [],
    task_execution_type: "sync",
    level: AlbumLevel.FREE,
    price: 0,
    activity_tag_type: 'new',
    activity_tag_text: '新品',
    template_list: [
       {
        template_url: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/fugu/mt_1994264167695904768.png",
        template_name: "萌宠时刻",
        template_id: "mt_1994264167695904768",
        template_description: "与爱宠的亲密合影，定格治愈系的温暖瞬间",
        price: 0
       }
    ],
    likes: 85,
    sort_weight: 90,
    created_at: 1764315069889,
    updated_at: 1764334372947
  },
  
  // 慢快门 -> Atmosphere
  {
    album_id: "mt_1994254173231509504",
    album_name: "故宫红墙",
    album_description: "流光溢彩中的故宫红墙，定格一眼万年的惊鸿",
    album_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/mankuaimen/mt_1994254173231509504.png",
    theme_styles: ["atmosphere", "retro"],
    function_type: "portrait",
    activity_tags: [],
    task_execution_type: "sync",
    level: AlbumLevel.VIP,
    price: 0,
    activity_tag_type: 'member',
    activity_tag_text: '会员专享',
    template_list: [
         {
            template_url: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/mankuaimen/mt_1994254173231509504.png",
            template_name: "旗袍折扇",
            template_id: "mt_1994254173231509504",
            template_description: "流光溢彩中的故宫红墙，定格一眼万年的惊鸿",
            price: 0
        }
    ],
    likes: 200,
    sort_weight: 95,
    created_at: 1764315069889,
    updated_at: 1764336458074
  },
  
  // 纯欲风
  {
    album_id: "mt_1994283138584911872",
    album_name: "白色居家",
    album_description: "洁白纯净的居家风格，展现慵懒迷人的独特魅力",
    album_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/chunyufeng/mt_1994283138584911872.png",
    theme_styles: ["pure_desire", "winter"],
    function_type: "portrait",
    activity_tags: ["discount"],
    task_execution_type: "sync",
    level: AlbumLevel.FREE,
    price: 0,
    activity_tag_type: 'free',
    activity_tag_text: '限时免费',
    template_list: [
         {
            template_url: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/chunyufeng/mt_1994283138584911872.png",
            template_name: "纯欲私房",
            template_id: "mt_1994283138584911872",
            template_description: "洁白纯净的居家风格，展现慵懒迷人的独特魅力",
            price: 0
        }
    ],
    likes: 300,
    sort_weight: 80,
    created_at: 1764315069889,
    updated_at: 1764336468547
  },

  // 氛围感 -> 黑色衬衫男
  {
    album_id: "mt_1994291156385394688",
    album_name: "黑色衬衫男",
    album_description: "冷峻的高级质感，打造电影男主般的忧郁氛围",
    album_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/fenweigan/mt_1994291156385394688.png",
    theme_styles: ["atmosphere", "cool"],
    function_type: "portrait",
    activity_tags: [],
    task_execution_type: "sync",
    level: AlbumLevel.FREE,
    price: 0,
    activity_tag_type: 'premium',
    activity_tag_text: '热门',
    template_list: [
        {
            template_url: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/fenweigan/mt_1994291156385394688.png",
            template_name: "暗夜冷感",
            template_id: "mt_1994291156385394688",
            template_description: "冷峻的高级质感，打造电影男主般的忧郁氛围",
            price: 0
        }
    ],
    likes: 59,
    sort_weight: 70,
    created_at: 1764315069889,
    updated_at: 1764600470863
  },

  // 图生图 Task
  {
    album_id: "b4498fc8692bd8c705ad1ece3e7e30ed",
    album_name: "3D手办",
    album_description: "体验最火爆的Nano Banana AI",
    album_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/3dshouban/bananResult.png",
    theme_styles: ["3d", "anime"],
    function_type: "image_to_image",
    activity_tags: ["free"],
    task_execution_type: "async",
    level: AlbumLevel.FREE,
    price: 0,
    src_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/3dshouban/bananaSrc.png",
    result_image: "https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/uploads/3dshouban/bananResult.png",
    prompt_text: "Transform this anime character into a collectible figure...",
    likes: 1500,
    sort_weight: 110,
    created_at: 1764481223004,
    updated_at: 1764517343279
  }
];

export const mockCategoryConfig: CategoryConfigRecord[] = [
  // Function Types
  {
    category_id: "ft_selfie",
    category_type: "function_type",
    category_code: "selfie",
    category_label: "自拍",
    category_label_zh: "自拍",
    icon: "camera",
    sort_order: 0,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889,
    extra_config: {
      is_featured: true,
      supported_theme_styles: ["polaroid", "atmosphere", "pure_desire", "retro", "cool", "winter"]
    }
  },
  {
    category_id: "ft_portrait",
    category_type: "function_type",
    category_code: "portrait",
    category_label: "个人写真",
    category_label_zh: "个人写真",
    icon: "user",
    sort_order: 1,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889,
    extra_config: {
      is_featured: true,
      supported_theme_styles: ["polaroid", "atmosphere", "pure_desire", "retro", "cool", "winter"]
    }
  },
  {
    category_id: "ft_group",
    category_type: "function_type",
    category_code: "group_photo",
    category_label: "多人合拍",
    category_label_zh: "多人合拍",
    icon: "users",
    sort_order: 2,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889,
    extra_config: {
      is_featured: true,
      supported_theme_styles: ["polaroid", "playful"]
    }
  },
  {
    category_id: "ft_img2img",
    category_type: "function_type",
    category_code: "image_to_image",
    category_label: "图生图",
    category_label_zh: "图生图",
    icon: "image",
    sort_order: 3,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889,
    extra_config: {
      is_featured: false, // Not shown in top tabs by default unless selected
      supported_theme_styles: ["3d", "anime"]
    }
  },

  // Theme Styles
  {
    category_id: "ts_polaroid",
    category_type: "theme_style",
    category_code: "polaroid",
    category_label: "拍立得",
    category_label_zh: "拍立得",
    sort_order: 1,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889
  },
  {
    category_id: "ts_atmosphere",
    category_type: "theme_style",
    category_code: "atmosphere",
    category_label: "氛围感",
    category_label_zh: "氛围感",
    sort_order: 2,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889
  },
  {
    category_id: "ts_pure_desire",
    category_type: "theme_style",
    category_code: "pure_desire",
    category_label: "纯欲风",
    category_label_zh: "纯欲",
    sort_order: 3,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889
  },
  {
    category_id: "ts_winter",
    category_type: "theme_style",
    category_code: "winter",
    category_label: "冬季",
    category_label_zh: "冬季",
    sort_order: 4,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889
  },

  // Activity Tags
  {
    category_id: "at_new",
    category_type: "activity_tag",
    category_code: "new",
    category_label: "上新",
    category_label_zh: "上新",
    icon: "bolt",
    sort_order: 1,
    is_active: true,
    created_at: 1764315069889,
    updated_at: 1764315069889
  }
];

/**
 * 主题风格枚举
 */
export enum ThemeStyle {
  WINTER = 'winter',
  CHRISTMAS = 'christmas',
  COUPLES = 'couples',
  PLAYFUL = 'playful',
  POLAROID = 'polaroid',
  ID_PHOTO = 'id_photo',
  PURE_DESIRE = 'pure_desire',
  ATMOSPHERE = 'atmosphere',
  // ... others
}

/**
 * 功能类型枚举
 */
export enum FunctionType {
  PORTRAIT = 'portrait',       // 个人写真
  GROUP_PHOTO = 'group_photo', // 多人合拍
  IMAGE_TO_IMAGE = 'image_to_image', // 图生图
  IMAGE_TO_VIDEO = 'image_to_video', // 图生视频
}

/**
 * 活动标签枚举
 */
export enum ActivityTag {
  NEW = 'new',
  DISCOUNT = 'discount',
  FREE = 'free',
}

/**
 * 任务执行类型
 */
export enum TaskExecutionType {
  SYNC = 'sync',
  ASYNC = 'async',
}

/**
 * 相册等级
 */
export enum AlbumLevel {
  FREE = '0',
  PREMIUM = '1',
  VIP = '2',
}

/**
 * 模板记录
 */
export interface TemplateRecord {
  template_id: string;
  template_url: string;
  template_name: string;
  template_description: string;
  price: number;
}

/**
 * Album 数据库记录
 */
export interface AlbumRecord {
  album_id: string;
  album_name: string;
  album_description: string;
  album_image: string;
  
  // 筛选维度字段
  theme_styles: string[];            // 存储 ThemeStyle 的字符串值
  function_type: string;             // 存储 FunctionType 的字符串值
  activity_tags: string[];           // 存储 ActivityTag 的字符串值
  
  // 其他字段
  task_execution_type: string;       // 'sync' | 'async'
  level: string;                     // '0' | '1' | '2'
  price: number;
  original_price?: number;
  activity_tag_type?: 'discount' | 'free' | 'premium' | 'member' | 'new';
  activity_tag_text?: string; // Custom text for the tag
  template_list?: TemplateRecord[];
  src_image?: string;
  result_image?: string;
  prompt_text?: string;
  style_description?: string;
  likes: number;
  sort_weight: number;
  created_at: number; // Timestamp
  updated_at: number; // Timestamp
}

/**
 * Album 列表响应
 */
export interface AlbumListResponse {
  code: number;
  message: string;
  data: {
    albums: AlbumRecord[];
    total: number;
    has_more: boolean;
  };
}



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
  /** 模板唯一标识符 */
  template_id: string;
  /** 模板图片URL地址 */
  template_url: string;
  /** 模板名称 */
  template_name: string;
  /** 模板描述文案 */
  template_description: string;
  /** 模板价格（美美币），0表示免费 */
  price: number;
}

/**
 * Album 数据库记录
 * 注意：created_at 和 updated_at 字段由 TCB 数据库系统自动生成，不需要在接口中定义
 */
export interface AlbumRecord {
  /** 相册唯一标识符，用于数据库主键和业务逻辑关联 */
  album_id: string;
  /** 相册名称，用于展示给用户 */
  album_name: string;
  /** 相册描述文案，用于展示相册的特色和用途 */
  album_description: string;
  /** 相册封面图片URL地址，用于列表展示 */
  album_image: string;
  
  /** 
   * 主题风格数组，存储 ThemeStyle 枚举的字符串值
   * 一个相册可以包含多个主题风格，如 ["polaroid", "retro"]
   * 用于筛选和分类功能
   */
  theme_styles: string[];
  
  /** 
   * 功能类型，存储 FunctionType 枚举的字符串值
   * 可选值：'portrait'（个人写真）、'group_photo'（多人合拍）、'image_to_image'（图生图）、'image_to_video'（图生视频）
   * 用于区分不同的功能模块
   */
  function_type: string;
  
  /** 
   * 活动标签数组，存储 ActivityTag 枚举的字符串值
   * 可选值：'new'（新品）、'discount'（折扣）、'free'（免费）
   * 用于标记相册的活动状态，支持多个标签
   */
  activity_tags: string[];
  
  /** 
   * 任务执行类型
   * 'sync'：同步执行，立即返回结果
   * 'async'：异步执行，需要轮询获取结果
   */
  task_execution_type: string;
  
  /** 
   * 相册等级，用于权限控制
   * '0'：免费（FREE），所有用户可用
   * '1'：高级（PREMIUM），需要高级会员
   * '2'：VIP，需要VIP会员
   */
  level: string;
  
  /** 相册价格（美美币），0表示免费 */
  price: number;
  
  /** 原价（美美币），可选字段，用于显示折扣前的价格 */
  original_price?: number;
  
  /** 
   * 活动标签类型，用于显示特殊的活动标识
   * 可选值：'discount'（限时折扣）、'free'（限时免费）、'premium'（热门推荐）、'member'（会员专享）、'new'（新品）
   */
  activity_tag_type?: 'discount' | 'free' | 'premium' | 'member' | 'new';
  
  /** 活动标签自定义文案，如 "限时5折"、"会员专享" 等 */
  activity_tag_text?: string;
  
  /** 
   * 模板列表，包含该相册下的所有模板
   * 用于模板类相册（如个人写真、多人合拍），每个模板代表一个具体的风格样式
   */
  template_list?: TemplateRecord[];
  
  /** 
   * 源图片URL，用于图生图（image_to_image）类型的相册
   * 可选字段，仅在 function_type 为 'image_to_image' 时使用
   */
  src_image?: string;
  
  /** 
   * 结果图片URL，用于图生图类型的相册展示效果
   * 可选字段，仅在 function_type 为 'image_to_image' 时使用
   */
  result_image?: string;
  
  /** 
   * 提示词文本，用于图生图类型的相册
   * 可选字段，描述图片生成的要求和风格
   */
  prompt_text?: string;
  
  /** 
   * 风格描述文本，用于描述相册的整体风格特色
   * 可选字段，用于展示和搜索
   */
  style_description?: string;
  
  /** 点赞数，用于排序和展示热度 */
  likes: number;
  
  /** 
   * 排序权重，数值越大越靠前
   * 用于控制相册在列表中的显示顺序，结合 likes 和 created_at 进行综合排序
   */
  sort_weight: number;
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



/**
 * 维度类型
 */
export enum CategoryType {
  FUNCTION_TYPE = 'function_type',
  THEME_STYLE = 'theme_style',
  ACTIVITY_TAG = 'activity_tag',
}

/**
 * 维度配置记录
 */
export interface CategoryConfigRecord {
  category_id: string;
  category_type: string;              // 'function_type' | 'theme_style' | 'activity_tag'
  category_code: string;              // 维度代码
  
  // 展示信息
  category_label: string;
  category_label_zh?: string;
  icon?: string;
  
  // 额外配置 (JSON)
  extra_config?: {
    description?: string;
    description_zh?: string;
    guide_text?: string;
    guide_text_zh?: string;
    supported_theme_styles?: string[];
    is_featured?: boolean;
  };
  
  sort_order: number;
  is_active: boolean;
  
  created_at: number;
  updated_at: number;
}

/**
 * 维度配置响应
 */
export interface CategoryConfigResponse {
  code: number;
  message: string;
  data: CategoryConfigRecord[];
}



/**
 * 交易记录数据模型
 */

/** 交易类型 */
export type TransactionType = 
  | 'coin_purchase'    // 金币购买
  | 'coin_consumption' // 金币消费（换脸）
  | 'subscription'     // 订阅
  | 'refund'          // 退款
  | 'bonus';          // 奖励

/** 交易状态 */
export type TransactionStatus = 
  | 'pending'    // 待处理
  | 'completed'  // 已完成
  | 'failed'     // 失败
  | 'cancelled'  // 已取消
  | 'refunded';  // 已退款

/** 支付方式 */
export type PaymentMethod = 
  | 'apple_pay'      // 苹果支付
  | 'system_bonus'   // 系统奖励
  | 'admin_gift'     // 管理员赠送
  | 'internal';      // 内部调整

/**
 * 交易记录接口
 */
export interface Transaction {
  /** 交易ID（主键） */
  _id: string;
  
  /** 用户ID */
  user_id: string;
  
  /** 交易类型 */
  transaction_type: TransactionType;
  
  /** 交易状态 */
  status: TransactionStatus;
  
  /** 金币变动数量（正数为收入，负数为支出） */
  coin_amount: number;
  
  /** 交易前余额 */
  balance_before: number;
  
  /** 交易后余额 */
  balance_after: number;
  
  /** 支付方式 */
  payment_method: PaymentMethod;
  
  /** 苹果交易ID（如果是苹果支付） */
  apple_transaction_id?: string;
  
  /** 苹果产品ID */
  apple_product_id?: string;
  
  /** 交易描述 */
  description: string;
  
  /** 关联的业务ID（如换脸记录ID、订阅记录ID等） */
  related_id?: string;
  
  /** 交易元数据（额外信息） */
  metadata?: {
    /** 换脸相关 */
    fusion?: {
      template_id: string;
      activity_id: string;
      result_url?: string;
    };
    /** 订阅相关 */
    subscription?: {
      plan_type: 'monthly' | 'yearly';
      expiration_date: number;
    };
    /** 金币包相关 */
    coin_package?: {
      package_id: string;
      package_name: string;
      bonus_coins?: number;
    };
  };
  
  /** 创建时间戳 */
  created_at: number;
  
  /** 更新时间戳 */
  updated_at: number;
  
  /** 完成时间戳 */
  completed_at?: number;
}

/**
 * 创建交易记录请求
 */
export interface CreateTransactionRequest {
  user_id: string;
  transaction_type: TransactionType;
  coin_amount: number;
  payment_method: PaymentMethod;
  description: string;
  balance_before?: number; // 交易前余额（可选，如果不提供则从用户表查询）
  apple_transaction_id?: string;
  apple_product_id?: string;
  related_id?: string;
  metadata?: Transaction['metadata'];
}

/**
 * 查询交易记录请求
 */
export interface QueryTransactionsRequest {
  user_id: string;
  transaction_type?: TransactionType;
  status?: TransactionStatus;
  start_date?: number;
  end_date?: number;
  page_size?: number;
  page_number?: number;
}

/**
 * 交易记录列表响应
 */
export interface TransactionListResponse {
  success: boolean;
  data: {
    records: Transaction[];
    total: number;
    page_size: number;
    page_number: number;
    has_more: boolean;
  };
  error?: string;
}

/**
 * RevenueCat 配置
 * 集中管理所有订阅和购买相关的配置
 */

import type { PurchasesPackage } from 'react-native-purchases';

// ==================== RevenueCat API 配置 ====================

export const REVENUECAT_API_KEY = {
  // iOS 使用生产环境 API Key（Apple Store）
  ios: 'appl_oZcTmTCMoJIWnzpcykfZNLRAcqw',
  // Android 暂时仍使用测试 Key，后续可按需替换
  android: 'test_iTvZGIfBvovUViOOeokGpqmqmug',
};

// Entitlement 标识符
export const ENTITLEMENTS = {
  PRO: 'FaceGlow Pro', // 在 RevenueCat Dashboard 中配置的 entitlement 标识符
};

// Offering 标识符（可选，如果不指定则使用默认 offering）
export const OFFERING_IDENTIFIER = 'default';

// ==================== 产品标识符配置 ====================

/**
 * 订阅产品标识符（与 App Store / RevenueCat 中的产品 ID 保持一致）
 */
export const PRODUCT_IDS = {
  // 订阅产品
  SUBSCRIPTION: {
    MONTHLY: 'com.digitech.faceglow.subscribe.monthly1',
    YEARLY: 'com.digitech.faceglow.subscribe.yearly',
  },
  // 美美币产品
  COINS: {
    COINS_80: 'com.digitech.faceglow.assets.coins1',
  },
  // 向后兼容的别名
  MONTHLY: 'com.digitech.faceglow.subscribe.monthly1',
  YEARLY: 'com.digitech.faceglow.subscribe.yearly',
};

// ==================== 类型定义 ====================

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  savePercent?: string;
  weeklyPrice?: string;
  productId: string;
  canPurchase?: boolean;
  isActive?: boolean;
  rcPackage?: PurchasesPackage;
}

export interface CoinPackage {
  id: string;
  title: string;
  coins: number;
  price: string;
  description: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  bonusPercent?: string;
  productId: string;
}

// ==================== 订阅计划配置 ====================

/**
 * 订阅计划配置
 */
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    title: '月度会员',
    price: '¥28',
    period: 'month',
    description: '解锁所有AI功能',
    productId: PRODUCT_IDS.SUBSCRIPTION.MONTHLY,
  },
  {
    id: 'yearly',
    title: '年度会员',
    price: '¥328',
    originalPrice: '¥336',
    period: 'year',
    description: '最优惠的选择',
    isBestValue: true,
    savePercent: '节省¥8',
    weeklyPrice: '每周¥6.31',
    productId: PRODUCT_IDS.SUBSCRIPTION.YEARLY,
  },
];

// ==================== 美美币包配置 ====================

/**
 * 美美币包配置
 */
export const coinPackages: CoinPackage[] = [
  {
    id: 'coins',
    title: '美美币',
    coins: 80,
    price: '¥8',
    description: '使用美美币，解锁高级AI写真模版',
    isPopular: true,
    productId: PRODUCT_IDS.COINS.COINS_80,
  },
];


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
    MONTHLY: 'com.digitech.faceglow.subscribe.monthly.v2',
    YEARLY: 'com.digitech.faceglow.subscribe.yearly.v2',
  },
  // 美美币产品
  COINS: {
    COINS_48: 'com.digitech.faceglow.assets.coins.48',
    COINS_120: 'com.digitech.faceglow.assets.coins.120',
    COINS_198: 'com.digitech.faceglow.assets.coins.198',
    COINS_498: 'com.digitech.faceglow.assets.coins.498',
    COINS_80: 'com.digitech.faceglow.assets.coins1', // Backward compatibility
  },
  // 向后兼容的别名
  MONTHLY: 'com.digitech.faceglow.subscribe.monthly.v2',
  YEARLY: 'com.digitech.faceglow.subscribe.yearly.v2',
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
  introductoryPrice?: string;
  introductoryDescription?: string;
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
  originalPrice?: string; // 划线价（原价）
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
    title: '美颜换换 月度会员',
    price: '¥18',
    period: 'month',
    description: '✨ 解锁所有AI功能\n🎨 人脸融合、图生图、图生视频\n💰 所有功能享受8折优惠\n🚀 批量生成功能\n📱 无限制使用高级模版',
    introductoryPrice: '¥9.9',
    introductoryDescription: '首月仅需¥9.9，之后¥18/月',
    productId: PRODUCT_IDS.SUBSCRIPTION.MONTHLY,
  },
  {
    id: 'yearly',
    title: '美颜换换 年度会员',
    price: '¥198',
    originalPrice: '¥216',
    period: 'year',
    description: '✨ 解锁所有AI功能\n🎨 人脸融合、图生图、图生视频\n💰 所有功能享受5折优惠\n🚀 批量生成功能\n📱 无限制使用高级模版\n🎁 最优惠选择，节省¥18',
    isBestValue: true,
    savePercent: '节省¥18',
    weeklyPrice: '每周¥3.81',
    introductoryPrice: '¥9.9',
    introductoryDescription: '首月仅需¥9.9，之后¥198/年',
    productId: PRODUCT_IDS.SUBSCRIPTION.YEARLY,
  },
];

// ==================== 美美币包配置 ====================

/**
 * 美美币包配置
 */
export const coinPackages: CoinPackage[] = [
  {
    id: 'coins48',
    title: '美美币',
    coins: 48,
    price: '¥8',
    originalPrice: '¥8',
    description: '尝鲜体验',
    productId: PRODUCT_IDS.COINS.COINS_48,
  },
  {
    id: 'coins120',
    title: '美美币',
    coins: 120,
    price: '¥18',
    originalPrice: '¥20',
    description: '推荐选择',
    isPopular: true,
    bonusPercent: '节省10%',
    productId: PRODUCT_IDS.COINS.COINS_120,
  },
  {
    id: 'coins198',
    title: '美美币',
    coins: 198,
    price: '¥28',
    originalPrice: '¥33',
    description: '适合高频使用',
    bonusPercent: '节省15%',
    productId: PRODUCT_IDS.COINS.COINS_198,
  },
  {
    id: 'coins498',
    title: '美美币',
    coins: 498,
    price: '¥48',
    originalPrice: '¥83',
    description: '最优惠选择',
    isBestValue: true,
    bonusPercent: '节省42%',
    productId: PRODUCT_IDS.COINS.COINS_498,
  },
];


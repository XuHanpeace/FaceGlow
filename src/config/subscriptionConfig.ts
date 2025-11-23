import type { PurchasesPackage } from 'react-native-purchases';

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
    productId: 'com.digitech.faceglow.subscribe.monthly1',
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
    productId: 'com.digitech.faceglow.subscribe.yearly',
  },
];

/**
 * 金币包配置
 */
export const coinPackages: CoinPackage[] = [
  {
    id: 'coins',
    title: '美美币',
    coins: 80,
    price: '¥8',
    description: '使用美美币，解锁高级AI写真模版',
    isPopular: true,
    productId: 'com.digitech.faceglow.assets.coins1',
  },
];

/**
 * 订阅页面配置
 */
export const subscriptionConfig = {
  title: '美颜换换会员',
  features: [
    '• 解锁全部写真模版',
    '• 高清图片导出',
  ],
  buttonText: '立即订阅',
  restoreText: '恢复购买',
};

/**
 * 金币页面配置
 */
export const coinConfig = {
  title: '购买美美币',
  description: '消耗美美币，参与更加专业的AI写真创作，解锁更多创意模板',
  buttonText: '立即购买',
};

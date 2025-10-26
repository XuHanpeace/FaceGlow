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
    title: '月会员',
    price: 'HK$128',
    period: 'month',
    description: '解锁所有AI功能',
    productId: 'com.digitech.faceglow.subscribe.monthly',
  },
  {
    id: 'yearly',
    title: '年会员',
    price: 'HK$288',
    originalPrice: 'HK$3016',
    period: 'year',
    description: '最优惠的选择',
    isBestValue: true,
    savePercent: '90%',
    weeklyPrice: 'HK$5.52',
    productId: 'com.digitech.faceglow.subscribe.yearly',
  },
];

/**
 * 金币包配置
 */
export const coinPackages: CoinPackage[] = [
  {
    id: 'coins',
    title: 'Face Coins',
    coins: 100,
    price: 'HK$6',
    description: '解锁AI创作功能',
    isPopular: true,
    productId: 'com.digitech.faceglow.assets.coins',
  },
];

/**
 * 订阅页面配置
 */
export const subscriptionConfig = {
  title: '美颜换换Pro',
  features: [
    '• 无限次AI换脸',
    '• 高清图片导出',
    '• 每日100张PRO级别照片',
    '• 视频创作赠送3000美美币',
  ],
  buttonText: '立即订阅',
  restoreText: '恢复购买',
};

/**
 * 金币页面配置
 */
export const coinConfig = {
  title: '购买美美币',
  description: '美美币可用于AI创作功能',
  buttonText: '立即购买',
};

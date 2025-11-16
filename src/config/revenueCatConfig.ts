/**
 * RevenueCat 配置
 */

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

// 订阅产品标识符（与 App Store / RevenueCat 中的产品 ID 保持一致）
export const PRODUCT_IDS = {
  MONTHLY: 'com.digitech.faceglow.subscribe.monthly1',
  YEARLY: 'com.digitech.faceglow.subscribe.yearly',
};

// Offering 标识符（可选，如果不指定则使用默认 offering）
export const OFFERING_IDENTIFIER = 'default';


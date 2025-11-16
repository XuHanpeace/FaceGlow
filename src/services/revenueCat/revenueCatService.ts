import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_API_KEY, ENTITLEMENTS, OFFERING_IDENTIFIER, PRODUCT_IDS } from '../../config/revenueCatConfig';

/**
 * RevenueCat 错误类型
 */
export interface RevenueCatError {
  code: string;
  message: string;
  underlyingErrorMessage?: string;
}

/**
 * 订阅状态接口
 */
export interface SubscriptionStatus {
  isPro: boolean;
  isActive: boolean;
  expirationDate: number | null;
  productIdentifier: string | null;
  willRenew: boolean;
  periodType: 'NORMAL' | 'TRIAL' | 'INTRO' | null;
}

/**
 * 产品信息接口
 */
export interface ProductInfo {
  identifier: string;
  title: string;
  description: string;
  price: string;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: string;
    period: string;
    cycles: number;
  };
  discount?: {
    price: string;
    period: string;
  };
}

/**
 * RevenueCat 订阅服务
 * 提供订阅购买、状态检查、产品查询等功能
 */
class RevenueCatService {
  private isInitialized = false;

  /**
   * 初始化 RevenueCat SDK
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ RevenueCat 已初始化');
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;

      console.log('🚀 初始化 RevenueCat SDK...');
      await Purchases.configure({ apiKey });

      // 如果提供了 userId，则关联用户
      if (userId) {
        await Purchases.logIn(userId);
        console.log('✅ RevenueCat 用户已关联:', userId);
      }

      this.isInitialized = true;
      console.log('✅ RevenueCat SDK 初始化成功');
    } catch (error) {
      console.error('❌ RevenueCat SDK 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前客户信息
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error: unknown) {
      console.error('❌ 获取客户信息失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 检查订阅状态
   */
  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];

      // 只把真正的订阅产品视为 Pro（过滤掉金币等一次性内购）
      if (
        entitlement &&
        entitlement.productIdentifier &&
        (entitlement.productIdentifier === PRODUCT_IDS.MONTHLY ||
          entitlement.productIdentifier === PRODUCT_IDS.YEARLY)
      ) {
        return {
          isPro: true,
          isActive: true,
          expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate).getTime() : null,
          productIdentifier: entitlement.productIdentifier || null,
          willRenew: entitlement.willRenew,
          periodType: entitlement.periodType as SubscriptionStatus['periodType'],
        };
      }

      return {
        isPro: false,
        isActive: false,
        expirationDate: null,
        productIdentifier: null,
        willRenew: false,
        periodType: null,
      };
    } catch (error: unknown) {
      console.error('❌ 检查订阅状态失败:', error);
      return {
        isPro: false,
        isActive: false,
        expirationDate: null,
        productIdentifier: null,
        willRenew: false,
        periodType: null,
      };
    }
  }

  /**
   * 获取可用的订阅产品（Offerings）
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      
      // 使用指定的 offering，如果没有则使用当前默认 offering
      // PurchasesOfferings 结构: { all: { [id]: offering }, current: offering | null }
      const offering = OFFERING_IDENTIFIER 
        ? offerings.all[OFFERING_IDENTIFIER] || offerings.current
        : offerings.current;

      return offering || null;
    } catch (error: unknown) {
      console.error('❌ 获取 Offerings 失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取可用的订阅包（Packages）
   */
  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    try {
      const offering = await this.getOfferings();
      if (!offering) {
        console.warn('⚠️ 没有可用的 Offering');
        return [];
      }

      return offering.availablePackages;
    } catch (error: unknown) {
      console.error('❌ 获取 Packages 失败:', error);
      return [];
    }
  }

  /**
   * 购买订阅包
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      console.log('💳 开始购买订阅:', packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('✅ 购买成功');
      return customerInfo;
    } catch (error: unknown) {
      console.error('❌ 购买失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 恢复购买
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      console.log('🔄 恢复购买...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ 恢复购买成功');
      return customerInfo;
    } catch (error: unknown) {
      console.error('❌ 恢复购买失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 同步购买信息（手动触发同步）
   */
  async syncPurchases(): Promise<void> {
    try {
      await Purchases.syncPurchases();
      console.log('✅ 同步购买信息成功');
    } catch (error: unknown) {
      console.error('❌ 同步购买信息失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 添加客户信息更新监听器
   */
  addCustomerInfoUpdateListener(
    listener: (customerInfo: CustomerInfo) => void
  ): () => void {
    const unsubscribe = Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      // RevenueCat SDK 会自动清理监听器，但为了类型安全，我们返回一个清理函数
      // 实际清理可能在 SDK 内部处理
    };
  }

  /**
   * 获取产品信息
   */
  getProductInfo(packageToGet: PurchasesPackage): ProductInfo {
    const product = (packageToGet as any).storeProduct || (packageToGet as any).product;

    return {
      identifier: product.identifier,
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      priceString: product.priceString,
      currencyCode: product.currencyCode,
      introPrice: product.introPrice
        ? {
            price: product.introPrice.priceString,
            period: product.introPrice.subscriptionPeriod?.unit || '',
            cycles: product.introPrice.numberOfPeriods || 0,
          }
        : undefined,
    };
  }

  /**
   * 检查是否为购买取消错误
   */
  isPurchaseCancelledError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      return errorCode === 'PURCHASE_CANCELLED' || errorCode === 'USER_CANCELLED';
    }
    return false;
  }

  /**
   * 检查是否为网络错误
   */
  isNetworkError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      return errorCode === 'NETWORK_ERROR' || errorCode === 'NETWORK_ERROR';
    }
    return false;
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): RevenueCatError {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      return {
        code: (error as { code: string }).code,
        message: (error as { message: string }).message,
        underlyingErrorMessage: (error as { underlyingErrorMessage?: string }).underlyingErrorMessage,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// 导出单例实例
export const revenueCatService = new RevenueCatService();


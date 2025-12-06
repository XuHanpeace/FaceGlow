import { useEffect, useState, useCallback } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { revenueCatService, SubscriptionStatus } from '../services/revenueCat/revenueCatService';

/**
 * RevenueCat Hook
 * 提供订阅状态、购买功能等
 */
export const useRevenueCat = (userId?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isPro: false,
    isActive: false,
    expirationDate: null,
    productIdentifier: null,
    willRenew: false,
    periodType: null,
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 刷新订阅状态
  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await revenueCatService.checkSubscriptionStatus();
      const info = await revenueCatService.getCustomerInfo();
      setSubscriptionStatus(status);
      setCustomerInfo(info);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('刷新订阅状态失败');
      setError(error);
      console.error('❌ 刷新订阅状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化 RevenueCat
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await revenueCatService.initialize(userId);
        setIsInitialized(true);
        await refreshStatus();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('RevenueCat 初始化失败');
        setError(error);
        console.error('❌ RevenueCat 初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [userId, refreshStatus]);

  // 监听客户信息更新
  useEffect(() => {
    if (!isInitialized) return;

    const removeListener = revenueCatService.addCustomerInfoUpdateListener((info) => {
      console.log('📢 [RevenueCat] 收到订阅状态更新回调:', {
        activeEntitlements: Object.keys(info.entitlements.active),
      });
      setCustomerInfo(info);
      
      // 更新订阅状态
      const entitlement = info.entitlements.active['FaceGlow Pro'];
      if (entitlement) {
        setSubscriptionStatus({
          isPro: true,
          isActive: true,
          expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate).getTime() : null,
          productIdentifier: entitlement.productIdentifier || null,
          willRenew: entitlement.willRenew,
          periodType: entitlement.periodType as SubscriptionStatus['periodType'],
        });
      } else {
        setSubscriptionStatus({
          isPro: false,
          isActive: false,
          expirationDate: null,
          productIdentifier: null,
          willRenew: false,
          periodType: null,
        });
      }
    });

    return () => {
      removeListener();
    };
  }, [isInitialized]);

  // 应用前后台同步订阅状态由全局 appLifecycleManager 负责，
  // 这里不再额外监听 AppState 以避免重复刷新。

  // 购买订阅包
  const purchasePackage = useCallback(async (packageToPurchase: any) => {
    try {
      setLoading(true);
      setError(null);
      const info = await revenueCatService.purchasePackage(packageToPurchase);
      setCustomerInfo(info);
      await refreshStatus();
      return info;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('购买失败');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  // 恢复购买
  const restorePurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await revenueCatService.restorePurchases();
      setCustomerInfo(info);
      await refreshStatus();
      return info;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('恢复购买失败');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  // 检查是否为购买取消错误
  const isPurchaseCancelled = useCallback((err: unknown) => {
    return revenueCatService.isPurchaseCancelledError(err);
  }, []);

  // 检查是否为网络错误
  const isNetworkError = useCallback((err: unknown) => {
    return revenueCatService.isNetworkError(err);
  }, []);

  return {
    // 状态
    isInitialized,
    subscriptionStatus,
    customerInfo,
    loading,
    error,

    // 计算属性
    isPro: subscriptionStatus.isPro && subscriptionStatus.isActive,
    hasActiveSubscription: subscriptionStatus.isPro && subscriptionStatus.isActive,

    // 方法
    refreshStatus,
    purchasePackage,
    restorePurchases,
    isPurchaseCancelled,
    isNetworkError,

    // 服务方法（直接访问）
    getOfferings: revenueCatService.getOfferings.bind(revenueCatService),
    getAvailablePackages: revenueCatService.getAvailablePackages.bind(revenueCatService),
    getProductInfo: revenueCatService.getProductInfo.bind(revenueCatService),
  };
};


import { NativeModules } from 'react-native';
import { Platform } from 'react-native';

const { ApplePayModule } = NativeModules;

export interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionType: string;
  expirationDate: number;
  isExpired: boolean;
  daysRemaining: number;
}

/**
 * 订阅状态检查服务
 * 用于在客户端检测订阅状态变化（包括取消订阅）
 */
class SubscriptionStatusChecker {
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: SubscriptionStatus) => void> = [];

  /**
   * 检查当前订阅状态
   * 方法1: 使用 refreshReceiptAndCheckStatus（推荐）- 从 Apple 服务器获取最新状态
   * 方法2: 使用 checkSubscriptionStatus - 检查本地存储的状态
   */
  async checkStatus(useRefresh: boolean = false): Promise<SubscriptionStatus> {
    try {
      let result: any;

      if (useRefresh && Platform.OS === 'ios') {
        // 方法1: 刷新收据并检查（会从 Apple 服务器获取最新状态）
        console.log('🔄 刷新收据并检查订阅状态...');
        result = await ApplePayModule.refreshReceiptAndCheckStatus();
      } else {
        // 方法2: 检查本地存储的状态
        console.log('🔍 检查本地订阅状态...');
        result = await ApplePayModule.checkSubscriptionStatus();
      }

      const expirationDate = result.expirationDate || 0;
      const now = Date.now();
      const isExpired = expirationDate > 0 && expirationDate < now;
      const daysRemaining = expirationDate > 0 
        ? Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
        : 0;

      const status: SubscriptionStatus = {
        isSubscribed: result.isSubscribed && !isExpired,
        subscriptionType: result.subscriptionType || '',
        expirationDate,
        isExpired,
        daysRemaining: Math.max(0, daysRemaining),
      };

      console.log('📊 订阅状态:', {
        isSubscribed: status.isSubscribed,
        type: status.subscriptionType,
        expired: status.isExpired,
        daysRemaining: status.daysRemaining,
      });

      // 通知所有监听者
      this.notifyListeners(status);

      return status;
    } catch (error: any) {
      console.error('❌ 检查订阅状态失败:', error);
      return {
        isSubscribed: false,
        subscriptionType: '',
        expirationDate: 0,
        isExpired: true,
        daysRemaining: 0,
      };
    }
  }

  /**
   * 恢复购买并检查状态
   * 这会从 Apple 服务器获取所有历史购买记录
   */
  async restoreAndCheck(): Promise<SubscriptionStatus> {
    try {
      console.log('🔄 恢复购买并检查订阅状态...');
      const result = await ApplePayModule.restorePurchases();
      
      if (result.success) {
        // 恢复成功后，再次检查状态
        return await this.checkStatus(true);
      } else {
        console.warn('⚠️ 恢复购买失败或没有可恢复的购买');
        return await this.checkStatus(false);
      }
    } catch (error: any) {
      console.error('❌ 恢复购买失败:', error);
      return await this.checkStatus(false);
    }
  }

  /**
   * 开始定期检查订阅状态
   * @param intervalMinutes 检查间隔（分钟），默认 60 分钟
   * @param useRefresh 是否使用刷新收据方式（更准确但更慢）
   */
  startPeriodicCheck(intervalMinutes: number = 60, useRefresh: boolean = false) {
    if (this.checkInterval) {
      this.stopPeriodicCheck();
    }

    console.log(`⏰ 开始定期检查订阅状态，间隔: ${intervalMinutes} 分钟`);

    // 立即检查一次
    this.checkStatus(useRefresh);

    // 设置定期检查
    this.checkInterval = setInterval(() => {
      this.checkStatus(useRefresh);
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ 已停止定期检查订阅状态');
    }
  }

  /**
   * 添加状态变化监听器
   */
  addListener(callback: (status: SubscriptionStatus) => void) {
    this.listeners.push(callback);
  }

  /**
   * 移除状态变化监听器
   */
  removeListener(callback: (status: SubscriptionStatus) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * 通知所有监听者
   */
  private notifyListeners(status: SubscriptionStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('❌ 监听器执行失败:', error);
      }
    });
  }
}

export const subscriptionStatusChecker = new SubscriptionStatusChecker();


import { NativeModules } from 'react-native';

const { ApplePayModule } = NativeModules;

export interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionType: string;
  expirationDate: string;
  isActive: boolean;
  daysRemaining: number;
}

export interface SubscriptionPlan {
  id: string;
  productId: string;
  title: string;
  price: string;
  period: string;
  isActive?: boolean;
  canPurchase?: boolean;
}

class SubscriptionManager {
  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      productId: 'com.digitech.faceglow.subscribe.monthly',
      title: '月会员',
      price: 'HK$128',
      period: 'month',
    },
    {
      id: 'yearly',
      productId: 'com.digitech.faceglow.subscribe.yearly',
      title: '年会员',
      price: 'HK$288',
      period: 'year',
    },
  ];

  /**
   * 检查当前订阅状态
   */
  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const result = await ApplePayModule.checkSubscriptionStatus();
      console.log('checkSubscriptionStatus', result);
      const expirationDate = result.expirationDate;
      const isActive = this.isSubscriptionActive(expirationDate);
      const daysRemaining = this.calculateDaysRemaining(expirationDate);
      
      return {
        isSubscribed: result.isSubscribed,
        subscriptionType: result.subscriptionType,
        expirationDate: expirationDate,
        isActive,
        daysRemaining,
      };
    } catch (error) {
      console.error('检查订阅状态失败:', error);
      return {
        isSubscribed: false,
        subscriptionType: '',
        expirationDate: '',
        isActive: false,
        daysRemaining: 0,
      };
    }
  }

  /**
   * 获取可用的订阅计划（过滤已订阅的）
   */
  async getAvailableSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const status = await this.checkSubscriptionStatus();
    
    if (!status.isActive) {
      // 没有有效订阅，所有计划都可用
      return this.subscriptionPlans.map(plan => ({
        ...plan,
        canPurchase: true,
        isActive: false,
      }));
    }

    // 有有效订阅，根据订阅类型过滤
    return this.subscriptionPlans.map(plan => {
      const isCurrentPlan = plan.productId === status.subscriptionType;
      const canUpgrade = this.canUpgrade(status.subscriptionType, plan.productId);
      
      return {
        ...plan,
        isActive: isCurrentPlan,
        canPurchase: isCurrentPlan || canUpgrade,
      };
    });
  }

  /**
   * 检查是否可以升级订阅
   */
  private canUpgrade(currentProductId: string, targetProductId: string): boolean {
    // 年会员不能降级到月会员
    if (currentProductId.includes('yearly') && targetProductId.includes('monthly')) {
      return false;
    }
    
    // 月会员可以升级到年会员
    if (currentProductId.includes('monthly') && targetProductId.includes('yearly')) {
      return true;
    }
    
    // 相同产品不能重复购买
    if (currentProductId === targetProductId) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查订阅是否有效
   */
  private isSubscriptionActive(expirationDate: string): boolean {
    if (!expirationDate) return false;
    
    const expiration = new Date(expirationDate);
    const now = new Date();
    
    return expiration > now;
  }

  /**
   * 计算剩余天数
   */
  private calculateDaysRemaining(expirationDate: string): number {
    if (!expirationDate) return 0;
    
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取订阅状态描述
   */
  getSubscriptionStatusText(status: SubscriptionStatus): string {
    if (!status.isSubscribed) {
      return '未订阅';
    }
    
    if (!status.isActive) {
      return '订阅已过期';
    }
    
    if (status.daysRemaining <= 7) {
      return `订阅即将过期 (${status.daysRemaining}天)`;
    }
    
    return `订阅有效 (${status.daysRemaining}天)`;
  }

  /**
   * 检查是否允许购买特定产品
   */
  async canPurchaseProduct(productId: string): Promise<{ canPurchase: boolean; reason?: string }> {
    const status = await this.checkSubscriptionStatus();
    
    if (!status.isActive) {
      return { canPurchase: true };
    }
    
    const canUpgrade = this.canUpgrade(status.subscriptionType, productId);
    
    if (!canUpgrade) {
      return {
        canPurchase: false,
        reason: '您已有有效订阅，无法重复购买'
      };
    }
    
    return { canPurchase: true };
  }
}

export const subscriptionManager = new SubscriptionManager();

import { userDataService } from './database/userDataService';
import { User } from '../types/model/user';

export interface SubscriptionUpdateData {
  subscriptionType: 'monthly' | 'yearly';
  productId: string;
  expirationDate: Date;
  coins?: number;
}

class SubscriptionDataService {
  /**
   * 处理订阅成功后的用户数据更新
   */
  async handleSubscriptionSuccess(
    uid: string, 
    subscriptionData: SubscriptionUpdateData
  ): Promise<boolean> {
    try {
      console.log('开始更新用户订阅数据:', { uid, subscriptionData });

      // 计算过期时间戳
      const expirationTimestamp = subscriptionData.expirationDate.getTime();

      // 准备更新数据
      const updateData: Partial<User> = {
        is_premium: true,
        premium_expires_at: expirationTimestamp,
        subscription_type: subscriptionData.subscriptionType,
        subscription_product_id: subscriptionData.productId,
        updated_at: Date.now(),
      };

      // 如果购买了金币，也更新余额
      if (subscriptionData.coins) {
        // 先获取当前用户数据
        const currentUser = await userDataService.getUserData(uid);
        if (currentUser) {
          updateData.balance = (currentUser.balance || 0) + subscriptionData.coins;
        } else {
          updateData.balance = subscriptionData.coins;
        }
      }

      console.log('更新数据:', updateData);

      // 更新用户数据
      const result = await userDataService.updateUserData(uid, updateData);
      
      if (result.success) {
        console.log('用户订阅数据更新成功');
        return true;
      } else {
        console.error('用户订阅数据更新失败:', result.error);
        return false;
      }
    } catch (error) {
      console.error('处理订阅成功数据时出错:', error);
      return false;
    }
  }

  /**
   * 处理金币购买成功后的用户数据更新
   */
  async handleCoinPurchaseSuccess(
    uid: string, 
    coinsAmount: number
  ): Promise<boolean> {
    try {
      console.log('开始更新用户金币数据:', { uid, coinsAmount });

      // 先获取当前用户数据
      const currentUser = await userDataService.getUserData(uid);
      if (!currentUser) {
        console.error('用户不存在');
        return false;
      }

      // 计算新的金币数量
      const newCoinsAmount = (currentUser.balance || 0) + coinsAmount;

      // 准备更新数据
      const updateData: Partial<User> = {
        balance: newCoinsAmount,
        updated_at: Date.now(),
      };

      console.log('金币更新数据:', updateData);

      // 更新用户数据
      const result = await userDataService.updateUserData(uid, updateData);
      
      if (result.success) {
        console.log('用户金币数据更新成功');
        return true;
      } else {
        console.error('用户金币数据更新失败:', result.error);
        return false;
      }
    } catch (error) {
      console.error('处理金币购买成功数据时出错:', error);
      return false;
    }
  }

  /**
   * 检查用户订阅状态
   */
  async checkUserSubscriptionStatus(uid: string): Promise<{
    isPremium: boolean;
    subscriptionType: string | null;
    expirationDate: Date | null;
    balance: number;
  }> {
    try {
      const user = await userDataService.getUserData(uid);
      if (!user) {
        return {
          isPremium: false,
          subscriptionType: null,
          expirationDate: null,
          balance: 0,
        };
      }

      const isPremium = user.is_premium && 
        user.premium_expires_at && 
        user.premium_expires_at > Date.now();

      return {
        isPremium,
        subscriptionType: user.subscription_type || null,
        expirationDate: user.premium_expires_at ? new Date(user.premium_expires_at) : null,
        balance: user.balance || 0,
      };
    } catch (error) {
      console.error('检查用户订阅状态时出错:', error);
      return {
        isPremium: false,
        subscriptionType: null,
        expirationDate: null,
        balance: 0,
      };
    }
  }

  /**
   * 从产品ID解析订阅类型
   */
  parseSubscriptionType(productId: string): 'monthly' | 'yearly' | null {
    if (productId.includes('monthly')) {
      return 'monthly';
    } else if (productId.includes('yearly')) {
      return 'yearly';
    }
    return null;
  }

  /**
   * 计算订阅过期时间
   */
  calculateExpirationDate(subscriptionType: 'monthly' | 'yearly'): Date {
    const now = new Date();
    if (subscriptionType === 'monthly') {
      // 月会员：当前时间 + 1个月
      return new Date(now.setMonth(now.getMonth() + 1));
    } else {
      // 年会员：当前时间 + 1年
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }
}

export const subscriptionDataService = new SubscriptionDataService();

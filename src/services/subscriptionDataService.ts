import { userDataService } from './database/userDataService';
import { transactionService } from './database/transactionService';
import { User } from '../types/model/user';
import type { SubscriptionStatus } from '../services/revenueCat/revenueCatService';

export interface SubscriptionUpdateData {
  subscriptionType: 'monthly' | 'yearly';
  productId: string;
  expirationDate: Date;
  willRenew?: boolean;
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
        uid,
        is_premium: true,
        premium_expires_at: expirationTimestamp,
        subscription_type: subscriptionData.subscriptionType,
        subscription_product_id: subscriptionData.productId,
        subscription_auto_renew: subscriptionData.willRenew ?? true,
        updated_at: Date.now(),
      };

      console.log('更新数据:', updateData);

      // 更新用户数据
      const result = await userDataService.updateUserData(updateData);
        
      if (result.success) {
        console.log('用户订阅数据更新成功');
        
        // 创建交易记录
        const transactionResult = await transactionService.createTransaction({
          user_id: uid,
          transaction_type: 'subscription',
          coin_amount: 0, // 订阅不涉及金币变动
          payment_method: 'apple_pay',
          description: `订阅${subscriptionData.subscriptionType === 'monthly' ? '月会员' : '年会员'}`,
          apple_transaction_id: subscriptionData.productId,
          apple_product_id: subscriptionData.productId,
          metadata: {
            subscription: {
              plan_type: subscriptionData.subscriptionType,
              expiration_date: subscriptionData.expirationDate.getTime(),
            }
          }
        });

        if (transactionResult.success) {
          // 更新交易状态为已完成
          await transactionService.updateTransactionStatus(
            transactionResult.data!._id,
            'completed'
          );
          console.log('订阅交易记录创建成功');
        } else {
          console.error('订阅交易记录创建失败:', transactionResult.error);
        }
        
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
   * 更新用户订阅的自动续订状态（willRenew）
   */
  async updateSubscriptionRenewStatus(uid: string, willRenew: boolean): Promise<boolean> {
    try {
      console.log('更新用户订阅自动续订状态:', { uid, willRenew });

      const updateData: Partial<User> = {
        uid,
        subscription_auto_renew: willRenew,
        updated_at: Date.now(),
      };

      const result = await userDataService.updateUserData(updateData);

      if (!result.success) {
        console.error('更新订阅自动续订状态失败:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('更新订阅自动续订状态出错:', error);
      return false;
    }
  }

  /**
   * 根据 RevenueCat 返回的订阅状态同步用户数据
   * 用于前台同步（包括自动续订变更、会员失效等）
   */
  async syncSubscriptionStatusFromRemote(uid: string, status: SubscriptionStatus): Promise<boolean> {
    try {
      console.log('同步远端订阅状态到用户数据:', { uid, status });

      // 先获取当前用户数据，避免无意义更新
      const currentUser = await userDataService.getUserByUid(uid);
      const record = currentUser?.data?.record;

      const currentIsPremium = record?.is_premium ?? false;
      const currentExpiresAt = record?.premium_expires_at ?? null;
      const currentAutoRenew = record?.subscription_auto_renew ?? false;

      const nextIsPremium = status.isPro && status.isActive;
      const nextExpiresAt = status.expirationDate ?? null;
      const nextAutoRenew = status.willRenew;

      // 如果状态完全一致，则不更新，避免每次前台都写库
      if (
        currentIsPremium === nextIsPremium &&
        currentExpiresAt === nextExpiresAt &&
        currentAutoRenew === nextAutoRenew
      ) {
        console.log('🔍 订阅状态无变化，跳过用户数据更新');
        return true;
      }

      const updateData: Partial<User> = {
        uid,
        is_premium: nextIsPremium,
        premium_expires_at: nextExpiresAt ?? undefined,
        subscription_auto_renew: nextAutoRenew,
        updated_at: Date.now(),
      };

      console.log('订阅状态变更数据:', updateData);

      const result = await userDataService.updateUserData(updateData);

      if (!result.success) {
        console.error('同步远端订阅状态失败:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('同步远端订阅状态出错:', error);
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
      const currentUser = await userDataService.getUserByUid(uid);
      if (!currentUser) {
        console.error('用户不存在');
        return false;
      }

      // 计算新的金币数量
      const newCoinsAmount = (currentUser.data?.record.balance || 0) + coinsAmount;

      // 准备更新数据
      const updateData: Partial<User> = {
        balance: newCoinsAmount,
        uid: uid,
      };

      console.log('金币更新数据:', updateData);

      // 更新用户数据
      const result = await userDataService.updateUserData({
        uid: uid,
        balance: newCoinsAmount,
      });
      
      if (result.success) {
        console.log('用户金币数据更新成功');
        
        // 创建交易记录
        const transactionResult = await transactionService.createTransaction({
          user_id: uid,
          transaction_type: 'coin_purchase',
          coin_amount: coinsAmount,
          payment_method: 'apple_pay',
          description: `购买${coinsAmount}金币`,
          apple_product_id: 'com.digitech.faceglow.assets.coins1',
          metadata: {
            coin_package: {
              package_id: 'coins_pack',
              package_name: 'Face Coins',
              bonus_coins: 0
            }
          }
        });

        if (transactionResult.success) {
          // 更新交易状态为已完成
          await transactionService.updateTransactionStatus(
            transactionResult.data!._id,
            'completed'
          );
          console.log('金币购买交易记录创建成功');
        } else {
          console.error('金币购买交易记录创建失败:', transactionResult.error);
        }
        
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
    willRenew: boolean;
    subscriptionType: string | null;
    expirationDate: Date | null;
    balance: number;
  }> {
    try {
      const user = await userDataService.getUserByUid(uid);
      if (!user) {
        return {
          isPremium: false,
          willRenew: false,
          subscriptionType: null,
          expirationDate: null,
          balance: 0,
        };
      }

      const isPremium = user.data?.record.is_premium ? true : false;
      const subscriptionType = user.data?.record.subscription_type || null;
      const expirationDate = user.data?.record.premium_expires_at ? new Date(user.data?.record.premium_expires_at) : null;
      const balance = user.data?.record.balance || 0;
      const willRenew = user.data?.record.subscription_auto_renew ?? false;

      return {
        isPremium: isPremium,
        willRenew,
        subscriptionType: subscriptionType,
        expirationDate: expirationDate,
        balance: balance,
      };
    } catch (error) {
      console.error('检查用户订阅状态时出错:', error);
      return {
        isPremium: false,
        willRenew: false,
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

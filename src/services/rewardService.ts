import { userDataService } from './database/userDataService';
import { transactionService } from './database/transactionService';

/**
 * 新用户奖励服务
 */
class RewardService {
  /**
   * 判断是否为新用户（自拍数为0）
   * @param uid 用户ID
   * @returns Promise<boolean>
   */
  async isNewUser(uid: string): Promise<boolean> {
    try {
      const userResult = await userDataService.getUserByUid(uid);
      if (!userResult.success || !userResult.data?.record) {
        return false;
      }

      const selfieList = userResult.data.record.selfie_list || [];
      return selfieList.length === 0;
    } catch (error) {
      console.error('判断新用户失败:', error);
      return false;
    }
  }

  /**
   * 为新用户发放首次上传自拍奖励（10美美币）
   * @param uid 用户ID
   * @returns Promise<{ success: boolean; newBalance?: number; error?: string }>
   */
  async grantFirstSelfieReward(uid: string): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      console.log('🎁 开始为新用户发放首次上传自拍奖励');

      // 使用 subscriptionDataService 的方法来增加余额（它会创建交易记录）
      // 但我们这里需要自定义交易类型为奖励
      const currentUser = await userDataService.getUserByUid(uid);
      if (!currentUser.success || !currentUser.data?.record) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      const rewardAmount = 10;
      const currentBalance = currentUser.data.record.balance || 0;
      const newBalance = currentBalance + rewardAmount;

      // 更新用户余额
      const updateResult = await userDataService.updateUserData({
        uid: uid,
        balance: newBalance,
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: '更新用户余额失败',
        };
      }

      // 创建交易记录
      const transactionResult = await transactionService.createTransaction({
        user_id: uid,
        transaction_type: 'bonus',
        coin_amount: rewardAmount,
        payment_method: 'system_bonus',
        description: '新用户首次上传自拍奖励',
        related_id: `first_selfie_reward_${uid}_${Date.now()}`,
      });

      if (transactionResult.success) {
        console.log('✅ 新用户首次上传自拍奖励发放成功:', { uid, rewardAmount, newBalance });
      } else {
        console.error('创建奖励交易记录失败:', transactionResult.error);
      }

      return {
        success: true,
        newBalance,
      };
    } catch (error: any) {
      console.error('发放新用户奖励失败:', error);
      return {
        success: false,
        error: error.message || '发放奖励失败',
      };
    }
  }

  /**
   * 测试用：直接发放美美币奖励（不检查是否为新用户）
   * @param uid 用户ID
   * @param amount 奖励金额，默认10
   * @returns Promise<{ success: boolean; newBalance?: number; error?: string }>
   */
  async grantTestReward(uid: string, amount: number = 10): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      console.log('🧪 测试：发放美美币奖励', { uid, amount });

      const currentUser = await userDataService.getUserByUid(uid);
      if (!currentUser.success || !currentUser.data?.record) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      const currentBalance = currentUser.data.record.balance || 0;
      const newBalance = currentBalance + amount;

      // 更新用户余额
      const updateResult = await userDataService.updateUserData({
        uid: uid,
        balance: newBalance,
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: '更新用户余额失败',
        };
      }

      // 创建交易记录
      const transactionResult = await transactionService.createTransaction({
        user_id: uid,
        transaction_type: 'bonus',
        coin_amount: amount,
        payment_method: 'system_bonus',
        description: '测试奖励',
        related_id: `test_reward_${uid}_${Date.now()}`,
      });

      if (transactionResult.success) {
        console.log('✅ 测试奖励发放成功:', { uid, amount, newBalance });
      } else {
        console.error('创建测试奖励交易记录失败:', transactionResult.error);
      }

      return {
        success: true,
        newBalance,
      };
    } catch (error: any) {
      console.error('发放测试奖励失败:', error);
      return {
        success: false,
        error: error.message || '发放奖励失败',
      };
    }
  }
}

export const rewardService = new RewardService();


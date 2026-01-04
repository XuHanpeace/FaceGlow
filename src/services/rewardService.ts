import { userDataService } from './database/userDataService';
import { transactionService } from './database/transactionService';

/**
 * 新用户奖励服务
 */
class RewardService {
  /**
   * 判断是否为新用户（自拍数为0）
   * @returns Promise<boolean>
   */
  async isNewUser(): Promise<boolean> {
    try {
      const userResult = await userDataService.getUserByUid();
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
   * @returns Promise<{ success: boolean; newBalance?: number; error?: string }>
   */
  async grantFirstSelfieReward(): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      console.log('🎁 开始为新用户发放首次上传自拍奖励');

      // 使用 subscriptionDataService 的方法来增加余额（它会创建交易记录）
      // 但我们这里需要自定义交易类型为奖励
      const currentUser = await userDataService.getUserByUid();
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
        user_id: '__AUTO__',
        transaction_type: 'bonus',
        coin_amount: rewardAmount,
        payment_method: 'system_bonus',
        description: '新用户首次上传自拍奖励',
        related_id: `first_selfie_reward_${Date.now()}`,
      });

      if (transactionResult.success) {
        console.log('✅ 新用户首次上传自拍奖励发放成功:', { rewardAmount, newBalance });
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
   * 通用奖励发放方法
   * @param amount 奖励金额
   * @param description 奖励描述
   * @param relatedId 关联ID（可选）
   * @returns Promise<{ success: boolean; newBalance?: number; error?: string }>
   */
  async grantReward(
    amount: number,
    description: string,
    relatedId?: string
  ): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      console.log('🎁 发放美美币奖励:', { amount, description });

      const currentUser = await userDataService.getUserByUid();
      if (!currentUser.success || !currentUser.data?.record) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      const currentBalance = currentUser.data.record.balance || 0;
      const newBalance = currentBalance + amount;

      // 先创建交易记录（传入 balance_before，让云函数统一更新余额）
      // 云函数会在 coin_amount > 0 时自动更新余额
      const transactionResult = await transactionService.createTransaction({
        user_id: '__AUTO__',
        transaction_type: 'bonus',
        coin_amount: amount,
        payment_method: 'system_bonus',
        description,
        related_id: relatedId || `reward_${Date.now()}`,
        balance_before: currentBalance, // 传入交易前余额
      });

      if (!transactionResult.success) {
        console.error('创建奖励交易记录失败:', transactionResult.error);
        // 如果交易记录创建失败，手动更新余额作为补偿
        const updateResult = await userDataService.updateUserData({
          balance: newBalance,
        });
        
        if (!updateResult.success) {
          return {
            success: false,
            error: '更新用户余额失败',
          };
        }
      }
      // 如果交易记录创建成功，云函数已经更新了余额，不需要再次更新

      if (transactionResult.success) {
        console.log('✅ 奖励发放成功:', { amount, newBalance, description });
      } else {
        console.error('创建奖励交易记录失败:', transactionResult.error);
      }

      return {
        success: true,
        newBalance,
      };
    } catch (error: any) {
      console.error('发放奖励失败:', error);
      return {
        success: false,
        error: error.message || '发放奖励失败',
      };
    }
  }

  /**
   * 测试用：直接发放美美币奖励（不检查是否为新用户）
   * @param amount 奖励金额，默认10
   * @returns Promise<{ success: boolean; newBalance?: number; error?: string }>
   */
  async grantTestReward(amount: number = 10): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    return this.grantReward(amount, '测试奖励', `test_reward_${Date.now()}`);
  }
}

export const rewardService = new RewardService();


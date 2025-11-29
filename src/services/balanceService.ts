import { userDataService } from './database/userDataService';
import { transactionService } from './database/transactionService';
import { User } from '../types/model/user';

export interface BalanceCheckResult {
  sufficient: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall?: number;
}

export interface DeductBalanceRequest {
  userId: string;
  amount: number;
  description: string;
  relatedId?: string;
  metadata?: any;
}

export interface DeductBalanceResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

/**
 * 余额管理服务
 */
class BalanceService {
  /**
   * 检查用户余额是否充足
   */
  async checkBalance(userId: string, requiredAmount: number): Promise<BalanceCheckResult> {
    try {
      console.log('检查用户余额:', { userId, requiredAmount });

      const userResult = await userDataService.getUserByUid(userId);
      
      if (!userResult.success || !userResult.data?.record) {
        return {
          sufficient: false,
          currentBalance: 0,
          requiredAmount,
          shortfall: requiredAmount,
        };
      }

      const currentBalance = userResult.data?.record.balance || 0;
      const sufficient = currentBalance >= requiredAmount;
      const shortfall = sufficient ? 0 : requiredAmount - currentBalance;

      return {
        sufficient,
        currentBalance,
        requiredAmount,
        shortfall,
      };
    } catch (error) {
      console.error('检查余额失败:', error);
      return {
        sufficient: false,
        currentBalance: 0,
        requiredAmount,
        shortfall: requiredAmount,
      };
    }
  }

  /**
   * 扣除用户余额
   */
  async deductBalance(request: DeductBalanceRequest): Promise<DeductBalanceResult> {
    try {
      console.log('扣除用户余额:', request);

      const { userId, amount, description, relatedId, metadata } = request;

      // 先检查余额是否充足
      const balanceCheck = await this.checkBalance(userId, amount);
      if (!balanceCheck.sufficient) {
        return {
          success: false,
          error: `余额不足，当前余额：${balanceCheck.currentBalance}，需要：${amount}`,
        };
      }

      // 获取用户当前数据
      const userResult = await userDataService.getUserByUid(userId);
      if (!userResult.success || !userResult.data?.record) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      const currentUser = userResult.data?.record;
      const newBalance = currentUser?.balance - amount;

      // 创建交易记录（先创建为待处理状态）
      const transactionResult = await transactionService.createTransaction({
        user_id: userId,
        transaction_type: 'coin_consumption',
        coin_amount: -amount,
        payment_method: 'internal',
        description,
        related_id: relatedId,
        metadata,
      });

      if (!transactionResult.success || !transactionResult.data) {
        return {
          success: false,
          error: '创建交易记录失败',
        };
      }

      const transactionId = transactionResult.data._id;

      // 更新用户余额
      const updateResult = await userDataService.updateUserData({
        balance: newBalance,
      });

      if (!updateResult.success) {
        // 如果更新用户余额失败，将交易记录标记为失败
        await transactionService.updateTransactionStatus(transactionId, 'failed');
        return {
          success: false,
          error: '更新用户余额失败',
        };
      }

      // 更新交易状态为已完成
      await transactionService.updateTransactionStatus(transactionId, 'completed');

      console.log('余额扣除成功:', { userId, amount, newBalance });

      return {
        success: true,
        transactionId,
        newBalance,
      };
    } catch (error: any) {
      console.error('扣除余额失败:', error);
      return {
        success: false,
        error: error.message || '扣除余额失败',
      };
    }
  }

  /**
   * 获取用户余额
   */
  async getUserBalance(userId: string): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      const userResult = await userDataService.getUserByUid(userId);
      
      if (!userResult.success || !userResult.data?.record) {
        return {
          success: false,
          error: '用户不存在',
        };
      }

      return {
        success: true,
        balance: userResult.data?.record.balance || 0,
        error: undefined,
      };
    } catch (error: any) {
      console.error('获取用户余额失败:', error);
      return {
        success: false,
        error: error.message || '获取用户余额失败',
      };
    }
  }
}

export const balanceService = new BalanceService();

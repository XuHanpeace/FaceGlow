import axios from 'axios';
import { CLOUDBASE_CONFIG } from '../../config/cloudbase';
import { 
  Transaction, 
  CreateTransactionRequest, 
  QueryTransactionsRequest, 
  TransactionListResponse 
} from '../../types/model/transaction';

/**
 * 交易记录服务
 */
class TransactionService {
  private baseUrl = `${CLOUDBASE_CONFIG.API.BASE_URL}/model/prod/transactions`;

  /**
   * 创建交易记录
   */
  async createTransaction(request: CreateTransactionRequest): Promise<{
    success: boolean;
    data?: Transaction;
    error?: string;
  }> {
    try {
      console.log('创建交易记录:', request);

      const response = await axios.post(`${this.baseUrl}/collection`, {
        envId: CLOUDBASE_CONFIG.ENV_ID,
        collectionName: 'transactions',
        data: {
          ...request,
          created_at: Date.now(),
          updated_at: Date.now(),
          status: 'pending' as const,
        }
      });

      if (response.data && response.data.inserted) {
        const transactionId = response.data.inserted;
        
        // 获取创建的记录
        const transaction = await this.getTransactionById(transactionId);
        
        return {
          success: true,
          data: transaction.data,
        };
      } else {
        return {
          success: false,
          error: '创建交易记录失败',
        };
      }
    } catch (error: any) {
      console.error('创建交易记录失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '创建交易记录失败',
      };
    }
  }

  /**
   * 根据ID获取交易记录
   */
  async getTransactionById(transactionId: string): Promise<{
    success: boolean;
    data?: Transaction;
    error?: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/query`, {
        envId: CLOUDBASE_CONFIG.ENV_ID,
        collectionName: 'transactions',
        query: {
          where: {
            _id: transactionId
          }
        }
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        return {
          success: true,
          data: response.data.data[0] as Transaction,
        };
      } else {
        return {
          success: false,
          error: '交易记录不存在',
        };
      }
    } catch (error: any) {
      console.error('获取交易记录失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '获取交易记录失败',
      };
    }
  }

  /**
   * 查询用户交易记录
   */
  async getUserTransactions(request: QueryTransactionsRequest): Promise<TransactionListResponse> {
    try {
      console.log('查询用户交易记录:', request);

      const {
        user_id,
        transaction_type,
        status,
        start_date,
        end_date,
        page_size = 20,
        page_number = 1,
      } = request;

      // 构建查询条件
      const where: any = {
        user_id,
      };

      if (transaction_type) {
        where.transaction_type = transaction_type;
      }

      if (status) {
        where.status = status;
      }

      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at.gte = start_date;
        }
        if (end_date) {
          where.created_at.lte = end_date;
        }
      }

      const response = await axios.post(`${this.baseUrl}/query`, {
        envId: CLOUDBASE_CONFIG.ENV_ID,
        collectionName: 'transactions',
        query: {
          where,
          orderBy: [
            { field: 'created_at', direction: 'desc' }
          ],
          limit: page_size,
          offset: (page_number - 1) * page_size,
        }
      });

      const records = response.data?.data || [];
      const total = response.data?.total || 0;

      return {
        success: true,
        data: {
          records: records as Transaction[],
          total,
          page_size,
          page_number,
          has_more: (page_number * page_size) < total,
        },
      };
    } catch (error: any) {
      console.error('查询交易记录失败:', error);
      return {
        success: false,
        data: {
          records: [],
          total: 0,
          page_size: request.page_size || 20,
          page_number: request.page_number || 1,
          has_more: false,
        },
        error: error.response?.data?.message || error.message || '查询交易记录失败',
      };
    }
  }

  /**
   * 更新交易状态
   */
  async updateTransactionStatus(
    transactionId: string, 
    status: Transaction['status'],
    metadata?: any
  ): Promise<{
    success: boolean;
    data?: Transaction;
    error?: string;
  }> {
    try {
      console.log('更新交易状态:', { transactionId, status });

      const updateData: any = {
        status,
        updated_at: Date.now(),
      };

      if (status === 'completed') {
        updateData.completed_at = Date.now();
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const response = await axios.put(`${this.baseUrl}/update`, {
        envId: CLOUDBASE_CONFIG.ENV_ID,
        collectionName: 'transactions',
        query: {
          where: {
            _id: transactionId
          }
        },
        data: updateData
      });

      if (response.data && response.data.updated > 0) {
        // 获取更新后的记录
        const transaction = await this.getTransactionById(transactionId);
        return {
          success: true,
          data: transaction.data,
        };
      } else {
        return {
          success: false,
          error: '更新交易状态失败',
        };
      }
    } catch (error: any) {
      console.error('更新交易状态失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '更新交易状态失败',
      };
    }
  }

  /**
   * 获取用户交易统计
   */
  async getUserTransactionStats(userId: string): Promise<{
    success: boolean;
    data?: {
      total_earned: number;
      total_spent: number;
      current_balance: number;
      transaction_count: number;
    };
    error?: string;
  }> {
    try {
      const response = await this.getUserTransactions({
        user_id: userId,
        page_size: 1000, // 获取所有记录用于统计
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      const transactions = response.data.records;
      let totalEarned = 0;
      let totalSpent = 0;

      transactions.forEach(transaction => {
        if (transaction.coin_amount > 0) {
          totalEarned += transaction.coin_amount;
        } else {
          totalSpent += Math.abs(transaction.coin_amount);
        }
      });

      return {
        success: true,
        data: {
          total_earned: totalEarned,
          total_spent: totalSpent,
          current_balance: totalEarned - totalSpent,
          transaction_count: transactions.length,
        },
      };
    } catch (error: any) {
      console.error('获取交易统计失败:', error);
      return {
        success: false,
        error: error.message || '获取交易统计失败',
      };
    }
  }
}

export const transactionService = new TransactionService();

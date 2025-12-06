import axios from 'axios';
import { authService } from '../auth/authService';
import { 
  Transaction, 
  CreateTransactionRequest
} from '../../types/model/transaction';

/**
 * 交易记录服务
 */
class TransactionService {
  // 云函数基础URL（用于创建交易）
  private cloudFunctionBaseUrl = 'https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com';

  /**
   * 创建交易记录（调用云函数）
   */
  async createTransaction(request: CreateTransactionRequest): Promise<{
    success: boolean;
    data?: Transaction;
    error?: string;
  }> {
    try {
      console.log('创建交易记录:', request);

      const token = authService.getCurrentAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${this.cloudFunctionBaseUrl}/createTransaction`,
        {
          data: request
        },
        {
          headers,
          timeout: 30000, // 30秒超时
        }
      );

      // 处理云函数返回的数据结构
      const responseData = response.data;
      
      // 如果返回的是 HTTP 响应格式（statusCode + body）
      if (responseData.statusCode === 200 && responseData.body) {
        const body = typeof responseData.body === 'string' 
          ? JSON.parse(responseData.body) 
          : responseData.body;
        
        if (body.code === 0 && body.data) {
          return {
            success: true,
            data: body.data as Transaction,
          };
        } else {
          return {
            success: false,
            error: body.message || '创建交易记录失败',
          };
        }
      }
      
      // 如果直接返回数据
      if (responseData.code === 0 && responseData.data) {
        return {
          success: true,
          data: responseData.data as Transaction,
        };
      }

      return {
        success: false,
        error: responseData.message || '创建交易记录失败',
      };
    } catch (error: any) {
      console.error('创建交易记录失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message || '创建交易记录失败',
      };
    }
  }

}

export const transactionService = new TransactionService();

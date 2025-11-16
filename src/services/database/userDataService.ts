import { databaseService, DatabaseResponse, DatabaseError, DatabaseUpdateResponse } from './databaseService';
import { User } from '../../types/model/user';

// 创建用户文档请求参数
export interface CreateUserRequest {
  uid: string;
  username: string;
  phone_number: string;
  name?: string;
  gender?: string;
  picture?: string;
}

// 更新用户登录信息请求参数
export interface UpdateLoginInfoRequest {
  uid: string;
  last_login_at: number;
}

// 用户数据服务类
export class UserDataService {
  private readonly modelName = 'users'; // 数据模型名称

  // 创建新用户文档（注册成功后调用）
  async createUser(userData: CreateUserRequest) {
    try {
      const createData = {
        uid: userData.uid,         // 来自CloudBase返回的sub字段re
        username: userData.username,
        phone_number: userData.phone_number,
        name: userData.name || '',
        gender: userData.gender || '',
        picture: userData.picture || '',
      };

      // 使用 upsert 接口创建用户文档
      const response = await databaseService.post<DatabaseResponse<{ id: string }>>(
        `/model/prod/${this.modelName}/upsert`,
        {
          filter: {
            where: {
              uid: {
                $eq: userData.uid
              }
            }
          },
          create: createData,
          update: createData  // 如果用户已存在，则更新为相同数据
        }
      );

      if (response.data?.record?.id && response.success) {
        return {
          success: true,
          data: {
            record: {
              id: response.data.record.id
            }
          }
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'CREATE_USER_ERROR',
          message: response.error?.message || '创建用户失败',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'CREATE_USER_ERROR',
          message: error instanceof Error ? error.message : '创建用户时发生未知错误',
        },
      };
    }
  }

  // 根据UID获取用户信息
  async getUserByUid(uid: string) {
    try {
      const response = await databaseService.post<DatabaseResponse<User>>(
        `/model/prod/${this.modelName}/get`,
        {
          filter: {
            where: {
              uid: {
                $eq: uid
              }
            }
          },
          select: {
            username: true,
            name: true,
            phone_number: true,
            picture: true,
            gender: true,
            selfie_url: true,
            selfie_list: true,
            work_list: true,
            balance: true,
            is_premium: true,
            premium_expires_at: true,
            subscription_type: true,
            subscription_product_id: true,
            subscription_auto_renew: true,
            status: true,
            preferences: true,
            statistics: true,
          }
        }
      );

      if (response.data?.record && response.success) {
        return {
          success: true,
          data: {
            record: response.data.record
          }
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'GET_USER_ERROR',
          message: response.error?.message || '获取用户信息失败',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'GET_USER_ERROR',
          message: error instanceof Error ? error.message : '获取用户信息时发生未知错误',
        },
      };
    }
  }

  // 更新用户数据信息（支持多个字段）
  async updateUserData(userData: Partial<User>) {
    try {
      // 构建更新数据，只包含非undefined的字段
      const updateData: any = {
        updated_at: Date.now(),
      };

      // 添加需要更新的字段
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.selfie_url !== undefined) updateData.selfie_url = userData.selfie_url;
      if (userData.selfie_list !== undefined) updateData.selfie_list = userData.selfie_list;
      if (userData.work_list !== undefined) updateData.work_list = userData.work_list;
      if (userData.balance !== undefined) updateData.balance = userData.balance;
      if (userData.picture !== undefined) updateData.picture = userData.picture;
      if (userData.gender !== undefined) updateData.gender = userData.gender;
      if (userData.is_premium !== undefined) updateData.is_premium = userData.is_premium;
      if (userData.premium_expires_at !== undefined) updateData.premium_expires_at = userData.premium_expires_at;
      if (userData.subscription_type !== undefined) updateData.subscription_type = userData.subscription_type;
      if (userData.subscription_product_id !== undefined) updateData.subscription_product_id = userData.subscription_product_id;
      if (userData.status !== undefined) updateData.status = userData.status;
      if (userData.subscription_auto_renew !== undefined) updateData.subscription_auto_renew = userData.subscription_auto_renew;
      if (userData.preferences !== undefined) updateData.preferences = userData.preferences;
      if (userData.device_info !== undefined) updateData.device_info = userData.device_info;
      if (userData.statistics !== undefined) updateData.statistics = userData.statistics;

      const response = await databaseService.put<DatabaseUpdateResponse<{ count: number }>>(
        `/model/prod/${this.modelName}/update`,
        {
          filter: {
            where: {
              uid: {
                $eq: userData.uid || ''
              }
            }
          },
          data: updateData
        }
      );

      if (response.data?.count && response.success) {
        return {
          success: true,
          data: {
            count: response.data.count
          }
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'UPDATE_USER_DATA_ERROR',
          message: response.error?.message || '更新用户数据失败',
        },
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'UPDATE_USER_DATA_ERROR',
          message: error instanceof Error ? error.message : '更新用户数据时发生未知错误',
        },
      };
    }
  }
}

// 创建用户数据服务实例
export const userDataService = new UserDataService();

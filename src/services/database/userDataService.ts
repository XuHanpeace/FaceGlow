import { databaseService, DatabaseResponse, DatabaseError } from './databaseService';

// 用户数据模型接口
export interface UserDocument {
  id?: string;
  uid: string;                    // 用户唯一标识
  username: string;               // 用户名
  phone_number: string;           // 手机号
  name?: string;                  // 昵称
  gender?: string;                // 性别
  avatar_url?: string;               // 头像
  locale?: string;                // 地区
  created_at: number;             // 创建时间
  updated_at: number;             // 更新时间
  last_login_at?: number;         // 最后登录时间
  login_count: number;            // 登录次数
  is_active: boolean;             // 是否激活
}

// 创建用户文档请求参数
export interface CreateUserRequest {
  uid: string;
  username: string;
  phone_number: string;
  name?: string;
  gender?: string;
  avatar_url?: string;
  locale?: string;
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
  async createUser(userData: CreateUserRequest): Promise<DatabaseResponse<{ id: string }>> {
    try {
      const now = Date.now();
      
      const createData = {
        uid: userData.uid,         // 来自CloudBase返回的sub字段
        username: userData.username,
        name: userData.name || '',
        gender: userData.gender || '',
        avatar_url: userData.avatar_url || '',
        phone_number: userData.phone_number || '',
        locale: userData.locale || 'zh-CN',
        created_at: now,
        updated_at: now,
        last_login_at: now,
        login_count: 1,
        is_active: true,
      };

      // 使用 upsert 接口创建用户文档
      const response = await databaseService.post<{ id: string }>(
        `/model/prod/${this.modelName}/upsert`,
        {
          filter: {
            uid: userData.uid
          },
          create: createData,
          update: createData  // 如果用户已存在，则更新为相同数据
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '创建用户失败',
          response.error?.code || 'CREATE_USER_ERROR'
        );
      }

      return {
        success: true,
        data: { id: response.data?.id || '' },
      };
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
  async getUserByUid(uid: string): Promise<DatabaseResponse<UserDocument>> {
    try {
      const response = await databaseService.post<UserDocument>(
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
            avatar_url: true,
            locale: true,
            created_at: true,
          }
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '获取用户信息失败',
          response.error?.code || 'GET_USER_ERROR'
        );
      }

      return {
        success: true,
        data: response.data,
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
}

// 创建用户数据服务实例
export const userDataService = new UserDataService();

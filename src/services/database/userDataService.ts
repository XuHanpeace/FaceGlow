import { databaseService, DatabaseResponse, DatabaseError } from './databaseService';

// 用户数据模型接口
export interface UserDocument {
  _id?: string;                   // 文档ID（CloudBase自动生成）
  uid: string;                    // 用户唯一标识
  username: string;               // 用户名
  phone_number: string;           // 手机号
  name?: string;                  // 昵称
  gender?: string;                // 性别
  picture?: string;               // 头像（CloudBase中的字段名）
}

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
  async createUser(userData: CreateUserRequest): Promise<DatabaseResponse<{ id: string }>> {
    try {
      const createData = {
        uid: userData.uid,         // 来自CloudBase返回的sub字段
        username: userData.username,
        phone_number: userData.phone_number,
        name: userData.name || '',
        gender: userData.gender || '',
        picture: userData.picture || '',
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

import { databaseService, DatabaseResponse, DatabaseError, DatabaseUpdateResponse } from './databaseService';
import { UserWorkModel } from '../../types/model/user_works';

// 查询用户作品请求参数
export interface QueryUserWorksRequest {
  uid: string;
  is_public?: string;            // 可选：按公开状态筛选（CloudBase中为文本类型）
  limit?: number;                // 可选：限制返回数量
  offset?: number;               // 可选：偏移量
}

// 用户作品数据服务类
export class UserWorkService {
  private readonly modelName = 'user_works'; // 数据模型名称

  // 根据用户ID查询作品列表
  async getUserWorks(query: QueryUserWorksRequest) {
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('pageSize', (query.limit || 20).toString());
      params.append('pageNumber', '1');
      params.append('getCount', 'true');
      
      // 添加过滤条件
      params.append('filter', JSON.stringify({
        where: {
          uid: {
            $eq: query.uid
          }
        }
      }));

      // 添加排序参数：按创建时间倒序
      params.append('orderBy', JSON.stringify({
        createdAt: 'DESC'
      }));

      // 使用GET请求到list端点
      const response = await databaseService.get<DatabaseResponse<UserWorkModel>>(
        `/model/prod/${this.modelName}/list?${params.toString()}`
      );

      console.log('查询用户作品响应:', response); // 打印响应到控制台

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '获取用户作品失败',
          response.error?.code || 'GET_USER_WORKS_ERROR'
        );
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('获取用户作品异常:', error); // 打印异常到控制台
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'GET_USER_WORKS_ERROR',
          message: error instanceof Error ? error.message : '获取用户作品时发生未知错误',
        },
      };
    }
  }

  // 根据作品ID获取单个作品详情
  async getWorkById(workId: string) {
    try {
      const response = await databaseService.get<DatabaseResponse<UserWorkModel>>(
        `/model/prod/${this.modelName}/get?_id=${workId}`
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'GET_WORK_ERROR',
          message: response.error?.message || '获取作品详情失败',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'GET_WORK_ERROR',
          message: error instanceof Error ? error.message : '获取作品详情时发生未知错误',
        },
      };
    }
  }

  // 创建新作品
  async createWork(workData: Omit<UserWorkModel, '_id'>) {
    try {
      const createData = {
        ...workData,
        activity_type: workData.activity_type || 'album',
        download_count: workData.download_count || '0',
        likes: workData.likes || '0',
        uid: workData.uid,
      };

      const response = await databaseService.post<DatabaseUpdateResponse<{ id: string }>>(
        `/model/prod/${this.modelName}/create`,
        {
          data: createData
        }
      );

      if (response.data?.id && response.success) {
        return {
          success: true,
          data: {
            id: response.data.id
          },
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'CREATE_WORK_ERROR',
          message: response.error?.message || '创建作品失败',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'CREATE_WORK_ERROR',
          message: error instanceof Error ? error.message : '创建作品时发生未知错误',
        },
      };
    }
  }

  // 根据任务ID获取单个作品详情
  async getWorkByTaskId(taskId: string) {
    try {
      // 按照文档截图使用 POST 方式调用 get 接口查询单条数据
      const response = await databaseService.post<DatabaseResponse<UserWorkModel>>(
        `/model/prod/${this.modelName}/get`,
        {
          filter: {
            where: {
              taskId: {
                $eq: taskId
              }
            }
          }
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          code: 'WORK_NOT_FOUND',
          message: '未找到对应任务ID的作品',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'GET_WORK_ERROR',
          message: error instanceof Error ? error.message : '根据任务ID获取作品失败',
        },
      };
    }
  }

  // 更新作品信息
  async updateWork(workId: string, updateData: Partial<UserWorkModel>) {
    try {
      const response = await databaseService.put<DatabaseUpdateResponse<any>>(
        `/model/prod/${this.modelName}/update`,
        {
          filter: {
            where: {
              _id: {
                $eq: workId
              }
            }
          },
          data: updateData
        }
      );

      if (response.success) {
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'UPDATE_WORK_ERROR',
          message: response.error?.message || '更新作品失败',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'UPDATE_WORK_ERROR',
          message: error instanceof Error ? error.message : '更新作品时发生未知错误',
        },
      };
    }
  }

  // 删除作品
  async deleteWork(workId: string) {
    try {
      const response = await databaseService.post<DatabaseUpdateResponse<any>>(
        `/model/prod/${this.modelName}/delete`,
        {
          filter: {
            where: {
              _id: {
                $eq: workId
              }
            }
          }
        }
      );

      if (response.success) {
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: {
          code: response.error?.code || 'DELETE_WORK_ERROR',
          message: response.error?.message || '删除作品失败',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'DELETE_WORK_ERROR',
          message: error instanceof Error ? error.message : '删除作品时发生未知错误',
        },
      };
    }
  }
}

// 创建用户作品服务实例
export const userWorkService = new UserWorkService();

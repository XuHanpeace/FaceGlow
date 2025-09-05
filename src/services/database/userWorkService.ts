import { databaseService, DatabaseResponse, DatabaseError, DatabaseCreateResponse } from './databaseService';
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
  async getUserWorks(query: QueryUserWorksRequest): Promise<DatabaseResponse<UserWorkModel>> {
    try {
      const response = await databaseService.post<UserWorkModel>(
        `/model/prod/${this.modelName}/get`,
        {
          filter: {
            where: {
              uid: {
                $eq: query.uid
              }
            }
          },
          select: {
            _id: true,
            uid: true,
            template_id: true,
            original_image: true,
            result_image: true,
            likes: true,
            is_public: true,
            download_count: true
          }
        }
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
  async getWorkById(workId: string): Promise<DatabaseResponse<UserWorkModel>> {
    try {
      const response = await databaseService.post<UserWorkModel>(
        `/model/prod/${this.modelName}/get`,
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

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '获取作品详情失败',
          response.error?.code || 'GET_WORK_ERROR'
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
          code: error instanceof DatabaseError ? error.code : 'GET_WORK_ERROR',
          message: error instanceof Error ? error.message : '获取作品详情时发生未知错误',
        },
      };
    }
  }

  // 创建新作品
  async createWork(workData: Omit<UserWorkModel, '_id'>): Promise<DatabaseCreateResponse<{ id: string }>> {
    try {
      const createData = {
        ...workData,
        download_count: workData.download_count || '0',
        likes: workData.likes || '0',
        uid: workData.uid,
      };

      const response = await databaseService.post<{ id: string }>(
        `/model/prod/${this.modelName}/create`,
        {
          data: createData
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '创建作品失败',
          response.error?.code || 'CREATE_WORK_ERROR'
        );
      }

      return {
        success: true,
        data: response.data as { id: string },
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

  // 创建测试作品
  async createTestWork(uid: string): Promise<DatabaseResponse<{ id: string }>> {
    try {
      const now = Date.now();
      
      const testWorkData = {
        uid: uid,
        template_id: 'test_template_001',
        original_image: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Original',
        result_image: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Result',
        status: 2, // 成功状态
        is_public: true,
        processing_time: 15,
        download_count: 0,
        likes: 0,
        comments: [],
        created_at: now,
        metadata: {
          test: true,
          description: '这是一个测试作品',
          created_at: now
        }
      };

      const response = await databaseService.post<{ id: string }>(
        `/model/prod/${this.modelName}/create`,
        {
          data: testWorkData
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '创建测试作品失败',
          response.error?.code || 'CREATE_TEST_WORK_ERROR'
        );
      }

      return {
        success: true,
        data: { id: (response.data as any)?.id || '' },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'CREATE_TEST_WORK_ERROR',
          message: error instanceof Error ? error.message : '创建测试作品时发生未知错误',
        },
      };
    }
  }

  // 更新作品状态
  async updateWorkStatus(workId: string, status: string, processingTime?: number): Promise<DatabaseResponse<{ count: number }>> {
    try {
      const updateData: any = { status };
      if (processingTime !== undefined) {
        updateData.processing_time = processingTime;
      }

      const response = await databaseService.post<{ count: number }>(
        `/model/prod/${this.modelName}/upsert`,
        {
          filter: {
            where: {
              _id: {
                $eq: workId
              }
            }
          },
          create: {
            _id: workId,
            ...updateData
          },
          update: updateData
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '更新作品状态失败',
          response.error?.code || 'UPDATE_WORK_STATUS_ERROR'
        );
      }

      return {
        success: true,
        data: { count: (response.data as any)?.count || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'UPDATE_WORK_STATUS_ERROR',
          message: error instanceof Error ? error.message : '更新作品状态时发生未知错误',
        },
      };
    }
  }

  // 增加作品点赞数
  async incrementLikes(workId: string): Promise<DatabaseResponse<{ count: number }>> {
    try {
      const response = await databaseService.post<{ count: number }>(
        `/model/prod/${this.modelName}/upsert`,
        {
          filter: {
            where: {
              _id: {
                $eq: workId
              }
            }
          },
          create: {
            _id: workId,
            likes: 1
          },
          update: {
            likes: { $inc: 1 }
          }
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '增加点赞数失败',
          response.error?.code || 'INCREMENT_LIKES_ERROR'
        );
      }

      return {
        success: true,
        data: { count: (response.data as any)?.count || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'INCREMENT_LIKES_ERROR',
          message: error instanceof Error ? error.message : '增加点赞数时发生未知错误',
        },
      };
    }
  }

  // 增加作品下载次数
  async incrementDownloadCount(workId: string): Promise<DatabaseResponse<{ count: number }>> {
    try {
      const response = await databaseService.post<{ count: number }>(
        `/model/prod/${this.modelName}/upsert`,
        {
          filter: {
            where: {
              _id: {
                $eq: workId
              }
            }
          },
          create: {
            _id: workId,
            download_count: 1
          },
          update: {
            download_count: { $inc: 1 }
          }
        }
      );

      if (!response.success) {
        throw new DatabaseError(
          response.error?.message || '增加下载次数失败',
          response.error?.code || 'INCREMENT_DOWNLOAD_COUNT_ERROR'
        );
      }

      return {
        success: true,
        data: { count: (response.data as any)?.count || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DatabaseError ? error.code : 'INCREMENT_DOWNLOAD_COUNT_ERROR',
          message: error instanceof Error ? error.message : '增加下载次数时发生未知错误',
        },
      };
    }
  }
}

// 创建用户作品服务实例
export const userWorkService = new UserWorkService();

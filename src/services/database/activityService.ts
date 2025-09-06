import { databaseService, DatabaseResponse, DatabaseError } from './databaseService';
import { Activity, ActivityQueryParams, ActivityListResponse } from '../../types/model/activity';

// 活动数据服务类
export class ActivityService {
  private readonly modelName = 'activity'; // 数据模型名称

  // 获取活动列表
  async getActivities(params?: ActivityQueryParams): Promise<ActivityListResponse> {
    try {
      // 构建查询参数
      const queryParams: any = {};
      
      // 添加分页参数
      if (params?.page_size) {
        queryParams.pageSize = params.page_size;
      }
      if (params?.page) {
        queryParams.pageNumber = params.page;
      }
      
      // 获取总数
      queryParams.getCount = true;

      const response = await databaseService.get<DatabaseResponse<Activity[]>>(
        `/model/prod/${this.modelName}/list`,
        queryParams
      )

      if (response.success && response.data && response.data.records) {
        return {
          code: 200,
          message: '获取活动列表成功',
          data: response.data.records
        };
      }

      return {
        code: 404,
        message: '未找到活动数据',
        data: []
      };
    } catch (error) {
      return {
        code: 500,
        message: error instanceof Error ? error.message : '获取活动数据时发生未知错误',
        data: []
      };
    }
  }
}

// 创建活动数据服务实例
export const activityService = new ActivityService();

import { userService } from './userService';
import { imageUploadService } from './imageUploadService';
import { cloudbaseHttpApi } from './cloudbaseHttpApi';
import { 
  FaceSwapRecord, 
  FaceSwapRequest, 
  FaceSwapResponse,
  User 
} from '../types/user';

/**
 * 换脸服务
 * 整合用户管理、图片上传和换脸功能
 */
class FaceSwapService {
  private readonly PROJECT_ID = 'at_1888958525505814528';

  /**
   * 执行换脸操作
   * @param templateId 模板ID
   * @param originalImageUri 原始图片本地路径
   * @returns 换脸结果
   */
  async performFaceSwap(
    templateId: string,
    originalImageUri: string
  ): Promise<FaceSwapResponse> {
    try {
      // 1. 获取或创建当前用户
      const currentUser = await userService.getOrCreateAnonymousUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      // 2. 上传原始图片到云存储
      console.log('开始上传原始图片...');
      const originalImageUrl = await imageUploadService.uploadImage(
        originalImageUri, 
        currentUser.id, 
        'user_photos'
      );
      console.log('原始图片上传成功:', originalImageUrl);

      // 3. 创建换脸记录
      console.log('创建换脸记录...');
      const record = await userService.createFaceSwapRecord(
        currentUser.id,
        templateId,
        `Template_${templateId}`, // 这里应该获取实际的模板名称
        originalImageUrl
      );
      console.log('换脸记录创建成功:', record.id);

      // 4. 调用换脸云函数
      console.log('调用换脸云函数...');
      const faceSwapResult = await this.callFaceSwapFunction({
        userId: currentUser.id,
        templateId,
        originalImageUrl,
        projectId: this.PROJECT_ID,
      });

      if (!faceSwapResult.success) {
        // 更新记录状态为失败
        await userService.updateFaceSwapRecord(record.id, {
          status: 'failed',
          errorMessage: faceSwapResult.errorMessage || '换脸处理失败',
        });
        
        throw new Error(faceSwapResult.errorMessage || '换脸处理失败');
      }

      // 5. 上传结果图片到云存储
      console.log('开始上传结果图片...');
      const resultImageUrl = await imageUploadService.uploadResultImage(
        faceSwapResult.resultImageUrl || '',
        currentUser.id,
        record.id
      );
      console.log('结果图片上传成功:', resultImageUrl);

      // 6. 更新换脸记录
      console.log('更新换脸记录...');
      const updatedRecord = await userService.updateFaceSwapRecord(record.id, {
        status: 'completed',
        resultImageUrl,
        completedAt: Date.now(),
        metadata: {
          processingTime: Date.now() - record.createdAt,
        },
      });

      console.log('换脸操作完成:', updatedRecord);

      return {
        success: true,
        recordId: record.id,
        resultImageUrl,
        status: 'completed',
      };

    } catch (error) {
      console.error('换脸操作失败:', error);
      
      return {
        success: false,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '换脸操作失败',
      };
    }
  }

  /**
   * 调用换脸云函数
   */
  private async callFaceSwapFunction(request: FaceSwapRequest): Promise<FaceSwapResponse> {
    try {
      const result = await cloudbaseHttpApi.callFunction('fusion', {
        projectId: request.projectId,
        modelId: request.templateId,
        imageUrl: request.originalImageUrl,
        userId: request.userId,
        timestamp: Date.now(),
      });

      // 检查云函数返回结果
      if (result.data && result.data.FusedImage) {
        return {
          success: true,
          resultImageUrl: result.data.FusedImage,
          status: 'completed',
        };
      } else {
        return {
          success: false,
          status: 'failed',
          errorMessage: '云函数返回结果格式错误',
        };
      }
    } catch (error) {
      console.error('调用换脸云函数失败:', error);
      return {
        success: false,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '云函数调用失败',
      };
    }
  }

  /**
   * 获取用户的换脸历史
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页大小
   * @returns 换脸记录列表
   */
  async getUserFaceSwapHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    try {
      return await userService.getUserFaceSwapRecords(userId, {
        page,
        pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    } catch (error) {
      console.error('获取换脸历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取换脸记录详情
   * @param recordId 记录ID
   * @returns 换脸记录详情
   */
  async getFaceSwapRecord(recordId: string): Promise<FaceSwapRecord | null> {
    try {
      const allRecords = await userService.getAllFaceSwapRecords();
      return allRecords.find(record => record.id === recordId) || null;
    } catch (error) {
      console.error('获取换脸记录详情失败:', error);
      return null;
    }
  }

  /**
   * 删除换脸记录
   * @param recordId 记录ID
   * @param userId 用户ID（用于权限验证）
   * @returns 是否删除成功
   */
  async deleteFaceSwapRecord(recordId: string, userId: string): Promise<boolean> {
    try {
      // 获取记录详情
      const record = await this.getFaceSwapRecord(recordId);
      if (!record) {
        throw new Error('记录不存在');
      }

      // 验证权限
      if (record.userId !== userId) {
        throw new Error('无权限删除此记录');
      }

      // 删除云存储中的图片
      if (record.originalImageUrl) {
        await imageUploadService.deleteImage(record.originalImageUrl);
      }
      if (record.resultImageUrl) {
        await imageUploadService.deleteImage(record.resultImageUrl);
      }

      // 从本地记录中删除
      const allRecords = await userService.getAllFaceSwapRecords();
      const filteredRecords = allRecords.filter(r => r.id !== recordId);
      
      // 这里需要调用 userService 的方法来更新记录
      // 由于 userService 没有提供删除方法，我们需要直接操作存储
      // 或者扩展 userService 添加删除方法
      
      // 临时实现：直接更新存储
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem('user_face_swap_records', JSON.stringify(filteredRecords));

      // 更新用户统计
      await userService.updateUserStats(userId, { totalSwaps: -1 });
      if (record.status === 'completed') {
        await userService.updateUserStats(userId, { successfulSwaps: -1 });
      } else if (record.status === 'failed') {
        await userService.updateUserStats(userId, { failedSwaps: -1 });
      }

      return true;
    } catch (error) {
      console.error('删除换脸记录失败:', error);
      return false;
    }
  }

  /**
   * 重新处理失败的换脸记录
   * @param recordId 记录ID
   * @returns 是否重新处理成功
   */
  async retryFaceSwap(recordId: string): Promise<boolean> {
    try {
      const record = await this.getFaceSwapRecord(recordId);
      if (!record) {
        throw new Error('记录不存在');
      }

      if (record.status !== 'failed') {
        throw new Error('只能重新处理失败的记录');
      }

      // 更新记录状态为处理中
      await userService.updateFaceSwapRecord(recordId, {
        status: 'processing',
        errorMessage: undefined,
      });

      // 重新执行换脸
      const result = await this.performFaceSwap(record.templateId, record.originalImageUrl);
      
      return result.success;
    } catch (error) {
      console.error('重新处理换脸记录失败:', error);
      return false;
    }
  }

  /**
   * 获取用户统计信息
   * @param userId 用户ID
   * @returns 用户统计信息
   */
  async getUserStats(userId: string) {
    try {
      return await userService.getUserStats(userId);
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return null;
    }
  }
}

// 导出单例实例
export const faceSwapService = new FaceSwapService();

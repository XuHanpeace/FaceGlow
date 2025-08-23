import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfo } from 'react-native-device-info';
import { 
  User, 
  FaceSwapRecord, 
  UserStats, 
  LoginResponse, 
  FaceSwapResponse,
  QueryResult,
  PaginationParams 
} from '../types/user';
import { cloudbaseHttpApi } from './cloudbaseHttpApi';

/**
 * 用户服务类
 * 负责用户管理、换脸记录管理等功能
 */
class UserService {
  private readonly USER_STORAGE_KEY = 'current_user';
  private readonly USER_RECORDS_KEY = 'user_face_swap_records';
  private readonly USER_STATS_KEY = 'user_stats';

  /**
   * 获取或创建匿名用户
   */
  async getOrCreateAnonymousUser(): Promise<User> {
    try {
      // 先尝试从本地存储获取用户
      const existingUser = await this.getCurrentUser();
      if (existingUser && existingUser.isAnonymous) {
        // 更新最后登录时间
        const updatedUser = {
          ...existingUser,
          lastLoginAt: Date.now(),
        };
        await this.saveUser(updatedUser);
        return updatedUser;
      }

      // 创建新的匿名用户
      const deviceId = await DeviceInfo.getUniqueId();
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deviceId,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        isAnonymous: true,
        status: 'active',
      };

      // 保存用户信息
      await this.saveUser(newUser);
      
      // 初始化用户统计
      await this.initializeUserStats(newUser.id);
      
      return newUser;
    } catch (error) {
      console.error('获取或创建匿名用户失败:', error);
      throw new Error('用户初始化失败');
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  /**
   * 保存用户信息
   */
  private async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('保存用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const updatedUser = { ...currentUser, ...updates };
      await this.saveUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 初始化用户统计信息
   */
  private async initializeUserStats(userId: string): Promise<void> {
    try {
      const stats: UserStats = {
        userId,
        totalSwaps: 0,
        successfulSwaps: 0,
        failedSwaps: 0,
        totalStorageUsed: 0,
        favoriteTemplates: [],
      };
      
      await AsyncStorage.setItem(
        `${this.USER_STATS_KEY}_${userId}`, 
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error('初始化用户统计失败:', error);
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const statsData = await AsyncStorage.getItem(`${this.USER_STATS_KEY}_${userId}`);
      return statsData ? JSON.parse(statsData) : null;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return null;
    }
  }

  /**
   * 创建换脸记录
   */
  async createFaceSwapRecord(
    userId: string,
    templateId: string,
    templateName: string,
    originalImageUrl: string
  ): Promise<FaceSwapRecord> {
    try {
      const record: FaceSwapRecord = {
        id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        templateId,
        templateName,
        originalImageUrl,
        resultImageUrl: '',
        status: 'processing',
        createdAt: Date.now(),
      };

      // 保存记录到本地
      await this.saveFaceSwapRecord(record);
      
      // 更新用户统计
      await this.updateUserStats(userId, { totalSwaps: 1 });
      
      return record;
    } catch (error) {
      console.error('创建换脸记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新换脸记录
   */
  async updateFaceSwapRecord(
    recordId: string,
    updates: Partial<FaceSwapRecord>
  ): Promise<FaceSwapRecord> {
    try {
      const records = await this.getAllFaceSwapRecords();
      const recordIndex = records.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        throw new Error('换脸记录不存在');
      }

      const updatedRecord = { ...records[recordIndex], ...updates };
      records[recordIndex] = updatedRecord;
      
      await AsyncStorage.setItem(this.USER_RECORDS_KEY, JSON.stringify(records));
      
      // 如果状态变为完成，更新用户统计
      if (updates.status === 'completed' && updates.resultImageUrl) {
        const record = updatedRecord;
        await this.updateUserStats(record.userId, { 
          successfulSwaps: 1,
          lastSwapAt: Date.now()
        });
      }
      
      return updatedRecord;
    } catch (error) {
      console.error('更新换脸记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有换脸记录
   */
  async getAllFaceSwapRecords(): Promise<FaceSwapRecord[]> {
    try {
      const recordsData = await AsyncStorage.getItem(this.USER_RECORDS_KEY);
      return recordsData ? JSON.parse(recordsData) : [];
    } catch (error) {
      console.error('获取换脸记录失败:', error);
      return [];
    }
  }

  /**
   * 获取用户的换脸记录
   */
  async getUserFaceSwapRecords(
    userId: string,
    pagination?: PaginationParams
  ): Promise<QueryResult<FaceSwapRecord>> {
    try {
      const allRecords = await this.getAllFaceSwapRecords();
      const userRecords = allRecords.filter(r => r.userId === userId);
      
      if (!pagination) {
        return {
          data: userRecords,
          total: userRecords.length,
          page: 1,
          pageSize: userRecords.length,
          hasMore: false,
        };
      }

      const { page, pageSize, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      
      // 排序
      const sortedRecords = userRecords.sort((a, b) => {
        const aValue = a[sortBy as keyof FaceSwapRecord];
        const bValue = b[sortBy as keyof FaceSwapRecord];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

      return {
        data: paginatedRecords,
        total: userRecords.length,
        page,
        pageSize,
        hasMore: endIndex < userRecords.length,
      };
    } catch (error) {
      console.error('获取用户换脸记录失败:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        hasMore: false,
      };
    }
  }

  /**
   * 保存换脸记录
   */
  private async saveFaceSwapRecord(record: FaceSwapRecord): Promise<void> {
    try {
      const existingRecords = await this.getAllFaceSwapRecords();
      existingRecords.push(record);
      await AsyncStorage.setItem(this.USER_RECORDS_KEY, JSON.stringify(existingRecords));
    } catch (error) {
      console.error('保存换脸记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户统计
   */
  private async updateUserStats(
    userId: string, 
    updates: Partial<UserStats>
  ): Promise<void> {
    try {
      const currentStats = await this.getUserStats(userId) || {
        userId,
        totalSwaps: 0,
        successfulSwaps: 0,
        failedSwaps: 0,
        totalStorageUsed: 0,
        favoriteTemplates: [],
      };

      const updatedStats = { ...currentStats, ...updates };
      
      // 处理增量更新
      if (updates.totalSwaps) {
        updatedStats.totalSwaps = currentStats.totalSwaps + updates.totalSwaps;
      }
      if (updates.successfulSwaps) {
        updatedStats.successfulSwaps = currentStats.successfulSwaps + updates.successfulSwaps;
      }
      if (updates.failedSwaps) {
        updatedStats.failedSwaps = currentStats.failedSwaps + updates.failedSwaps;
      }

      await AsyncStorage.setItem(
        `${this.USER_STATS_KEY}_${userId}`, 
        JSON.stringify(updatedStats)
      );
    } catch (error) {
      console.error('更新用户统计失败:', error);
    }
  }

  /**
   * 添加收藏模板
   */
  async addFavoriteTemplate(userId: string, templateId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      if (stats && !stats.favoriteTemplates.includes(templateId)) {
        stats.favoriteTemplates.push(templateId);
        await AsyncStorage.setItem(
          `${this.USER_STATS_KEY}_${userId}`, 
          JSON.stringify(stats)
        );
      }
    } catch (error) {
      console.error('添加收藏模板失败:', error);
    }
  }

  /**
   * 移除收藏模板
   */
  async removeFavoriteTemplate(userId: string, templateId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      if (stats) {
        stats.favoriteTemplates = stats.favoriteTemplates.filter(id => id !== templateId);
        await AsyncStorage.setItem(
          `${this.USER_STATS_KEY}_${userId}`, 
          JSON.stringify(stats)
        );
      }
    } catch (error) {
      console.error('移除收藏模板失败:', error);
    }
  }

  /**
   * 清理用户数据
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
      await AsyncStorage.removeItem(`${this.USER_STATS_KEY}_${userId}`);
      
      // 清理该用户的换脸记录
      const allRecords = await this.getAllFaceSwapRecords();
      const filteredRecords = allRecords.filter(r => r.userId !== userId);
      await AsyncStorage.setItem(this.USER_RECORDS_KEY, JSON.stringify(filteredRecords));
    } catch (error) {
      console.error('清理用户数据失败:', error);
    }
  }
}

// 导出单例实例
export const userService = new UserService();

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TaskType,
  TaskProgress,
  TaskStorageData,
  TaskWithProgress,
  TaskStatus,
  NEWCOMER_TASKS,
  getTaskByType,
  getTaskById,
} from '../types/model/task';
import { rewardService } from './rewardService';

const TASK_STORAGE_KEY = '@faceglow_task_progress';
const CURRENT_VERSION = 1;

/**
 * 任务服务
 * 负责任务进度的本地存储、读取和更新
 */
class TaskService {
  private cachedData: TaskStorageData | null = null;

  /**
   * 初始化任务进度数据
   */
  private initializeProgressMap(): Record<string, TaskProgress> {
    const progressMap: Record<string, TaskProgress> = {};
    NEWCOMER_TASKS.forEach(task => {
      progressMap[task.id] = {
        taskId: task.id,
        currentCount: 0,
        isCompleted: false,
        isRewardClaimed: false,
      };
    });
    return progressMap;
  }

  /**
   * 从本地存储读取任务数据（不修改缓存，用于更新时拿到最新持久化数据，避免并发导致覆盖）
   */
  private async loadTaskDataFromStorage(): Promise<TaskStorageData> {
    try {
      const jsonStr = await AsyncStorage.getItem(TASK_STORAGE_KEY);
      if (jsonStr) {
        const data = JSON.parse(jsonStr) as TaskStorageData;
        if (data.version === CURRENT_VERSION && data.progressMap) {
          return data;
        }
      }
    } catch (error) {
      console.error('[TaskService] 从存储读取任务数据失败:', error);
    }
    return {
      version: CURRENT_VERSION,
      progressMap: this.initializeProgressMap(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * 从本地存储加载任务数据
   */
  async loadTaskData(): Promise<TaskStorageData> {
    const data = await this.loadTaskDataFromStorage();
    this.cachedData = data;
    return data;
  }

  /**
   * 保存任务数据到本地存储
   */
  async saveTaskData(data: TaskStorageData): Promise<void> {
    try {
      data.lastUpdated = Date.now();
      await AsyncStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(data));
      this.cachedData = data;
      console.log('[TaskService] 任务数据已保存');
    } catch (error) {
      console.error('[TaskService] 保存任务数据失败:', error);
    }
  }

  /**
   * 获取所有任务及其进度
   */
  async getAllTasksWithProgress(): Promise<TaskWithProgress[]> {
    const data = this.cachedData || (await this.loadTaskData());
    
    return NEWCOMER_TASKS.map(task => {
      const storedProgress = data.progressMap[task.id];
      // 为了避免 Redux Toolkit 在 dev 下冻结对象，始终返回一份拷贝给 Redux
      const progress: TaskProgress = storedProgress
        ? { ...storedProgress }
        : {
            taskId: task.id,
            currentCount: 0,
            isCompleted: false,
            isRewardClaimed: false,
          };

      let status: TaskStatus = 'pending';
      if (progress.isRewardClaimed) {
        status = 'claimed';
      } else if (progress.isCompleted) {
        status = 'completed';
      }

      return {
        ...task,
        progress,
        status,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * 获取单个任务的进度
   */
  async getTaskProgress(taskId: string): Promise<TaskProgress | null> {
    const data = this.cachedData || (await this.loadTaskData());
    return data.progressMap[taskId] || null;
  }

  /**
   * 更新任务进度（根据任务类型）
   * @param taskType 任务类型
   * @param incrementBy 增加的次数，默认为1
   * @returns 更新后的任务进度及是否本次刚达成完成
   */
  async updateTaskProgressByType(
    taskType: TaskType,
    incrementBy: number = 1
  ): Promise<{ progress: TaskProgress; justCompleted: boolean; taskTitle: string } | null> {
    const taskDef = getTaskByType(taskType);
    if (!taskDef) {
      console.warn('[TaskService] 未找到任务类型:', taskType);
      return null;
    }
    const safeIncrement = Math.max(1, Number(incrementBy) || 1);
    const result = await this.updateTaskProgress(taskDef.id, safeIncrement);
    if (!result) return null;
    return {
      progress: result.progress,
      justCompleted: result.justCompleted,
      taskTitle: taskDef.title,
    };
  }

  /**
   * 更新任务进度（根据任务ID）
   * @param taskId 任务ID
   * @param incrementBy 增加的次数，默认为1
   * @returns 更新后的任务进度及是否本次刚达成完成
   */
  async updateTaskProgress(
    taskId: string,
    incrementBy: number = 1
  ): Promise<{ progress: TaskProgress; justCompleted: boolean } | null> {
    // 更新时始终从存储读最新数据，避免与 fetchTasks 等并发导致用旧缓存覆盖
    const data = await this.loadTaskDataFromStorage();
    const taskDef = getTaskById(taskId);

    if (!taskDef) {
      console.warn('[TaskService] 未找到任务:', taskId);
      return null;
    }

    const safeIncrement = Math.max(1, Number(incrementBy) || 1);
    const storedProgress = data.progressMap[taskId];
    let progress: TaskProgress = storedProgress
      ? { ...storedProgress }
      : {
          taskId,
          currentCount: 0,
          isCompleted: false,
          isRewardClaimed: false,
        };

    if (progress.isRewardClaimed) {
      console.log('[TaskService] 任务已领取奖励，跳过更新:', taskId);
      return { progress, justCompleted: false };
    }

    const previousCompleted = progress.isCompleted;
    const previousCount = progress.currentCount;
    progress.currentCount = Math.min(
      progress.currentCount + safeIncrement,
      taskDef.targetCount
    );

    if (progress.currentCount >= taskDef.targetCount && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = Date.now();
      console.log('[TaskService] 任务完成:', taskId);
    }

    const justCompleted = !previousCompleted && progress.isCompleted;

    data.progressMap[taskId] = progress;
    this.cachedData = data;
    await this.saveTaskData(data);

    console.log('[TaskService] 任务进度更新:', {
      taskId,
      previousCount,
      incrementBy: safeIncrement,
      currentCount: progress.currentCount,
      targetCount: taskDef.targetCount,
      isCompleted: progress.isCompleted,
    });

    return { progress, justCompleted };
  }

  /**
   * 领取任务奖励
   * @param taskId 任务ID
   * @returns 领取结果
   */
  async claimReward(taskId: string): Promise<{
    success: boolean;
    rewardAmount?: number;
    newBalance?: number;
    error?: string;
  }> {
    // 领取奖励时也从存储拿最新数据，避免并发覆盖 & Redux 冻结
    const data = await this.loadTaskDataFromStorage();
    const taskDef = getTaskById(taskId);
    
    if (!taskDef) {
      return { success: false, error: '任务不存在' };
    }

    const storedProgress = data.progressMap[taskId];
    if (!storedProgress) {
      return { success: false, error: '任务进度不存在' };
    }

    // 拷贝一份，避免直接改到 Redux 冻结的对象
    const progress: TaskProgress = { ...storedProgress };

    if (!progress.isCompleted) {
      return { success: false, error: '任务尚未完成' };
    }

    if (progress.isRewardClaimed) {
      return { success: false, error: '奖励已领取' };
    }

    // 发放奖励
    const rewardResult = await rewardService.grantReward(
      taskDef.rewardAmount,
      `新人任务奖励: ${taskDef.title}`,
      `task_reward_${taskId}_${Date.now()}`
    );

    if (!rewardResult.success) {
      return { success: false, error: rewardResult.error || '发放奖励失败' };
    }

    // 更新领取状态
    progress.isRewardClaimed = true;
    progress.claimedAt = Date.now();
    data.progressMap[taskId] = progress;
    await this.saveTaskData(data);

    console.log('[TaskService] 奖励已领取:', {
      taskId,
      rewardAmount: taskDef.rewardAmount,
      newBalance: rewardResult.newBalance,
    });

    return {
      success: true,
      rewardAmount: taskDef.rewardAmount,
      newBalance: rewardResult.newBalance,
    };
  }

  /**
   * 获取可领取奖励的任务数量
   */
  async getClaimableTaskCount(): Promise<number> {
    const tasks = await this.getAllTasksWithProgress();
    return tasks.filter(t => t.status === 'completed').length;
  }

  /**
   * 获取未完成任务数量
   */
  async getPendingTaskCount(): Promise<number> {
    const tasks = await this.getAllTasksWithProgress();
    return tasks.filter(t => t.status === 'pending').length;
  }

  /**
   * 获取总可领取奖励金额
   */
  async getTotalClaimableReward(): Promise<number> {
    const tasks = await this.getAllTasksWithProgress();
    return tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.rewardAmount, 0);
  }

  /**
   * 检查是否有未领取的奖励（用于显示红点）
   */
  async hasUnclaimedRewards(): Promise<boolean> {
    const count = await this.getClaimableTaskCount();
    return count > 0;
  }

  /**
   * 检查是否有未完成的任务（用于显示红点）
   */
  async hasIncompleteTasks(): Promise<boolean> {
    const tasks = await this.getAllTasksWithProgress();
    return tasks.some(t => t.status !== 'claimed');
  }

  /**
   * 重置所有任务进度（仅用于测试）
   */
  async resetAllTasks(): Promise<void> {
    const initialData: TaskStorageData = {
      version: CURRENT_VERSION,
      progressMap: this.initializeProgressMap(),
      lastUpdated: Date.now(),
    };
    await this.saveTaskData(initialData);
    console.log('[TaskService] 所有任务已重置');
  }

  /**
   * 清除缓存（用于刷新数据）
   */
  clearCache(): void {
    this.cachedData = null;
  }
}

export const taskService = new TaskService();

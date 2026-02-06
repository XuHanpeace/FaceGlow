import { DeviceEventEmitter } from 'react-native';
import { TaskType } from '../types/model/task';

/**
 * 应用事件服务
 * 用于组件间通信，特别是跨页面的事件通知
 */
class EventService {
  // 事件类型定义
  static readonly EVENTS = {
    SHOW_REWARD_MODAL: 'SHOW_REWARD_MODAL', // 显示奖励弹窗
    // 任务相关事件
    TASK_SELFIE_UPLOADED: 'TASK_SELFIE_UPLOADED',       // 自拍上传完成
    TASK_SPRING_CREATION: 'TASK_SPRING_CREATION',       // 春节写真创作完成
    TASK_VIDEO_CREATION: 'TASK_VIDEO_CREATION',         // 视频创作完成
    TASK_WORK_SHARED: 'TASK_WORK_SHARED',               // 作品分享完成
    TASK_WORK_DOWNLOADED: 'TASK_WORK_DOWNLOADED',       // 作品下载完成
    TASK_PROGRESS_UPDATED: 'TASK_PROGRESS_UPDATED',     // 任务进度更新（通用）
  } as const;

  /**
   * 发送显示奖励弹窗事件
   * @param rewardAmount 奖励金额
   */
  emitShowRewardModal(rewardAmount: number): void {
    console.log('📢 [EventService] 发送显示奖励弹窗事件:', rewardAmount);
    DeviceEventEmitter.emit(EventService.EVENTS.SHOW_REWARD_MODAL, { rewardAmount });
  }

  /**
   * 监听显示奖励弹窗事件
   * @param callback 回调函数，接收 { rewardAmount: number }
   * @returns 清理函数
   */
  onShowRewardModal(callback: (data: { rewardAmount: number }) => void): () => void {
    const subscription = DeviceEventEmitter.addListener(
      EventService.EVENTS.SHOW_REWARD_MODAL,
      callback
    );
    return () => subscription.remove();
  }

  // ==================== 任务事件 ====================

  /**
   * 发送任务进度更新事件（通用）
   * @param taskType 任务类型
   * @param count 完成次数（默认1）
   */
  emitTaskProgress(taskType: TaskType, count: number = 1): void {
    console.log('📢 [EventService] 发送任务进度事件:', { taskType, count });
    DeviceEventEmitter.emit(EventService.EVENTS.TASK_PROGRESS_UPDATED, { taskType, count });
  }

  /**
   * 监听任务进度更新事件
   * @param callback 回调函数
   * @returns 清理函数
   */
  onTaskProgressUpdated(callback: (data: { taskType: TaskType; count: number }) => void): () => void {
    const subscription = DeviceEventEmitter.addListener(
      EventService.EVENTS.TASK_PROGRESS_UPDATED,
      callback
    );
    return () => subscription.remove();
  }

  /**
   * 发送自拍上传完成事件
   */
  emitSelfieUploaded(): void {
    console.log('📢 [EventService] 发送自拍上传完成事件');
    this.emitTaskProgress(TaskType.SELFIE_UPLOAD, 1);
  }

  /**
   * 发送春节写真创作完成事件
   */
  emitSpringCreation(): void {
    console.log('📢 [EventService] 发送春节写真创作完成事件');
    this.emitTaskProgress(TaskType.SPRING_CREATION, 1);
  }

  /**
   * 发送视频创作完成事件
   */
  emitVideoCreation(): void {
    console.log('📢 [EventService] 发送视频创作完成事件');
    this.emitTaskProgress(TaskType.VIDEO_CREATION, 1);
  }

  /**
   * 发送作品分享完成事件
   */
  emitWorkShared(): void {
    console.log('📢 [EventService] 发送作品分享完成事件');
    this.emitTaskProgress(TaskType.WORK_SHARE, 1);
  }

  /**
   * 发送作品下载完成事件
   */
  emitWorkDownloaded(): void {
    console.log('📢 [EventService] 发送作品下载完成事件');
    this.emitTaskProgress(TaskType.WORK_DOWNLOAD, 1);
  }
}

// 导出单例
export const eventService = new EventService();
export default eventService;


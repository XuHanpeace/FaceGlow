import { DeviceEventEmitter } from 'react-native';

/**
 * 应用事件服务
 * 用于组件间通信，特别是跨页面的事件通知
 */
class EventService {
  // 事件类型定义
  static readonly EVENTS = {
    SHOW_REWARD_MODAL: 'SHOW_REWARD_MODAL', // 显示奖励弹窗
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
}

// 导出单例
export const eventService = new EventService();
export default eventService;


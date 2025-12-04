import { MMKV } from 'react-native-mmkv';
import { authService } from './auth/authService';
import { STORAGE_KEYS } from '../types/auth';

// 创建MMKV存储实例
const storage = new MMKV();

// 登录提示服务专用的存储键名
const LOGIN_PROMPT_STORAGE_KEYS = {
  LOGIN_PROMPT_DISMISSED_AT: 'loginPromptDismissedAt', // 用户关闭弹窗的时间戳
  ANONYMOUS_BROWSE_START_TIME: 'anonymousBrowseStartTime', // 匿名浏览开始时间
} as const;

// 配置常量
const CONFIG = {
  ANONYMOUS_BROWSE_THRESHOLD: 2 * 60 * 1000, // 2分钟（匿名浏览阈值）
  DISMISS_COOLDOWN: 60 * 60 * 1000, // 1小时（防打扰冷却时间）
} as const;

/**
 * 登录提示服务
 * 管理登录提示弹窗的显示逻辑
 */
class LoginPromptService {
  private dismissCallback: (() => void) | null = null;
  private showCallback: ((reason: 'anonymous' | 'authLost') => void) | null = null;
  private anonymousBrowseTimer: NodeJS.Timeout | null = null;
  private wasLoggedIn: boolean = false;

  /**
   * 设置显示回调
   */
  setShowCallback(callback: (reason: 'anonymous' | 'authLost') => void) {
    this.showCallback = callback;
  }

  /**
   * 设置关闭回调
   */
  setDismissCallback(callback: () => void) {
    this.dismissCallback = callback;
  }

  /**
   * 检查是否在防打扰冷却期内
   */
  private isInCooldown(): boolean {
    const dismissedAt = storage.getNumber(LOGIN_PROMPT_STORAGE_KEYS.LOGIN_PROMPT_DISMISSED_AT);
    if (!dismissedAt) {
      return false;
    }

    const now = Date.now();
    const elapsed = now - dismissedAt;
    return elapsed < CONFIG.DISMISS_COOLDOWN;
  }

  /**
   * 记录用户关闭弹窗
   */
  recordDismiss(): void {
    storage.set(LOGIN_PROMPT_STORAGE_KEYS.LOGIN_PROMPT_DISMISSED_AT, Date.now());
    if (this.dismissCallback) {
      this.dismissCallback();
    }
  }

  /**
   * 检查是否应该显示登录提示（匿名浏览场景）
   */
  private shouldShowForAnonymous(): boolean {
    // 如果用户已经登录，不显示
    if (!authService.isAnonymous()) {
      return false;
    }

    // 如果在冷却期内，不显示
    if (this.isInCooldown()) {
      return false;
    }

    // 检查匿名浏览时长
    const browseStartTime = storage.getNumber(LOGIN_PROMPT_STORAGE_KEYS.ANONYMOUS_BROWSE_START_TIME);
    if (!browseStartTime) {
      // 记录开始时间
      storage.set(LOGIN_PROMPT_STORAGE_KEYS.ANONYMOUS_BROWSE_START_TIME, Date.now());
      return false;
    }

    const now = Date.now();
    const elapsed = now - browseStartTime;
    
    return elapsed >= CONFIG.ANONYMOUS_BROWSE_THRESHOLD;
  }

  /**
   * 检查是否应该显示登录提示（登录态丢失场景）
   */
  private shouldShowForAuthLost(): boolean {
    // 如果用户当前已登录，不显示
    if (!authService.isAnonymous() && authService.hasValidAuth()) {
      return false;
    }

    // 检查是否曾经登录过
    const hasLoggedInBefore = authService.hasLoggedInBefore();
    if (!hasLoggedInBefore) {
      return false;
    }

    // 登录态丢失场景不需要冷却期，立即显示
    return true;
  }

  /**
   * 显示登录提示（匿名浏览场景）
   */
  showForAnonymous(): void {
    if (this.shouldShowForAnonymous() && this.showCallback) {
      this.showCallback('anonymous');
    }
  }

  /**
   * 显示登录提示（登录态丢失场景）
   */
  showForAuthLost(): void {
    if (this.shouldShowForAuthLost() && this.showCallback) {
      this.showCallback('authLost');
      // 清除匿名浏览开始时间，因为已经提示过了
      storage.delete(LOGIN_PROMPT_STORAGE_KEYS.ANONYMOUS_BROWSE_START_TIME);
    }
  }

  /**
   * 手动触发显示登录提示（用于测试）
   */
  showManually(reason: 'anonymous' | 'authLost' = 'anonymous'): void {
    if (this.showCallback) {
      this.showCallback(reason);
    }
  }

  /**
   * 启动匿名浏览计时
   */
  startAnonymousBrowseTimer(): void {
    // 清除之前的计时器
    if (this.anonymousBrowseTimer) {
      clearInterval(this.anonymousBrowseTimer);
    }

    // 如果用户已登录，不启动计时
    if (!authService.isAnonymous()) {
      return;
    }

    // 记录开始时间
    storage.set(LOGIN_PROMPT_STORAGE_KEYS.ANONYMOUS_BROWSE_START_TIME, Date.now());

    // 设置定时检查
    this.anonymousBrowseTimer = setInterval(() => {
      this.showForAnonymous();
    }, 60000); // 每分钟检查一次
  }

  /**
   * 停止匿名浏览计时
   */
  stopAnonymousBrowseTimer(): void {
    if (this.anonymousBrowseTimer) {
      clearInterval(this.anonymousBrowseTimer);
      this.anonymousBrowseTimer = null;
    }
  }

  /**
   * 检查登录状态变化
   */
  checkAuthStateChange(): void {
    const isCurrentlyLoggedIn = !authService.isAnonymous() && authService.hasValidAuth();
    
    // 如果从已登录变为未登录，触发登录态丢失提示
    if (this.wasLoggedIn && !isCurrentlyLoggedIn) {
      console.log('🔔 检测到登录态丢失，显示登录提示');
      // 清除冷却期，让登录态丢失提示可以立即显示
      storage.delete(LOGIN_PROMPT_STORAGE_KEYS.LOGIN_PROMPT_DISMISSED_AT);
      this.showForAuthLost();
    }

    // 更新状态
    this.wasLoggedIn = isCurrentlyLoggedIn;

    // 如果用户登录了，清除匿名浏览计时和冷却期
    if (isCurrentlyLoggedIn) {
      this.stopAnonymousBrowseTimer();
      storage.delete(LOGIN_PROMPT_STORAGE_KEYS.ANONYMOUS_BROWSE_START_TIME);
      // 清除冷却期，因为用户已经登录了
      storage.delete(LOGIN_PROMPT_STORAGE_KEYS.LOGIN_PROMPT_DISMISSED_AT);
    } else {
      // 如果用户未登录，启动匿名浏览计时
      this.startAnonymousBrowseTimer();
    }
  }

  /**
   * 初始化服务
   */
  initialize(): void {
    // 初始化登录状态
    this.wasLoggedIn = !authService.isAnonymous() && authService.hasValidAuth();
    
    // 如果用户未登录，启动匿名浏览计时
    if (authService.isAnonymous()) {
      this.startAnonymousBrowseTimer();
    }

    // 定期检查登录状态变化（每30秒检查一次）
    setInterval(() => {
      this.checkAuthStateChange();
    }, 30000);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopAnonymousBrowseTimer();
    this.showCallback = null;
    this.dismissCallback = null;
  }
}

// 导出单例
export const loginPromptService = new LoginPromptService();


import { MMKV } from 'react-native-mmkv';
import { authService } from './auth/authService';

// 创建MMKV存储实例
const storage = new MMKV();

// 登录提示服务专用的存储键名
const LOGIN_PROMPT_STORAGE_KEYS = {
  LOGIN_PROMPT_DISMISSED_AT: 'loginPromptDismissedAt', // 用户关闭弹窗的时间戳
} as const;

// 配置常量
const CONFIG = {
  DISMISS_COOLDOWN: 60 * 60 * 1000, // 1小时（防打扰冷却时间）
} as const;

/**
 * 登录提示服务
 * 管理登录提示弹窗的显示逻辑
 */
class LoginPromptService {
  private dismissCallback: (() => void) | null = null;
  private showCallback: ((reason: 'anonymous' | 'authLost') => void) | null = null;

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

    return true;
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
   * 检查匿名登录并显示登录引导（APP回到前台时调用）
   */
  checkAnonymousOnForeground(): void {
    console.log('🔍 [LoginPrompt] APP回到前台，检查匿名登录状态...');
    
    // 如果用户是匿名登录，直接显示登录引导
    if (authService.isAnonymous()) {
      console.log('🎭 [LoginPrompt] 检测到匿名登录，显示登录引导');
      this.showForAnonymous();
    } else {
      console.log('✅ [LoginPrompt] 用户已登录，无需显示登录引导');
    }
  }

  /**
   * 初始化服务
   */
  initialize(): void {
    console.log('✅ [LoginPrompt] 登录提示服务初始化完成');
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.showCallback = null;
    this.dismissCallback = null;
  }
}

// 导出单例
export const loginPromptService = new LoginPromptService();


import { MMKV } from 'react-native-mmkv';
import { authService } from './authService';
import { STORAGE_KEYS } from '../../types/auth';

// 创建MMKV存储实例
const storage = new MMKV();

// 长期认证配置
const LONG_TERM_AUTH_CONFIG = {
  // 30天登录态保持
  MAX_IDLE_DAYS: 30,
  // 刷新token的提前时间（小时）
  REFRESH_AHEAD_HOURS: 2,
  // 检查间隔（分钟）
  CHECK_INTERVAL_MINUTES: 30,
} as const;

// 存储键
const LONG_TERM_STORAGE_KEYS = {
  LAST_ACTIVE_TIME: 'lastActiveTime',
  BACKGROUND_REFRESH_ENABLED: 'backgroundRefreshEnabled',
  REFRESH_FAILURE_COUNT: 'refreshFailureCount',
  MAX_REFRESH_FAILURES: 'maxRefreshFailures',
} as const;

/**
 * 长期认证服务
 * 负责处理长时间未使用应用的登录态保持
 */
export class LongTermAuthService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  /**
   * 初始化长期认证服务
   */
  async initialize(): Promise<void> {
    console.log('🚀 初始化长期认证服务...');
    
    // 检查是否需要恢复登录态
    await this.checkAndRestoreAuth();
    
    // 启动定期检查
    this.startPeriodicCheck();
    
    // 记录活跃时间
    this.updateLastActiveTime();
    
    console.log('✅ 长期认证服务初始化完成');
  }

  /**
   * 检查并恢复登录态
   */
  async checkAndRestoreAuth(): Promise<boolean> {
    console.log('🔍 检查并恢复登录态...');
    
    try {
      // 检查是否在30天内
      if (!this.isWithinIdlePeriod()) {
        console.log('❌ 超过30天未使用，需要重新登录');
        await this.clearExpiredAuth();
        return false;
      }

      // 检查是否有有效的refresh token
      const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        console.log('❌ 没有refresh token，需要重新登录');
        return false;
      }

      // 尝试刷新token
      const refreshResult = await authService.refreshAccessToken();
      if (refreshResult.success) {
        console.log('✅ 登录态恢复成功');
        this.updateLastActiveTime();
        this.resetFailureCount();
        return true;
      } else {
        console.log('❌ 登录态恢复失败:', refreshResult.error?.message);
        this.incrementFailureCount();
        return false;
      }
    } catch (error: any) {
      console.error('❌ 检查并恢复登录态异常:', error.message);
      this.incrementFailureCount();
      return false;
    }
  }

  /**
   * 启动定期检查
   */
  private startPeriodicCheck(): void {
    // 清除之前的定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // 设置定期检查
    this.refreshTimer = setInterval(async () => {
      await this.performPeriodicCheck();
    }, LONG_TERM_AUTH_CONFIG.CHECK_INTERVAL_MINUTES * 60 * 1000);

    console.log(`⏰ 启动定期检查，间隔: ${LONG_TERM_AUTH_CONFIG.CHECK_INTERVAL_MINUTES}分钟`);
  }

  /**
   * 执行定期检查
   */
  private async performPeriodicCheck(): Promise<void> {
    console.log('🔄 执行定期检查...');
    
    try {
      // 检查是否超过30天
      if (!this.isWithinIdlePeriod()) {
        console.log('❌ 超过30天未使用，清除认证信息');
        await this.clearExpiredAuth();
        return;
      }

      // 检查token是否需要刷新
      if (this.shouldRefreshToken()) {
        console.log('🔄 Token需要刷新，开始刷新...');
        await this.refreshTokenIfNeeded();
      }

      // 更新活跃时间
      this.updateLastActiveTime();
    } catch (error: any) {
      console.error('❌ 定期检查异常:', error.message);
    }
  }

  /**
   * 检查是否在30天空闲期内
   */
  private isWithinIdlePeriod(): boolean {
    const lastActiveTime = storage.getNumber(LONG_TERM_STORAGE_KEYS.LAST_ACTIVE_TIME);
    if (!lastActiveTime) {
      console.log('⚠️ 没有最后活跃时间记录，认为需要重新登录');
      return false;
    }

    const currentTime = Date.now();
    const idleDays = (currentTime - lastActiveTime) / (1000 * 60 * 60 * 24);
    
    console.log(`📅 空闲时间检查: ${idleDays.toFixed(1)}天 (限制: ${LONG_TERM_AUTH_CONFIG.MAX_IDLE_DAYS}天)`);
    
    return idleDays <= LONG_TERM_AUTH_CONFIG.MAX_IDLE_DAYS;
  }

  /**
   * 检查是否需要刷新token
   */
  private shouldRefreshToken(): boolean {
    const expiresAt = storage.getNumber(STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) {
      return true;
    }

    const currentTime = Date.now();
    const refreshAheadTime = LONG_TERM_AUTH_CONFIG.REFRESH_AHEAD_HOURS * 60 * 60 * 1000;
    const shouldRefresh = currentTime >= (expiresAt - refreshAheadTime);
    
    if (shouldRefresh) {
      const remainingHours = (expiresAt - currentTime) / (1000 * 60 * 60);
      console.log(`⏰ Token需要刷新，剩余时间: ${remainingHours.toFixed(1)}小时`);
    }
    
    return shouldRefresh;
  }

  /**
   * 刷新token（如果需要）
   */
  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('⚠️ 正在刷新中，跳过本次刷新');
      return false;
    }

    this.isRefreshing = true;
    
    try {
      const refreshResult = await authService.refreshAccessToken();
      if (refreshResult.success) {
        console.log('✅ Token刷新成功');
        this.resetFailureCount();
        return true;
      } else {
        console.log('❌ Token刷新失败:', refreshResult.error?.message);
        this.incrementFailureCount();
        return false;
      }
    } catch (error: any) {
      console.error('❌ Token刷新异常:', error.message);
      this.incrementFailureCount();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 更新最后活跃时间
   */
  updateLastActiveTime(): void {
    const currentTime = Date.now();
    storage.set(LONG_TERM_STORAGE_KEYS.LAST_ACTIVE_TIME, currentTime);
    console.log('📅 更新最后活跃时间:', new Date(currentTime).toISOString());
  }

  /**
   * 清除过期的认证信息
   */
  private async clearExpiredAuth(): Promise<void> {
    console.log('🗑️ 清除过期认证信息...');
    
    try {
      await authService.logout();
    } catch (error) {
      console.warn('⚠️ 登出API调用失败:', error);
    }
    
    // 清除长期认证相关数据
    storage.delete(LONG_TERM_STORAGE_KEYS.LAST_ACTIVE_TIME);
    storage.delete(LONG_TERM_STORAGE_KEYS.REFRESH_FAILURE_COUNT);
    
    console.log('✅ 过期认证信息清除完成');
  }

  /**
   * 增加失败次数
   */
  private incrementFailureCount(): void {
    const currentCount = storage.getNumber(LONG_TERM_STORAGE_KEYS.REFRESH_FAILURE_COUNT) || 0;
    const newCount = currentCount + 1;
    storage.set(LONG_TERM_STORAGE_KEYS.REFRESH_FAILURE_COUNT, newCount);
    
    console.log(`📊 刷新失败次数: ${newCount}`);
    
    // 如果失败次数过多，清除认证信息
    const maxFailures = storage.getNumber(LONG_TERM_STORAGE_KEYS.MAX_REFRESH_FAILURES) || 5;
    if (newCount >= maxFailures) {
      console.log('❌ 刷新失败次数过多，清除认证信息');
      this.clearExpiredAuth();
    }
  }

  /**
   * 重置失败次数
   */
  private resetFailureCount(): void {
    storage.delete(LONG_TERM_STORAGE_KEYS.REFRESH_FAILURE_COUNT);
    console.log('🔄 重置刷新失败次数');
  }

  /**
   * 应用进入前台时调用
   */
  async onAppForeground(): Promise<void> {
    console.log('📱 应用进入前台，检查登录态...');
    
    // 更新活跃时间
    this.updateLastActiveTime();
    
    // 检查并恢复登录态
    await this.checkAndRestoreAuth();
  }

  /**
   * 应用进入后台时调用
   */
  onAppBackground(): void {
    console.log('📱 应用进入后台，更新活跃时间...');
    
    // 更新活跃时间
    this.updateLastActiveTime();
  }

  /**
   * 停止服务
   */
  stop(): void {
    console.log('🛑 停止长期认证服务...');
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    console.log('✅ 长期认证服务已停止');
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    isRunning: boolean;
    lastActiveTime: number | null;
    failureCount: number;
    isWithinIdlePeriod: boolean;
  } {
    return {
      isRunning: this.refreshTimer !== null,
      lastActiveTime: storage.getNumber(LONG_TERM_STORAGE_KEYS.LAST_ACTIVE_TIME) || null,
      failureCount: storage.getNumber(LONG_TERM_STORAGE_KEYS.REFRESH_FAILURE_COUNT) || 0,
      isWithinIdlePeriod: this.isWithinIdlePeriod(),
    };
  }

  /**
   * 手动触发检查
   */
  async manualCheck(): Promise<boolean> {
    console.log('🔍 手动触发登录态检查...');
    return await this.checkAndRestoreAuth();
  }
}

// 导出单例实例
export const longTermAuthService = new LongTermAuthService();

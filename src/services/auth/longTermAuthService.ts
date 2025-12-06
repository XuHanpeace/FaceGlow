import { MMKV } from 'react-native-mmkv';
import { authService } from './authService';
import { STORAGE_KEYS } from '../../types/auth';

// 创建MMKV存储实例
const storage = new MMKV();

// 长期认证配置
const LONG_TERM_AUTH_CONFIG = {
  // 刷新token的提前时间（小时）
  // Access Token 有效期 24 小时，提前 2 小时刷新，确保有足够时间处理刷新失败的情况
  REFRESH_AHEAD_HOURS: 2,
  // 检查间隔（分钟）
  // Access Token 有效期 24 小时，每 60 分钟检查一次即可
  CHECK_INTERVAL_MINUTES: 60,
} as const;

/**
 * 长期认证服务
 * 负责定期检查token过期时间并刷新token
 */
export class LongTermAuthService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  /**
   * 初始化长期认证服务
   */
  async initialize(): Promise<void> {
    console.log('🚀 初始化长期认证服务...');
    
    // 启动定期检查
    this.startPeriodicCheck();
    
    console.log('✅ 长期认证服务初始化完成');
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
      // 检查token是否需要刷新
      if (this.shouldRefreshToken()) {
        console.log('🔄 Token需要刷新，开始刷新...');
        await this.refreshTokenIfNeeded();
      }
    } catch (error: any) {
      console.error('❌ 定期检查异常:', error.message);
    }
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
        return true;
      } else {
        console.log('❌ Token刷新失败:', refreshResult.error?.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Token刷新异常:', error.message);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 应用进入前台时调用
   */
  async onAppForeground(): Promise<void> {
    console.log('📱 应用进入前台，检查token...');
    
    // 检查token是否需要刷新
    if (this.shouldRefreshToken()) {
      await this.refreshTokenIfNeeded();
    }
  }

  /**
   * 应用进入后台时调用
   */
  onAppBackground(): void {
    console.log('📱 应用进入后台');
    // 不需要做任何处理
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
  } {
    return {
      isRunning: this.refreshTimer !== null,
    };
  }

  /**
   * 手动触发检查
   */
  async manualCheck(): Promise<boolean> {
    console.log('🔍 手动触发token检查...');
    if (this.shouldRefreshToken()) {
      return await this.refreshTokenIfNeeded();
    }
    return true;
  }
}

// 导出单例实例
export const longTermAuthService = new LongTermAuthService();

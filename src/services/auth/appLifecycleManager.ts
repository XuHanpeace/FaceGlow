import { AppState, AppStateStatus } from 'react-native';
import { longTermAuthService } from './longTermAuthService';

/**
 * 应用生命周期管理器
 * 负责管理应用的前后台切换和长期认证
 */
export class AppLifecycleManager {
  private appState: AppStateStatus = AppState.currentState;
  private isInitialized = false;

  /**
   * 初始化应用生命周期管理
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ 应用生命周期管理器已初始化');
      return;
    }

    console.log('🚀 初始化应用生命周期管理器...');

    // 监听应用状态变化
    AppState.addEventListener('change', this.handleAppStateChange);

    // 初始化长期认证服务
    await longTermAuthService.initialize();

    this.isInitialized = true;
    console.log('✅ 应用生命周期管理器初始化完成');
  }

  /**
   * 处理应用状态变化
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    console.log(`📱 应用状态变化: ${this.appState} -> ${nextAppState}`);

    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // 应用从后台/非活跃状态进入前台
      console.log('📱 应用进入前台');
      this.onAppForeground();
    } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      // 应用从前台进入后台/非活跃状态
      console.log('📱 应用进入后台');
      this.onAppBackground();
    }

    this.appState = nextAppState;
  };

  /**
   * 应用进入前台时的处理
   */
  private async onAppForeground(): Promise<void> {
    try {
      console.log('🔄 处理应用进入前台...');
      
      // 更新长期认证状态
      await longTermAuthService.onAppForeground();
      
      console.log('✅ 应用进入前台处理完成');
    } catch (error: any) {
      console.error('❌ 应用进入前台处理异常:', error.message);
    }
  }

  /**
   * 应用进入后台时的处理
   */
  private onAppBackground(): void {
    try {
      console.log('🔄 处理应用进入后台...');
      
      // 更新长期认证状态
      longTermAuthService.onAppBackground();
      
      console.log('✅ 应用进入后台处理完成');
    } catch (error: any) {
      console.error('❌ 应用进入后台处理异常:', error.message);
    }
  }

  /**
   * 停止应用生命周期管理
   */
  stop(): void {
    console.log('🛑 停止应用生命周期管理器...');
    
    // 停止长期认证服务
    longTermAuthService.stop();
    
    // 移除应用状态监听
    AppState.removeEventListener('change', this.handleAppStateChange);
    
    this.isInitialized = false;
    console.log('✅ 应用生命周期管理器已停止');
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isInitialized: boolean;
    appState: AppStateStatus;
    authStatus: ReturnType<typeof longTermAuthService.getStatus>;
  } {
    return {
      isInitialized: this.isInitialized,
      appState: this.appState,
      authStatus: longTermAuthService.getStatus(),
    };
  }

  /**
   * 手动触发登录态检查
   */
  async manualAuthCheck(): Promise<boolean> {
    console.log('🔍 手动触发登录态检查...');
    return await longTermAuthService.manualCheck();
  }
}

// 导出单例实例
export const appLifecycleManager = new AppLifecycleManager();

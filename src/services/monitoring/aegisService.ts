// @ts-ignore
import Aegis from 'aegis-rn-sdk';
import { authService } from '../auth/authService';

// Aegis 监控实例
let aegisInstance: Aegis | null = null;

/**
 * Aegis 监控服务
 * 用于页面性能监控、错误监控和埋点上报
 */
class AegisService {
  /**
   * 初始化 Aegis 监控
   * @param userId 用户ID（可选）
   */
  initialize(userId?: string) {
    try {
      if (aegisInstance) {
        console.log('Aegis 已经初始化，跳过重复初始化');
        return;
      }

      // 获取当前用户ID
      const currentUserId = userId || authService.getCurrentUserId() || undefined;

      // 初始化 Aegis SDK
      aegisInstance = new Aegis({
        id: '16EDVTlL4xovXxLej1', // 上报 ID（从截图获取）
        uin: currentUserId, // 用户唯一 ID
        reportApiSpeed: true, // 开启接口测速
        hostUrl: 'https://rumt-zh.com', // 上报域名
        enableConsole: __DEV__, // 开发环境开启 console 输出
      });

      console.log('✅ Aegis 监控初始化成功');
    } catch (error) {
      console.error('❌ Aegis 监控初始化失败:', error);
    }
  }

  /**
   * 更新用户ID
   * @param userId 用户ID
   */
  setUser(userId: string) {
    if (aegisInstance) {
      // Aegis SDK 的 uin 需要在初始化时设置，这里重新初始化
      this.initialize(userId);
    }
  }

  /**
   * 上报自定义事件
   * @param eventName 事件名称
   * @param extraData 额外数据
   */
  reportEvent(eventName: string, extraData?: Record<string, string | number | boolean>) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报事件');
      return;
    }

    try {
      aegisInstance.reportEvent({
        name: eventName,
        ext1: extraData ? JSON.stringify(extraData) : undefined,
      });
    } catch (error) {
      console.error('上报事件失败:', error);
    }
  }

  /**
   * 上报页面访问（PV）
   * @param pageName 页面名称
   */
  reportPageView(pageName: string) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报页面访问');
      return;
    }

    try {
      // 使用 fg_pv_ 前缀
      this.reportEvent(`fg_pv_${pageName.toLowerCase()}`, { page_name: pageName });
    } catch (error) {
      console.error('上报页面访问失败:', error);
    }
  }

  /**
   * 上报点击事件
   * @param action 点击动作名称
   * @param params 行为参数
   */
  reportClick(action: string, params?: Record<string, string | number | boolean>) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报点击事件');
      return;
    }

    try {
      // 使用 fg_click_ 前缀
      this.reportEvent(`fg_click_${action}`, params || {});
    } catch (error) {
      console.error('上报点击事件失败:', error);
    }
  }

  /**
   * 上报用户行为
   * @param action 行为名称
   * @param params 行为参数
   */
  reportUserAction(action: string, params?: Record<string, string | number | boolean | undefined>) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报用户行为');
      return;
    }

    try {
      // 使用 fg_action_ 前缀
      this.reportEvent(`fg_action_${action}`, params as Record<string, string | number | boolean>);
    } catch (error) {
      console.error('上报用户行为失败:', error);
    }
  }

  /**
   * 上报接口错误
   * @param url 接口URL
   * @param error 错误信息
   * @param statusCode HTTP状态码
   */
  reportApiError(url: string, error: string, statusCode?: number) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报接口错误');
      return;
    }

    // 防止错误循环：如果错误信息中包含 location 相关错误，直接记录到 console，不再上报
    if (error && typeof error === 'string' && 
        (error.includes('location') || error.includes('Property \'location\''))) {
      console.error('⚠️ 检测到 location 相关错误，跳过上报以避免错误循环:', error);
      return;
    }

    try {
      // 从URL中提取接口名称
      const apiName = url.split('/').pop() || 'unknown';
      aegisInstance.error({
        msg: `fg_error_api_${apiName}`,
        ext1: error,
        ext2: statusCode?.toString(),
        ext3: url,
      });
    } catch (err) {
      // 上报错误本身失败时，只记录到 console，不再尝试上报，避免错误循环
      console.error('上报接口错误失败（已跳过避免循环）:', err);
    }
  }

  /**
   * 上报业务错误
   * @param error 错误对象或错误信息
   * @param extraData 额外数据
   */
  reportError(error: Error | string, extraData?: Record<string, string | number | boolean | undefined>) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报错误');
      return;
    }

    // 防止错误循环：如果错误信息中包含 location 相关错误，直接记录到 console，不再上报
    const errorMessage = error instanceof Error ? error.message : error;
    if (errorMessage && typeof errorMessage === 'string' && 
        (errorMessage.includes('location') || errorMessage.includes('Property \'location\''))) {
      console.error('⚠️ 检测到 location 相关错误，跳过上报以避免错误循环:', errorMessage);
      return;
    }

    try {
      if (error instanceof Error) {
        aegisInstance.error({
          msg: `fg_error_${error.message.substring(0, 50)}`,
          ext1: error.message,
          ext2: error.stack,
          ext3: extraData ? JSON.stringify(extraData as Record<string, string | number | boolean>) : undefined,
        });
      } else {
        // 如果错误信息已经包含 fg_error_ 前缀，直接使用
        const errorMsg = error.startsWith('fg_error_') ? error : `fg_error_${error.substring(0, 50)}`;
        aegisInstance.error({
          msg: errorMsg,
          ext1: error,
          ext2: extraData ? JSON.stringify(extraData as Record<string, string | number | boolean>) : undefined,
        });
      }
    } catch (err) {
      // 上报错误本身失败时，只记录到 console，不再尝试上报，避免错误循环
      console.error('上报错误失败（已跳过避免循环）:', err);
    }
  }

  /**
   * 上报信息日志
   * @param message 日志信息
   * @param extraData 额外数据
   */
  reportInfo(message: string, extraData?: Record<string, string | number | boolean>) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报信息');
      return;
    }

    try {
      aegisInstance.info({
        msg: message,
        ext1: extraData ? JSON.stringify(extraData) : undefined,
      });
    } catch (error) {
      console.error('上报信息失败:', error);
    }
  }

  /**
   * 上报自定义指标
   * @param metricName 指标名称
   * @param value 指标值
   * @param tags 标签
   */
  reportMetric(metricName: string, value: number, tags?: Record<string, string>) {
    if (!aegisInstance) {
      console.warn('Aegis 未初始化，无法上报指标');
      return;
    }

    try {
      this.reportEvent('metric', {
        metric_name: metricName,
        value,
        ...tags,
      });
    } catch (error) {
      console.error('上报指标失败:', error);
    }
  }
}

export const aegisService = new AegisService();


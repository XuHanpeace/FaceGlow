import { Alert } from 'react-native';
import nativeCOSService, { COSConfig } from './nativeCOS';
import COS_SECRETS from '../config/cosSecrets';

export interface COSUploadResult {
  success: boolean;
  url?: string;
  fileKey?: string;
  etag?: string;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export interface COSInitResult {
  success: boolean;
  message?: string;
}

/**
 * COS服务
 * 负责管理腾讯云COS的初始化、重新初始化和文件上传等功能
 */
class COSService {
  private isInitialized: boolean = false;
  private config: COSConfig | null = null;

  // 内置的COS配置
  private readonly DEFAULT_CONFIG: COSConfig = {
    secretId: COS_SECRETS.secretId,
    secretKey: COS_SECRETS.secretKey,
    bucket: 'myhh2',
    region: 'ap-nanjing',
    appId: '1257391807',
    // 高级配置选项
    useHTTPS: true,
    enableLogging: true,
    timeoutInterval: 30,
    // 服务配置
    enableOCR: false,
    enableImageProcessing: false,
    enableVideoProcessing: false,
  };

  constructor() {
    // 构造函数中自动初始化
    this.autoInitialize();
  }

  /**
   * 自动初始化COS服务
   */
  private async autoInitialize(): Promise<COSInitResult> {
    try {
      console.log('🔄 COS服务自动初始化中...');
      const result = await this.initialize(this.DEFAULT_CONFIG);
      if (result.success) {
        console.log('✅ COS服务自动初始化成功');
      } else {
        console.warn('⚠️ COS服务自动初始化失败:', result.message);
      }
      return result;
    } catch (error) {
      console.error('❌ COS服务自动初始化异常:', error);
      return { success: false, message: `自动初始化异常：${error}` };
    }
  }

  /**
   * 初始化COS服务
   * @param config COS配置信息（可选，如果不传则使用默认配置）
   * @returns 初始化结果
   */
  async initialize(config?: COSConfig): Promise<COSInitResult> {
    try {
      const targetConfig = config || this.DEFAULT_CONFIG;
      console.log('开始初始化COS服务...');
      console.log('配置信息:', targetConfig);

      // 验证配置
      if (targetConfig.secretId === 'SECRETID' || targetConfig.secretKey === 'SECRETKEY') {
        Alert.alert(
          '配置提示',
          '请先在代码中配置您的真实COS信息：\n\n' +
          '1. 替换 SECRETID 为您的真实 SecretId\n' +
          '2. 替换 SECRETKEY 为您的真实 SecretKey\n' +
          '3. 确认 bucket、region、appId 配置正确',
          [{ text: '知道了', style: 'default' }]
        );
        return { success: false, message: '配置信息不完整' };
      }

      console.log('调用原生模块初始化...');
      const result = await nativeCOSService.initialize(targetConfig);
      console.log('初始化结果:', result);

      if (result.success) {
        this.isInitialized = true;
        this.config = targetConfig;
        console.log('COS服务初始化成功，状态已更新');
        return { success: true, message: 'COS服务初始化成功！' };
      } else {
        throw new Error(result.message || '初始化失败');
      }
    } catch (error) {
      console.error('COS初始化错误:', error);
      return { 
        success: false, 
        message: `COS服务初始化失败：${error}` 
      };
    }
  }

  /**
   * 重新初始化COS服务
   * @param config COS配置信息（可选，如果不传则使用默认配置）
   * @returns 重新初始化结果
   */
  async reinitialize(config?: COSConfig): Promise<COSInitResult> {
    try {
      const targetConfig = config || this.DEFAULT_CONFIG;
      console.log('开始重新初始化COS服务...');
      const result = await nativeCOSService.reinitializeCOS(targetConfig);
      console.log('重新初始化结果:', result);

      if (result.success) {
        this.isInitialized = true;
        this.config = targetConfig;
        console.log('COS服务重新初始化成功，状态已更新');
        return { success: true, message: 'COS服务重新初始化成功！' };
      } else {
        throw new Error(result.message || '重新初始化失败');
      }
    } catch (error) {
      console.error('COS重新初始化错误:', error);
      return { 
        success: false, 
        message: `COS服务重新初始化失败：${error}` 
      };
    }
  }

  /**
   * 上传文件到COS
   * @param filePath 文件路径
   * @param fileName 文件名
   * @param folder 文件夹（可选，默认为'uploads'）
   * @returns 上传结果
   */
  async uploadFile(
    filePath: string, 
    fileName: string, 
    folder: string = 'uploads'
  ): Promise<COSUploadResult> {
    try {
      // 检查初始化状态
      if (!this.isInitialized) {
        console.log('🔄 COS服务未初始化，尝试自动初始化...');
        const initResult = await this.autoInitialize();
        if (!initResult.success) {
          return { 
            success: false, 
            error: 'COS服务自动初始化失败，请手动初始化' 
          };
        }
      }

      // 检查配置
      if (!this.config) {
        return { 
          success: false, 
          error: 'COS配置信息缺失' 
        };
      }

      console.log('准备上传文件:');
      console.log('  - 文件路径:', filePath);
      console.log('  - 文件名:', fileName);
      console.log('  - 文件夹:', folder);
      
      // 调用原生模块上传文件
      const result = await nativeCOSService.uploadFile(filePath, fileName, folder);
      console.log('上传成功:', result);
      
      if (result.success && result.url) {
        // 上传成功后输出详细信息
        console.log('🎉 图片上传成功！');
        console.log('📸 图片地址:', result.url);
        console.log('🔑 文件Key:', result.fileKey);
        console.log('🏷️ ETag:', result.etag);
        console.log('📁 文件路径:', result.filePath);
        console.log('📝 文件名:', result.fileName);

        return {
          success: true,
          url: result.url,
          fileKey: result.fileKey,
          etag: result.etag,
          filePath: result.filePath,
          fileName: result.fileName,
        };
      } else {
        throw new Error(result.error || '上传失败');
      }
      
    } catch (error) {
      console.error('上传失败详细信息:', error);
      return { 
        success: false, 
        error: `上传失败：${error}` 
      };
    }
  }

  /**
   * 检查COS服务是否已初始化
   * @returns 是否已初始化
   */
  async checkInitialization(): Promise<boolean> {
    try {
      console.log('检查COS初始化状态...');
      const initialized = await nativeCOSService.isInitialized();
      console.log('初始化状态检查结果:', initialized);
      this.isInitialized = initialized;
      return initialized;
    } catch (error) {
      console.error('检查初始化状态失败:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * 获取当前初始化状态
   * @returns 是否已初始化
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取当前配置
   * @returns COS配置信息
   */
  getConfig(): COSConfig | null {
    return this.config;
  }

  /**
   * 获取默认配置（只读）
   * @returns 默认COS配置
   */
  getDefaultConfig(): Readonly<COSConfig> {
    return Object.freeze({ ...this.DEFAULT_CONFIG });
  }

  /**
   * 设置事件监听器
   * @param onProgress 进度回调
   * @param onComplete 完成回调
   * @returns 清理函数
   */
  setupEventListeners(
    onProgress: (progress: { progress: number; bytesSent: number; totalBytes: number }) => void,
    onComplete: (result: COSUploadResult) => void
  ) {
    // 监听上传进度
    const progressListener = nativeCOSService.onUploadProgress((progress) => {
      onProgress(progress);
    });

    // 监听上传完成
    const completeListener = nativeCOSService.onUploadComplete((result) => {
      if (result.success && result.url) {
        // 事件监听器中的详细日志输出
        console.log('📡 上传完成事件触发:');
        console.log('  - 成功状态:', result.success);
        console.log('  - 图片地址:', result.url);
        console.log('  - 文件Key:', result.fileKey);
        console.log('  - ETag:', result.etag);
        console.log('  - 文件路径:', result.filePath);
        console.log('  - 文件名:', result.fileName);
      } else {
        console.error('❌ 上传失败事件:', result.error);
      }
      
      onComplete(result);
    });

    // 返回清理函数
    return () => {
      progressListener.remove();
      completeListener.remove();
    };
  }

  /**
   * 清理COS服务
   */
  async cleanup(): Promise<void> {
    try {
      await nativeCOSService.cleanup();
      this.isInitialized = false;
      this.config = null;
      console.log('COS服务已清理');
    } catch (error) {
      console.error('清理COS服务失败:', error);
    }
  }
}

// 创建并自动初始化COS服务实例
const cosServiceInstance = new COSService();

// 导出已初始化的服务实例
export const cosService = cosServiceInstance;
export default cosServiceInstance;

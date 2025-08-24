import { NativeEventEmitter, NativeModules } from 'react-native';

const { NativeCOS } = NativeModules;

// 检查原生模块是否可用
if (!NativeCOS) {
  throw new Error('NativeCOS module is not available. Make sure the native module is properly linked.');
}

export interface COSConfig {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  appId: string;
  // 可选：临时密钥
  tmpSecretId?: string;
  tmpSecretKey?: string;
  sessionToken?: string;
}

export interface UploadProgress {
  filePath: string;
  fileName: string;
  progress: number;
  bytesSent: number;
  totalBytes: number;
}

export interface UploadState {
  filePath: string;
  fileName: string;
  state: string;
  uploadId: string;
}

export interface UploadResult {
  filePath: string;
  fileName: string;
  success: boolean;
  url?: string;
  etag?: string;
  fileKey?: string;
  error?: string;
}

export interface COSResponse {
  success: boolean;
  message?: string;
  initialized?: boolean;
  config?: COSConfig;
}

class NativeCOSService {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    // 延迟初始化事件发射器，确保原生模块完全准备好
    this.initEventEmitter();
  }

  private initEventEmitter() {
    try {
      if (NativeCOS) {
        this.eventEmitter = new NativeEventEmitter(NativeCOS);
      }
    } catch (error) {
      console.warn('Failed to initialize NativeEventEmitter:', error);
    }
  }

  // 初始化COS服务
  async initialize(config: COSConfig): Promise<COSResponse> {
    try {
      const result = await NativeCOS.initializeCOS(config);
      return result;
    } catch (error) {
      throw new Error(`COS初始化失败: ${error}`);
    }
  }

  // 上传文件
  async uploadFile(
    filePath: string,
    fileName: string,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    try {
      const result = await NativeCOS.uploadFile(filePath, fileName, folder);
      return result;
    } catch (error) {
      throw new Error(`文件上传失败: ${error}`);
    }
  }

  // 检查是否已初始化
  async isInitialized(): Promise<boolean> {
    try {
      const result = await NativeCOS.isInitialized();
      return result.initialized;
    } catch (error) {
      return false;
    }
  }

  // 获取当前配置
  async getConfig(): Promise<COSConfig> {
    try {
      const result = await NativeCOS.getConfig();
      return result.config;
    } catch (error) {
      throw new Error(`获取配置失败: ${error}`);
    }
  }

  // 清理配置
  async cleanup(): Promise<COSResponse> {
    try {
      const result = await NativeCOS.cleanup();
      return result;
    } catch (error) {
      throw new Error(`清理失败: ${error}`);
    }
  }

  // 监听上传进度
  onUploadProgress(callback: (progress: UploadProgress) => void) {
    if (!this.eventEmitter) {
      this.initEventEmitter();
    }
    
    if (this.eventEmitter) {
      return this.eventEmitter.addListener('onUploadProgress', callback);
    }
    
    // 如果事件发射器不可用，返回一个空的监听器
    return {
      remove: () => {},
    };
  }

  // 监听上传状态
  onUploadState(callback: (state: UploadState) => void) {
    if (!this.eventEmitter) {
      this.initEventEmitter();
    }
    
    if (this.eventEmitter) {
      return this.eventEmitter.addListener('onUploadState', callback);
    }
    
    return {
      remove: () => {},
    };
  }

  // 监听上传完成
  onUploadComplete(callback: (result: UploadResult) => void) {
    if (!this.eventEmitter) {
      this.initEventEmitter();
    }
    
    if (this.eventEmitter) {
      return this.eventEmitter.addListener('onUploadComplete', callback);
    }
    
    return {
      remove: () => {},
    };
  }
}

export default new NativeCOSService();

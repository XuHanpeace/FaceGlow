import COS from 'cos-js-sdk-v5';

// COS配置接口
export interface COSConfig {
  region: string;           // 存储桶所在地域简称
  bucket: string;           // 存储桶名称，格式：bucketname-appid
  secretId: string;         // 腾讯云API密钥SecretId
  secretKey: string;        // 腾讯云API密钥SecretKey
  cdnDomain?: string;       // CDN域名（可选）
  isHttps?: boolean;        // 是否使用HTTPS
  isDebuggable?: boolean;   // 是否开启调试模式
}

// 上传配置接口
export interface UploadConfig {
  forceSimpleUpload?: boolean;        // 是否强制使用简单上传
  enableVerification?: boolean;       // 分片上传时是否整体校验
  divisionForUpload?: number;         // 启用分块上传的最小对象大小（字节）
  sliceSizeForUpload?: number;        // 分块上传时的分块大小（字节）
}

// 上传进度回调
export interface ProgressCallback {
  (complete: number, target: number): void;
}

// 上传状态回调
export interface StateCallback {
  (state: 'waiting' | 'uploading' | 'paused' | 'completed' | 'cancelled' | 'error'): void;
}

// 上传结果
export interface UploadResult {
  success: boolean;
  url?: string;              // 上传成功后的访问URL
  cdnUrl?: string;           // CDN加速URL
  key?: string;              // 对象键
  etag?: string;             // 文件ETag
  size?: number;             // 文件大小
  errorMessage?: string;     // 错误信息
}

// 文件信息
export interface FileInfo {
  uri: string;               // 文件本地路径
  name?: string;             // 文件名
  type?: string;             // 文件类型
  size?: number;             // 文件大小
}

/**
 * 腾讯云COS上传服务
 * 基于官方React Native SDK实现，支持简单上传和分块上传
 */
class COSUploadService {
  private config: COSConfig;
  private uploadConfig: UploadConfig;
  private cosInstance: COS | null = null;
  private isInitialized: boolean = false;

  constructor(config: COSConfig, uploadConfig?: UploadConfig) {
    this.config = {
      isHttps: true,
      isDebuggable: __DEV__,
      ...config,
    };

    this.uploadConfig = {
      forceSimpleUpload: false,
      enableVerification: true,
      divisionForUpload: 2 * 1024 * 1024,  // 2MB
      sliceSizeForUpload: 1 * 1024 * 1024, // 1MB
      ...uploadConfig,
    };
  }

  /**
   * 初始化COS服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 创建COS实例
      this.cosInstance = new COS({
        SecretId: this.config.secretId,
        SecretKey: this.config.secretKey,
        Protocol: this.config.isHttps ? 'https:' : 'http:',
        Domain: `${this.config.bucket}.cos.${this.config.region}.myqcloud.com`,
        UseAccelerate: false, // 是否使用全球加速域名
        Timeout: 60000, // 超时时间
      });

      this.isInitialized = true;
      console.log('COS服务初始化成功');
    } catch (error) {
      console.error('COS服务初始化失败:', error);
      throw new Error('COS服务初始化失败');
    }
  }

  /**
   * 上传文件到COS
   * @param fileInfo 文件信息
   * @param cosPath 对象在存储桶中的位置标识符
   * @param onProgress 上传进度回调
   * @param onState 上传状态回调
   * @returns 上传结果
   */
  async uploadFile(
    fileInfo: FileInfo,
    cosPath: string,
    onProgress?: ProgressCallback,
    onState?: StateCallback
  ): Promise<UploadResult> {
    try {
      // 确保服务已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.cosInstance) {
        throw new Error('COS实例未初始化');
      }

      // 验证文件
      await this.validateFile(fileInfo);

      // 生成完整的COS路径
      const fullCosPath = this.generateCosPath(cosPath, fileInfo.name);

      // 目前只使用简单上传，分块上传需要File对象
      const result = await this.simpleUpload(
        fileInfo,
        fullCosPath,
        onProgress,
        onState
      );

      // 生成CDN URL
      if (result.success && result.url) {
        result.cdnUrl = this.generateCDNUrl(result.url);
      }

      return result;
    } catch (error) {
      console.error('文件上传失败:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  /**
   * 简单上传（适用于小文件）
   */
  private async simpleUpload(
    fileInfo: FileInfo,
    cosPath: string,
    onProgress?: ProgressCallback,
    onState?: StateCallback
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      if (!this.cosInstance) {
        reject(new Error('COS实例未初始化'));
        return;
      }

      onState?.('uploading');

      // 使用COS SDK的putObject方法进行简单上传
      this.cosInstance!.putObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: cosPath,
        Body: fileInfo.uri as any, // 临时类型断言，实际使用时需要转换为File对象
        StorageClass: 'STANDARD',
        onProgress: (progressData) => {
          if (onProgress && progressData.total > 0) {
            onProgress(progressData.loaded, progressData.total);
          }
        },
      }, (err, data) => {
        if (err) {
          onState?.('error');
          reject(new Error(err.message || '简单上传失败'));
        } else {
          onState?.('completed');
          resolve({
            success: true,
            url: `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${cosPath}`,
            key: cosPath,
            etag: data?.ETag,
            size: fileInfo.size,
          });
        }
      });
    });
  }



  /**
   * 验证文件
   */
  private async validateFile(fileInfo: FileInfo): Promise<void> {
    if (!fileInfo.uri) {
      throw new Error('文件路径不能为空');
    }

    const fileSize = fileInfo.size || await this.getFileSize(fileInfo.uri);
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (fileSize > maxSize) {
      throw new Error(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
    }
  }

  /**
   * 获取文件大小
   */
  private async getFileSize(fileUri: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', fileUri);
      xhr.onload = () => {
        if (xhr.status === 200) {
          const size = parseInt(xhr.getResponseHeader('Content-Length') || '0');
          resolve(size);
        } else {
          reject(new Error('无法获取文件大小'));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send();
    });
  }

  /**
   * 生成COS路径
   */
  private generateCosPath(basePath: string, fileName?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    if (fileName) {
      const extension = fileName.split('.').pop();
      return `${basePath}/${timestamp}_${random}.${extension}`;
    }
    
    return `${basePath}/${timestamp}_${random}.jpg`;
  }

  /**
   * 生成CDN URL
   */
  private generateCDNUrl(cosUrl: string): string {
    if (this.config.cdnDomain) {
      // 如果有配置CDN域名，替换为CDN URL
      const cosDomain = `${this.config.bucket}.cos.${this.config.region}.myqcloud.com`;
      return cosUrl.replace(cosDomain, this.config.cdnDomain);
    }
    return cosUrl;
  }

  /**
   * 删除文件
   */
  async deleteFile(cosPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.cosInstance) {
        reject(new Error('COS实例未初始化'));
        return;
      }

      this.cosInstance!.deleteObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: cosPath,
      }, (err, _data) => {
        if (err) {
          console.error('删除文件失败:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * 获取文件访问URL
   */
  getFileUrl(cosPath: string): string {
    const protocol = this.config.isHttps ? 'https' : 'http';
    const domain = this.config.cdnDomain || `${this.config.bucket}.cos.${this.config.region}.myqcloud.com`;
    
    return `${protocol}://${domain}/${cosPath}`;
  }

  /**
   * 批量上传文件
   */
  async uploadMultipleFiles(
    files: FileInfo[],
    basePath: string,
    onProgress?: (completed: number, total: number) => void,
    onFileProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    let completedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cosPath = `${basePath}/file_${i}`;

      try {
        const result = await this.uploadFile(
          file,
          cosPath,
          (complete, target) => {
            onFileProgress?.(i, complete / target);
          },
          (state) => {
            if (state === 'completed' || state === 'error') {
              completedCount++;
              onProgress?.(completedCount, files.length);
            }
          }
        );

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          errorMessage: error instanceof Error ? error.message : '上传失败',
        });
        completedCount++;
        onProgress?.(completedCount, files.length);
      }
    }

    return results;
  }

  /**
   * 获取上传任务状态
   */
  getUploadStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * 重新初始化服务
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.cosInstance = null;
    await this.initialize();
  }
}

// 默认配置
export const defaultCOSConfig: COSConfig = {
  region: 'ap-guangzhou', // 广州地区
  bucket: 'your-bucket-name-1250000000', // 需要替换为实际的存储桶名称
  secretId: 'your-secret-id', // 需要替换为实际的SecretId
  secretKey: 'your-secret-key', // 需要替换为实际的SecretKey
  cdnDomain: '', // 可选：CDN域名
  isHttps: true,
  isDebuggable: __DEV__,
};

// 导出单例实例
export const cosUploadService = new COSUploadService(defaultCOSConfig);

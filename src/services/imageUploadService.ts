import { Platform } from 'react-native';
import { cloudbaseHttpApi } from './cloudbaseHttpApi';
import { cloudbaseConfig } from './cloudbaseConfig';

/**
 * 图片上传服务
 * 负责将用户照片上传到云存储
 */
class ImageUploadService {
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * 上传图片到云存储
   * @param imageUri 图片本地路径
   * @param userId 用户ID
   * @param category 图片分类（如：'user_photos', 'results'）
   * @returns 上传后的图片URL
   */
  async uploadImage(
    imageUri: string, 
    userId: string, 
    category: string = 'user_photos'
  ): Promise<string> {
    try {
      // 验证图片格式和大小
      await this.validateImage(imageUri);
      
      // 生成唯一的文件名
      const fileName = this.generateFileName(userId, category);
      
      // 调用云函数上传图片
      const result = await this.uploadToCloudStorage(imageUri, fileName, category);
      
      if (!result.success || !result.url) {
        throw new Error(result.errorMessage || '图片上传失败');
      }
      
      return result.url;
    } catch (error) {
      console.error('图片上传失败:', error);
      throw error;
    }
  }

  /**
   * 上传换脸结果图片
   * @param imageUri 结果图片本地路径
   * @param userId 用户ID
   * @param recordId 换脸记录ID
   * @returns 上传后的图片URL
   */
  async uploadResultImage(
    imageUri: string, 
    userId: string, 
    recordId: string
  ): Promise<string> {
    try {
      // 验证图片格式和大小
      await this.validateImage(imageUri);
      
      // 生成结果图片文件名
      const fileName = this.generateResultFileName(userId, recordId);
      
      // 调用云函数上传图片
      const result = await this.uploadToCloudStorage(imageUri, fileName, 'results');
      
      if (!result.success || !result.url) {
        throw new Error(result.errorMessage || '结果图片上传失败');
      }
      
      return result.url;
    } catch (error) {
      console.error('结果图片上传失败:', error);
      throw error;
    }
  }

  /**
   * 验证图片
   */
  private async validateImage(imageUri: string): Promise<void> {
    try {
      // 获取图片信息
      const imageInfo = await this.getImageInfo(imageUri);
      
      // 检查文件大小
      if (imageInfo.size > this.MAX_IMAGE_SIZE) {
        throw new Error(`图片大小不能超过 ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
      }
      
      // 检查文件格式
      if (!this.SUPPORTED_FORMATS.includes(imageInfo.type)) {
        throw new Error('不支持的图片格式，请使用 JPEG、PNG 或 WebP 格式');
      }
      
      // 检查图片尺寸
      if (imageInfo.width < 100 || imageInfo.height < 100) {
        throw new Error('图片尺寸太小，最小需要 100x100 像素');
      }
      
      if (imageInfo.width > 4096 || imageInfo.height > 4096) {
        throw new Error('图片尺寸太大，最大支持 4096x4096 像素');
      }
    } catch (error) {
      console.error('图片验证失败:', error);
      throw error;
    }
  }

  /**
   * 获取图片信息
   */
  private async getImageInfo(imageUri: string): Promise<{
    size: number;
    type: string;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      // 这里需要根据实际使用的图片库来实现
      // 例如使用 react-native-image-size 或其他库
      
      // 临时实现，实际项目中需要替换
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', imageUri);
      xhr.onload = () => {
        if (xhr.status === 200) {
          const size = parseInt(xhr.getResponseHeader('Content-Length') || '0');
          const type = xhr.getResponseHeader('Content-Type') || 'image/jpeg';
          
          // 获取图片尺寸（这里需要实际实现）
          resolve({
            size,
            type,
            width: 800,  // 临时值，需要实际获取
            height: 600, // 临时值，需要实际获取
          });
        } else {
          reject(new Error('无法获取图片信息'));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send();
    });
  }

  /**
   * 生成文件名
   */
  private generateFileName(userId: string, category: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${category}/${userId}/${timestamp}_${random}.jpg`;
  }

  /**
   * 生成结果图片文件名
   */
  private generateResultFileName(userId: string, recordId: string): string {
    const timestamp = Date.now();
    return `results/${userId}/${recordId}_${timestamp}.jpg`;
  }

  /**
   * 上传到云存储
   */
  private async uploadToCloudStorage(
    imageUri: string, 
    fileName: string, 
    category: string
  ): Promise<{ success: boolean; url?: string; errorMessage?: string }> {
    try {
      // 调用云函数上传图片
      const result = await cloudbaseHttpApi.callFunction('uploadImage', {
        imageUri,
        fileName,
        category,
        timestamp: Date.now(),
      });
      
      return {
        success: true,
        url: result.data?.url || result.data?.imageUrl,
      };
    } catch (error) {
      console.error('云存储上传失败:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  /**
   * 压缩图片（可选功能）
   */
  async compressImage(
    imageUri: string, 
    quality: number = 0.8,
    maxWidth: number = 1024,
    maxHeight: number = 1024
  ): Promise<string> {
    try {
      // 这里需要根据实际使用的图片压缩库来实现
      // 例如使用 react-native-image-compressor 或其他库
      
      // 临时实现，返回原图
      console.log('图片压缩功能待实现');
      return imageUri;
    } catch (error) {
      console.error('图片压缩失败:', error);
      return imageUri; // 压缩失败时返回原图
    }
  }

  /**
   * 删除图片
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // 调用云函数删除图片
      const result = await cloudbaseHttpApi.callFunction('deleteImage', {
        imageUrl,
        timestamp: Date.now(),
      });
      
      return result.data?.success || false;
    } catch (error) {
      console.error('删除图片失败:', error);
      return false;
    }
  }

  /**
   * 获取图片的CDN URL
   */
  getCdnUrl(imageUrl: string): string {
    // 如果已经是CDN URL，直接返回
    if (imageUrl.includes('cdn') || imageUrl.includes('cloudfront')) {
      return imageUrl;
    }
    
    // 根据配置生成CDN URL
    // 这里需要根据实际的CDN配置来实现
    return imageUrl.replace(
      /https:\/\/.*\.tcloudbasegateway\.com/,
      'https://your-cdn-domain.com'
    );
  }

  /**
   * 批量上传图片
   */
  async uploadMultipleImages(
    imageUris: string[], 
    userId: string, 
    category: string = 'user_photos'
  ): Promise<string[]> {
    try {
      const uploadPromises = imageUris.map(imageUri => 
        this.uploadImage(imageUri, userId, category)
      );
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('批量上传图片失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const imageUploadService = new ImageUploadService();

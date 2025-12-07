import axios from 'axios';
import RNFS from 'react-native-fs';
import { cosService } from './cos/COSService';

export interface ImageUploadResult {
  success: boolean;
  cosUrl?: string;
  error?: string;
}

/**
 * 图片上传服务
 * 负责将临时URL的图片下载并上传到COS，返回永久URL
 */
class ImageUploadService {
  /**
   * 下载图片到临时文件
   * @param imageUrl 图片URL
   * @returns 临时文件路径
   */
  private async downloadImageToTemp(imageUrl: string): Promise<string> {
    try {
      console.log('📥 开始下载图片:', imageUrl);
      
      // 获取高质量URL（如果是COS URL）
      const highQualityUrl = this.getHighQualityImageUrl(imageUrl);
      
      // 下载图片
      const response = await axios({
        url: highQualityUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'image/*,*/*;q=0.8',
          'Accept-Encoding': 'identity', // 防止服务器压缩
        },
        timeout: 30000,
      });

      // 转换为Base64（React Native 使用 react-native-fs 的 base64 编码）
      // 直接使用 ArrayBuffer 数据写入文件
      const uint8Array = new Uint8Array(response.data);
      const base64String = this.arrayBufferToBase64(uint8Array);
      
      // 生成临时文件路径（强制使用 PNG 格式）
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const tempFileName = `temp_${timestamp}_${randomStr}.png`; // 强制使用 PNG
      const tempFilePath = `${RNFS.CachesDirectoryPath}/${tempFileName}`;
      
      // 写入临时文件
      await RNFS.writeFile(tempFilePath, base64String, 'base64');
      console.log('✅ 图片下载完成，临时文件路径:', tempFilePath);
      
      return tempFilePath;
    } catch (error: any) {
      console.error('❌ 下载图片失败:', error);
      throw new Error(`下载图片失败: ${error.message}`);
    }
  }

  /**
   * 获取高质量图片URL（如果是COS URL，添加质量参数）
   */
  private getHighQualityImageUrl(imageUrl: string): string {
    try {
      if (imageUrl.includes('myqcloud.com') || imageUrl.includes('cos.')) {
        const urlWithoutParams = imageUrl.split('?')[0];
        return `${urlWithoutParams}?imageMogr2/quality/100`;
      }
      return imageUrl;
    } catch (error) {
      console.warn('处理高质量URL失败，使用原URL:', error);
      return imageUrl;
    }
  }

  /**
   * 将 ArrayBuffer/Uint8Array 转换为 Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // React Native 环境，使用全局 base64 编码（如果可用）
    if (typeof global.btoa !== 'undefined') {
      return global.btoa(binary);
    }
    // 如果没有 btoa，使用手动实现
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
    }
    return result;
  }

  /**
   * 从URL获取图片扩展名
   */
  private getImageExtension(url: string): string {
    try {
      const urlWithoutParams = url.split('?')[0];
      const match = urlWithoutParams.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      return match ? `.${match[1].toLowerCase()}` : '.jpg';
    } catch {
      return '.jpg';
    }
  }

  /**
   * 上传图片到COS
   * @param imageUrl 临时图片URL（服务商返回的临时URL）
   * @param folder COS文件夹路径（可选，默认为'user_works'）
   * @param albumId 相册ID（用于文件命名）
   * @returns 上传结果，包含COS永久URL
   */
  async uploadImageToCOS(
    imageUrl: string,
    folder: string = 'user_works',
    albumId?: string
  ): Promise<ImageUploadResult> {
    try {
      console.log('🔄 开始上传图片到COS:', imageUrl);
      
      // 1. 下载图片到临时文件
      const tempFilePath = await this.downloadImageToTemp(imageUrl);
      
      try {
        // 2. 生成COS文件名（包含 album_id，强制使用 PNG 格式）
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        // 强制使用 PNG 格式
        const cosFileName = albumId 
          ? `work_${albumId}_${timestamp}_${randomStr}.png`
          : `work_${timestamp}_${randomStr}.png`;
        
        // 3. 上传到COS
        console.log('📤 上传到COS，文件夹:', folder, '文件名:', cosFileName);
        const uploadResult = await cosService.uploadFile(tempFilePath, cosFileName, folder);
        
        if (uploadResult.success && uploadResult.url) {
          console.log('✅ 图片上传到COS成功:', uploadResult.url);
          
          // 确保返回的 URL 是 PNG 格式（使用 COS 图片处理转换为 PNG）
          let finalUrl = uploadResult.url;
          if (finalUrl.includes('myqcloud.com') || finalUrl.includes('cos.')) {
            // 如果 URL 中没有图片处理参数，添加 PNG 转换参数
            if (!finalUrl.includes('imageMogr2')) {
              const urlWithoutParams = finalUrl.split('?')[0];
              const queryString = finalUrl.includes('?') ? finalUrl.split('?')[1] : '';
              // 转换为 PNG 格式，质量100
              const pngParam = 'imageMogr2/format/png/rquality/100';
              finalUrl = queryString 
                ? `${urlWithoutParams}?${pngParam}&${queryString}`
                : `${urlWithoutParams}?${pngParam}`;
            } else if (!finalUrl.includes('format/png')) {
              // 如果已有图片处理参数但没有 PNG 转换，添加 PNG 转换
              const urlWithoutParams = finalUrl.split('?')[0];
              const queryString = finalUrl.split('?')[1] || '';
              const pngParam = 'imageMogr2/format/png/rquality/100';
              finalUrl = queryString 
                ? `${urlWithoutParams}?${pngParam}&${queryString}`
                : `${urlWithoutParams}?${pngParam}`;
            }
          }
          
          return {
            success: true,
            cosUrl: finalUrl,
          };
        } else {
          throw new Error(uploadResult.error || '上传到COS失败');
        }
      } finally {
        // 4. 清理临时文件
        try {
          const exists = await RNFS.exists(tempFilePath);
          if (exists) {
            await RNFS.unlink(tempFilePath);
            console.log('🗑️ 临时文件已清理:', tempFilePath);
          }
        } catch (cleanupError) {
          console.warn('⚠️ 清理临时文件失败:', cleanupError);
        }
      }
    } catch (error: any) {
      console.error('❌ 上传图片到COS失败:', error);
      return {
        success: false,
        error: error.message || '上传图片到COS失败',
      };
    }
  }

  /**
   * 批量上传图片到COS
   * @param imageUrls 图片URL数组
   * @param folder COS文件夹路径（可选）
   * @param albumId 相册ID（用于文件命名）
   * @returns 上传结果数组，顺序与输入一致
   */
  async uploadImagesToCOS(
    imageUrls: string[],
    folder: string = 'user_works',
    albumId?: string
  ): Promise<ImageUploadResult[]> {
    console.log(`🔄 开始批量上传 ${imageUrls.length} 张图片到COS`);
    
    const results: ImageUploadResult[] = [];
    
    // 串行上传，避免并发过多导致问题
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`📤 上传第 ${i + 1}/${imageUrls.length} 张图片`);
      
      const result = await this.uploadImageToCOS(imageUrl, folder, albumId);
      results.push(result);
      
      if (!result.success) {
        console.error(`❌ 第 ${i + 1} 张图片上传失败:`, result.error);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ 批量上传完成: ${successCount}/${imageUrls.length} 成功`);
    
    return results;
  }
}

// 创建并导出服务实例
export const imageUploadService = new ImageUploadService();
export default imageUploadService;


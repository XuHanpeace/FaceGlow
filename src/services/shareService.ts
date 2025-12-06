import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { showSuccessToast } from '../utils/toast';

// 安全导入 RNFetchBlob
let RNFetchBlob: any;
try {
  RNFetchBlob = require('rn-fetch-blob').default;
  console.log('✅ RNFetchBlob模块加载成功');
} catch (error) {
  console.error('❌ RNFetchBlob模块加载失败:', error);
  RNFetchBlob = null;
}

// 安全导入CameraRoll，避免NativeEventEmitter错误
let CameraRoll: any;
try {
  const cameraRollModule = require('@react-native-camera-roll/camera-roll');
  CameraRoll = cameraRollModule.CameraRoll;
  console.log('✅ CameraRoll模块加载成功');
} catch (error) {
  console.error('❌ CameraRoll模块加载失败:', error);
  CameraRoll = null;
}

/**
 * 分享服务
 * 提供图片保存等功能
 */
class ShareService {
  private showModalCallback: ((imageUrl: string) => void) | null = null;

  /**
   * 请求存储权限（Android）
   */
  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS 不需要单独请求权限
    }

    try {
      if (Platform.Version >= 33) {
        // Android 13+ 使用新的权限
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: '保存图片权限',
            message: '美颜换换需要访问您的相册以保存图片',
            buttonPositive: '允许',
            buttonNegative: '拒绝',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 12 及以下
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: '保存图片权限',
            message: '美颜换换需要访问您的相册以保存图片',
            buttonPositive: '允许',
            buttonNegative: '拒绝',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('请求存储权限失败:', error);
      return false;
    }
  }

  /**
   * 获取高质量PNG格式图片URL（移除所有压缩和处理参数，转换为PNG格式）
   * @param imageUrl 原始图片URL
   * @returns 高质量PNG格式图片URL
   */
  private getHighQualityImageUrl(imageUrl: string): string {
    try {
      // 如果URL没有参数，直接返回（已经是原始高质量图片）
      if (!imageUrl.includes('?')) {
        console.log('📥 [SaveImage] URL无参数，使用原始高质量URL');
        return imageUrl;
      }
      
      // 分离URL和参数
      const [baseUrl, queryString] = imageUrl.split('?');
      
      // 检查是否是腾讯云COS URL（使用特殊格式的参数）
      const isCosUrl = imageUrl.includes('myqcloud.com') || imageUrl.includes('cos.');
      
      if (isCosUrl) {
        // 腾讯云COS的参数格式可能是：?imageMogr2/quality/80 或 ?imageView2/1/w/500
        // 移除所有图片处理参数，然后添加PNG格式转换参数
        
        // 检查是否有图片处理参数（以 image 开头的参数）
        const hasImageProcessing = queryString.includes('imageMogr2') || 
                                   queryString.includes('imageView2') || 
                                   queryString.includes('thumbnail') ||
                                   queryString.includes('imageAve') ||
                                   queryString.includes('imageInfo');
        
        if (hasImageProcessing) {
          // 移除所有图片处理参数，添加PNG格式转换
          // 使用 imageMogr2/format/png 转换为PNG格式，quality=100 保证高质量
          console.log('📥 [SaveImage] 检测到COS图片处理参数，移除后转换为PNG格式');
          
          // 检查是否有其他非图片处理参数（如签名）
          const params = new URLSearchParams(queryString);
          const imageProcessingKeys: string[] = [];
          const otherParams: string[] = [];
          
          params.forEach((value, key) => {
            if (key.includes('image') || key.includes('thumbnail') || 
                key.includes('quality') || key.includes('compress')) {
              imageProcessingKeys.push(key);
            } else {
              // 保留非图片处理参数
              otherParams.push(`${key}=${encodeURIComponent(value)}`);
            }
          });
          
          // 构建PNG格式URL
          const pngParam = 'imageMogr2/format/png/rquality/100';
          if (otherParams.length > 0) {
            return `${baseUrl}?${pngParam}&${otherParams.join('&')}`;
          } else {
            return `${baseUrl}?${pngParam}`;
          }
        }
        
        // 如果没有图片处理参数，直接添加PNG格式转换
        console.log('📥 [SaveImage] COS URL无图片处理参数，添加PNG格式转换');
        const pngParam = 'imageMogr2/format/png/rquality/100';
        if (queryString) {
          // 保留原有参数（如签名），添加PNG转换参数
          return `${baseUrl}?${pngParam}&${queryString}`;
        } else {
          return `${baseUrl}?${pngParam}`;
        }
      } else {
        // 非COS URL，检查是否有压缩参数
        const params = new URLSearchParams(queryString);
        const compressionParams = ['w', 'width', 'h', 'height', 'q', 'quality', 'compress', 'format'];
        let hasCompression = false;
        
        compressionParams.forEach(param => {
          if (params.has(param)) {
            params.delete(param);
            hasCompression = true;
          }
        });
        
        if (hasCompression) {
          const remainingParams = params.toString();
          if (remainingParams) {
            console.log('📥 [SaveImage] 已移除压缩参数，使用高质量URL');
            return `${baseUrl}?${remainingParams}`;
          } else {
            console.log('📥 [SaveImage] 已移除所有压缩参数，使用原始URL');
            return baseUrl;
          }
        }
      }
      
      // 如果没有需要移除的参数，直接返回原URL
      console.log('📥 [SaveImage] URL无压缩参数，使用原始URL');
      return imageUrl;
    } catch (error) {
      console.warn('处理高质量URL失败，使用原URL:', error);
      return imageUrl;
    }
  }

  /**
   * 保存图片到相册
   * @param imageUrl 图片URL
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async saveImageToAlbum(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📥 [SaveImage] 开始保存图片到相册');
      console.log('📥 [SaveImage] 原始图片URL:', imageUrl);

      // 检查RNFetchBlob是否可用
      if (!RNFetchBlob) {
        console.error('❌ [SaveImage] RNFetchBlob模块不可用');
        return {
          success: false,
          error: 'RNFetchBlob模块初始化失败，请重启应用',
        };
      }

      // 检查CameraRoll是否可用
      if (!CameraRoll) {
        console.error('❌ [SaveImage] CameraRoll模块不可用');
        return {
          success: false,
          error: 'CameraRoll模块初始化失败，请重启应用',
        };
      }

      // 1. 请求存储权限
      console.log('📥 [SaveImage] 步骤1: 请求存储权限');
      const hasPermission = await this.requestStoragePermission();
      console.log('📥 [SaveImage] 权限结果:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ [SaveImage] 没有存储权限');
        return {
          success: false,
          error: '需要相册访问权限才能保存图片',
        };
      }

      // 2. 获取高质量图片URL
      const highQualityUrl = this.getHighQualityImageUrl(imageUrl);
      console.log('📥 [SaveImage] 高质量图片URL:', highQualityUrl);

      // 3. 使用 rn-fetch-blob 下载图片到临时目录（PNG格式）
      console.log('📥 [SaveImage] 步骤2: 下载图片到临时目录（PNG格式）');
      const timestamp = Date.now();
      // 使用 rn-fetch-blob 获取缓存目录
      const cacheDir = RNFetchBlob.fs.dirs.CacheDir;
      const tempFilePath = `${cacheDir}/faceglow_${timestamp}.png`;
      
      console.log('📥 [SaveImage] 临时文件路径（PNG）:', tempFilePath);
      
      const response = await RNFetchBlob.config({
        path: tempFilePath,
        addAndroidDownloads: {
          useDownloadManager: false,
          notification: false,
        },
      }).fetch('GET', highQualityUrl);

      const statusCode = response.info().status;
      console.log('📥 [SaveImage] 下载结果状态码:', statusCode);
      
      if (statusCode !== 200) {
        // 清理失败的文件
        try {
          const exists = await RNFetchBlob.fs.exists(tempFilePath);
          if (exists) {
            await RNFetchBlob.fs.unlink(tempFilePath);
          }
        } catch (cleanupError) {
          console.warn('清理失败文件时出错:', cleanupError);
        }
        throw new Error(`下载失败，状态码: ${statusCode}`);
      }

      console.log('✅ [SaveImage] 图片下载成功');

      // 4. 保存到相册
      console.log('💾 [SaveImage] 步骤3: 保存到相册...');
      console.log('💾 [SaveImage] 文件路径:', tempFilePath);
      
      // rn-fetch-blob 返回的路径已经是完整路径，不需要添加 file:// 前缀
      await CameraRoll.save(tempFilePath, {
        type: 'photo',
        album: '美颜换换', // 可选：创建专属相册
      });

      console.log('✅ [SaveImage] 图片已保存到相册');

      // 5. 清理临时文件（延迟删除，确保保存成功）
      setTimeout(async () => {
        try {
          const fileExists = await RNFetchBlob.fs.exists(tempFilePath);
          if (fileExists) {
            await RNFetchBlob.fs.unlink(tempFilePath);
            console.log('🗑️ 临时文件已清理');
          }
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError);
        }
      }, 2000);

      return { success: true };
    } catch (error: unknown) {
      console.error('❌ [SaveImage] 保存图片失败');
      console.error('❌ [SaveImage] 错误详情:', error);
      
      const errorObj = error as { message?: string; stack?: string };
      console.error('❌ [SaveImage] 错误消息:', errorObj.message);
      console.error('❌ [SaveImage] 错误堆栈:', errorObj.stack);
      
      let errorMessage = '保存图片失败';
      
      if (errorObj.message?.includes('Permission')) {
        errorMessage = '没有相册访问权限';
      } else if (errorObj.message?.includes('Network') || errorObj.message?.includes('network')) {
        errorMessage = '网络错误，请检查网络连接';
      } else if (errorObj.message?.includes('Download') || errorObj.message?.includes('download')) {
        errorMessage = '图片下载失败';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 设置显示分享Modal的回调
   * @param callback 显示Modal的回调函数
   */
  setShowModalCallback(callback: (imageUrl: string) => void): void {
    this.showModalCallback = callback;
  }

  /**
   * 显示分享选项（通过Modal）
   * @param imageUrl 要分享的图片URL
   */
  showShareOptions(imageUrl: string): void {
    if (this.showModalCallback) {
      this.showModalCallback(imageUrl);
    } else {
      // 降级方案：使用系统Alert
      Alert.alert(
        '分享作品',
        '选择分享方式',
        [
          {
            text: '保存到相册',
            onPress: async () => {
              const result = await this.saveImageToAlbum(imageUrl);
              if (result.success) {
                showSuccessToast('图片已保存到相册');
              } else {
                Alert.alert('❌ 失败', result.error || '保存失败');
              }
            },
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  }
}

// 导出单例
export const shareService = new ShareService();


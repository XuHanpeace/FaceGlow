import { Platform, PermissionsAndroid, Alert, Linking, Image } from 'react-native';
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

// 安全导入 react-native-image-marker
let ImageMarker: any;
let Position: any;
let ImageFormat: any;
let TextBackgroundType: any;
try {
  const markerModule = require('react-native-image-marker');
  ImageMarker = markerModule.default;
  Position = markerModule.Position;
  ImageFormat = markerModule.ImageFormat;
  TextBackgroundType = markerModule.TextBackgroundType;
  console.log('✅ react-native-image-marker模块加载成功');
} catch (error) {
  console.error('❌ react-native-image-marker模块加载失败:', error);
  ImageMarker = null;
  Position = null;
  ImageFormat = null;
  TextBackgroundType = null;
}

/**
 * 分享服务
 * 提供图片保存等功能
 */
class ShareService {
  private showModalCallback: ((imageUrl: string) => void) | null = null;

  private isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.includes('.mp4?');
  }

  /**
   * 引导用户去设置中开启权限
   * @param permissionType 权限类型：'album' | 'camera'
   */
  private async guideToSettings(permissionType: 'album' | 'camera' = 'album'): Promise<void> {
    const permissionText = permissionType === 'album' 
      ? '我们仅用于保存您的作品图片，不会访问您的其他信息。我们重视并保护您的隐私安全。'
      : '我们仅用于拍摄照片，不会访问您的其他信息。我们重视并保护您的隐私安全。';
    
    Alert.alert(
      '"美颜换换"需要您的授权',
      permissionText,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '去设置',
          onPress: async () => {
            try {
              await Linking.openSettings();
            } catch (error) {
              console.error('打开设置失败:', error);
              Alert.alert('提示', '无法打开设置，请手动前往系统设置开启权限');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

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
   * 请求存储权限（Android）- 视频保存
   * Android 13+：READ_MEDIA_VIDEO
   */
  async requestVideoStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          {
            title: '保存视频权限',
            message: '美颜换换需要访问您的相册以保存视频',
            buttonPositive: '允许',
            buttonNegative: '拒绝',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: '保存视频权限',
          message: '美颜换换需要访问您的相册以保存视频',
          buttonPositive: '允许',
          buttonNegative: '拒绝',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('请求视频存储权限失败:', error);
      return false;
    }
  }

  /**
   * 为图片添加水印
   * @param imagePath 本地图片路径
   * @returns Promise<string> 返回带水印的图片路径
   */
  private async addWatermarkToImage(imagePath: string): Promise<string> {
    try {
      if (!ImageMarker || !Position || !ImageFormat || !TextBackgroundType) {
        console.warn('⚠️ [Watermark] react-native-image-marker不可用，跳过水印');
        return imagePath;
      }
      
      console.log('🎨 [Watermark] 开始添加水印');
      console.log('🎨 [Watermark] 原始图片路径:', imagePath);
      console.log('🎨 [Watermark] TextBackgroundType可用:', !!TextBackgroundType);
      
      const options = {
        backgroundImage: {
          src: imagePath,
          scale: 1,
        },
        watermarkTexts: [{
          text: '© 美颜换换 · FaceGlow AI',
          position: {
            position: Position.bottomRight,
          },
          style: {
            color: '#fff',
            fontSize: 20,
            fontName: 'Helvetica Neue-Bold',
            shadowStyle: {
              dx: 10,
              dy: 10,
              radius: 10,
              color: '#6450B0',
            },
          },
        }],
        underline: true,
        bold: true,
        scale: 1,
        quality: 100,
        filename: 'watermarked',
        saveFormat: ImageFormat.png,
      };
      
      const result = await ImageMarker.markText(options);
      console.log('✅ [Watermark] 水印添加成功');
      console.log('✅ [Watermark] 带水印图片路径:', result);

      return result;
    } catch (error) {
      console.error('❌ [Watermark] 添加水印失败:', error);
      // 如果添加水印失败，返回原图片路径
      return imagePath;
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
        this.guideToSettings('album');
        return {
          success: false,
          error: '需要相册访问权限才能保存图片，请在设置中开启权限',
        };
      }

      // 3. 使用 rn-fetch-blob 下载图片到临时目录（PNG格式）
      console.log('📥 [SaveImage] 步骤2: 下载图片到临时目录（PNG格式）', imageUrl);
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
      }).fetch('GET', imageUrl);

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

      // 4. 添加水印
      console.log('🎨 [SaveImage] 步骤3: 添加水印...');
      let finalImagePath = tempFilePath;
      try {
        finalImagePath = await this.addWatermarkToImage(tempFilePath);
        console.log('✅ [SaveImage] 水印添加成功，最终图片路径:', finalImagePath);
        
        // 如果生成了新的水印图片，清理原临时文件
        if (finalImagePath !== tempFilePath) {
          setTimeout(async () => {
            try {
              const exists = await RNFetchBlob.fs.exists(tempFilePath);
              if (exists) {
                await RNFetchBlob.fs.unlink(tempFilePath);
                console.log('🗑️ 原临时文件已清理');
              }
            } catch (cleanupError) {
              console.warn('清理原临时文件失败:', cleanupError);
            }
          }, 1000);
        }
      } catch (watermarkError) {
        console.warn('⚠️ [SaveImage] 添加水印失败，使用原图:', watermarkError);
        // 如果添加水印失败，继续使用原图
      }

      // 5. 保存到相册
      console.log('💾 [SaveImage] 步骤4: 保存到相册...');
      console.log('💾 [SaveImage] 文件路径:', finalImagePath);
      
      // rn-fetch-blob 返回的路径已经是完整路径，不需要添加 file:// 前缀
      await CameraRoll.save(finalImagePath, {
        type: 'photo',
        album: '美颜换换', // 可选：创建专属相册
      });

      console.log('✅ [SaveImage] 图片已保存到相册');

      // 6. 清理临时文件（延迟删除，确保保存成功）
      setTimeout(async () => {
        try {
          const fileExists = await RNFetchBlob.fs.exists(finalImagePath);
          if (fileExists) {
            await RNFetchBlob.fs.unlink(finalImagePath);
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
      
      // 统一视为权限问题，引导用户去设置开启权限
      this.guideToSettings('album');
      
      return {
        success: false,
        error: '没有相册访问权限，请在设置中开启权限',
      };
    }
  }

  /**
   * 保存视频到相册（mp4）
   */
  async saveVideoToAlbum(videoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📥 [SaveVideo] 开始保存视频到相册');
      console.log('📥 [SaveVideo] 原始视频URL:', videoUrl);

      if (!this.isVideoUrl(videoUrl)) {
        return { success: false, error: '不是有效的视频链接' };
      }

      if (!RNFetchBlob) {
        return { success: false, error: 'RNFetchBlob模块初始化失败，请重启应用' };
      }
      if (!CameraRoll) {
        return { success: false, error: 'CameraRoll模块初始化失败，请重启应用' };
      }

      const hasPermission = await this.requestVideoStoragePermission();
      if (!hasPermission) {
        this.guideToSettings('album');
        return { success: false, error: '需要相册访问权限才能保存视频，请在设置中开启权限' };
      }

      const timestamp = Date.now();
      const cacheDir = RNFetchBlob.fs.dirs.CacheDir;
      const tempFilePath = `${cacheDir}/faceglow_${timestamp}.mp4`;

      const response = await RNFetchBlob.config({
        path: tempFilePath,
        addAndroidDownloads: {
          useDownloadManager: false,
          notification: false,
        },
      }).fetch('GET', videoUrl);

      const statusCode = response.info().status;
      if (statusCode !== 200) {
        try {
          const exists = await RNFetchBlob.fs.exists(tempFilePath);
          if (exists) await RNFetchBlob.fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn('清理失败文件时出错:', cleanupError);
        }
        throw new Error(`下载失败，状态码: ${statusCode}`);
      }

      await CameraRoll.save(tempFilePath, {
        type: 'video',
        album: '美颜换换',
      });

      // 清理临时文件
      setTimeout(async () => {
        try {
          const exists = await RNFetchBlob.fs.exists(tempFilePath);
          if (exists) await RNFetchBlob.fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError);
        }
      }, 2000);

      return { success: true };
    } catch (error: unknown) {
      console.error('❌ [SaveVideo] 保存视频失败:', error);
      this.guideToSettings('album');
      return { success: false, error: '没有相册访问权限，请在设置中开启权限' };
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


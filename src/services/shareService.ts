import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { showSuccessToast } from '../utils/toast';

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
   * 保存图片到相册
   * @param imageUrl 图片URL
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async saveImageToAlbum(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📥 [SaveImage] 开始保存图片到相册');
      console.log('📥 [SaveImage] 图片URL:', imageUrl);

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

      // 2. 下载图片到临时目录
      console.log('📥 [SaveImage] 步骤2: 下载图片到临时目录');
      const timestamp = Date.now();
      const tempFilePath = `${RNFS.CachesDirectoryPath}/faceglow_${timestamp}.jpg`;
      
      console.log('📥 [SaveImage] 临时文件路径:', tempFilePath);
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: tempFilePath,
        background: true, // iOS后台下载
        discretionary: true,
        cacheable: true,
      }).promise;

      console.log('📥 [SaveImage] 下载结果状态码:', downloadResult.statusCode);
      
      if (downloadResult.statusCode !== 200) {
        throw new Error(`下载失败，状态码: ${downloadResult.statusCode}`);
      }

      console.log('✅ [SaveImage] 图片下载成功');

      // 3. 保存到相册
      console.log('💾 [SaveImage] 步骤3: 保存到相册...');
      console.log('💾 [SaveImage] 文件路径:', `file://${tempFilePath}`);
      
      await CameraRoll.save(`file://${tempFilePath}`, {
        type: 'photo',
        album: '美颜换换', // 可选：创建专属相册
      });

      console.log('✅ [SaveImage] 图片已保存到相册');

      // 4. 清理临时文件（延迟删除，确保保存成功）
      setTimeout(async () => {
        try {
          const fileExists = await RNFS.exists(tempFilePath);
          if (fileExists) {
            await RNFS.unlink(tempFilePath);
            console.log('🗑️ 临时文件已清理');
          }
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError);
        }
      }, 2000);

      return { success: true };
    } catch (error: any) {
      console.error('❌ [SaveImage] 保存图片失败');
      console.error('❌ [SaveImage] 错误详情:', error);
      console.error('❌ [SaveImage] 错误消息:', error.message);
      console.error('❌ [SaveImage] 错误堆栈:', error.stack);
      
      let errorMessage = '保存图片失败';
      
      if (error.message?.includes('Permission')) {
        errorMessage = '没有相册访问权限';
      } else if (error.message?.includes('Network')) {
        errorMessage = '网络错误，请检查网络连接';
      } else if (error.message?.includes('Download')) {
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


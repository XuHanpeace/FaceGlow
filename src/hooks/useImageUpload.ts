import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { cosUploadService, FileInfo, UploadResult, ProgressCallback, StateCallback } from '../services/cosUploadService';
import { COS_PATHS, isValidFileType, isValidFileSize } from '../services/cosConfig';
import { useUser } from '../contexts/UserContext';

// 图片选择选项
const imagePickerOptions = {
  mediaType: 'photo' as MediaType,
  includeBase64: false,
  maxHeight: 2000,
  maxWidth: 2000,
  quality: 0.8 as PhotoQuality,
  saveToPhotos: false,
};

// 相机选项
const cameraOptions = {
  ...imagePickerOptions,
  saveToPhotos: true,
  includeExtra: true,
};

/**
 * 图片上传Hook
 * 提供拍照和选择照片的上传功能
 */
export const useImageUpload = () => {
  const { currentUser } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');

  /**
   * 拍照并上传
   */
  const takePhotoAndUpload = useCallback(async (
    onSuccess?: (result: UploadResult) => void,
    onError?: (error: string) => void,
    onProgress?: ProgressCallback,
    onState?: StateCallback
  ): Promise<UploadResult | null> => {
    try {
      // 检查用户登录状态
      if (!currentUser) {
        const errorMsg = '用户未登录，无法上传图片';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      // 启动相机
      const response: ImagePickerResponse = await launchCamera(cameraOptions);
      
      if (response.didCancel) {
        console.log('用户取消拍照');
        return null;
      }

      if (response.errorCode) {
        const errorMsg = `相机启动失败: ${response.errorMessage}`;
        onError?.(errorMsg);
        Alert.alert('相机错误', errorMsg);
        return null;
      }

      if (!response.assets || response.assets.length === 0) {
        const errorMsg = '未获取到图片';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      const asset = response.assets[0];
      if (!asset.uri) {
        const errorMsg = '图片路径无效';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      // 验证文件类型和大小
      const fileType = asset.type || 'image/jpeg';
      const fileSize = asset.fileSize || 0;

      if (!isValidFileType(fileType)) {
        const errorMsg = '不支持的图片格式';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      if (!isValidFileSize(fileSize, fileType)) {
        const errorMsg = '图片文件过大';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      // 准备文件信息
      const fileInfo: FileInfo = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: fileType,
        size: fileSize,
      };

      // 生成COS路径
      const cosPath = `${COS_PATHS.USER_PHOTOS}/${currentUser.id}`;
      
      // 上传图片
      return await uploadImageToCOS(
        fileInfo,
        cosPath,
        onSuccess,
        onError,
        onProgress,
        onState
      );

    } catch (error) {
      const errorMsg = `拍照失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg, error);
      onError?.(errorMsg);
      Alert.alert('拍照失败', errorMsg);
      return null;
    }
  }, [currentUser]);

  /**
   * 选择照片并上传
   */
  const selectPhotoAndUpload = useCallback(async (
    onSuccess?: (result: UploadResult) => void,
    onError?: (error: string) => void,
    onProgress?: ProgressCallback,
    onState?: StateCallback
  ): Promise<UploadResult | null> => {
    try {
      // 检查用户登录状态
      if (!currentUser) {
        const errorMsg = '用户未登录，无法上传图片';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      // 启动图片选择器
      const response: ImagePickerResponse = await launchImageLibrary(imagePickerOptions);
      
      if (response.didCancel) {
        console.log('用户取消选择图片');
        return null;
      }

      if (response.errorCode) {
        const errorMsg = `图片选择失败: ${response.errorMessage}`;
        onError?.(errorMsg);
        Alert.alert('选择失败', errorMsg);
        return null;
      }

      if (!response.assets || response.assets.length === 0) {
        const errorMsg = '未选择图片';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      const asset = response.assets[0];
      if (!asset.uri) {
        const errorMsg = '图片路径无效';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      // 验证文件类型和大小
      const fileType = asset.type || 'image/jpeg';
      const fileSize = asset.fileSize || 0;

      if (!isValidFileType(fileType)) {
        const errorMsg = '不支持的图片格式';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      if (!isValidFileSize(fileSize, fileType)) {
        const errorMsg = '图片文件过大';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return null;
      }

      // 准备文件信息
      const fileInfo: FileInfo = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: fileType,
        size: fileSize,
      };

      // 生成COS路径
      const cosPath = `${COS_PATHS.USER_PHOTOS}/${currentUser.id}`;
      
      // 上传图片
      return await uploadImageToCOS(
        fileInfo,
        cosPath,
        onSuccess,
        onError,
        onProgress,
        onState
      );

    } catch (error) {
      const errorMsg = `选择图片失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg, error);
      onError?.(errorMsg);
      Alert.alert('选择失败', errorMsg);
      return null;
    }
  }, [currentUser]);

  /**
   * 上传图片到COS
   */
  const uploadImageToCOS = async (
    fileInfo: FileInfo,
    cosPath: string,
    onSuccess?: (result: UploadResult) => void,
    onError?: (error: string) => void,
    onProgress?: ProgressCallback,
    onState?: StateCallback
  ): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // 合并进度回调
      const combinedProgressCallback: ProgressCallback = (complete, target) => {
        const progress = complete / target;
        setUploadProgress(progress);
        onProgress?.(complete, target);
      };

      // 合并状态回调
      const combinedStateCallback: StateCallback = (state) => {
        if (state === 'completed') {
          setUploadStatus('completed');
        } else if (state === 'error') {
          setUploadStatus('error');
        }
        onState?.(state);
      };

      // 执行上传
      const result = await cosUploadService.uploadFile(
        fileInfo,
        cosPath,
        combinedProgressCallback,
        combinedStateCallback
      );

      if (result.success) {
        setUploadStatus('completed');
        setUploadProgress(1);
        
        console.log('图片上传成功:', {
          url: result.url,
          cdnUrl: result.cdnUrl,
          key: result.key,
          size: result.size,
        });
        
        onSuccess?.(result);
        
        // 显示成功提示
        Alert.alert('上传成功', '图片已成功上传到云端');
        
        return result;
      } else {
        throw new Error(result.errorMessage || '上传失败');
      }

    } catch (error) {
      const errorMsg = `图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg, error);
      
      setUploadStatus('error');
      setUploadProgress(0);
      
      onError?.(errorMsg);
      Alert.alert('上传失败', errorMsg);
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 批量上传图片
   */
  const uploadMultiplePhotos = useCallback(async (
    photos: FileInfo[],
    onSuccess?: (results: UploadResult[]) => void,
    onError?: (error: string) => void,
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> => {
    try {
      if (!currentUser) {
        const errorMsg = '用户未登录，无法上传图片';
        onError?.(errorMsg);
        Alert.alert('上传失败', errorMsg);
        return [];
      }

      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      const cosPath = `${COS_PATHS.USER_PHOTOS}/${currentUser.id}`;
      
      const results = await cosUploadService.uploadMultipleFiles(
        photos,
        cosPath,
        onProgress,
        (fileIndex, progress) => {
          // 单个文件的进度可以在这里处理
          console.log(`文件 ${fileIndex} 上传进度: ${(progress * 100).toFixed(1)}%`);
        }
      );

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        setUploadStatus('completed');
        setUploadProgress(1);
        onSuccess?.(results);
        Alert.alert('批量上传成功', `成功上传 ${successCount} 张图片`);
      } else {
        setUploadStatus('error');
        onError?.(`部分图片上传失败，成功 ${successCount}/${totalCount}`);
        Alert.alert('批量上传完成', `成功上传 ${successCount}/${totalCount} 张图片`);
      }

      return results;

    } catch (error) {
      const errorMsg = `批量上传失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg, error);
      
      setUploadStatus('error');
      setUploadProgress(0);
      
      onError?.(errorMsg);
      Alert.alert('批量上传失败', errorMsg);
      
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [currentUser]);

  /**
   * 重置上传状态
   */
  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('idle');
  }, []);

  return {
    // 状态
    isUploading,
    uploadProgress,
    uploadStatus,
    
    // 方法
    takePhotoAndUpload,
    selectPhotoAndUpload,
    uploadMultiplePhotos,
    resetUploadState,
    
    // 计算属性
    uploadProgressPercent: Math.round(uploadProgress * 100),
    isUploadCompleted: uploadStatus === 'completed',
    isUploadError: uploadStatus === 'error',
  };
};

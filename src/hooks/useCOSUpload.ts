import { useState, useCallback } from 'react';
import { cosUploadService, FileInfo, UploadResult, ProgressCallback, StateCallback } from '../services/cosUploadService';
import { COS_PATHS } from '../services/cosConfig';

// 上传状态
export type UploadState = 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';

// 上传进度信息
export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
}

// Hook返回值接口
export interface UseCOSUploadReturn {
  // 状态
  uploadState: UploadState;
  uploadProgress: UploadProgress;
  uploadResult: UploadResult | null;
  isUploading: boolean;
  
  // 方法
  uploadUserPhoto: (fileInfo: FileInfo) => Promise<UploadResult>;
  uploadFaceSwapResult: (fileInfo: FileInfo, recordId: string) => Promise<UploadResult>;
  uploadTemplate: (fileInfo: FileInfo, templateId: string) => Promise<UploadResult>;
  uploadAvatar: (fileInfo: FileInfo) => Promise<UploadResult>;
  uploadCustom: (fileInfo: FileInfo, customPath: string) => Promise<UploadResult>;
  cancelUpload: () => void;
  resetUpload: () => void;
  
  // 批量上传
  uploadMultipleFiles: (files: FileInfo[], basePath: string) => Promise<UploadResult[]>;
  
  // 错误处理
  error: string | null;
  clearError: () => void;
}

/**
 * COS上传Hook
 * 提供便捷的文件上传接口，支持进度监控和状态管理
 */
export const useCOSUpload = (): UseCOSUploadReturn => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ current: 0, total: 0, percentage: 0 });
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 计算是否正在上传
  const isUploading = uploadState === 'uploading';

  // 进度回调
  const handleProgress: ProgressCallback = useCallback((complete, target) => {
    setUploadProgress({
      current: complete,
      total: target,
      percentage: Math.round((complete / target) * 100),
    });
  }, []);

  // 状态回调
  const handleState: StateCallback = useCallback((state) => {
    switch (state) {
      case 'waiting':
        setUploadState('uploading');
        break;
      case 'uploading':
        setUploadState('uploading');
        break;
      case 'completed':
        setUploadState('success');
        break;
      case 'cancelled':
        setUploadState('cancelled');
        break;
      case 'error':
        setUploadState('error');
        break;
    }
  }, []);

  // 通用上传方法
  const uploadFile = useCallback(async (
    fileInfo: FileInfo,
    cosPath: string,
    onProgress?: ProgressCallback,
    onState?: StateCallback
  ): Promise<UploadResult> => {
    try {
      setError(null);
      setUploadState('uploading');
      setUploadProgress({ current: 0, total: 0, percentage: 0 });

      const result = await cosUploadService.uploadFile(
        fileInfo,
        cosPath,
        onProgress || handleProgress,
        onState || handleState
      );

      if (result.success) {
        setUploadState('success');
        setUploadResult(result);
      } else {
        setUploadState('error');
        setError(result.errorMessage || '上传失败');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传失败';
      setUploadState('error');
      setError(errorMessage);
      throw err;
    }
  }, [handleProgress, handleState]);

  // 上传用户照片
  const uploadUserPhoto = useCallback(async (fileInfo: FileInfo): Promise<UploadResult> => {
    const cosPath = `${COS_PATHS.USER_PHOTOS}/${Date.now()}`;
    return uploadFile(fileInfo, cosPath);
  }, [uploadFile]);

  // 上传换脸结果
  const uploadFaceSwapResult = useCallback(async (
    fileInfo: FileInfo, 
    recordId: string
  ): Promise<UploadResult> => {
    const cosPath = `${COS_PATHS.FACE_SWAP_RESULTS}/${recordId}`;
    return uploadFile(fileInfo, cosPath);
  }, [uploadFile]);

  // 上传模板
  const uploadTemplate = useCallback(async (fileInfo: FileInfo, templateId: string): Promise<UploadResult> => {
    const cosPath = `${COS_PATHS.TEMPLATES}/${templateId}`;
    return uploadFile(fileInfo, cosPath);
  }, [uploadFile]);

  // 上传头像
  const uploadAvatar = useCallback(async (fileInfo: FileInfo): Promise<UploadResult> => {
    const cosPath = `${COS_PATHS.AVATARS}/${Date.now()}`;
    return uploadFile(fileInfo, cosPath);
  }, [uploadFile]);

  // 自定义路径上传
  const uploadCustom = useCallback(async (fileInfo: FileInfo, customPath: string): Promise<UploadResult> => {
    return uploadFile(fileInfo, customPath);
  }, [uploadFile]);

  // 批量上传
  const uploadMultipleFiles = useCallback(async (
    files: FileInfo[], 
    basePath: string
  ): Promise<UploadResult[]> => {
    try {
      setError(null);
      setUploadState('uploading');
      setUploadProgress({ current: 0, total: files.length, percentage: 0 });

      const results = await cosUploadService.uploadMultipleFiles(
        files,
        basePath,
        (completed, total) => {
          setUploadProgress({
            current: completed,
            total,
            percentage: Math.round((completed / total) * 100),
          });
        },
        (fileIndex, progress) => {
          // 单个文件的进度
          console.log(`文件 ${fileIndex} 上传进度: ${Math.round(progress * 100)}%`);
        }
      );

      const successCount = results.filter(r => r.success).length;
      if (successCount === results.length) {
        setUploadState('success');
      } else {
        setUploadState('error');
        setError(`${results.length - successCount} 个文件上传失败`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量上传失败';
      setUploadState('error');
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 取消上传
  const cancelUpload = useCallback(() => {
    setUploadState('cancelled');
    setUploadProgress({ current: 0, total: 0, percentage: 0 });
  }, []);

  // 重置上传状态
  const resetUpload = useCallback(() => {
    setUploadState('idle');
    setUploadProgress({ current: 0, total: 0, percentage: 0 });
    setUploadResult(null);
    setError(null);
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    uploadState,
    uploadProgress,
    uploadResult,
    isUploading,
    
    // 方法
    uploadUserPhoto,
    uploadFaceSwapResult,
    uploadTemplate,
    uploadAvatar,
    uploadCustom,
    cancelUpload,
    resetUpload,
    
    // 批量上传
    uploadMultipleFiles,
    
    // 错误处理
    error,
    clearError,
  };
};

// 导出Hook
export default useCOSUpload;

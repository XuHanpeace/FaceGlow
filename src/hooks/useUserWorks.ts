import { useState, useEffect, useCallback } from 'react';
import { useTypedSelector } from '../store/hooks';
import { userWorkService } from '../services/database/userWorkService';
import { UserWorkModel, ResultData } from '../types/model/user_works';
import { authService } from '../services/auth/authService';

/**
 * 用户作品Hook
 * 专门处理用户作品相关的逻辑
 */
export const useUserWorks = () => {
  const [works, setWorks] = useState<UserWorkModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户作品列表
  const fetchUserWorks = useCallback(async () => {
    const currentUserId = authService.getCurrentUserId();
    if (!currentUserId) {
      setError('用户未登录');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useUserWorks] 开始获取用户作品，用户ID:', currentUserId);
      
      const result = await userWorkService.getUserWorks({
        uid: currentUserId,
        is_public: '1', // 获取公开作品
        limit: 50, // 限制50个作品
        offset: 0
      });

      console.log('[useUserWorks] 获取用户作品结果:', result);

      if (result.success && result.data) {
        // 处理返回的数据结构
        const worksData = (result.data as any).record || result.data;
        if (Array.isArray(worksData)) {
          setWorks(worksData);
          console.log('[useUserWorks] 成功获取作品数量:', worksData.length);
        } else {
          setWorks([]);
          console.log('[useUserWorks] 作品数据格式异常:', worksData);
        }
      } else {
        setError(result.error?.message || '获取作品失败');
        console.error('[useUserWorks] 获取作品失败:', result.error);
      }
    } catch (err: any) {
      setError(err.message || '获取作品时发生错误');
      console.error('[useUserWorks] 获取作品异常:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新作品
  const createWork = useCallback(async (workData: Omit<UserWorkModel, '_id'>) => {
    const currentUserId = authService.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('用户未登录');
    }

    try {
      console.log('[useUserWorks] 开始创建作品:', workData);
      
      const result = await userWorkService.createWork({
        ...workData,
        uid: currentUserId,
        created_at: Date.now(),
        updated_at: Date.now()
      });

      console.log('[useUserWorks] 创建作品结果:', result);

      if (result.success && result.data?.id) {
        // 创建成功后刷新作品列表
        await fetchUserWorks();
        return result.data.id;
      } else {
        throw new Error(result.error?.message || '创建作品失败');
      }
    } catch (err: any) {
      console.error('[useUserWorks] 创建作品异常:', err);
      throw err;
    }
  }, [fetchUserWorks]);

  // 自动获取作品数据
  useEffect(() => {
    fetchUserWorks();
  }, [fetchUserWorks]);

  // 格式化作品数据用于展示
  const formattedWorks = works.map(work => ({
    id: work._id || '',
    title: work.activity_title,
    description: work.activity_description,
    image: work.activity_image,
    albumId: work.album_id,
    activityId: work.activity_id,
    likes: parseInt(work.likes) || 0,
    downloads: parseInt(work.download_count) || 0,
    isPublic: work.is_public === '1',
    createdAt: work.created_at || 0,
    updatedAt: work.updated_at || 0,
    resultData: work.result_data || [],
    // 获取第一个结果图片作为封面
    coverImage: work.result_data && work.result_data.length > 0 
      ? work.result_data[0].result_image 
      : work.activity_image
  }));

  // 计算统计信息
  const statistics = {
    totalWorks: works.length,
    publicWorks: works.filter(work => work.is_public === '1').length,
    privateWorks: works.filter(work => work.is_public === '0').length,
    totalLikes: works.reduce((sum, work) => sum + (parseInt(work.likes) || 0), 0),
    totalDownloads: works.reduce((sum, work) => sum + (parseInt(work.download_count) || 0), 0),
  };

  return {
    // 原始数据
    works,
    loading,
    error,
    
    // 格式化数据
    formattedWorks,
    statistics,
    
    // 方法
    fetchUserWorks,
    createWork,
  };
};

/**
 * 创建作品Hook
 * 专门处理创建新作品的逻辑
 */
export const useCreateWork = () => {
  const { createWork, loading } = useUserWorks();

  const createWorkFromFusion = useCallback(async (
    activityId: string,
    activityTitle: string,
    activityDescription: string,
    activityImage: string,
    albumId: string,
    templateId: string,
    templateImage: string,
    resultImage: string
  ) => {
    try {
      console.log('[useCreateWork] 开始创建换脸作品');
      
      const workData: Omit<UserWorkModel, '_id'> = {
        uid: '', // 会在createWork中自动设置
        activity_id: activityId,
        activity_title: activityTitle,
        activity_description: activityDescription,
        activity_image: activityImage,
        album_id: albumId,
        is_public: '1',
        download_count: '0',
        likes: '0',
        result_data: [
          {
            template_id: templateId,
            template_image: templateImage,
            result_image: resultImage
          }
        ],
        ext_data: '{}',
        created_at: Date.now(),
        updated_at: Date.now()
      };

      const workId = await createWork(workData);
      console.log('[useCreateWork] 作品创建成功，ID:', workId);
      
      return workId;
    } catch (error: any) {
      console.error('[useCreateWork] 创建作品失败:', error);
      throw error;
    }
  }, [createWork]);

  return {
    createWorkFromFusion,
    loading,
  };
};

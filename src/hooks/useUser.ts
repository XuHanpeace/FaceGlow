import { useEffect, useCallback } from 'react';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { authService } from '../services/auth/authService';
import { setDefaultSelfie } from '../store/slices/userSlice';

/**
 * 用户信息Hook
 * 提供用户数据的获取、状态管理和常用方法
 */
export const useUser = () => {
  const dispatch = useAppDispatch();
  
  // 从Redux获取用户状态
  const userProfile = useTypedSelector((state) => state.user.profile);
  const userLoading = useTypedSelector((state) => state.user.loading);
  const userError = useTypedSelector((state) => state.user.error);
  const defaultSelfieUrl = useTypedSelector((state) => state.user.default_selfie_url);

  // 自动获取用户数据
  useEffect(() => {
    const loadUserData = async () => {
      const currentUserId = authService.getCurrentUserId();
      if (currentUserId && !userProfile) {
        try {
          await dispatch(fetchUserProfile({ userId: currentUserId })).unwrap();
        } catch (error) {
          console.error('[useUser] 获取用户数据失败:', error);
        }
      }
    };

    loadUserData();
  }, [dispatch, userProfile]);

  // 初始化默认自拍逻辑
  useEffect(() => {
    if (userProfile?.selfie_list && userProfile.selfie_list.length > 0) {
      // 如果没有设置默认自拍，则使用倒序第一张（最新的）
      if (!defaultSelfieUrl) {
        const latestSelfie = userProfile.selfie_list[userProfile.selfie_list.length - 1];
        dispatch(setDefaultSelfie(latestSelfie));
      }
    }
  }, [userProfile, defaultSelfieUrl, dispatch]);

  // 手动刷新用户数据
  const refreshUserData = useCallback(async () => {
    const currentUserId = authService.getCurrentUserId();
    if (currentUserId) {
      try {
        console.log('🔄 开始刷新用户数据...');
        const result = await dispatch(fetchUserProfile({ userId: currentUserId })).unwrap();
        // 打印会在 useEffect 中自动触发
        return result;
      } catch (error) {
        console.error('[useUser] 刷新用户数据失败:', error);
        throw error;
      }
    }
  }, [dispatch]);

  // 设置默认自拍
  const setDefaultSelfieUrl = useCallback((selfieUrl: string) => {
    dispatch(setDefaultSelfie(selfieUrl));
  }, [dispatch]);

  // 用户信息计算属性
  const userInfo = {
    // 基本信息
    uid: userProfile?.uid || '',
    username: userProfile?.username || '',
    name: userProfile?.name || userProfile?.username || '',
    phoneNumber: userProfile?.phone_number || '',
    
    // 头像相关
    avatar: userProfile?.picture || '',
    selfieUrl: userProfile?.selfie_url || '',
    selfieList: userProfile?.selfie_list || [],
    
    // 业务数据
    balance: userProfile?.balance || 0,
    isPremium: userProfile?.is_premium || false,
    premiumExpiresAt: userProfile?.premium_expires_at,
    subscriptionAutoRenew: userProfile?.subscription_auto_renew ?? false,
    
    // 状态信息
    status: userProfile?.status || 'inactive',
    createdAt: userProfile?.created_at || 0,
    updatedAt: userProfile?.updated_at || 0,
    
    // 其他数据
    workList: userProfile?.work_list || [],
    preferences: userProfile?.preferences,
    deviceInfo: userProfile?.device_info,
    statistics: userProfile?.statistics,
  };

  // 用户状态判断
  const isLoggedIn = !!userProfile;
  const hasAvatar = !!userInfo.avatar;
  const hasSelfies = userInfo.selfieList.length > 0;
  const isVip = userInfo.isPremium;
  const hasWorks = userInfo.workList.length > 0;

  // 格式化方法
  const formatBalance = (balance?: number) => {
    const amount = balance || userInfo.balance;
    return amount; // 转换为元，保留2位小数
  };

  const formatDate = (timestamp?: number) => {
    const time = timestamp || userInfo.createdAt;
    if (!time) return '';
    return new Date(time).toLocaleDateString('zh-CN');
  };

  return {
    // 原始数据
    userProfile,
    userLoading,
    userError,
    
    // 计算属性
    userInfo,
    
    // 状态判断
    isLoggedIn,
    hasAvatar,
    hasSelfies,
    isVip,
    hasWorks,
    
    // 方法
    refreshUserData,
    setDefaultSelfieUrl,
    formatBalance,
    formatDate,
  };
};

/**
 * 用户头像Hook
 * 专门处理用户头像相关的逻辑
 */
export const useUserAvatar = () => {
  const { userInfo, hasAvatar, refreshUserData } = useUser();

  const avatarSource = hasAvatar 
    ? { uri: userInfo.avatar }
    : require('../assets/icons/default-avatar.webp'); // 需要添加默认头像

  const updateAvatar = async (newAvatarUrl: string) => {
    // 这里可以调用更新头像的API
    // 然后刷新用户数据
    await refreshUserData();
  };

  return {
    avatarSource,
    hasAvatar,
    updateAvatar,
  };
};

/**
 * 用户自拍Hook
 * 专门处理用户自拍相关的逻辑
 */
export const useUserSelfies = () => {
  const { userInfo, hasSelfies, refreshUserData, setDefaultSelfieUrl } = useUser();
  const defaultSelfieUrl = useTypedSelector((state) => state.user.default_selfie_url);

  // 处理自拍照显示顺序：默认自拍永远在第一位，其余按倒序排列
  const selfies = (() => {
    const reversedList = userInfo.selfieList.slice().reverse();
    
    if (defaultSelfieUrl && reversedList.includes(defaultSelfieUrl)) {
      // 将默认自拍移到第一位
      const defaultIndex = reversedList.indexOf(defaultSelfieUrl);
      const defaultSelfie = reversedList.splice(defaultIndex, 1)[0];
      return [defaultSelfie, ...reversedList];
    }
    
    return reversedList;
  })().map((url, index) => ({
    id: `selfie_${index}`,
    url,
    source: { uri: url },
  }));

  const addSelfie = async (newSelfieUrl: string) => {
    // 这里可以调用添加自拍的API
    // 然后刷新用户数据
    await refreshUserData();
  };

  const removeSelfie = async (selfieUrl: string) => {
    // 这里可以调用删除自拍的API
    // 然后刷新用户数据
    await refreshUserData();
  };

  return {
    selfies,
    hasSelfies,
    defaultSelfieUrl,
    addSelfie,
    removeSelfie,
    setDefaultSelfieUrl,
  };
};

/**
 * 用户余额Hook
 * 专门处理用户余额相关的逻辑
 */
export const useUserBalance = () => {
  const { userInfo, formatBalance, refreshUserData } = useUser();

  const balance = userInfo.balance;
  const balanceFormatted = formatBalance();
  const balanceYuan = balance;

  const deductBalance = async (amount: number) => {
    // 这里可以调用扣除余额的API
    // 然后刷新用户数据
    await refreshUserData();
  };

  const addBalance = async (amount: number) => {
    // 这里可以调用增加余额的API
    // 然后刷新用户数据
    await refreshUserData();
  };

  return {
    balance,
    balanceFormatted,
    balanceYuan,
    deductBalance,
    addBalance,
  };
};

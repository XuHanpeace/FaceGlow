import { useEffect, useMemo } from 'react';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { setDefaultSelfie } from '../store/slices/userSlice';

/**
 * 用户信息Hook
 * 纯粹的数据监听hook，只负责从Redux获取用户状态并转换为易用的格式
 * 刷新用户数据请直接使用: dispatch(fetchUserProfile({ userId }))
 */
export const useUser = () => {
  const dispatch = useAppDispatch();
  
  // 从Redux获取用户状态
  const userProfile = useTypedSelector((state) => state.user.profile);
  const userLoading = useTypedSelector((state) => state.user.loading);
  const userError = useTypedSelector((state) => state.user.error);
  const defaultSelfieUrl = useTypedSelector((state) => state.user.default_selfie_url);

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

  // 用户信息计算属性（使用 useMemo 确保正确响应 userProfile 变化）
  const userInfo = useMemo(() => {
    if (!userProfile) {
      // 如果 userProfile 为 null，返回所有空值
      return {
        uid: '',
        username: '',
        name: '',
        phoneNumber: '',
        avatar: '',
        selfieUrl: '',
        selfieList: [],
        balance: 0,
        isPremium: false,
        premiumExpiresAt: undefined,
        subscriptionAutoRenew: false,
        status: 'inactive',
        createdAt: 0,
        updatedAt: 0,
        workList: [],
        preferences: undefined,
        deviceInfo: undefined,
        statistics: undefined,
      };
    }
    
    return {
      // 基本信息
      uid: userProfile.uid || '',
      username: userProfile.username || '',
      name: userProfile.name || userProfile.username || '',
      phoneNumber: userProfile.phone_number || '',
      
      // 头像相关
      avatar: userProfile.picture || '',
      selfieUrl: userProfile.selfie_url || '',
      selfieList: userProfile.selfie_list || [],
      
      // 业务数据
      balance: userProfile.balance || 0,
      isPremium: userProfile.is_premium || false,
      premiumExpiresAt: userProfile.premium_expires_at,
      subscriptionAutoRenew: userProfile.subscription_auto_renew ?? false,
      
      // 状态信息
      status: userProfile.status || 'inactive',
      createdAt: userProfile.created_at || 0,
      updatedAt: userProfile.updated_at || 0,
      
      // 其他数据
      workList: userProfile.work_list || [],
      preferences: userProfile.preferences,
      deviceInfo: userProfile.device_info,
      statistics: userProfile.statistics,
    };
  }, [userProfile]);

  // 用户状态判断（使用 useMemo 确保正确响应变化）
  const isLoggedIn = useMemo(() => !!userProfile, [userProfile]);
  const hasAvatar = useMemo(() => !!(userInfo.avatar && userInfo.avatar.trim()), [userInfo.avatar]);
  const hasSelfies = useMemo(() => userInfo.selfieList.length > 0, [userInfo.selfieList]);
  const isVip = useMemo(() => userInfo.isPremium, [userInfo.isPremium]);
  const hasWorks = useMemo(() => userInfo.workList.length > 0, [userInfo.workList]);


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
    setDefaultSelfieUrl: (selfieUrl: string | null) => {
      dispatch(setDefaultSelfie(selfieUrl));
    },
    formatBalance: (balance?: number) => {
      const amount = balance || userInfo.balance;
      return amount;
    },
    formatDate: (timestamp?: number) => {
      const time = timestamp || userInfo.createdAt;
      if (!time) return '';
      return new Date(time).toLocaleDateString('zh-CN');
    },
  };
};

/**
 * 用户头像Hook
 * 专门处理用户头像相关的逻辑
 */
export const useUserAvatar = () => {
  const { userInfo, hasAvatar } = useUser();

  const avatarSource = hasAvatar 
    ? { uri: userInfo.avatar }
    : ''; // 需要添加默认头像

  return {
    avatarSource,
    hasAvatar,
  };
};

/**
 * 用户自拍Hook
 * 专门处理用户自拍相关的逻辑
 */
export const useUserSelfies = () => {
  const { userInfo, hasSelfies, setDefaultSelfieUrl, userProfile } = useUser();
  const defaultSelfieUrl = useTypedSelector((state) => state.user.default_selfie_url);

  // 处理自拍照显示顺序：默认自拍永远在第一位，其余按倒序排列
  // 使用 useMemo 确保正确响应 userProfile 和 defaultSelfieUrl 的变化
  const selfies = useMemo(() => {
    // 如果 userProfile 为 null 或没有自拍列表，返回空数组
    if (!userProfile || !userInfo.selfieList || userInfo.selfieList.length === 0) {
      return [];
    }
    
    const reversedList = userInfo.selfieList.slice().reverse();
    
    if (defaultSelfieUrl && reversedList.includes(defaultSelfieUrl)) {
      // 将默认自拍移到第一位
      const defaultIndex = reversedList.indexOf(defaultSelfieUrl);
      const defaultSelfie = reversedList.splice(defaultIndex, 1)[0];
      return [defaultSelfie, ...reversedList];
    }
    
    return reversedList;
  }, [userProfile?.uid, userInfo.selfieList.length, defaultSelfieUrl]).map((url, index) => ({
    id: `selfie_${index}`,
    url,
    source: { uri: url },
  }));

  return {
    selfies,
    hasSelfies,
    defaultSelfieUrl,
    setDefaultSelfieUrl,
  };
};

/**
 * 用户余额Hook
 * 专门处理用户余额相关的逻辑
 */
export const useUserBalance = () => {
  const { userInfo, formatBalance } = useUser();

  const balance = userInfo.balance;
  const balanceFormatted = formatBalance();
  const balanceYuan = balance;

  return {
    balance,
    balanceFormatted,
    balanceYuan,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { checkInService } from '../services/checkInService';

export interface CheckInStatus {
  hasCheckedInToday: boolean;
  showRedDot: boolean;
  shouldShake: boolean;
  isLoading: boolean;
}

/**
 * 签到状态 Hook
 * 封装签到状态逻辑，在页面聚焦时自动刷新
 */
export function useCheckInStatus(): CheckInStatus {
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const checkedIn = await checkInService.hasCheckedInToday();
      setHasCheckedInToday(checkedIn);
    } catch (error) {
      console.error('[useCheckInStatus] 刷新状态失败:', error);
      setHasCheckedInToday(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 页面聚焦时刷新状态
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus])
  );

  // 组件挂载时也刷新一次
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 计算显示状态
  const showRedDot = !hasCheckedInToday && !isLoading;
  const shouldShake = !hasCheckedInToday && !isLoading;

  return {
    hasCheckedInToday,
    showRedDot,
    shouldShake,
    isLoading,
  };
}


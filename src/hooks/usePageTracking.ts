import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { aegisService } from '../services/monitoring/aegisService';

/**
 * 页面访问跟踪 Hook
 * 用于自动上报页面访问（PV）
 */
export const usePageTracking = (pageName: string) => {
  const navigation = useNavigation();

  useEffect(() => {
    // 页面加载时上报 PV
    aegisService.reportPageView(pageName);

    // 可以添加页面停留时间统计等逻辑
    return () => {
      // 页面卸载时的清理逻辑
    };
  }, [pageName, navigation]);
};


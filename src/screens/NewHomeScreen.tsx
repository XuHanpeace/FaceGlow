import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HomeHeader from '../components/HomeHeader';
import ContentSection from '../components/ContentSection';
import SelfieModule from '../components/SelfieModule';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { fetchActivities } from '../store/slices/activitySlice';
import { useUser } from '../hooks/useUser';
import { useAuthState } from '../hooks/useAuthState';

type NewHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NewHomeScreen: React.FC = () => {
  const navigation = useNavigation<NewHomeScreenNavigationProp>();
  const dispatch = useAppDispatch();

  // 检查登录状态
  const { isLoggedIn, isLoading } = useAuthState();
  
  // 使用用户hooks获取数据
  const { refreshUserData } = useUser();

  // 使用Redux获取活动数据
  const activities = useTypedSelector((state) => state.activity.activities);
  
  // 刷新状态
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // 页面初始化时查询活动数据
  useEffect(() => {
    console.log('🏃‍♂️ 开始获取活动数据...');
    dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 }));
  }, [dispatch]);

  // 页面获得焦点时刷新数据（登录成功后返回时触发）
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // 防抖：如果距离上次刷新不到2秒，则跳过
      if (now - lastRefreshTime < 2000) {
        console.log('⏰ 距离上次刷新时间太短，跳过本次刷新');
        return;
      }
      
      console.log('🔄 页面获得焦点，刷新数据...');
      setLastRefreshTime(now);
      // 只刷新活动数据，避免循环调用
      dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 }));
    }, [dispatch, lastRefreshTime])
  );

  // 下拉刷新函数
  const onRefresh = useCallback(async () => {
    const now = Date.now();
    // 防抖：如果距离上次刷新不到2秒，则跳过
    if (now - lastRefreshTime < 2000) {
      console.log('⏰ 距离上次刷新时间太短，跳过本次下拉刷新');
      return;
    }
    
    // 检查登录状态，如果没有登录态则跳转到登录页面
    if (!isLoggedIn) {
      console.log('🔐 检测到未登录状态，跳转到登录页面');
      navigation.navigate('NewAuth');
      return;
    }
    
    setRefreshing(true);
    setLastRefreshTime(now);
    try {
      console.log('🔄 开始下拉刷新...');
      // 同时刷新活动数据和用户数据
      await Promise.all([
        dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 })).unwrap(),
        refreshUserData()
      ]);
      console.log('✅ 下拉刷新完成');
    } catch (error) {
      console.error('❌ 下拉刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, refreshUserData, lastRefreshTime, isLoggedIn, navigation]);

  const handleAlbumPress = (albumId: string) => {
    // 从activities中找到选中的相册
    let selectedAlbum = null;
    
    for (const activity of activities) {
      const album = activity.album_id_list.find(a => a.album_id === albumId);
      if (album) {
        selectedAlbum = album;
        break;
      }
    }
    
    if (selectedAlbum) {
      // 直接传递album数据到BeforeCreation页面
      navigation.navigate('BeforeCreation', {
        albumData: selectedAlbum,
      });
    }
  };

  const handleViewAllPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('AlbumMarket', {
      activityId: categoryId,
      activityName: categoryName,
    });
  };

  const handleUpgradePress = () => {
    navigation.navigate('TestCenter');
  };

  const handleProfilePress = () => {
    navigation.navigate('NewProfile');
  };

  const handleAddSelfiePress = () => {
    navigation.navigate('SelfieGuide');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 只保护顶部的SafeArea */}
      <SafeAreaView style={styles.safeAreaTop} />
      
      {/* 固定头部 */}
      <View style={styles.fixedHeader}>
        <HomeHeader
          onUpgradePress={handleUpgradePress}
          onProfilePress={handleProfilePress}
        />
      </View>

      {/* 可滚动内容区域 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            title="下拉刷新"
            titleColor="#fff"
          />
        }
      >
        {/* 我的自拍照模块 */}
        <SelfieModule onAddSelfiePress={handleAddSelfiePress} />

        {/* 使用Redux中的活动数据 */}
        {activities.map((activity, index) => (
          <ContentSection
            key={activity.activiy_id}
            title={activity.activity_title}
            albums={activity.album_id_list}
            categoryId={activity.activiy_id}
            onAlbumPress={handleAlbumPress}
            onViewAllPress={handleViewAllPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeAreaTop: {
    backgroundColor: '#000',
  },
  fixedHeader: {
    backgroundColor: '#000',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
});

export default NewHomeScreen;

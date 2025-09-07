import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HomeHeader from '../components/HomeHeader';
import ContentSection from '../components/ContentSection';
import SelfieModule from '../components/SelfieModule';
import DefaultSelfieSelector from '../components/DefaultSelfieSelector';
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
  
  // 默认自拍选择器状态
  const [showDefaultSelfieSelector, setShowDefaultSelfieSelector] = useState(false);

  // 页面初始化时查询活动数据
  useEffect(() => {
    console.log('🏃‍♂️ 开始获取活动数据...');
    dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 }));
  }, [dispatch]);

  // 页面获得焦点时刷新数据（登录成功后返回时触发）
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 页面获得焦点，刷新数据...');
      // 同时刷新活动数据和用户数据
      Promise.all([
        dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 })).unwrap(),
        refreshUserData()
      ]).catch(error => {
        console.error('❌ 页面焦点刷新失败:', error);
      });
    }, [dispatch, refreshUserData])
  );


  const handleAlbumPress = (albumId: string) => {
    // 从activities中找到选中的相册
    let selectedAlbum = null;
    let activityId = null;
    
    for (const activity of activities) {
      const album = activity.album_id_list.find(a => a.album_id === albumId);
      if (album) {
        selectedAlbum = album;
        activityId = activity.activiy_id;
        break;
      }
    }
    
    if (selectedAlbum && activityId) {
      // 直接传递album数据和activityId到BeforeCreation页面
      navigation.navigate('BeforeCreation', {
        albumData: selectedAlbum,
        activityId: activityId,
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
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    navigation.navigate('SelfieGuide');
  };

  const handleSelfieSelect = () => {
    setShowDefaultSelfieSelector(true);
  };

  const handleDefaultSelfieSelect = (selfieUrl: string) => {
    console.log('选择默认自拍:', selfieUrl);
    setShowDefaultSelfieSelector(false);
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
      >
        {/* 我的自拍照模块 */}
        <SelfieModule 
          onAddSelfiePress={handleAddSelfiePress} 
          onSelfieSelect={handleSelfieSelect}
        />

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

      {/* 默认自拍选择器 */}
      <DefaultSelfieSelector
        visible={showDefaultSelfieSelector}
        onClose={() => setShowDefaultSelfieSelector(false)}
        onSelect={handleDefaultSelfieSelect}
      />
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

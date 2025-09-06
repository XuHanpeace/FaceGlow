import React, { useEffect } from 'react';
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
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { fetchActivities } from '../store/slices/activitySlice';
import { setUploading, setUploadProgress } from '../store/slices/selfieSlice';
import { useUser, useUserBalance, useUserSelfies } from '../hooks/useUser';
import { useAuthState } from '../hooks/useAuthState';

type NewHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NewHomeScreen: React.FC = () => {
  const navigation = useNavigation<NewHomeScreenNavigationProp>();
  const dispatch = useAppDispatch();

  // 检查登录状态
  const { isLoggedIn, isLoading } = useAuthState();

  // 使用用户hooks获取数据
  const { selfies } = useUserSelfies();

  // 使用Redux获取活动数据
  const activities = useTypedSelector((state) => state.activity.activities);

  // 检查登录状态，未登录时自动跳转到登录页面
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      console.log('🔐 检测到未登录状态，自动拉起登录页面');
      navigation.navigate('NewAuth');
    }
  }, [isLoading, isLoggedIn, navigation]);

  // 页面初始化时查询活动数据
  useEffect(() => {
    console.log('🏃‍♂️ 开始获取活动数据...');
    dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 }));
  }, [dispatch]);

  // 页面获得焦点时刷新数据（登录成功后返回时触发）
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 页面获得焦点，刷新数据...');
      dispatch(fetchActivities({ pageSize: 10, pageNumber: 1 }));
    }, [dispatch])
  );

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
console.log(activities);
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
        <View style={styles.selfieModule}>
          <Text style={styles.selfieTitle}>我的自拍</Text>
          <View style={styles.selfieContent}>
            {/* 从Redux获取自拍照数据 */}
            <TouchableOpacity style={styles.addSelfieButton} onPress={handleAddSelfiePress}>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
            {selfies.slice(0, 3).map((selfie) => (
              <Image 
                key={selfie.id} 
                source={selfie.source} 
                style={styles.selfieImage} 
              />
            ))}
          </View>
        </View>

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
  selfieModule: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    padding: 16,
  },
  selfieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  selfieContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  selfieImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  addSelfieButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(94, 231, 223, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(94, 231, 223, 0.4)',
    borderStyle: 'dashed',
  },
  addIcon: {
    color: '#5EE7DF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default NewHomeScreen;

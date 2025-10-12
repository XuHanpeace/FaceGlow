import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { addSelfie } from '../store/slices/selfieSlice';
import { useUser, useUserAvatar, useUserSelfies } from '../hooks/useUser';
import { userWorkService } from '../services/database/userWorkService';
import { UserWorkModel } from '../types/model/user_works';
import { useAuthState } from '../hooks/useAuthState';
import UserWorkCard from '../components/UserWorkCard';

type NewProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'works' | 'posts' | 'selfies';

interface SelfieItem {
  id: string;
  imageUrl: string;
  createdAt: string;
}

const NewProfileScreen: React.FC = () => {
  const navigation = useNavigation<NewProfileScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>('works');

  // 使用用户hooks获取数据
  const { userInfo, isLoggedIn } = useUser();
  const { avatarSource, hasAvatar } = useUserAvatar();
  const { selfies, hasSelfies, defaultSelfieUrl } = useUserSelfies();
  
  // 用户作品状态
  const [userWorks, setUserWorks] = useState<UserWorkModel[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const { user } = useAuthState();

  // 从Redux获取其他数据
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleGiftPress = () => {
    // 处理礼物功能
    console.log('Gift pressed');
    navigation.navigate('TestCenter')
  };
               
  const handleSharePress = () => {
    // 处理分享功能
    console.log('Share pressed');
    navigation.navigate('TestCenter')
  };

  const handleContactsPress = () => {
    // 处理查看联系人创作
    console.log('Contacts pressed');
  };

  const handleEditProfilePress = () => {
    // 处理编辑个人资料
    console.log('Edit profile pressed');
  };

  const handleAddSelfiePress = () => {
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    // 跳转到自拍引导页
    navigation.navigate('SelfieGuide');
  };

  const handleAddMockSelfie = () => {

  };

  const handleAddPostPress = () => {
    // 处理添加帖子
    console.log('Add post pressed');
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'works') {
      fetchUserWorks();
    }
  };

  const handleWorkPress = (work: UserWorkModel) => {
    navigation.navigate('UserWorkPreview', { work });
  };

  // 获取用户作品
  const fetchUserWorks = async () => {
    if (!user?.uid) {
      console.log('❌ 用户未登录，无法获取作品');
      return;
    }

    setWorksLoading(true);
    try {
      console.log('🔄 开始获取用户作品...');
      const result = await userWorkService.getUserWorks({ uid: user.uid });
      
      if (result.success && result.data) {
        const works = Array.isArray(result.data.records) ? result.data.records : [];
        console.log('✅ 获取用户作品成功:', works.length, '个作品');
        setUserWorks(works);
      } else {
        console.log('❌ 获取用户作品失败:', result.error?.message);
        setUserWorks([]);
      }
    } catch (error: any) {
      console.error('❌ 获取用户作品异常:', error);
      setUserWorks([]);
    } finally {
      setWorksLoading(false);
    }
  };

  // 组件加载时获取用户作品
  useEffect(() => {
    if (isLoggedIn && user?.uid) {
      fetchUserWorks();
    }
  }, [isLoggedIn, user?.uid]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>简介</Text>
        <View style={styles.placeholder} />
        {/* <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleGiftPress}>
            <Text style={styles.giftIcon}>🎁</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {hasAvatar ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarIcon}>👤</Text>
              )}
            </View>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{userInfo.name || userInfo.username || '未设置用户名'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePress}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 添加自拍照 */}
        <TouchableOpacity style={styles.instagramButton} onPress={handleAddSelfiePress}>
          <View style={styles.instagramIcon}>
            <Text style={styles.instagramGradient}>📸</Text>
          </View>
          <Text style={styles.instagramText}>添加自拍照</Text>
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>

        {/* 导航标签 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'works' && styles.activeTab]}
            onPress={() => handleTabPress('works')}
          >
            <Text style={[styles.tabText, activeTab === 'works' && styles.activeTabText]}>
              我的作品
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => handleTabPress('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              帖子
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'selfies' && styles.activeTab]}
            onPress={() => handleTabPress('selfies')}
          >
            <Text style={[styles.tabText, activeTab === 'selfies' && styles.activeTabText]}>
              我的自拍
            </Text>
          </TouchableOpacity>
        </View>

        {/* 内容区域 */}
        <View style={styles.contentArea}>
          {activeTab === 'posts' && (
            <TouchableOpacity style={styles.addPostCard} onPress={handleAddPostPress}>
              <Text style={styles.addPostIcon}>+</Text>
              <Text style={styles.addPostText}>添加帖子</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'works' && (
            <View style={styles.worksContainer}>
              {worksLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>🎨 正在加载作品...</Text>
                </View>
              ) : userWorks.length > 0 ? (
                <View style={styles.worksGrid}>
                  {userWorks.map((work) => (
                    <UserWorkCard
                      key={work._id}
                      work={work}
                      onPress={handleWorkPress}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>🎨 还没有作品哦</Text>
                  <Text style={styles.emptySubText}>快去创作你的第一个作品吧～</Text>
                </View>
              )}
            </View>
          )}
          {activeTab === 'selfies' && (
            <View style={styles.selfiesContainer}>
              <View style={styles.selfiesGrid}>
                {hasSelfies ? (
                  selfies.map((selfie) => (
                    <TouchableOpacity key={selfie.id} style={styles.selfieItem}>
                      <Image 
                        source={selfie.source} 
                        style={[
                          styles.selfieImage,
                          selfie.url === defaultSelfieUrl && styles.defaultSelfieImage
                        ]} 
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptySelfiesState}>
                    <Text style={styles.emptySelfiesText}>暂无自拍照</Text>
                    <TouchableOpacity style={styles.addFirstSelfieButton} onPress={handleAddSelfiePress}>
                      <Text style={styles.addFirstSelfieText}>添加第一张自拍照</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    width: 10,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  giftIcon: {
    fontSize: 16,
  },
  shareIcon: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  greenBanner: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    marginRight: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  bannerArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    fontSize: 24,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  editButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 16,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  instagramIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instagramGradient: {
    fontSize: 18,
  },
  instagramText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  plusIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  activeTabText: {
    opacity: 1,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20
  },
  addPostCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPostIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.6,
  },
  emptySubText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.4,
    marginTop: 8,
  },
  worksContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.6,
  },
  worksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workItem: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  workImage: {
    width: '100%',
    height: 120,
  },
  workInfo: {
    padding: 12,
  },
  workTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  workDate: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
  },
  selfiesContainer: {
    flex: 1,
  },
  selfiesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  selfiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  selfieItem: {
    alignItems: 'center',
    width: '30%',
    position: 'relative',
  },
  selfieImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  defaultSelfieImage: {
    borderWidth: 3,
    borderColor: '#5EE7DF',
  },
  selfieDate: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  testCenterButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  testCenterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptySelfiesState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySelfiesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addFirstSelfieButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFirstSelfieText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NewProfileScreen;

import React, { useState } from 'react';
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

type NewProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'drafts' | 'posts' | 'likes';

const NewProfileScreen: React.FC = () => {
  const navigation = useNavigation<NewProfileScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleGiftPress = () => {
    // 处理礼物功能
    console.log('Gift pressed');
  };

  const handleSharePress = () => {
    // 处理分享功能
    console.log('Share pressed');
  };

  const handleContactsPress = () => {
    // 处理查看联系人创作
    console.log('Contacts pressed');
  };

  const handleEditProfilePress = () => {
    // 处理编辑个人资料
    console.log('Edit profile pressed');
  };

  const handleAddInstagramPress = () => {
    // 处理添加Instagram
    console.log('Add Instagram pressed');
  };

  const handleAddPostPress = () => {
    // 处理添加帖子
    console.log('Add post pressed');
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>简介</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleGiftPress}>
            <Text style={styles.giftIcon}>🎁</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 绿色横幅 */}
        <View style={styles.greenBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerImageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop' }}
                style={styles.bannerImage}
              />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>查看您的联系人创作</Text>
              <Text style={styles.bannerSubtitle}>添加好友以解锁</Text>
            </View>
            <TouchableOpacity style={styles.bannerArrow} onPress={handleContactsPress}>
              <Text style={styles.arrowIcon}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>User6849a7a2</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePress}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 添加Instagram */}
        <TouchableOpacity style={styles.instagramButton} onPress={handleAddInstagramPress}>
          <View style={styles.instagramIcon}>
            <Text style={styles.instagramGradient}>📷</Text>
          </View>
          <Text style={styles.instagramText}>添加 Instagram</Text>
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>

        {/* 导航标签 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'drafts' && styles.activeTab]}
            onPress={() => handleTabPress('drafts')}
          >
            <Text style={[styles.tabText, activeTab === 'drafts' && styles.activeTabText]}>
              草稿
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
            style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
            onPress={() => handleTabPress('likes')}
          >
            <Text style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}>
              点赞
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
          {activeTab === 'drafts' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无草稿</Text>
            </View>
          )}
          {activeTab === 'likes' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无点赞</Text>
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
    backgroundColor: '#000',
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
    borderRadius: 12,
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
    paddingHorizontal: 20,
  },
  addPostCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
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
});

export default NewProfileScreen;

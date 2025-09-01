import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, SafeAreaView, TouchableOpacity, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HomeHeader from '../components/HomeHeader';
import ContentSection from '../components/ContentSection';

type NewHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 模拟数据
const mockArtBrandingTemplates = [
  {
    id: 'art-1',
    title: 'Glam AI',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    likes: 6000,
    isPremium: true,
  },
  {
    id: 'art-2',
    title: 'Glam AI',
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
    likes: 10000,
    isPremium: true,
  },
  {
    id: 'art-3',
    title: 'Glam AI',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    likes: 8500,
    isPremium: true,
  },
];

const mockCommunityTemplates = [
  {
    id: 'community-1',
    title: 'Product Showcase',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop',
    likes: 3200,
    isPremium: false,
  },
  {
    id: 'community-2',
    title: 'Pet Portrait',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=600&fit=crop',
    likes: 4500,
    isPremium: false,
  },
  {
    id: 'community-3',
    title: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
    likes: 2800,
    isPremium: false,
  },
];

const NewHomeScreen: React.FC = () => {
  const navigation = useNavigation<NewHomeScreenNavigationProp>();


  const handleTemplatePress = (templateId: string) => {
    // 跳转到换脸前置页
    navigation.navigate('BeforeCreation', {
      templateId,
      templateData: {
        // 这里可以传递模板数据
      },
    });
  };

  const handleViewAllPress = (categoryId: string, categoryName: string) => {
    // 跳转到模板市场页面
    navigation.navigate('TemplateMarket', {
      categoryId,
      categoryName,
    });
  };



  const handleUpgradePress = () => {
    // 处理升级功能
    console.log('Upgrade pressed');
  };

  const handleProfilePress = () => {
    // 处理个人页面跳转
    navigation.navigate('NewProfile');
  };

  const handleAddSelfiePress = () => {
    // 跳转到自拍引导页
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
          balance={25}
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
            {/* Mock自拍照展示 */}
              <TouchableOpacity style={styles.addSelfieButton} onPress={handleAddSelfiePress}>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }} style={styles.selfieImage} />
              <Image source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }} style={styles.selfieImage} />

          </View>
        </View>

        <ContentSection
          title="Art Branding"
          templates={mockArtBrandingTemplates}
          categoryId="art-branding"
          onTemplatePress={handleTemplatePress}
          onViewAllPress={handleViewAllPress}
        />

        <ContentSection
          title="Community"
          templates={mockCommunityTemplates}
          categoryId="community"
          onTemplatePress={handleTemplatePress}
          onViewAllPress={handleViewAllPress}
        />
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
    borderRadius: 16,
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

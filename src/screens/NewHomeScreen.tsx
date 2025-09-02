import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HomeHeader from '../components/HomeHeader';
import ContentSection from '../components/ContentSection';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { setSelectedTemplate } from '../store/slices/templateSlice';
import { setUploading, setUploadProgress } from '../store/slices/selfieSlice';

type NewHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NewHomeScreen: React.FC = () => {
  const navigation = useNavigation<NewHomeScreenNavigationProp>();
  const dispatch = useAppDispatch();

  // 使用Redux获取数据
  const balance = useTypedSelector((state) => state.user.profile?.balance || 0);
  const artBrandingTemplates = useTypedSelector((state) => state.templates.templates['art-branding'] || []);
  const communityTemplates = useTypedSelector((state) => state.templates.templates['community'] || []);
  const selfies = useTypedSelector((state) => state.selfies.selfies);
  const uploading = useTypedSelector((state) => state.selfies.uploading);
  const uploadProgress = useTypedSelector((state) => state.selfies.uploadProgress);

  const handleTemplatePress = (templateId: string) => {
    // 从Redux store中找到选中的模板
    const selectedTemplate = [...artBrandingTemplates, ...communityTemplates]
      .find(template => template.id === templateId);
    
    if (selectedTemplate) {
      dispatch(setSelectedTemplate(selectedTemplate));
      navigation.navigate('BeforeCreation', {
        templateId,
        templateData: selectedTemplate,
      });
    }
  };

  const handleViewAllPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('TemplateMarket', {
      categoryId,
      categoryName,
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
          balance={balance}
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
                source={{ uri: selfie.imageUrl }} 
                style={styles.selfieImage} 
              />
            ))}
          </View>
        </View>

        {/* 使用Redux中的模板数据 */}
        <ContentSection
          title="Art Branding"
          templates={artBrandingTemplates}
          categoryId="art-branding"
          onTemplatePress={handleTemplatePress}
          onViewAllPress={handleViewAllPress}
        />

        <ContentSection
          title="Community"
          templates={communityTemplates}
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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { callFaceFusionCloudFunction } from '../services/tcb/tcb';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type BeforeCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BeforeCreationScreenRouteProp = RouteProp<RootStackParamList, 'BeforeCreation'>;

// 模拟模板数据
const mockTemplateData = {
  id: 'template-1',
  title: 'Glam AI Style',
  images: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop',
  ],
  previewImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
  description: '需要AI头像',
};

const BeforeCreationScreen: React.FC = () => {
  const navigation = useNavigation<BeforeCreationScreenNavigationProp>();
  const route = useRoute<BeforeCreationScreenRouteProp>();
  const { templateId, templateData } = route.params;
  
  const dispatch = useAppDispatch();
  
  // 从Redux获取用户自拍照数据
  const selfies = useTypedSelector((state) => state.selfies.selfies);
  const isProcessing = useTypedSelector((state) => state.selfies.uploading);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFusionProcessing, setIsFusionProcessing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 使用模拟数据，实际应该从API获取
  const template = mockTemplateData;

  useEffect(() => {
    // 自动轮播
    const interval = setInterval(() => {
      if (template.images.length > 1) {
        const nextIndex = (currentImageIndex + 1) % template.images.length;
        setCurrentImageIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * screenWidth,
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentImageIndex, template.images.length]);

  const handleImageScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentImageIndex(index);
  };

  const handleSavePress = () => {
    // 处理保存功能
    console.log('Save pressed');
  };

  const handleSharePress = () => {
    // 处理分享功能
    console.log('Share pressed');
  };

  const handleUseStylePress = async () => {
    try {
      // 检查是否上传过自拍
      if (selfies.length <= 0) {
        Alert.alert(
          '需要自拍照',
          '使用此风格需要先上传自拍照，是否前往上传？',
          [
            {
              text: '取消',
              style: 'cancel',
            },
            {
              text: '去上传',
              onPress: () => {
                navigation.navigate('SelfieGuide');
              },
            },
          ]
        );
        return;
      }

      // 开始人脸融合处理
      setIsFusionProcessing(true);
      
      // 获取最新的自拍照
      const latestSelfie = selfies[0];
      
      // 调用人脸融合云函数
      const fusionParams = {
        projectId: 'at_1888958525505814528', // TODO: 从模板数据中获取
        modelId: templateId,
        imageUrl: latestSelfie.imageUrl,
      };

      console.log('开始人脸融合:', fusionParams);
      
      const result = await callFaceFusionCloudFunction({
        projectId: 'at_1888958525505814528',
        modelId: templateId,
        imageUrl: latestSelfie.imageUrl,
      }); 
      
      if (result.code === 0 && result.data) {
        // 融合成功
        Alert.alert(
          '融合成功',
          'AI头像生成完成！',
          [
            {
              text: '查看结果',
              onPress: () => {
                // TODO: 跳转到结果页面
                console.log('融合结果:', result.data);
              },
            },
            {
              text: '确定',
            },
          ]
        );
      } else {
        // 融合失败
        Alert.alert('融合失败', result.message || '生成AI头像失败，请重试');
      }
    } catch (error: any) {
      console.error('人脸融合失败:', error);
      Alert.alert('错误', error.message || '处理失败，请重试');
    } finally {
      setIsFusionProcessing(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      {/* 右侧操作按钮 */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSavePress}>
          <Text style={styles.actionIcon}>⬇️</Text>
          <Text style={styles.actionLabel}>保存</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionLabel}>分享</Text>
        </TouchableOpacity>
      </View>

      {/* 主图片区域 */}
      <View style={styles.imageContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleImageScroll}
          scrollEventThrottle={16}
        >
          {template.images.map((imageUrl, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>

        {/* 图片指示器 */}
        {template.images.length > 1 && (
          <View style={styles.indicatorContainer}>
            {template.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* 预览图片 */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: template.previewImage }}
          style={styles.previewImage}
          resizeMode="cover"
        />
      </View>

      {/* 底部信息区域 */}
      <View style={styles.bottomContainer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.personIcon}>👤</Text>
          <Text style={styles.description}>{template.description}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.useStyleButton, (isFusionProcessing || isProcessing) && styles.useStyleButtonDisabled]} 
          onPress={handleUseStylePress}
          disabled={isFusionProcessing || isProcessing}
        >
          {isFusionProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.processingText}>AI处理中...</Text>
            </View>
          ) : (
            <Text style={styles.useStyleText}>使用风格</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: 0,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rightActions: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 0,
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight + 100,
    marginTop: -100,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  previewContainer: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    zIndex: 5,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#fff',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 100,
  },
  personIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  useStyleButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  useStyleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  useStyleButtonDisabled: {
    backgroundColor: '#666',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BeforeCreationScreen;

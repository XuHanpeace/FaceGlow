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
import { Template } from '../types/model/activity';
import SelfieSelector from '../components/SelfieSelector';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type BeforeCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BeforeCreationScreenRouteProp = RouteProp<RootStackParamList, 'BeforeCreation'>;

const BeforeCreationScreen: React.FC = () => {
  const navigation = useNavigation<BeforeCreationScreenNavigationProp>();
  const route = useRoute<BeforeCreationScreenRouteProp>();
  const { albumData, activityId } = route.params;
  
  const dispatch = useAppDispatch();
  
  // 从Redux获取用户自拍照数据
  const selfies = useTypedSelector((state) => state.selfies.selfies);
  const isProcessing = useTypedSelector((state) => state.selfies.uploading);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFusionProcessing, setIsFusionProcessing] = useState(false);
  const [selectedSelfieUrl, setSelectedSelfieUrl] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 从albumData中获取template数据
  const album = albumData;
  const templates = album.template_list || [];
  
  // 构建轮播图数据，使用template_list中的template_url
  const template = {
    id: album.album_id,
    title: album.album_name,
    images: templates.map((t: Template) => t.template_url),
    previewImage: templates[0]?.template_url || '',
    description: album.album_description
  };

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
      // 检查是否选择了自拍
      if (!selectedSelfieUrl) {
        Alert.alert(
          '需要自拍照',
          '使用此风格需要先选择自拍照，是否前往上传？',
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
      
      // 获取当前选中的template
      const currentTemplate = templates[currentImageIndex];
      if (!currentTemplate) {
        Alert.alert('错误', '未找到选中的模板');
        return;
      }

      // 跳转到CreationResult页面
      navigation.navigate('CreationResult', {
        albumData: album,
        selfieUrl: selectedSelfieUrl,
        activityId: activityId,
      });

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

  const handleSelfieSelect = (selfieUrl: string) => {
    setSelectedSelfieUrl(selfieUrl);
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
          {template.images.map((imageUrl: string, index: number) => (
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
            {template.images.map((_: string, index: number) => (
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

      {/* 自拍选择器 */}
      <View style={styles.previewContainer}>
        <SelfieSelector
          selectedSelfieUrl={selectedSelfieUrl || undefined}
          onSelfieSelect={handleSelfieSelect}
          size={100}
        />
      </View>

      {/* 底部信息区域 */}
      <View style={styles.bottomContainer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{album.album_description || '需要AI头像'}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.useStyleButton, (isFusionProcessing || isProcessing) && styles.useStyleButtonDisabled]} 
          onPress={handleUseStylePress}
          disabled={isProcessing}
        >
          <Text style={styles.useStyleText}>使用风格</Text>
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

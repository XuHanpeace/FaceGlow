import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FastImage from 'react-native-fast-image';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { useAuthState } from '../hooks/useAuthState';
import { authService } from '../services/auth/authService';
import { Album, Template } from '../types/model/activity';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SelfieSelector from '../components/SelfieSelector';

const { width: screenWidth } = Dimensions.get('window');

type BeforeCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BeforeCreationScreenRouteProp = RouteProp<RootStackParamList, 'BeforeCreation'>;

const BeforeCreationScreen: React.FC = () => {
  const navigation = useNavigation<BeforeCreationScreenNavigationProp>();
  const route = useRoute<BeforeCreationScreenRouteProp>();
  const { albumData, activityId } = route.params;
  
  const dispatch = useAppDispatch();
  
  // 检查登录状态
  const { isLoggedIn } = useAuthState();
  
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

  const handleUseStylePress = async () => {
    // 触发触觉反馈
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };
    ReactNativeHapticFeedback.trigger("impactLight", options);

    try {
      // 检查是否是真实用户
      const authResult = await authService.requireRealUser();
      
      if (!authResult.success) {
        if (authResult.error?.code === 'ANONYMOUS_USER' || authResult.error?.code === 'NOT_LOGGED_IN') {
              navigation.navigate('NewAuth');
        }
        return;
      }

      // 检查是否选择了自拍
      if (!selectedSelfieUrl) {
        Alert.alert(
          '😅 需要自拍照',
          '小主，使用此风格需要先选择自拍照，是否前往上传？',
          [
            {
              text: '取消',
              style: 'cancel',
            },
            {
              text: '✨ 去上传',
              onPress: async () => {
                // 再次确认真实用户（防止用户登出）
                const uploadAuthResult = await authService.requireRealUser();
                if (uploadAuthResult.success) {
                  navigation.navigate('SelfieGuide');
                } else {
                  Alert.alert('提示', '请先登录');
                }
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 返回按钮 */}
      <BackButton iconType="arrow" onPress={handleBackPress} />

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

        {/* 图片指示器 - 移动到左下角内容上方 */}
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

      {/* 底部内容区域 */}
      <View style={styles.bottomContainer}>
        {/* 内容容器 */}
        <View style={styles.contentContainer}>
          {/* 头像选择 - 左下方 */}
          <View style={styles.avatarContainer}>
            <SelfieSelector
              onSelfieSelect={handleSelfieSelect}
              selectedSelfieUrl={selectedSelfieUrl ?? undefined}
              size={72}
            />
          </View>

          {/* 文本信息 */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{template.title}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {template.description}
            </Text>
          </View>

          {/* 按钮 */}
          <GradientButton
            title="创作同款"
            onPress={handleUseStylePress}
            variant="primary"
            size="large"
            style={styles.useButton}
            fontSize={16}
            borderRadius={28}
            loading={isFusionProcessing}
            disabled={isFusionProcessing}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1, // 全屏显示
    width: '100%',
  },
  imageWrapper: {
    width: screenWidth,
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    top: 60, // 顶部指示器
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 5,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40, // 底部安全距离
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
  },
  avatarContainer: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  textContainer: {
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  useButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default BeforeCreationScreen;

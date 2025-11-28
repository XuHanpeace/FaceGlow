import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Alert,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import LinearGradient from 'react-native-linear-gradient';

import { RootStackParamList } from '../types/navigation';
import { useTypedSelector } from '../store/hooks';
import { useAuthState } from '../hooks/useAuthState';
import { authService } from '../services/auth/authService';
import { Album, Template } from '../types/model/activity';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';
import SelfieSelector from '../components/SelfieSelector';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type BeforeCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BeforeCreationScreenRouteProp = RouteProp<RootStackParamList, 'BeforeCreation'>;

// 扩展 Album 类型，包含 activityId
interface AlbumWithActivityId extends Album {
  activityId: string;
}

// 单个模版页面组件
const TemplateSlide = React.memo(({ 
  template, 
  album, 
  selectedSelfieUrl, 
  isFusionProcessing, 
  onUseStyle, 
  onSelfieSelect 
}: { 
  template: Template, 
  album: Album, 
  selectedSelfieUrl: string | null, 
  isFusionProcessing: boolean, 
  onUseStyle: (template: Template) => void, 
  onSelfieSelect: (url: string) => void 
}) => {
  return (
    <View style={styles.pageContainer}>
      <Image
        source={{ uri: template.template_url }}
        style={styles.mainImage}
        resizeMode="cover"
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      <View style={styles.contentOverlay}>
        <View style={styles.avatarContainer}>
          <SelfieSelector
            onSelfieSelect={onSelfieSelect}
            selectedSelfieUrl={selectedSelfieUrl ?? undefined}
            size={72}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{album.album_name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {template.template_description || album.album_description}
          </Text>
        </View>

        <GradientButton
          title="创作同款"
          onPress={() => onUseStyle(template)}
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
  );
});

// 单个相册组件（包含多个模版）
const AlbumSlide = React.memo(({ 
  album, 
  isActive,
  selectedSelfieUrl, 
  isFusionProcessing, 
  onUseStyle, 
  onSelfieSelect 
}: { 
  album: Album, 
  isActive: boolean,
  selectedSelfieUrl: string | null, 
  isFusionProcessing: boolean, 
  onUseStyle: (template: Template) => void, 
  onSelfieSelect: (url: string) => void 
}) => {
  const templates = album.template_list || [];

  const renderTemplateItem = useCallback(({ item }: { item: Template }) => {
    return (
      <TemplateSlide
        template={item}
        album={album}
        selectedSelfieUrl={selectedSelfieUrl}
        isFusionProcessing={isFusionProcessing}
        onUseStyle={onUseStyle}
        onSelfieSelect={onSelfieSelect}
      />
    );
  }, [album, selectedSelfieUrl, isFusionProcessing, onUseStyle, onSelfieSelect]);

  return (
    <View style={styles.albumContainer}>
      <FlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item, index) => item.template_id || `${album.album_id}_${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="start"
        initialNumToRender={2}
        windowSize={3}
        removeClippedSubviews={true}
      />
    </View>
  );
});

const BeforeCreationScreen: React.FC = () => {
  const navigation = useNavigation<BeforeCreationScreenNavigationProp>();
  const route = useRoute<BeforeCreationScreenRouteProp>();
  const { albumData, activityId } = route.params;
  
  const { isLoggedIn } = useAuthState();
  
  // Redux state
  const activities = useTypedSelector((state) => state.activity.activities);
  const isProcessing = useTypedSelector((state) => state.selfies.uploading);

  // 扁平化所有 Albums，并注入 activityId
  const allAlbums = useMemo<AlbumWithActivityId[]>(() => {
    if (!activities || activities.length === 0) {
      return [{ ...albumData, activityId: activityId }];
    }
    
    const albums: AlbumWithActivityId[] = [];
    activities.forEach(activity => {
      // 兼容 activity_id 和 activiy_id (以防拼写错误被修正或混用)
      const actId = (activity as any).activity_id || activity.activiy_id;
      if (activity.album_id_list) {
        activity.album_id_list.forEach(album => {
          albums.push({
            ...album,
            activityId: actId
          });
        });
      }
    });

    // 确保当前 albumData 在列表中，如果不在（比如来自非 redux 数据源），则添加
    const exists = albums.some(a => a.album_id === albumData.album_id);
    if (!exists) {
      return [{ ...albumData, activityId: activityId }, ...albums];
    }
    return albums;
  }, [activities, albumData, activityId]);

  // 初始 Index
  const initialIndex = useMemo(() => {
    const index = allAlbums.findIndex(a => a.album_id === albumData.album_id);
    return index >= 0 ? index : 0;
  }, [allAlbums, albumData]);

  const [isFusionProcessing, setIsFusionProcessing] = useState(false);
  const [selectedSelfieUrl, setSelectedSelfieUrl] = useState<string | null>(null);
  const [activeAlbumIndex, setActiveAlbumIndex] = useState(initialIndex);

  // 垂直滑动回调
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveAlbumIndex(viewableItems[0].index);
    }
  }).current;

  const handleUseStylePress = useCallback(async (currentTemplate: Template) => {
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
      
      if (!currentTemplate) {
        Alert.alert('错误', '未找到选中的模板');
        return;
      }

      // 获取当前选中的 Album 和对应的 Activity ID
      const currentAlbum = allAlbums[activeAlbumIndex];
      // 直接从 currentAlbum 中获取 activityId，如果没有则回退到 route params
      const currentActivityId = currentAlbum.activityId || activityId;

      // 跳转到CreationResult页面
      navigation.navigate('CreationResult', {
        albumData: currentAlbum, // 使用当前激活的 Album Data
        selfieUrl: selectedSelfieUrl,
        activityId: currentActivityId, 
      });

    } catch (error: any) {
      console.error('人脸融合失败:', error);
      Alert.alert('错误', error.message || '处理失败，请重试');
    } finally {
      setIsFusionProcessing(false);
    }
  }, [selectedSelfieUrl, navigation, activityId, allAlbums, activeAlbumIndex]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelfieSelect = useCallback((selfieUrl: string) => {
    setSelectedSelfieUrl(selfieUrl);
  }, []);

  const renderAlbumItem = useCallback(({ item, index }: { item: Album, index: number }) => {
    return (
      <AlbumSlide
        album={item}
        isActive={index === activeAlbumIndex}
        selectedSelfieUrl={selectedSelfieUrl}
        isFusionProcessing={isFusionProcessing}
        onUseStyle={handleUseStylePress}
        onSelfieSelect={handleSelfieSelect}
      />
    );
  }, [activeAlbumIndex, selectedSelfieUrl, isFusionProcessing, handleUseStylePress, handleSelfieSelect]);

  // 如果没有数据，显示 Loading 或空状态
  if (!allAlbums || allAlbums.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <BackButton iconType="arrow" onPress={handleBackPress} />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: '#fff'}}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <BackButton iconType="arrow" onPress={handleBackPress} />

      <FlatList
        data={allAlbums}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.album_id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenHeight}
        snapToAlignment="start"
        initialScrollIndex={initialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        getItemLayout={(data, index) => (
          {length: screenHeight, offset: screenHeight * index, index}
        )}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  albumContainer: {
    width: screenWidth,
    height: screenHeight,
  },
  pageContainer: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
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

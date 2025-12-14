import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import LinearGradient from 'react-native-linear-gradient';

import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { authService } from '../services/auth/authService';
import { Album, Template } from '../types/model/activity';
import { AlbumWithActivityId, selectAllAlbums } from '../store/slices/activitySlice';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';
import SelfieSelector from '../components/SelfieSelector';
import { startAsyncTask, StartAsyncTaskPayload, AsyncTaskError } from '../store/slices/asyncTaskSlice';
import { CrossFadeImage } from '../components/CrossFadeImage';
import FastImage from 'react-native-fast-image';
import { useUser, useUserBalance, useUserSelfies } from '../hooks/useUser';
import { AlbumRecord } from '../types/model/album';
import { normalizeTaskExecutionType } from '../utils/albumUtils';
import { aegisService } from '../services/monitoring/aegisService';
import { TaskType } from '../services/cloud/asyncTaskService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type BeforeCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BeforeCreationScreenRouteProp = RouteProp<RootStackParamList, 'BeforeCreation'>;

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
  onSelfieSelect: (url: string) => void,
  customPrompt: string,
  onCustomPromptChange: (text: string) => void,
}) => {
  // 使用 AlbumRecord 结构中的 src_image 字段
  const albumRecord = album as AlbumRecord;
  const srcImage = albumRecord.src_image;

  return (
    <View style={styles.pageContainer}>
      {srcImage ? (
        <CrossFadeImage
          image1={srcImage}
          image2={template.template_url}
          duration={1500}
          interval={2000}
          imageStyle={styles.mainImage}
          containerStyle={styles.mainImageContainer}
        />
      ) : (
        <FastImage
          source={{ uri: template.template_url }}
          style={styles.mainImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
      
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

        {/* 自定义提示词输入框（如果允许） */}
        {/* {album.allow_custom_prompt && (
          <View style={styles.promptInputContainer}>
            <TextInput
              style={styles.promptInput}
              placeholder={album.custom_prompt_placeholder || "描述你想要的视频效果..."}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={customPrompt}
              onChangeText={onCustomPromptChange}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
              editable={!isFusionProcessing}
            />
            <Text style={styles.promptInputHint}>
              {customPrompt.length}/200
            </Text>
          </View>
        )} */}

        <GradientButton
          title="一键创作"
          onPress={() => onUseStyle(template)}
          variant="primary"
          size="large"
          style={styles.useButton}
          fontSize={16}
          borderRadius={28}
          loading={isFusionProcessing}
          disabled={isFusionProcessing}
          rightComponent={
            ((template.price && template.price > 0) || (album.price && album.price > 0)) ? (
              <View style={styles.priceContainer}>
                <Image 
                  source={require('../assets/mm-coins.png')} 
                  style={styles.coinIcon}
                  resizeMode="contain"
                />
                <Text style={styles.priceText}>
                  {template.price && template.price > 0 ? template.price : album.price}
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
});

// 单个相册组件（包含多个模版）
const AlbumSlide = React.memo(({ 
  album, 
  selectedSelfieUrl, 
  isFusionProcessing, 
  onUseStyle, 
  onSelfieSelect,
  customPrompt,
  onCustomPromptChange,
}: { 
  album: Album, 
  selectedSelfieUrl: string | null, 
  isFusionProcessing: boolean, 
  onUseStyle: (template: Template) => void, 
  onSelfieSelect: (url: string) => void,
  customPrompt: string,
  onCustomPromptChange: (text: string) => void,
}) => {
  
  // 如果是 asyncTask，可能 template_list 为空，构造一个虚拟 template
  const templates = (album.template_list && album.template_list.length > 0) 
    ? album.template_list 
    : [{
        template_id: 'default',
        template_url: album.album_image, // 使用相册封面作为模板图
        template_name: album.album_name,
        template_description: album.album_description,
        price: 0
      } as Template];

  const renderTemplateItem = useCallback(({ item }: { item: Template }) => {
    return (
      <TemplateSlide
        template={item}
        album={album}
        selectedSelfieUrl={selectedSelfieUrl}
        isFusionProcessing={isFusionProcessing}
        onUseStyle={onUseStyle}
        onSelfieSelect={onSelfieSelect}
        customPrompt={customPrompt}
        onCustomPromptChange={onCustomPromptChange}
      />
    );
  }, [album, selectedSelfieUrl, isFusionProcessing, onUseStyle, onSelfieSelect, customPrompt, onCustomPromptChange]);

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
        nestedScrollEnabled={true}
      />
    </View>
  );
});

const BeforeCreationScreen: React.FC = () => {
  const navigation = useNavigation<BeforeCreationScreenNavigationProp>();
  const route = useRoute<BeforeCreationScreenRouteProp>();
  const dispatch = useAppDispatch();
  const { albumData, activityId } = route.params;
  
  // Redux state - 直接使用已计算好的 allAlbums
  const allAlbums = useTypedSelector(selectAllAlbums);
  const activities = useTypedSelector((state) => state.activity.activities);
  const user = useTypedSelector((state) => state.auth);
  
  // 用户信息和余额
  const { userInfo, isVip } = useUser();
  const { balance } = useUserBalance();
  const { hasSelfies, selfies } = useUserSelfies();
  // 确保当前 albumData 在列表中，如果不在（比如来自非 redux 数据源），则添加
  const albumsWithCurrent = useMemo<AlbumWithActivityId[]>(() => {
    // 如果 allAlbums 为空，说明数据还没加载，先返回当前 albumData
    if (!allAlbums || allAlbums.length === 0) {
      return [{ ...albumData, activityId: activityId }];
    }
    
    // 检查当前 albumData 是否已在列表中
    const exists = allAlbums.some(a => a.album_id === albumData.album_id);
    if (!exists) {
      // 如果不在，添加到列表开头
      return [{ ...albumData, activityId: activityId }, ...allAlbums];
    }
    
    return allAlbums;
  }, [allAlbums, albumData, activityId]);

  // 初始 Index - 根据传入的 albumData 和 activityId 定位
  const initialIndex = useMemo(() => {
    const index = albumsWithCurrent.findIndex(a => 
      a.album_id === albumData.album_id && 
      (a.activityId === activityId || !a.activityId)
    );
    return index >= 0 ? index : 0;
  }, [albumsWithCurrent, albumData, activityId]);

  const [isFusionProcessing, setIsFusionProcessing] = useState(false);
  const [selectedSelfieUrl, setSelectedSelfieUrl] = useState<string | null>(null);
  const [activeAlbumIndex, setActiveAlbumIndex] = useState(initialIndex);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 页面加载时上报埋点
  useEffect(() => {
    aegisService.reportPageView('before_creation');
    aegisService.reportUserAction('enter_before_creation', {
      album_id: albumData?.album_id || '',
      album_title: albumData?.album_name || '', // 专辑标题
      activity_id: activityId,
      template_count: albumData?.template_list?.length || 0,
    });
  }, []);

console.log('allAlbums', allAlbums, albumsWithCurrent, initialIndex);

  // 垂直滑动回调
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveAlbumIndex(viewableItems[0].index);
    }
  }, []);

  const handleUseStylePress = useCallback(async (currentTemplate: Template) => {
    // 触发触觉反馈
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };
    ReactNativeHapticFeedback.trigger("impactLight", options);

    // 埋点：用户点击创作按钮（使用 fg_click_ 前缀，包含专辑标题）
    const currentAlbum = albumsWithCurrent[activeAlbumIndex];
    aegisService.reportClick('create_button', {
      album_id: currentAlbum?.album_id || '',
      album_title: currentAlbum?.album_name || '', // 专辑标题
      template_id: currentTemplate?.template_id || '',
      activity_id: currentAlbum?.activityId || activityId,
      template_price: currentTemplate?.price || 0,
      album_price: currentAlbum?.price || 0,
    });

    try {
      // 检查是否是真实用户
      const authResult = await authService.requireRealUser();
      
      if (!authResult.success) {
        if (authResult.error?.code === 'ANONYMOUS_USER' || authResult.error?.code === 'NOT_LOGGED_IN') {
              navigation.navigate('NewAuth');
        }
        return;
      }


      // 获取当前选中的 Album 和对应的 Activity ID
      const currentAlbum = albumsWithCurrent[activeAlbumIndex];
      const currentActivityId = currentAlbum.activityId || activityId;

      // 检查是否选择了自拍，如果没有则直接跳转到上传页面
      if (!selectedSelfieUrl) {
        // 埋点：缺少自拍照，跳转到上传页面
        aegisService.reportUserAction('navigate_to_selfie_upload', {
          album_id: currentAlbum?.album_id || '',
          album_title: currentAlbum?.album_name || '',
          reason: 'no_selfie_selected',
        });
        
        // 再次确认真实用户（防止用户登出）
        const uploadAuthResult = await authService.requireRealUser();
        if (uploadAuthResult.success) {
          // 判断是否为新用户（没有自拍）
          const isNewUser = !hasSelfies || selfies.length === 0;
          navigation.navigate('SelfieGuide', { isNewUser });
        } else {
          // 如果用户未登录，先跳转到登录页面
          navigation.navigate('NewAuth');
        }
        return;
      }

      
      // 将 AlbumWithActivityId 转换为 AlbumRecord 进行类型检查
      // 注意：AlbumWithActivityId 可能不包含所有 AlbumRecord 字段，需要安全访问
      const albumRecord = currentAlbum as unknown as AlbumRecord;
      
      // 获取价格信息（用于传递给云函数）
      const albumPrice = currentAlbum.price || 0;
      const templatePrice = currentTemplate?.price || 0;
      const totalPrice = templatePrice > 0 ? templatePrice : albumPrice;
      
      // 3.2 检查用户权限（会员专享）
      const albumLevel = albumRecord.level || currentAlbum.level || '0';
      const isMemberOnly = albumRecord.activity_tag_type === 'member';
      
      // level: '0'=免费, '1'=高级会员, '2'=VIP会员
      // 或者 activity_tag_type === 'member' 表示会员专享
      if ((albumLevel !== '0' || isMemberOnly) && !isVip) {
        Alert.alert(
          '👑 会员专享',
          '此功能为会员专享，普通用户无法使用\n是否前往开通会员？',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '去开通', 
              onPress: () => navigation.navigate('Subscription')
            }
          ]
        );
        return;
      }

      // 开始处理
      setIsFusionProcessing(true);

      // 3.3 根据 task_execution_type 判断调用哪个云函数
      // 兼容旧模板：将 sync/async 映射到新的具体类型
      const normalizedTaskExecutionType = normalizeTaskExecutionType(
        albumRecord.task_execution_type,
        albumRecord.function_type
      );
      
      console.log('[BeforeCreation] Task Execution Type:', { 
          currentActivityId, 
          original_task_execution_type: albumRecord.task_execution_type,
          normalized_task_execution_type: normalizedTaskExecutionType,
          function_type: albumRecord.function_type,
      });

      // 判断是否为同步任务（调用 fusion 云函数）
      const isSyncTask = normalizedTaskExecutionType === 'sync_portrait' || 
                        normalizedTaskExecutionType === 'sync_group_photo';

      if (!isSyncTask) {
        // 异步任务逻辑（调用 callBailian 云函数）
        // 从 AlbumRecord 中获取 prompt_text
        const promptText = albumRecord.prompt_text || '';
        
        // 根据标准化后的 task_execution_type 映射到 TaskType
        let taskType: TaskType;
        if (normalizedTaskExecutionType === 'async_image_to_video') {
          taskType = TaskType.IMAGE_TO_VIDEO;
        } else if (normalizedTaskExecutionType === 'async_video_effect') {
          taskType = TaskType.VIDEO_EFFECT;
        } else if (normalizedTaskExecutionType === 'async_portrait_style_redraw') {
          taskType = TaskType.PORTRAIT_STYLE_REDRAW;
        } else {
          // 默认或 async_image_to_image
          taskType = TaskType.IMAGE_TO_IMAGE;
        }

        // 合并提示词：默认提示词 + 用户自定义提示词
        let finalPrompt = promptText;
        if (albumRecord.allow_custom_prompt && customPrompt.trim()) {
          finalPrompt = `${promptText} ${customPrompt.trim()}`;
        }
        
        if (!finalPrompt && taskType !== TaskType.VIDEO_EFFECT) {
          Alert.alert('错误', '缺少提示词数据，无法进行创作');
          setIsFusionProcessing(false);
          return;
        }
        
        // 验证必填参数
        if ((taskType === TaskType.IMAGE_TO_IMAGE || taskType === TaskType.IMAGE_TO_VIDEO) && !selectedSelfieUrl) {
          Alert.alert('错误', '请先选择自拍照');
          setIsFusionProcessing(false);
          return;
        }
        
        // 视频特效使用首帧图片（从selectedSelfieUrl或images获取）
        // 不需要额外验证，因为视频特效实际上使用的是首帧图片URL
        
        console.log('[BeforeCreation] Starting AsyncTask:', { taskType, prompt: finalPrompt });
        
        // 尝试从 authService 直接获取当前用户信息，作为兜底
        const currentUid = authService.getCurrentUserId();
        const uid = currentUid || user?.uid;

        if (!uid) {
             console.error('[BeforeCreation] User UID not found in Redux or Auth Service');
             throw new Error('用户未登录');
        }

        // 构建视频参数（视频特效使用）
        const videoParams: any = {};
        if (taskType === TaskType.VIDEO_EFFECT) {
          videoParams.resolution = '720P'; // 默认720P
          videoParams.template = albumRecord.video_effect_template || 'flying';
          videoParams.style_type = albumRecord.video_effect_template || 'flying'; // 向后兼容
        } else if (taskType === TaskType.IMAGE_TO_VIDEO) {
          videoParams.resolution = '720P'; // 默认720P
        }

        // 构建人像风格重绘参数
        const styleRedrawParams: any = {};
        if (taskType === TaskType.PORTRAIT_STYLE_REDRAW) {
          if (albumRecord.style_index !== undefined) {
            styleRedrawParams.style_index = albumRecord.style_index;
          }
          if (albumRecord.style_ref_url) {
            styleRedrawParams.style_ref_url = albumRecord.style_ref_url;
          }
        }

        const taskParams: StartAsyncTaskPayload = {
             taskType: taskType,
             prompt: finalPrompt || '', // 视频特效和人像风格重绘不需要prompt，但保持向后兼容
             images: [selectedSelfieUrl], // 所有异步任务都使用自拍图
             audioUrl: taskType === TaskType.IMAGE_TO_VIDEO ? albumRecord.audio_url : undefined, // 图生视频音频URL（如果相册数据中有）
             activityId: currentActivityId,
             activityTitle: albumRecord.album_name,
             activityDescription: albumRecord.album_description,
             activityImage: albumRecord.preview_video_url || albumRecord.result_image || albumRecord.album_image,
             uid: uid,
             templateId: currentTemplate?.template_id || albumRecord.album_id,
             price: totalPrice,
             videoParams: Object.keys(videoParams).length > 0 ? videoParams : undefined,
             styleRedrawParams: Object.keys(styleRedrawParams).length > 0 ? styleRedrawParams : undefined,
             promptData: {
               text: finalPrompt,
               srcImage: albumRecord.src_image,
               resultImage: albumRecord.result_image,
               styleTitle: albumRecord.album_name,
               styleDesc: albumRecord.album_description,
             }
        };
        console.log('[BeforeCreation] Dispatching startAsyncTask:', taskParams);

        try {
        await dispatch(startAsyncTask(taskParams)).unwrap();
        console.log('[BeforeCreation] AsyncTask started successfully');
        } catch (error) {
          // 处理余额不足错误（使用错误码判断）
          if (error && typeof error === 'object' && 'errCode' in error) {
            const asyncTaskError = error as AsyncTaskError;
            if (asyncTaskError.errCode === 'INSUFFICIENT_BALANCE') {
              const currentBalance = asyncTaskError.data?.currentBalance ?? 0;
              const requiredAmount = asyncTaskError.data?.requiredAmount ?? 0;
              Alert.alert(
                '💎 余额不足',
                `需要${requiredAmount}美美币，当前余额${currentBalance}美美币\n是否前往充值？`,
                [
                  { text: '取消', style: 'cancel' },
                  { 
                    text: '去充值', 
                    onPress: () => navigation.navigate('CoinPurchase')
                  }
                ]
              );
              return;
            }
          }
          // 其他错误
          const errorMessage = error && typeof error === 'object' && 'message' in error 
            ? (error as AsyncTaskError).message 
            : (error instanceof Error ? error.message : String(error));
          throw new Error(errorMessage);
        }

        // 埋点：异步任务提交成功（使用 fg_action_ 前缀，包含专辑标题）
        aegisService.reportUserAction('async_task_submitted', {
          album_id: currentAlbum?.album_id || '',
          album_title: currentAlbum?.album_name || '',
          template_id: currentTemplate?.template_id || albumRecord.album_id,
          activity_id: currentActivityId,
          task_type: taskType,
          has_custom_prompt: !!(albumRecord.allow_custom_prompt && customPrompt.trim()),
        });

        Alert.alert('创作已开始', `AI正在努力创作中，预计需要1-3分钟。完成后会提醒你，记得去"我的作品"查看哦～`, [
            { text: '好的', onPress: () => navigation.goBack() }
        ]);

      } else {
        // 同步任务（换脸）- 使用 templateId
        if (!currentTemplate) {
          Alert.alert('错误', '未找到选中的模板');
          setIsFusionProcessing(false);
          return;
        }

        // 验证 template_id 是否存在（换脸需要 templateId）
        if (!currentTemplate.template_id) {
          Alert.alert('错误', '模板ID缺失，无法进行换脸创作');
          setIsFusionProcessing(false);
          return;
        }

        // 埋点：跳转到换脸页面（使用 fg_action_ 前缀，包含专辑标题）
        aegisService.reportUserAction('navigate_to_fusion', {
          album_id: currentAlbum?.album_id || '',
          album_title: currentAlbum?.album_name || '', // 专辑标题
          template_id: currentTemplate?.template_id || '',
          activity_id: currentActivityId,
          task_type: 'face_fusion',
        });

        // 跳转到CreationResult页面（换脸使用 templateId）
        navigation.navigate('CreationResult', {
          albumData: currentAlbum,
          selfieUrl: selectedSelfieUrl,
          activityId: currentActivityId, 
        });
      }

    } catch (error) {
      console.error('处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : '处理失败，请重试';
      Alert.alert('错误', errorMessage);
    } finally {
      setIsFusionProcessing(false);
    }
  }, [selectedSelfieUrl, customPrompt, navigation, activityId, albumsWithCurrent, activeAlbumIndex, activities, dispatch, user, userInfo, isVip, balance]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelfieSelect = useCallback((selfieUrl: string) => {
    setSelectedSelfieUrl(selfieUrl);
  }, []);

  const handleCustomPromptChange = useCallback((text: string) => {
    setCustomPrompt(text);
  }, []);

  const renderAlbumItem = useCallback(({ item }: { item: Album }) => {
    return (
      <AlbumSlide
        album={item}
        selectedSelfieUrl={selectedSelfieUrl}
        isFusionProcessing={isFusionProcessing}
        onUseStyle={handleUseStylePress}
        onSelfieSelect={handleSelfieSelect}
        customPrompt={customPrompt}
        onCustomPromptChange={handleCustomPromptChange}
      />
    );
  }, [selectedSelfieUrl, isFusionProcessing, handleUseStylePress, handleSelfieSelect, customPrompt, handleCustomPromptChange]);

  // 如果没有数据，显示 Loading 或空状态
  if (!albumsWithCurrent || albumsWithCurrent.length === 0) {
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <FlatList
        style={{ flex: 1 }}
        data={albumsWithCurrent}
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
        getItemLayout={(_data, index) => (
          {length: screenHeight, offset: screenHeight * index, index}
        )}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        nestedScrollEnabled={true}
      />
      </KeyboardAvoidingView>
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
  mainImageContainer: {
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIcon: {
    width: 22,
    height: 22,
  },
  priceText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  promptInputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  promptInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  promptInputHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
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

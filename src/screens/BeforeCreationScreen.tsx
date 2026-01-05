import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  TextInput,
  Keyboard,
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
import { startAsyncTask, StartAsyncTaskPayload, AsyncTaskError, VideoParams, StyleRedrawParams } from '../store/slices/asyncTaskSlice';
import { CrossFadeImage } from '../components/CrossFadeImage';
import FastImage from 'react-native-fast-image';
import { LoadingImage } from '../components/LoadingImage';
import { useUser, useUserBalance, useUserSelfies } from '../hooks/useUser';
import { AlbumRecord } from '../types/model/album';
import { getAlbumMediaInfo, normalizeTaskExecutionType } from '../utils/albumUtils';
import { aegisService } from '../services/monitoring/aegisService';
import { TaskType } from '../services/cloud/asyncTaskService';
import Video from 'react-native-video';
import { MMKV } from 'react-native-mmkv';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 创建MMKV存储实例用于保存自拍选择
const storage = new MMKV();
const STORAGE_KEY_SELECTED_SELFIES = 'beforeCreation_selectedSelfies';
// 自定义提示词存储 key 前缀
const STORAGE_KEY_CUSTOM_PROMPT_PREFIX = 'custom_prompt_';

type BeforeCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BeforeCreationScreenRouteProp = RouteProp<RootStackParamList, 'BeforeCreation'>;

// 单个模版页面组件
const TemplateSlide = React.memo(({ 
  template, 
  album, 
  selectedSelfies, 
  isFusionProcessing, 
  onUseStyle, 
  onSelfieSelect,
  customPrompt,
  onCustomPromptChange,
  isVisible,
}: { 
  template: Template, 
  album: Album, 
  selectedSelfies: string[], 
  isFusionProcessing: boolean, 
  onUseStyle: (template: Template) => void, 
  onSelfieSelect: (index: number, url: string) => void,
  customPrompt: string,
  onCustomPromptChange: (text: string) => void,
  isVisible: boolean,
}) => {
  // 使用 AlbumRecord 结构中的 src_image 字段
  const albumRecord = album as unknown as AlbumRecord;
  const srcImage = albumRecord.src_image;
  
  // 判断是否为多人合拍模式
  const isMultiPerson = albumRecord.is_multi_person === true;

  // 统一入口：视频相册判断 + 封面/预览字段选择
  const { isVideoAlbum, coverImageUrl, previewVideoUrl } = getAlbumMediaInfo(albumRecord);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  // 监听键盘显示/隐藏
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.pageContainer}>
      {/* 视频相册：优先展示预览视频 */}
      {isVideoAlbum && previewVideoUrl && !videoFailed ? (
        <View style={styles.mainImageContainer}>
          <Video
            source={{ uri: previewVideoUrl }}
            style={[styles.mainImage, styles.videoLayer]}
            resizeMode="cover"
            paused={!isVisible}
            muted={false}
            repeat={true}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            poster={coverImageUrl}
            posterResizeMode="cover"
            onError={(error) => {
              console.warn('[BeforeCreation] 预览视频播放失败，回退图片:', error);
              setVideoFailed(true);
            }}
          />
        </View>
      ) : isMultiPerson && albumRecord.result_image ? (
        // 多人合拍模式：直接显示 result_image，不显示绿色条效果
        <View style={styles.mainImageContainer}>
          <LoadingImage
            source={{ uri: albumRecord.result_image }}
            style={styles.mainImage}
            resizeMode={FastImage.resizeMode.cover}
            placeholderColor="#1A1A1A"
            fadeDuration={500}
          />
        </View>
      ) : srcImage ? (
        <CrossFadeImage
          image1={srcImage}
          image2={template.template_url}
          duration={1500}
          interval={2000}
          imageStyle={styles.mainImage}
          containerStyle={styles.mainImageContainer}
        />
      ) : (
        <LoadingImage
          source={{ uri: template.template_url }}
          style={styles.mainImage}
          resizeMode={FastImage.resizeMode.cover}
          placeholderColor="#1A1A1A"
          fadeDuration={500}
        />
      )}
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* 多人合拍模式：自拍选择器显示在中间偏下 */}
      {isMultiPerson && (
        <View style={styles.multiSelfieContainer}>
          <View style={styles.multiSelfieColumn}>
            <View style={styles.personLabelContainer}>
              <Text style={styles.personLabel}>人物1</Text>
            </View>
            <View style={styles.multiSelfieItem}>
              <SelfieSelector
                onSelfieSelect={(url: string) => onSelfieSelect(0, url)}
                selectedSelfieUrl={selectedSelfies[0] ?? undefined}
                size={72}
              />
            </View>
          </View>
          <View style={styles.plusContainer}>
            <Text style={styles.plusText}>+</Text>
          </View>
          <View style={styles.multiSelfieColumn}>
            <View style={styles.personLabelContainer}>
              <Text style={styles.personLabel}>人物2</Text>
            </View>
            <View style={styles.multiSelfieItem}>
              <SelfieSelector
                onSelfieSelect={(url: string) => onSelfieSelect(1, url)}
                selectedSelfieUrl={selectedSelfies[1] ?? undefined}
                size={72}
              />
            </View>
          </View>
        </View>
      )}

      <View style={[styles.contentOverlay, keyboardHeight > 0 && { paddingBottom: keyboardHeight + 20 }]}>
        {/* 单人模式：自拍选择器显示在内容区域 */}
        {!isMultiPerson && (
          <View style={styles.avatarContainer}>
            <SelfieSelector
              onSelfieSelect={(url: string) => onSelfieSelect(0, url)}
              selectedSelfieUrl={selectedSelfies[0] ?? undefined}
              size={72}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title}>{album.album_name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {template.template_description || album.album_description}
          </Text>
        </View>

        {/* 自定义提示词输入框（enable_custom_prompt=true 时展示） */}
        {albumRecord.enable_custom_prompt === true ? (
          <View style={styles.promptInputContainer}>
            <TextInput
              style={styles.promptInput}
              placeholder="你可以手动输入你想说的话（可选）"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={customPrompt}
              onChangeText={onCustomPromptChange}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
              editable={!isFusionProcessing}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: albumRecord.custom_prompt_tips ? 6 : 0 }}>
              {albumRecord.custom_prompt_tips ? (
                <Text style={[styles.promptInputHint, { opacity: 0.9 }]}>
                  小贴士：{albumRecord.custom_prompt_tips}
                </Text>
              ) : <View />}
              <Text style={styles.promptInputHint}>
                {customPrompt.length}/200
              </Text>
            </View>
          </View>
        ) : null}

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

        {/* 多人合拍模式：显示小贴士（在按钮下方） */}
        {isMultiPerson && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>💡小贴士: "多人合拍"需要上传至少两张自拍哦</Text>
          </View>
        )}
      </View>
    </View>
  );
});

// 单个相册组件（包含多个模版）
const AlbumSlide = React.memo(({ 
  album, 
  selectedSelfies, 
  isFusionProcessing, 
  onUseStyle, 
  onSelfieSelect,
  customPrompt,
  onCustomPromptChange,
  isAlbumVisible,
}: { 
  album: Album, 
  selectedSelfies: string[], 
  isFusionProcessing: boolean, 
  onUseStyle: (template: Template) => void, 
  onSelfieSelect: (index: number, url: string) => void,
  customPrompt: string,
  onCustomPromptChange: (text: string) => void,
  isAlbumVisible: boolean,
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

  const [visibleTemplateIndex, setVisibleTemplateIndex] = useState<number>(0);

  const onViewableTemplateItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setVisibleTemplateIndex(viewableItems[0].index);
      }
    }
  ).current;

  const templateViewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderTemplateItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    return (
      <TemplateSlide
        template={item}
        album={album}
        selectedSelfies={selectedSelfies}
        isFusionProcessing={isFusionProcessing}
        onUseStyle={onUseStyle}
        onSelfieSelect={onSelfieSelect}
        customPrompt={customPrompt}
        onCustomPromptChange={onCustomPromptChange}
        isVisible={isAlbumVisible && index === visibleTemplateIndex}
      />
    );
  }, [album, selectedSelfies, isFusionProcessing, onUseStyle, onSelfieSelect, customPrompt, onCustomPromptChange, visibleTemplateIndex, isAlbumVisible]);

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
        initialNumToRender={1}
        windowSize={3}
        nestedScrollEnabled={true}
        onViewableItemsChanged={onViewableTemplateItemsChanged}
        viewabilityConfig={templateViewabilityConfig}
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
  
  // 从存储中恢复自拍选择
  const getStoredSelectedSelfies = useCallback((): string[] => {
    try {
      const stored = storage.getString(STORAGE_KEY_SELECTED_SELFIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item: unknown) => typeof item === 'string')) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('读取存储的自拍选择失败:', error);
    }
    return [];
  }, []);

  // 保存自拍选择到存储
  const saveSelectedSelfies = useCallback((selfies: string[]) => {
    try {
      storage.set(STORAGE_KEY_SELECTED_SELFIES, JSON.stringify(selfies));
    } catch (error) {
      console.warn('保存自拍选择失败:', error);
    }
  }, []);

  const [selectedSelfies, setSelectedSelfies] = useState<string[]>(() => {
    // 初始化时从存储中恢复
    return getStoredSelectedSelfies();
  });
  const [activeAlbumIndex, setActiveAlbumIndex] = useState(initialIndex);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 提取自拍URL数组，使用useMemo稳定引用
  const selfieUrls = useMemo(() => {
    return selfies.map(s => s.url);
  }, [selfies.length, selfies[0]?.url, selfies[1]?.url]);

  // 从存储中恢复自定义提示词
  const getStoredCustomPrompt = useCallback((albumId: string): string => {
    try {
      const key = `${STORAGE_KEY_CUSTOM_PROMPT_PREFIX}${albumId}`;
      const stored = storage.getString(key);
      if (stored && typeof stored === 'string') {
        return stored;
      }
    } catch (error) {
      console.warn('读取存储的自定义提示词失败:', error);
    }
    return '';
  }, []);

  // 保存自定义提示词到存储
  const saveCustomPrompt = useCallback((albumId: string, prompt: string) => {
    try {
      const key = `${STORAGE_KEY_CUSTOM_PROMPT_PREFIX}${albumId}`;
      if (prompt && prompt.trim()) {
        storage.set(key, prompt.trim());
      } else {
        // 如果为空，删除存储
        storage.delete(key);
      }
    } catch (error) {
      console.warn('保存自定义提示词失败:', error);
    }
  }, []);

  // 当切换相册时，若启用自定义提示词则优先使用本地存储的值，否则使用 album.custom_prompt
  useEffect(() => {
    const currentAlbum = albumsWithCurrent[activeAlbumIndex];
    if (!currentAlbum) return;
    
    const albumRecord = currentAlbum as unknown as AlbumRecord;
    
    // 更新自定义提示词
    if (albumRecord.enable_custom_prompt === true) {
      // 优先使用本地存储的值
      const storedPrompt = getStoredCustomPrompt(albumRecord.album_id);
      if (storedPrompt) {
        setCustomPrompt(storedPrompt);
      } else {
        // 如果没有本地存储的值，使用相册默认值
        const newPrompt = typeof albumRecord.custom_prompt === 'string' ? albumRecord.custom_prompt : '';
        setCustomPrompt(newPrompt);
      }
    } else {
      setCustomPrompt('');
    }
  }, [activeAlbumIndex, albumsWithCurrent.length, getStoredCustomPrompt]);

  // 监听 selectedSelfies 变化并保存到存储
  useEffect(() => {
    if (selectedSelfies.length > 0) {
      saveSelectedSelfies(selectedSelfies);
    }
  }, [selectedSelfies, saveSelectedSelfies]);

  // 初始化自拍选择：只在首次加载或自拍列表变化时初始化，记住用户的选择
  useEffect(() => {
    if (selfieUrls.length === 0) {
      return;
    }

    // 获取当前相册信息
    const currentAlbum = albumsWithCurrent[activeAlbumIndex];
    if (!currentAlbum) return;
    
    const albumRecord = currentAlbum as unknown as AlbumRecord;
    const isMultiPerson = albumRecord.is_multi_person === true;
    
    // 检查当前选择是否与相册类型匹配
    const needsMultiPerson = isMultiPerson;
    const currentIsMultiPerson = selectedSelfies.length >= 2;
    
    // 如果选择的数量与相册类型匹配，且都有值，就保留选择
    if (needsMultiPerson && currentIsMultiPerson && selectedSelfies[0] && selectedSelfies[1]) {
      return; // 保留用户的选择
    }
    if (!needsMultiPerson && !currentIsMultiPerson && selectedSelfies[0]) {
      return; // 保留用户的选择
    }
    
    // 如果类型不匹配或没有选择，才初始化
    if (isMultiPerson) {
      // 多人合拍模式：填充第一张和第二张自拍
      const newSelfies = [
        selfieUrls[0] || '',
        selfieUrls[1] || ''
      ];
      setSelectedSelfies(prev => {
        // 如果之前是单人模式，需要扩展为多人模式，保留第一张自拍
        if (prev.length === 1 && prev[0]) {
          return [prev[0], newSelfies[1]];
        }
        return newSelfies;
      });
    } else {
      // 单人模式：只填充第一张自拍
      const newSelfies = [selfieUrls[0] || ''];
      setSelectedSelfies(prev => {
        // 如果之前是多人模式，保留第一张自拍
        if (prev.length >= 1 && prev[0]) {
          return [prev[0]];
        }
        return newSelfies;
      });
    }
  }, [selfieUrls, activeAlbumIndex, albumsWithCurrent.length]);

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

      // 将 AlbumWithActivityId 转换为 AlbumRecord 进行类型检查
      const albumRecord = currentAlbum as unknown as AlbumRecord;
      const isMultiPerson = albumRecord.is_multi_person === true;
      
      // 检查是否选择了自拍，如果没有则直接跳转到上传页面
      if (isMultiPerson) {
        // 多人合拍模式：需要2张自拍
        if (selectedSelfies.length < 2 || !selectedSelfies[0] || !selectedSelfies[1]) {
          // 埋点：缺少自拍照，跳转到上传页面
          aegisService.reportUserAction('navigate_to_selfie_upload', {
            album_id: currentAlbum?.album_id || '',
            album_title: currentAlbum?.album_name || '',
            reason: 'no_selfie_selected_multi',
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
      } else {
        // 单人模式：需要1张自拍
        if (!selectedSelfies[0]) {
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
      }

      
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
        } else if (normalizedTaskExecutionType === 'async_doubao_image_to_image') {
          // 豆包图生图是独立的执行类型
          taskType = TaskType.DOUBAO_IMAGE_TO_IMAGE;
        } else {
          // 默认或 async_image_to_image
          taskType = TaskType.IMAGE_TO_IMAGE;
        }

        // 自定义提示词：Seedance 图生视频由云函数拼接 prompt_text + custom_prompt
        const enableCustomPrompt = albumRecord.enable_custom_prompt === true;
        const trimmedCustomPrompt = customPrompt.trim();
        const finalPrompt = promptText;
        
        // 豆包图生图需要 prompt_text、用户自拍图和 result_image
        if (taskType === TaskType.DOUBAO_IMAGE_TO_IMAGE) {
          if (!finalPrompt) {
            Alert.alert('错误', '缺少提示词数据，无法进行豆包图生图创作');
            setIsFusionProcessing(false);
            return;
          }
          // 多人合拍模式：验证2张自拍
          if (isMultiPerson) {
            if (selectedSelfies.length < 2 || !selectedSelfies[0] || !selectedSelfies[1]) {
              Alert.alert('错误', '多人合拍需要选择2张自拍');
              setIsFusionProcessing(false);
              return;
            }
          } else {
            // 单人模式：验证1张自拍
            if (!selectedSelfies[0]) {
              Alert.alert('错误', '请先选择自拍照');
              setIsFusionProcessing(false);
              return;
            }
          }
          // 注意：result_image 不再是必填项，因为 exclude_result_image 可能为 true
        } else if (!finalPrompt && taskType !== TaskType.VIDEO_EFFECT) {
          // 其他任务（除了视频特效）也需要 prompt
          Alert.alert('错误', '缺少提示词数据，无法进行创作');
          setIsFusionProcessing(false);
          return;
        }
        
        // 验证必填参数
        if ((taskType === TaskType.IMAGE_TO_IMAGE || taskType === TaskType.IMAGE_TO_VIDEO) && !selectedSelfies[0]) {
          Alert.alert('错误', '请先选择自拍照');
          setIsFusionProcessing(false);
          return;
        }
        
        // 视频特效使用首帧图片（从selectedSelfies[0]或images获取）
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
        const videoParams: VideoParams = {};
        if (taskType === TaskType.VIDEO_EFFECT) {
          videoParams.resolution = '720P'; // 默认720P
          videoParams.template = albumRecord.video_effect_template || 'flying';
          videoParams.style_type = albumRecord.video_effect_template || 'flying'; // 向后兼容
        } else if (taskType === TaskType.IMAGE_TO_VIDEO) {
          videoParams.resolution = '720P'; // 默认720P
        }

        // 构建人像风格重绘参数
        const styleRedrawParams: StyleRedrawParams = {};
        if (taskType === TaskType.PORTRAIT_STYLE_REDRAW) {
          if (albumRecord.style_index !== undefined) {
            styleRedrawParams.style_index = albumRecord.style_index;
          }
          if (albumRecord.style_ref_url) {
            styleRedrawParams.style_ref_url = albumRecord.style_ref_url;
          }
        }

        // 构建 images 数组
        // 豆包图生图：result_image 默认在第一位（如果存在且未排除），后续为用户自拍
        // 其他任务：使用 selectedSelfies[0]
        let imagesArray: string[] = [];
        // 从相册数据中读取 exclude_result_image 标记位（默认 false，即参考 result_image，保持历史版本兼容）
        const excludeResultImage = albumRecord.exclude_result_image === true;
        
        if (taskType === TaskType.DOUBAO_IMAGE_TO_IMAGE) {
          // 豆包图生图：按照新的顺序构建
          // 1. 如果 exclude_result_image 为 false 且 result_image 存在，放在第一位
          if (albumRecord.result_image && !excludeResultImage) {
            imagesArray.push(albumRecord.result_image);
          }
          
          // 2. 添加用户自拍（单人模式：1张，多人合拍：2张）
          if (isMultiPerson) {
            // 多人合拍：添加2张自拍
            if (selectedSelfies.length >= 2 && selectedSelfies[0] && selectedSelfies[1]) {
              imagesArray.push(selectedSelfies[0], selectedSelfies[1]);
            }
          } else {
            // 单人模式：添加1张自拍
            if (selectedSelfies[0]) {
              imagesArray.push(selectedSelfies[0]);
            }
          }
          
          console.log('[BeforeCreation] 豆包图生图 images 数组:', {
            'isMultiPerson': isMultiPerson,
            'excludeResultImage': excludeResultImage,
            'imagesArray': imagesArray,
            '生成方式': excludeResultImage 
              ? (isMultiPerson ? '仅使用2张用户自拍图 + prompt' : '仅使用用户自拍图 + prompt')
              : (isMultiPerson ? '使用 result_image + 2张用户自拍图 + prompt' : '使用 result_image + 用户自拍图 + prompt')
          });
        } else {
          // 其他异步任务使用自拍图
          if (selectedSelfies[0]) {
            imagesArray = [selectedSelfies[0]];
          }
        }

        const taskParams: StartAsyncTaskPayload = {
             taskType: taskType,
             prompt: finalPrompt || '', // 视频特效和人像风格重绘不需要prompt，但保持向后兼容
             enableCustomPrompt: enableCustomPrompt,
             customPrompt: enableCustomPrompt ? trimmedCustomPrompt : '',
             images: imagesArray, // 根据任务类型构建不同的 images 数组
             excludeResultImage: taskType === TaskType.DOUBAO_IMAGE_TO_IMAGE ? excludeResultImage : undefined, // 仅在豆包图生图时传递
             audioUrl: taskType === TaskType.IMAGE_TO_VIDEO ? albumRecord.audio_url : undefined, // 图生视频音频URL（如果相册数据中有）
             activityId: currentActivityId,
             albumId: albumRecord.album_id,
             activityTitle: albumRecord.album_name,
             activityDescription: albumRecord.album_description,
             // 封面统一只传图片 URL，避免把 preview_video_url 这种视频 URL 当封面导致任务面板黑屏
             activityImage: getAlbumMediaInfo(albumRecord).coverImageUrl,
             templateId: currentTemplate?.template_id || albumRecord.album_id,
             price: totalPrice,
             videoParams: Object.keys(videoParams).length > 0 ? videoParams : undefined,
             styleRedrawParams: Object.keys(styleRedrawParams).length > 0 ? styleRedrawParams : undefined,
             promptData: {
               text: finalPrompt,
               srcImage: selectedSelfies[0] || undefined, // 豆包图生图使用用户选择的自拍图（多人合拍时使用第一张）
               resultImage: albumRecord.result_image, // 场景图（如果存在）
               styleTitle: albumRecord.album_name,
               styleDesc: albumRecord.album_description,
             }
        };
        console.log('[BeforeCreation] Dispatching startAsyncTask:', taskParams);

        try {
        await dispatch(startAsyncTask(taskParams)).unwrap();
        console.log('[BeforeCreation] AsyncTask started successfully');
        
        // 如果用户输入了自定义提示词，保存到本地存储
        if (enableCustomPrompt && trimmedCustomPrompt) {
          saveCustomPrompt(albumRecord.album_id, trimmedCustomPrompt);
        }
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

        // 所有异步任务（包括豆包图生图）统一处理：弹出提示并退出
        // 埋点：异步任务提交成功（使用 fg_action_ 前缀，包含专辑标题）
        aegisService.reportUserAction('async_task_submitted', {
          album_id: currentAlbum?.album_id || '',
          album_title: currentAlbum?.album_name || '',
          template_id: currentTemplate?.template_id || albumRecord.album_id,
          activity_id: currentActivityId,
          task_type: taskType,
          has_custom_prompt: !!(enableCustomPrompt && trimmedCustomPrompt),
        });

        // 豆包图生图虽然调用是同步的，但需要至少5秒，所以也当作异步任务展示
        const alertMessage = taskType === TaskType.DOUBAO_IMAGE_TO_IMAGE
          ? `AI正在努力创作中，预计需要5-10秒。完成后会提醒你，记得去"我的作品"查看哦～`
          : `AI正在努力创作中，预计需要1-3分钟。完成后会提醒你，记得去"我的作品"查看哦～`;

        Alert.alert('创作已开始', alertMessage, [
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
          selfieUrl: selectedSelfies[0] || undefined,
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
  }, [selectedSelfies, customPrompt, navigation, activityId, albumsWithCurrent, activeAlbumIndex, activities, dispatch, user, userInfo, isVip, balance]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelfieSelect = useCallback((index: number, selfieUrl: string) => {
    setSelectedSelfies(prev => {
      const newSelfies = [...prev];
      newSelfies[index] = selfieUrl;
      return newSelfies;
    });
  }, []);

  const handleCustomPromptChange = useCallback((text: string) => {
    setCustomPrompt(text);
  }, []);

  const renderAlbumItem = useCallback(({ item, index }: { item: Album; index: number }) => {
    return (
      <AlbumSlide
        album={item}
        selectedSelfies={selectedSelfies}
        isFusionProcessing={isFusionProcessing}
        onUseStyle={handleUseStylePress}
        onSelfieSelect={handleSelfieSelect}
        customPrompt={customPrompt}
        onCustomPromptChange={handleCustomPromptChange}
        isAlbumVisible={index === activeAlbumIndex}
      />
    );
  }, [selectedSelfies, isFusionProcessing, handleUseStylePress, handleSelfieSelect, customPrompt, handleCustomPromptChange, activeAlbumIndex]);

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
  videoLayer: {
    backgroundColor: 'transparent',
  },
  videoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
  multiAvatarContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  multiSelfieContainer: {
    position: 'absolute',
    bottom: '20%', // 中间偏下位置
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
    marginBottom: 72, // 往上移动一张自拍的高度
  },
  multiSelfieColumn: {
    alignItems: 'center',
  },
  multiSelfieItem: {
    // 自拍选择器容器
  },
  personLabelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  personLabel: {
    color: '#fff',
    fontSize: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  plusContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 20, // 上移，与自拍选择器中心对齐（自拍选择器72px，中心在36px，+号32px，中心在16px，所以需要上移20px）
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  plusText: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  tipContainer: {
    marginTop: 4,
    marginBottom: 0,
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
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
    width: 16,
    height: 16,
    marginRight: 4,
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

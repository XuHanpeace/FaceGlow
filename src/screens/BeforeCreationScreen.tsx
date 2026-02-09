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
  InteractionManager,
  Animated,
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
import { getAlbumMediaInfo } from '../utils/albumUtils';
import { aegisService } from '../services/monitoring/aegisService';
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
  shouldAutoFocusPrompt,
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
  shouldAutoFocusPrompt: boolean,
}) => {
  // 使用 AlbumRecord 结构中的 src_image 字段
  const albumRecord = album as unknown as AlbumRecord;
  const srcImage = albumRecord.src_image;
  
  // 判断是否为多人合拍模式
  const isMultiPerson = albumRecord.is_multi_person === true;

  // 统一入口：视频相册判断 + 封面/预览字段选择
  const { isVideoAlbum, coverImageUrl, previewVideoUrl } = getAlbumMediaInfo(albumRecord);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  
  // 自定义提示词输入框 ref
  const promptInputRef = useRef<TextInput>(null);
  // 记录是否已经自动聚焦过（避免重复聚焦）
  const hasAutoFocused = useRef<boolean>(false);
  
  // 使用 Animated 实现平滑的键盘动画（使用 useNativeDriver: true 提升性能）
  const keyboardTranslateY = useRef(new Animated.Value(0)).current;

  // 监听键盘显示/隐藏，使用原生驱动动画
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardTranslateY, {
          toValue: -e.endCoordinates.height,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(keyboardTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? (e?.duration || 250) : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardTranslateY]);

  // 首次进入页面且有自定义提示词功能时，自动聚焦输入框
  useEffect(() => {
    if (shouldAutoFocusPrompt && albumRecord.enable_custom_prompt === true && !hasAutoFocused.current) {
      // 使用 InteractionManager 确保在导航动画完成后再聚焦
      const interactionPromise = InteractionManager.runAfterInteractions(() => {
        // 延迟足够长的时间，确保页面完全稳定后再聚焦
        setTimeout(() => {
          if (promptInputRef.current && !hasAutoFocused.current) {
            promptInputRef.current.focus();
            hasAutoFocused.current = true;
          }
        }, 600);
      });
      
      return () => interactionPromise.cancel();
    }
  }, [shouldAutoFocusPrompt, albumRecord.enable_custom_prompt]);

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

      <Animated.View style={[
        styles.contentOverlay, 
        { 
          transform: [{ translateY: keyboardTranslateY }]
        }
      ]}>
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
              ref={promptInputRef}
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
      </Animated.View>
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
  shouldAutoFocusPrompt,
}: { 
  album: Album, 
  selectedSelfies: string[], 
  isFusionProcessing: boolean, 
  onUseStyle: (template: Template) => void, 
  onSelfieSelect: (index: number, url: string) => void,
  customPrompt: string,
  onCustomPromptChange: (text: string) => void,
  isAlbumVisible: boolean,
  shouldAutoFocusPrompt: boolean,
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
        shouldAutoFocusPrompt={shouldAutoFocusPrompt && index === visibleTemplateIndex}
      />
    );
  }, [album, selectedSelfies, isFusionProcessing, onUseStyle, onSelfieSelect, customPrompt, onCustomPromptChange, visibleTemplateIndex, isAlbumVisible, shouldAutoFocusPrompt]);

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
  // 标记是否是首次进入页面（用于自动聚焦自定义提示词输入框）
  const [isInitialEntry, setIsInitialEntry] = useState(true);
  
  // 从存储中恢复自拍选择
  const getStoredSelectedSelfies = useCallback((): string[] => {
    try {
      const stored = storage.getString(STORAGE_KEY_SELECTED_SELFIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item: unknown) => typeof item === 'string')) {
          console.log('[BeforeCreation] 从存储读取自拍选择:', parsed);
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
      const value = JSON.stringify(selfies);
      storage.set(STORAGE_KEY_SELECTED_SELFIES, value);
      console.log('[BeforeCreation] 保存自拍选择到存储:', selfies);
    } catch (error) {
      console.warn('保存自拍选择失败:', error);
    }
  }, []);

  const [selectedSelfies, setSelectedSelfies] = useState<string[]>(() => {
    // 初始化时先返回空数组，等待 selfieUrls 加载完成后再从存储恢复
    // 这样可以确保在验证 URL 有效性时，selfieUrls 已经加载完成
    return [];
  });
  const [activeAlbumIndex, setActiveAlbumIndex] = useState(initialIndex);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 提取自拍URL数组，使用useMemo稳定引用
  const selfieUrls = useMemo(() => {
    return selfies.map(s => s.url);
  }, [selfies]);

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
      const targetPrompt = storedPrompt || (typeof albumRecord.custom_prompt === 'string' ? albumRecord.custom_prompt : '');
      
      setCustomPrompt(prev => {
        if (prev === targetPrompt) return prev;
        return targetPrompt;
      });
    } else {
      setCustomPrompt(prev => {
        if (prev === '') return prev;
        return '';
      });
    }
  }, [activeAlbumIndex, albumsWithCurrent, getStoredCustomPrompt]);

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
    
    // 验证存储的自拍URL是否仍然有效（在当前用户的selfieUrls列表中）
    const validateSelfieUrl = (url: string): boolean => {
      return selfieUrls.includes(url);
    };
    
    // 直接从存储读取，而不是依赖 selectedSelfies state（避免循环更新）
    const storedSelfies = getStoredSelectedSelfies();
    
    // 检查存储的选择是否与相册类型匹配，且URL仍然有效
    const needsMultiPerson = isMultiPerson;
    const storedIsMultiPerson = storedSelfies.length >= 2;
    
    let targetSelfies: string[] = [];
    
    // 如果存储的选择数量与相册类型匹配，且都有值，且URL仍然有效，就使用存储的值
    if (needsMultiPerson && storedIsMultiPerson && storedSelfies[0] && storedSelfies[1]) {
      if (validateSelfieUrl(storedSelfies[0]) && validateSelfieUrl(storedSelfies[1])) {
        targetSelfies = storedSelfies;
      }
    } else if (!needsMultiPerson && !storedIsMultiPerson && storedSelfies[0]) {
      if (validateSelfieUrl(storedSelfies[0])) {
        targetSelfies = storedSelfies;
      }
    }
    
    // 如果存储的值无效，则使用默认值
    if (targetSelfies.length === 0) {
      if (isMultiPerson) {
        // 多人合拍模式：优先使用存储的有效自拍，否则使用默认的第一张和第二张
        const firstSelfie = storedSelfies[0] && validateSelfieUrl(storedSelfies[0]) 
          ? storedSelfies[0] 
          : selfieUrls[0] || '';
        const secondSelfie = storedSelfies[1] && validateSelfieUrl(storedSelfies[1])
          ? storedSelfies[1]
          : selfieUrls[1] || '';
        
        targetSelfies = [firstSelfie, secondSelfie];
      } else {
        // 单人模式：优先使用存储的有效自拍，否则使用默认的第一张
        const firstSelfie = storedSelfies[0] && validateSelfieUrl(storedSelfies[0])
          ? storedSelfies[0]
          : selfieUrls[0] || '';
        
        targetSelfies = [firstSelfie];
      }
    }
    
    // 强制更新 selectedSelfies，确保组件正确显示存储的值
    console.log('[BeforeCreation] 初始化自拍选择:', {
      currentSelectedSelfies: selectedSelfies,
      targetSelfies,
      selfieUrlsLength: selfieUrls.length,
      storedSelfies,
      isMultiPerson,
    });
    
    // 直接设置目标值，不进行比较，确保组件能正确更新
    setSelectedSelfies(targetSelfies);
  }, [selfieUrls, activeAlbumIndex, albumsWithCurrent, getStoredSelectedSelfies]);

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
      // 用户滑动切换后，不再是首次进入
      setIsInitialEntry(false);
    }
  }, []);

  /** 按 taskType 分别构建 images / videoParams / styleRedrawParams，再组装为 StartAsyncTaskPayload */
  const buildTaskParams = useCallback((
    taskType: string,
    ctx: {
      albumRecord: AlbumRecord;
      currentTemplate: Template;
      currentActivityId: string;
      selectedSelfies: string[];
      selfieUrls: string[];
      isMultiPerson: boolean;
      finalPrompt: string;
      enableCustomPrompt: boolean;
      trimmedCustomPrompt: string;
      totalPrice: number;
    }
  ): StartAsyncTaskPayload => {
    const {
      albumRecord,
      currentTemplate,
      currentActivityId,
      selectedSelfies,
      selfieUrls,
      isMultiPerson,
      finalPrompt,
      enableCustomPrompt,
      trimmedCustomPrompt,
      totalPrice,
    } = ctx;
    const excludeResultImage = albumRecord.exclude_result_image === true;

    const buildImages = (): string[] => {
      if (taskType === 'doubao_image_to_image') {
        const arr: string[] = [];
        if (albumRecord.result_image && !excludeResultImage) arr.push(albumRecord.result_image);
        if (isMultiPerson && selectedSelfies.length >= 2 && selectedSelfies[0] && selectedSelfies[1]) {
          arr.push(selectedSelfies[0], selectedSelfies[1]);
        } else if (selectedSelfies[0]) arr.push(selectedSelfies[0]);
        return arr;
      }
      // 非豆包（混元等）：isMultiPerson 时与豆包一致，显式取前两张；缺的用 selfieUrls 兜底（避免 state 未刷新或只选了一个槽）
      if (isMultiPerson) {
        const first = (selectedSelfies[0] && String(selectedSelfies[0]).trim()) || selfieUrls[0];
        const second = (selectedSelfies[1] && String(selectedSelfies[1]).trim()) || selfieUrls[1];
        const result = first && second ? [first, second] : first ? [first] : [];
        if (result.length < 2 && (selectedSelfies.length >= 2 || selfieUrls.length >= 2)) {
          console.warn('[BeforeCreation] buildImages(isMultiPerson): 期望2张，实际', result.length, { selectedSelfiesLen: selectedSelfies.length, selfieUrlsLen: selfieUrls.length });
        }
        return result;
      }
      let arr = selectedSelfies.filter((url): url is string => Boolean(url && String(url).trim()));

      return arr;
    };

    const buildVideoParams = (): VideoParams => {
      const v: VideoParams = {};
      if (taskType === 'video_effect') {
        v.resolution = '720P';
        v.template = albumRecord.video_effect_template || 'flying';
        v.style_type = albumRecord.video_effect_template || 'flying';
      } else if (taskType === 'image_to_video') {
        v.resolution = '720P';
      }
      return v;
    };

    const buildStyleRedrawParams = (): StyleRedrawParams => {
      const s: StyleRedrawParams = {};
      if (taskType === 'portrait_style_redraw') {
        if (albumRecord.style_index !== undefined) s.style_index = albumRecord.style_index;
        if (albumRecord.style_ref_url) s.style_ref_url = albumRecord.style_ref_url;
      }
      return s;
    };

    const videoParams = buildVideoParams();
    const styleRedrawParams = buildStyleRedrawParams();
    const imagesArray = buildImages();

    return {
      taskType,
      prompt: finalPrompt || '',
      enableCustomPrompt,
      customPrompt: enableCustomPrompt ? trimmedCustomPrompt : '',
      images: imagesArray,
      excludeResultImage: taskType === 'doubao_image_to_image' ? excludeResultImage : undefined,
      audioUrl: taskType === 'image_to_video' ? albumRecord.audio_url : undefined,
      activityId: currentActivityId,
      albumId: albumRecord.album_id,
      activityTitle: albumRecord.album_name,
      activityDescription: albumRecord.album_description,
      activityImage: getAlbumMediaInfo(albumRecord).coverImageUrl,
      templateId: currentTemplate?.template_id || albumRecord.album_id,
      price: totalPrice,
      videoParams: Object.keys(videoParams).length > 0 ? videoParams : undefined,
      styleRedrawParams: Object.keys(styleRedrawParams).length > 0 ? styleRedrawParams : undefined,
      taskParams: albumRecord.task_params,
      promptData: {
        text: finalPrompt,
        srcImage: selectedSelfies[0] || undefined,
        resultImage: albumRecord.result_image,
        styleTitle: albumRecord.album_name,
        styleDesc: albumRecord.album_description,
      },
    };
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
      // 检查登录态，"一键创作"需要登录
      const authResult = await authService.requireRealUser();
      
      if (!authResult.success) {
        // 未登录时直接跳转到登录页
        navigation.navigate('NewAuth');
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
          
          // 允许匿名用户选择照片，不需要登录
          const isNewUser = !hasSelfies || selfies.length === 0;
          navigation.navigate('SelfieGuide', { isNewUser });
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
          
          // 允许匿名用户选择照片，不需要登录
          const isNewUser = !hasSelfies || selfies.length === 0;
          navigation.navigate('SelfieGuide', { isNewUser });
          return;
        }
      }

      // 在点击创作时，显式保存当前的自拍选择到存储
      saveSelectedSelfies(selectedSelfies);
      
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

      // 任务类型：相册 task_execution_type 去掉 async_ 前缀（如 async_hunyuan_image -> hunyuan_image），缺省为 image_to_image
      const taskType: string = (albumRecord.task_execution_type || '').replace(/^async_/, '') || 'image_to_image';
      const promptText = albumRecord.prompt_text || '';
      const enableCustomPrompt = albumRecord.enable_custom_prompt === true;
      const trimmedCustomPrompt = customPrompt.trim();
      const finalPrompt = promptText;

      // 只要 isMultiPerson=true，就必须校验已选 2 张自拍且均有效
      if (isMultiPerson) {
        if (selectedSelfies.length < 2 || !selectedSelfies[0] || !selectedSelfies[1]) {
          Alert.alert('错误', '多人合拍需要选择2张自拍');
          setIsFusionProcessing(false);
          return;
        }
      }

      // 豆包图生图需要 prompt_text、用户自拍图和 result_image
      if (taskType === 'doubao_image_to_image') {
        if (!finalPrompt) {
          Alert.alert('错误', '缺少提示词数据，无法进行豆包图生图创作');
          setIsFusionProcessing(false);
          return;
        }
        if (!isMultiPerson && !selectedSelfies[0]) {
          Alert.alert('错误', '请先选择自拍照');
          setIsFusionProcessing(false);
          return;
        }
      } else if (!finalPrompt && taskType !== 'video_effect') {
          // 其他任务（除了视频特效）也需要 prompt
          Alert.alert('错误', '缺少提示词数据，无法进行创作');
          setIsFusionProcessing(false);
          return;
        }
        
        // 除视频特效外，其余异步任务均需要至少一张自拍（prompt+image 固化传参，新增模型无需改此处）
        if (taskType !== 'video_effect' && !selectedSelfies[0]) {
          Alert.alert('错误', '请先选择自拍照');
          setIsFusionProcessing(false);
          return;
        }
        
        // 视频特效使用首帧图片（从 selectedSelfies[0] 或 images 获取），不需要额外验证
      console.log('[BeforeCreation] Starting AsyncTask:', { taskType, prompt: finalPrompt });
        
        // 确保有认证态（包括匿名用户），获取 UID
        const authData = await authService.ensureAuthenticated();
        if (!authData.success || !authData.data?.uid) {
          console.error('[BeforeCreation] Failed to get user UID');
          throw new Error('无法获取用户信息');
        }

        const taskParams = buildTaskParams(taskType, {
          albumRecord,
          currentTemplate,
          currentActivityId,
          selectedSelfies,
          selfieUrls,
          isMultiPerson,
          finalPrompt,
          enableCustomPrompt,
          trimmedCustomPrompt,
          totalPrice,
        });
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
          let errorMessage = '处理失败，请重试';
          if (error && typeof error === 'object') {
            if ('message' in error) {
              errorMessage = (error as AsyncTaskError).message;
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
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
        const alertMessage = taskType === 'doubao_image_to_image'
          ? `AI正在努力创作中，预计需要5-10秒。完成后会提醒你，记得去"我的作品"查看哦～`
          : `AI正在努力创作中，预计需要1-3分钟。完成后会提醒你，记得去"我的作品"查看哦～`;

        Alert.alert('创作已开始', alertMessage, [
          { text: '好的', onPress: () => navigation.goBack() }
        ]);

    } catch (error) {
      console.error('处理失败:', error);
      let errorMessage = '处理失败，请重试';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      Alert.alert('错误', errorMessage);
    } finally {
      setIsFusionProcessing(false);
    }
  }, [selectedSelfies, customPrompt, navigation, activityId, albumsWithCurrent, activeAlbumIndex, activities, dispatch, user, userInfo, isVip, balance, buildTaskParams, selfieUrls, saveSelectedSelfies]);

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
        shouldAutoFocusPrompt={false}
      />
    );
  }, [selectedSelfies, isFusionProcessing, handleUseStylePress, handleSelfieSelect, customPrompt, handleCustomPromptChange, activeAlbumIndex, isInitialEntry]);

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

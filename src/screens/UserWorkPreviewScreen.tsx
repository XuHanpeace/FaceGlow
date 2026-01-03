import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  FlatList,
  ViewToken,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ImageComparison } from '../components/ImageComparison';
import { shareService } from '../services/shareService';
import { ShareModal } from '../components/ShareModal';
import { Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';
import { showSuccessToast } from '../utils/toast';
import BackButton from '../components/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import { UserWorkModel, TaskStatus } from '../types/model/user_works';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { pollAsyncTask, AsyncTask, startAsyncTask, StartAsyncTaskPayload, AsyncTaskError } from '../store/slices/asyncTaskSlice';
import { userWorkService } from '../services/database/userWorkService';
import { fetchUserWorks } from '../store/slices/userWorksSlice';
import { OneTimeReveal } from '../components/OneTimeReveal';
import FastImage from 'react-native-fast-image';
import Video, { type VideoRef } from 'react-native-video';
import { TaskType } from '../services/cloud/asyncTaskService';
import { authService } from '../services/auth/authService';
import { selectAllAlbums } from '../store/slices/activitySlice';
import { AlbumLevel, Album } from '../types/model/activity';
import { albumService } from '../services/database/albumService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type UserWorkPreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserWorkPreviewScreenRouteProp = RouteProp<RootStackParamList, 'UserWorkPreview'>;

// 单个结果页（UserWork下的某个result）
const ResultItem = React.memo(({ 
  item, 
  showComparison, 
  selfieUrl,
  onInteractionStart,
  onInteractionEnd,
  isAsyncTask,
  taskStatus,
  onRefresh,
  coverImage,
  extData,
  isVisible = true,
  onRegenerate,
  onVideoExpiredChange
}: { 
  item: any, 
  showComparison: boolean, 
  selfieUrl: string | null,
  onInteractionStart?: () => void,
  onInteractionEnd?: () => void,
  isAsyncTask?: boolean,
  taskStatus?: TaskStatus,
  onRefresh?: () => void,
  coverImage?: string,
  extData?: any,
  isVisible?: boolean,
  onRegenerate?: () => void,
  onVideoExpiredChange?: (expired: boolean) => void
}) => {
  // 判断 result_image 是否是视频文件
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.endsWith('.mp4') || urlLower.includes('.mp4?') || 
           extData?.task_type === 'image_to_video' || 
           extData?.task_type === 'video_effect';
  };

  const resultImageUrl = item.result_image;
  const isVideoResult = isVideoUrl(resultImageUrl);
  
  // 视频播放状态管理
  const [isVideoPaused, setIsVideoPaused] = useState(!isVisible); // 默认根据可见性设置
  const videoRef = useRef<VideoRef | null>(null);

  // 视频加载/缓冲状态：用于优化"点进去等待一段时间才播放"的体验
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoExpired, setIsVideoExpired] = useState<boolean>(false); // 视频是否过期
  const [videoFailed, setVideoFailed] = useState<boolean>(false); // 视频是否加载失败（非过期错误）
  const [videoReloadKey, setVideoReloadKey] = useState<number>(0);
  
  // 当可见性改变时，更新播放状态
  useEffect(() => {
    if (isVideoResult) {
      setIsVideoPaused(!isVisible);
    }
  }, [isVisible, isVideoResult]);

  useEffect(() => {
    if (!isVideoResult) return;
    // 进入视频页时默认显示加载态，直到 onReadyForDisplay/onLoad 回调
    setIsVideoLoading(true);
    setIsVideoBuffering(false);
    setVideoError(null);
    setIsVideoExpired(false);
    onVideoExpiredChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoResult, resultImageUrl, videoReloadKey]);
  
  // 处理视频点击暂停/播放
  const handleVideoPress = () => {
    if (isVideoResult) {
      // 如果在加载或缓冲中，点击给用户明确反馈：保持暂停/播放切换仍可用
      setIsVideoPaused(prev => !prev);
    }
  };

  const handleRetryVideo = () => {
    if (!isVideoResult) return;
    setVideoError(null);
    setIsVideoExpired(false);
    setVideoFailed(false);
    setIsVideoLoading(true);
    setIsVideoBuffering(false);
    // 通过 key 触发 Video 重建，强制重新拉流
    setVideoReloadKey((v) => v + 1);
  };
  
  // 获取视频失败时的兜底图片（从ext_data.prompt_data.srcImage获取）
  const getFallbackImage = () => {
    try {
      if (extData?.prompt_data?.srcImage) {
        return extData.prompt_data.srcImage;
      }
    } catch (e) {
      console.error('获取兜底图片失败:', e);
    }
    return null;
  };
  
  const fallbackImage = getFallbackImage();

  // 处理视频过期：跳转到BeforeCreation页面重新生成
  const handleRegenerateVideo = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };
  // Hourglass Animation
  const spinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isAsyncTask && taskStatus === TaskStatus.PENDING) {
        const spin = Animated.sequence([
            Animated.timing(spinValue, {
                toValue: 1, // 180 deg
                duration: 800,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.ease)
            }),
            Animated.delay(300),
            Animated.timing(spinValue, {
                toValue: 2, // 360 deg
                duration: 800,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.ease)
            }),
            Animated.delay(300),
            Animated.timing(spinValue, {
                toValue: 0, // reset
                duration: 0,
                useNativeDriver: true
            })
        ]);
        Animated.loop(spin).start();
    } else {
        spinValue.setValue(0);
        spinValue.stopAnimation();
    }
  }, [taskStatus, isAsyncTask]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '180deg', '360deg']
  });

  // Reveal Animation Logic
  const [playReveal, setPlayReveal] = useState(false);
  // Track previous status to detect the edge.
  const prevStatusRef = useRef(taskStatus);
  
  // 判断是否是 image_to_image 类型
  const isImageToImage = extData?.task_type === 'image_to_image';
  
  // 针对 image_to_image 类型，获取原始图（优先使用 selfieUrl，否则使用 template_image）
  const originalImageForImageToImage = isImageToImage 
    ? (selfieUrl || item.template_image || coverImage || '')
    : null;

  useEffect(() => {
      if (!isAsyncTask) return;

      if (taskStatus === TaskStatus.SUCCESS) {
          // Case 1: Transition from !SUCCESS -> SUCCESS
          if (prevStatusRef.current !== TaskStatus.SUCCESS) {
              // 对于 image_to_image 类型，先展示原始图一段时间，再触发动画
              const delay = isImageToImage ? 800 : 500;
              setTimeout(() => {
                  setPlayReveal(true);
              }, delay);
          }
          // Case 2: Already SUCCESS on mount (Entry)
          else if (!playReveal) {
              // 对于 image_to_image 类型，先展示原始图一段时间，再触发动画
              const delay = isImageToImage ? 800 : 0;
              setTimeout(() => {
                  setPlayReveal(true);
              }, delay);
          }
      }
      prevStatusRef.current = taskStatus;
  }, [taskStatus, isAsyncTask, isImageToImage]);

  if (isAsyncTask) {
    if (taskStatus === TaskStatus.FAILED) {
        return (
            <View style={styles.pageContainer}>
                {coverImage && (
                    <FastImage 
                        source={{ uri: coverImage }} 
                        style={[styles.resultImage, { opacity: 0.4 }]} 
                        resizeMode={FastImage.resizeMode.cover} 
                    />
                )}
                <View style={[styles.statusContainer, { position: 'absolute', width: '100%', height: '100%' }]}>
                    <FontAwesome name="exclamation-circle" size={50} color="#FF4D4F" />
                    <Text style={styles.statusTextBig}>作品生成失败</Text>
                    {onRegenerate && (
                      <View style={{ marginTop: 24 }}>
                        <GradientButton
                          title="重新生成"
                          onPress={onRegenerate}
                          variant="primary"
                          size="medium"
                        />
                      </View>
                    )}
                </View>
            </View>
        );
    }
    
    // Unified View for PENDING and SUCCESS (Static & Transition)
    return (
        <TouchableOpacity 
          style={styles.pageContainer} 
          activeOpacity={1}
          onPress={isVideoResult ? handleVideoPress : undefined}
        >
            {/* Main Content: 如果是视频，使用Video组件；否则使用OneTimeReveal */}
            {taskStatus === TaskStatus.SUCCESS && isVideoResult && resultImageUrl ? (
              <>
                {!videoFailed ? (
                  <Video
                    key={`async-video-${videoReloadKey}`}
                    ref={videoRef}
                    source={{ uri: resultImageUrl }}
                    style={styles.resultImage}
                    resizeMode="cover"
                    paused={isVideoPaused}
                    muted={false}
                    repeat={true}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                    poster={coverImage}
                    posterResizeMode="cover"
                    onLoadStart={() => {
                      setIsVideoLoading(true);
                      setIsVideoBuffering(false);
                      setVideoError(null);
                    }}
                    onLoad={() => {
                      setIsVideoLoading(false);
                      setIsVideoBuffering(false);
                    }}
                    onReadyForDisplay={() => {
                      // iOS 上更可靠：首帧可展示
                      setIsVideoLoading(false);
                      setIsVideoBuffering(false);
                    }}
                    onBuffer={(e) => {
                      // e.isBuffering: boolean
                      setIsVideoBuffering(!!e?.isBuffering);
                    }}
                    onError={(error: any) => {
                      console.error('视频播放错误:', error);
                      setIsVideoLoading(false);
                      setIsVideoBuffering(false);
                      setVideoFailed(true);
                      
                      // 检测视频过期错误（火山引擎保护机制）
                      const errorCode = error?.error?.code;
                      const errorDomain = error?.error?.domain;
                      if (errorCode === -1102 && errorDomain === 'NSURLErrorDomain') {
                        // 视频已过期，提示用户重新生成
                        setIsVideoExpired(true);
                        setVideoError('为了保护您的隐私，当前视频已过期（视频有效期为24小时）');
                        onVideoExpiredChange?.(true);
                      } else {
                        setVideoError('视频加载失败，请检查网络后重试');
                        setIsVideoExpired(false);
                        onVideoExpiredChange?.(false);
                      }
                    }}
                  />
                ) : null}
                {/* 视频过期时显示模糊封面 */}
                {isVideoExpired && coverImage ? (
                  <View style={styles.videoExpiredOverlay} pointerEvents="none">
                    <FastImage
                      source={{ uri: coverImage }}
                      style={styles.videoExpiredCover}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                    <View style={styles.videoExpiredBlur} />
                  </View>
                ) : null}
                {/* 视频加载失败时显示兜底图片（非过期错误） */}
                {videoFailed && !isVideoExpired && (fallbackImage || coverImage) ? (
                  <FastImage
                    source={{ uri: fallbackImage || coverImage }}
                    style={styles.resultImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : null}
                {/* 加载/缓冲提示蒙层：让用户知道"正在加载视频"而不是卡住 */}
                {(isVideoLoading || isVideoBuffering || !!videoError) && (
                  <View style={styles.videoLoadingOverlay} pointerEvents="box-none">
                    <View style={styles.videoLoadingCard}>
                      {!!videoError ? (
                        <>
                          <FontAwesome name="exclamation-circle" size={18} color="#FF4D4F" />
                          <Text style={styles.videoLoadingText}>{videoError}</Text>
                          {isVideoExpired ? (
                            <TouchableOpacity onPress={handleRegenerateVideo} style={styles.videoRetryBtn}>
                              <FontAwesome name="refresh" size={14} color="#fff" style={{ marginRight: 6 }} />
                              <Text style={styles.videoRetryText}>重新生成</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity onPress={handleRetryVideo} style={styles.videoRetryBtn}>
                              <FontAwesome name="refresh" size={14} color="#fff" style={{ marginRight: 6 }} />
                              <Text style={styles.videoRetryText}>点击重试</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : (
                        <>
                          <ActivityIndicator color="#fff" />
                          <Text style={styles.videoLoadingText}>
                            {isVideoBuffering ? '网络波动，正在缓冲...' : '正在加载视频...'}
                          </Text>
                          <Text style={styles.videoLoadingSubText}>首次加载可能需要几秒，请稍等</Text>
                        </>
                      )}
                    </View>
                  </View>
                )}
                {/* 播放/暂停按钮覆盖层 */}
                {isVideoPaused ? (
                  <View style={styles.videoPlayButton}>
                    <FontAwesome name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
                  </View>
                ) : null}
              </>
            ) : (
              <OneTimeReveal 
                  image1={
                    // 对于 image_to_image 类型，使用原始图作为背景
                    isImageToImage && originalImageForImageToImage
                      ? originalImageForImageToImage
                      : coverImage ? coverImage : ''
                  }
                  image2={isVideoResult ? undefined : (item.result_image || undefined)}
                  trigger={playReveal}
                  revealed={false} // Always animate reveal on entry
                  duration={1500}
                  containerStyle={{ width: screenWidth, height: screenHeight }}
              />
            )}

            {/* Overlays for PENDING state */}
            {taskStatus === TaskStatus.PENDING && (
                <>
                    <View style={styles.loadingHintContainer}>
                        <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
                            <FontAwesome name="hourglass-half" size={16} color="#fff" />
                        </Animated.View>
                        <Text style={styles.loadingHintText}>美颜换换正在施展魔法，预计1分钟完成...</Text>
                    </View>

                    {/* doubao 任务不支持刷新进度，不显示刷新按钮 */}
                    {extData?.task_type !== 'doubao_image_to_image' && (
                        <TouchableOpacity onPress={onRefresh} style={styles.manualRefreshButton}>
                            <FontAwesome name="refresh" size={14} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
                            <Text style={styles.manualRefreshText}>刷新进度</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Small Original Image (Always show if available) */}
            {selfieUrl && (
                <View style={styles.smallOriginalContainer}>
                    <FastImage 
                      source={{ uri: selfieUrl }} 
                      style={styles.smallOriginalImage} 
                      resizeMode={FastImage.resizeMode.cover}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
  }

  // 非异步任务：判断是否是视频（需要在组件顶层声明函数）
  const isVideoUrlForSync = (url?: string) => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.endsWith('.mp4') || urlLower.includes('.mp4?');
  };
  
  const resultImageSync = item.result_image;
  const isVideoSync = isVideoUrlForSync(resultImageSync);
  
  // 非异步任务的视频播放状态管理
  const [isVideoSyncPaused, setIsVideoSyncPaused] = useState(!isVisible);
  const videoSyncRef = useRef<VideoRef | null>(null);
  const [isVideoSyncExpired, setIsVideoSyncExpired] = useState<boolean>(false);
  
  useEffect(() => {
    if (isVideoSync) {
      setIsVideoSyncPaused(!isVisible);
    }
  }, [isVisible, isVideoSync]);
  
  const handleVideoSyncPress = () => {
    if (isVideoSync) {
      setIsVideoSyncPaused(prev => !prev);
    }
  };
  
  // 非异步任务的 image_to_image 类型动画触发
  const isImageToImageSync = extData?.task_type === 'image_to_image';
  const [playRevealSync, setPlayRevealSync] = useState(false);
  const originalImageForImageToImageSync = isImageToImageSync 
    ? (selfieUrl || item.template_image || coverImage || '')
    : null;
  
  useEffect(() => {
    if (isImageToImageSync && isVisible && !playRevealSync) {
      // 先展示原始图一段时间，再触发动画
      setTimeout(() => {
        setPlayRevealSync(true);
      }, 800);
    }
  }, [isImageToImageSync, isVisible, playRevealSync]);
  
  return (
    <TouchableOpacity 
      style={styles.pageContainer} 
      activeOpacity={1}
      onPress={isVideoSync ? handleVideoSyncPress : undefined}
    >
      {showComparison && selfieUrl && item.template_image ? (
        <ImageComparison
          beforeImage={item.template_image}
          afterImage={isVideoSync ? (coverImage || item.template_image) : item.result_image}
          width={screenWidth}
          height={screenHeight}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
        />
      ) : isVideoSync && resultImageSync ? (
        <>
          <Video
            key={`sync-video-${videoReloadKey}`}
            ref={videoSyncRef}
            source={{ uri: resultImageSync }}
            style={styles.resultImage}
            resizeMode="cover"
            paused={isVideoSyncPaused}
            muted={false}
            repeat={true}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            poster={coverImage || item.template_image}
            posterResizeMode="cover"
            onLoadStart={() => {
              setIsVideoLoading(true);
              setIsVideoBuffering(false);
              setVideoError(null);
              setIsVideoSyncExpired(false);
              onVideoExpiredChange?.(false);
            }}
            onLoad={() => {
              setIsVideoLoading(false);
              setIsVideoBuffering(false);
            }}
            onReadyForDisplay={() => {
              setIsVideoLoading(false);
              setIsVideoBuffering(false);
            }}
            onBuffer={(e) => {
              setIsVideoBuffering(!!e?.isBuffering);
            }}
            onError={(error: any) => {
              console.error('视频播放错误:', error);
              setIsVideoLoading(false);
              setIsVideoBuffering(false);
              
              // 检测视频过期错误（火山引擎保护机制）
              const errorCode = error?.error?.code;
              const errorDomain = error?.error?.domain;
              if (errorCode === -1102 && errorDomain === 'NSURLErrorDomain') {
                // 视频已过期，提示用户重新生成
                setIsVideoSyncExpired(true);
                setVideoError('为了保护您的隐私，当前视频已过期（视频有效期为24小时）');
                onVideoExpiredChange?.(true);
              } else {
                setVideoError('视频加载失败，请检查网络后重试');
                setIsVideoSyncExpired(false);
                onVideoExpiredChange?.(false);
              }
            }}
          />
          {/* 视频过期时显示模糊封面 */}
          {isVideoSyncExpired && (coverImage || item.template_image) ? (
            <View style={styles.videoExpiredOverlay} pointerEvents="none">
              <FastImage
                source={{ uri: coverImage || item.template_image }}
                style={styles.videoExpiredCover}
                resizeMode={FastImage.resizeMode.cover}
              />
              <View style={styles.videoExpiredBlur} />
            </View>
          ) : null}
          {(isVideoLoading || isVideoBuffering || !!videoError) && (
            <View style={styles.videoLoadingOverlay} pointerEvents="box-none">
              <View style={styles.videoLoadingCard}>
                {!!videoError ? (
                  <>
                    <FontAwesome name="exclamation-circle" size={18} color="#FF4D4F" />
                    <Text style={styles.videoLoadingText}>{videoError}</Text>
                    {isVideoSyncExpired ? (
                      <TouchableOpacity onPress={handleRegenerateVideo} style={styles.videoRetryBtn}>
                        <FontAwesome name="refresh" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.videoRetryText}>重新生成</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={handleRetryVideo} style={styles.videoRetryBtn}>
                        <FontAwesome name="refresh" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.videoRetryText}>点击重试</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.videoLoadingText}>
                      {isVideoBuffering ? '网络波动，正在缓冲...' : '正在加载视频...'}
                    </Text>
                    <Text style={styles.videoLoadingSubText}>首次加载可能需要几秒，请稍等</Text>
                  </>
                )}
              </View>
            </View>
          )}
          {/* 播放/暂停按钮覆盖层 */}
          {isVideoSyncPaused ? (
            <View style={styles.videoPlayButton}>
              <FontAwesome name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
            </View>
          ) : null}
        </>
      ) : isImageToImageSync && originalImageForImageToImageSync && item.result_image ? (
        // 对于 image_to_image 类型，使用 OneTimeReveal 展示绿光扫过效果
        <OneTimeReveal 
          image1={originalImageForImageToImageSync}
          image2={item.result_image}
          trigger={playRevealSync}
          revealed={false}
          duration={1500}
          containerStyle={{ width: screenWidth, height: screenHeight }}
        />
      ) : (
        <FastImage
          source={{ uri: item.result_image }}
          style={styles.resultImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
      
      {!showComparison && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      )}
    </TouchableOpacity>
  );
});

// 单个作品组件（包含多个结果）
const WorkSlide = React.memo(({ 
  work, 
  showComparison,
  onInteractionStart,
  onInteractionEnd,
  onRefresh,
  isVisible = true,
  onRegenerate,
  onVideoExpiredChange
}: { 
  work: UserWorkModel,
  showComparison: boolean,
  onInteractionStart: () => void,
  onInteractionEnd: () => void,
  onRefresh: () => void,
  isVisible?: boolean,
  onRegenerate: (albumId: string) => void,
  onVideoExpiredChange?: (expired: boolean) => void
}) => {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const isAsyncTask = work.activity_type === 'asyncTask';
  
  // Debug: 打印作品信息
  useEffect(() => {
    console.log('[WorkSlide] 作品更新:', {
      _id: work._id,
      taskStatus: work.taskStatus,
      result_image: work.result_data?.[0]?.result_image,
      activity_image: work.activity_image,
      template_image: work.result_data?.[0]?.template_image
    });
  }, [work]);
  
  // 仅依赖 work 中的状态 (Single Source of Truth)
  const getTaskStatus = (w: UserWorkModel) => {
    if (w.taskStatus) return w.taskStatus;
    try {
      if (w.ext_data) {
        const ext = JSON.parse(w.ext_data);
        return ext.task_status;
      }
    } catch(e) { return null; }
    return null;
  };
  const taskStatus = getTaskStatus(work);

  // 解析 ext_data
  const extData = useMemo(() => {
    try {
      if (work.ext_data) {
        return JSON.parse(work.ext_data);
      }
    } catch (e) {
      console.error('解析ext_data失败:', e);
    }
    return {};
  }, [work.ext_data]);

  // 获取自拍照URL（从ext_data中解析，兜底 template_image）
  const selfieUrl = useMemo(() => {
    let extSelfie = null;
    try {
      if (work.ext_data) {
        const parsedExtData = JSON.parse(work.ext_data);
        extSelfie = parsedExtData.selfie_url || null;
      }
    } catch (error) {
      console.error('解析ext_data失败:', error);
    }
    return extSelfie || work.result_data?.[0]?.template_image;
  }, [work.ext_data, work.result_data]);

  // 获取封面/底图（如果result_image是视频，使用activity_image作为封面）
  const coverImage = useMemo(() => {
    const resultImage = work.result_data?.[0]?.result_image;
    // 判断是否是视频
    const isVideo = resultImage && (
      resultImage.toLowerCase().endsWith('.mp4') || 
      resultImage.toLowerCase().includes('.mp4?') ||
      extData?.task_type === 'image_to_video' ||
      extData?.task_type === 'video_effect'
    );
    
    // 如果是视频，优先使用ext_data.prompt_data.srcImage作为兜底，否则使用activity_image或template_image作为封面
    if (isVideo) {
      let cover = work.activity_image || work.result_data?.[0]?.template_image || '';
      // 尝试从extData.prompt_data.srcImage获取兜底图片
      try {
        if (extData?.prompt_data?.srcImage) {
          cover = extData.prompt_data.srcImage;
        }
      } catch (e) {
        console.error('获取视频兜底图片失败:', e);
      }
      console.log('[WorkSlide] 视频作品，coverImage:', cover);
      return cover;
    }
    
    // 对于异步任务，优先使用 template_image 作为背景（避免黑屏）
    // 如果任务已完成且有 result_image，则使用 result_image
    if (isAsyncTask && taskStatus === TaskStatus.SUCCESS && resultImage) {
      // 任务已完成，使用 result_image 作为封面
      console.log('[WorkSlide] 异步任务已完成，使用 result_image 作为封面:', resultImage);
      return resultImage;
    }
    
    // 否则优先使用 template_image（避免黑屏），然后才是 activity_image
    const cover = work.result_data?.[0]?.template_image || work.activity_image || resultImage || '';
    console.log('[WorkSlide] coverImage:', cover, 'resultImage:', resultImage, 'taskStatus:', taskStatus);
    return cover;
  }, [work.activity_image, work.result_data, extData, isAsyncTask, taskStatus]);

  const handleInteractionStart = useCallback(() => {
    setScrollEnabled(false); // 禁用自身水平滚动
    onInteractionStart(); // 通知父组件禁用垂直滚动
  }, [onInteractionStart]);

  const handleInteractionEnd = useCallback(() => {
    setScrollEnabled(true); // 启用自身水平滚动
    onInteractionEnd(); // 通知父组件启用垂直滚动
  }, [onInteractionEnd]);

  // 跟踪当前可见的 result item 索引（用于视频播放控制）
  const [visibleResultIndex, setVisibleResultIndex] = useState(0);
  
  const onViewableResultItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setVisibleResultIndex(viewableItems[0].index);
    }
  }).current;

  // 根据工作可见性和 result item 可见性计算最终可见性
  const renderResultItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isResultItemVisible = isVisible && visibleResultIndex === index;
    return (
      <ResultItem
        item={item}
        showComparison={showComparison}
        selfieUrl={selfieUrl}
        onInteractionStart={handleInteractionStart}
        onInteractionEnd={handleInteractionEnd}
        isAsyncTask={isAsyncTask}
        taskStatus={taskStatus}
        onRefresh={onRefresh}
        coverImage={coverImage}
        extData={extData}
        isVisible={isResultItemVisible}
        onRegenerate={() => onRegenerate(work.album_id)}
        onVideoExpiredChange={onVideoExpiredChange}
      />
    );
  }, [showComparison, selfieUrl, handleInteractionStart, handleInteractionEnd, isAsyncTask, taskStatus, onRefresh, coverImage, extData, visibleResultIndex, isVisible, onRegenerate, onVideoExpiredChange, work]);

  return (
    <View style={styles.workContainer}>
      <FlatList
        data={work.result_data || []}
        renderItem={renderResultItem}
        keyExtractor={(_item, index) => `result-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="start"
        scrollEnabled={scrollEnabled}
        onViewableItemsChanged={onViewableResultItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        initialNumToRender={1}
        windowSize={3}
        removeClippedSubviews={true}
      />
    </View>
  );
});

const UserWorkPreviewScreen: React.FC = () => {
  const navigation = useNavigation<UserWorkPreviewScreenNavigationProp>();
  const route = useRoute<UserWorkPreviewScreenRouteProp>();
  const { work: paramWork, initialWorkId, worksList: paramWorksList } = route.params;
  
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { tasks } = useTypedSelector(state => state.asyncTask);
  const { works: globalUserWorks } = useTypedSelector(state => state.userWorks);
  const allAlbums = useTypedSelector(selectAllAlbums);
  
  const [isVerticalScrollEnabled, setIsVerticalScrollEnabled] = useState(true);

  // 1. 初始化作品列表 State
  const [worksList, setWorksList] = useState<UserWorkModel[]>(() => {
    if (paramWorksList && paramWorksList.length > 0) {
      return paramWorksList;
    }
    return paramWork ? [paramWork] : [];
  });

  // 初始索引
  const initialIndex = useMemo(() => {
    const targetId = initialWorkId || paramWork?._id;
    const list = paramWorksList && paramWorksList.length > 0 ? paramWorksList : (paramWork ? [paramWork] : []);
    const index = list.findIndex(w => w._id === targetId);
    return index >= 0 ? index : 0;
  }, [initialWorkId, paramWork, paramWorksList]);

  const [activeWorkIndex, setActiveWorkIndex] = useState(initialIndex);
  const [showComparison, setShowComparison] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState('');
  const [isVideoExpired, setIsVideoExpired] = useState(false); // 当前视频是否过期
  
  // 当前激活的作品
  const activeWork = worksList[activeWorkIndex];

  useEffect(() => {
      console.log('[Preview] 当前激活作品变更:', activeWork?._id, 'TaskId:', activeWork?.taskId, 'Status:', activeWork?.taskStatus, JSON.parse(activeWork?.ext_data || '{}')); // LOG
  }, [activeWork]);

  // 2. 监听 Redux 任务更新 (asyncTask)
  useEffect(() => {
      if (!activeWork?.taskId) return;
      
      const task = tasks.find(t => t.taskId === activeWork.taskId);
      
      // 优先使用 Redux 推送的 updatedWork
      if (task && task.updatedWork) {
          const updated = task.updatedWork;
          // 检查是否需要更新
          if (updated.taskStatus !== activeWork.taskStatus || 
              updated.result_data?.[0]?.result_image !== activeWork.result_data?.[0]?.result_image) {
              
              console.log('[Preview] 接收到 Redux 任务更新数据，更新界面');
              setWorksList(prev => {
                  const newList = [...prev];
                  const idx = newList.findIndex(w => w.taskId === updated.taskId);
                  if (idx !== -1) {
                      newList[idx] = updated;
                  }
                  return newList;
              });
          }
      } 
      // 兜底：如果 Redux 没推 updatedWork 但状态成功了，主动拉取
      else if (task && task.status === TaskStatus.SUCCESS) {
          const isLocalPending = activeWork.taskStatus !== TaskStatus.SUCCESS;
          const isLocalNoImage = !activeWork.result_data?.[0]?.result_image;
          
          if (isLocalPending || isLocalNoImage) {
             console.log('[Preview] Redux任务成功(无推送)，主动请求最新作品数据...');
             refreshWorkData(activeWork.taskId);
          }
      }
  }, [tasks, activeWork]); 

  // 3. 监听全局 userWorks 更新并同步到本地 list
  useEffect(() => {
    if (globalUserWorks.length > 0 && worksList.length > 0) {
        setWorksList(prev => {
            let hasChange = false;
            // 创建新数组以避免直接修改 state
            const newList = [...prev];
            
            // 遍历本地列表，查找全局是否有更新
            for (let i = 0; i < newList.length; i++) {
                const localItem = newList[i];
                const globalItem = globalUserWorks.find(g => g._id === localItem._id);
                
                if (globalItem) {
                    const isStatusChanged = globalItem.taskStatus !== localItem.taskStatus;
                    // 注意：比较可选链可能 undefined
                    const localImg = localItem.result_data?.[0]?.result_image;
                    const globalImg = globalItem.result_data?.[0]?.result_image;
                    const isResultChanged = globalImg !== localImg;
                    
                    if (isStatusChanged || isResultChanged) {
                        console.log('[Preview] 从全局 Store 同步更新作品:', localItem._id, 'Status:', globalItem.taskStatus);
                        newList[i] = globalItem;
                        hasChange = true;
                    }
                }
            }
            return hasChange ? newList : prev;
        });
    }
  }, [globalUserWorks]);

  const refreshWorkData = async (taskId: string) => {
      console.log('[Preview] 正在刷新作品数据 taskId:', taskId); // LOG
      try {
          const result = await userWorkService.getWorkByTaskId(taskId);
          if (result.success && result.data) {
               console.log('[Preview] 刷新成功，更新本地状态'); // LOG
               // 兼容 TCB 返回
               const rawData = result.data as any;
               const newData = rawData.record ? rawData.record : rawData;
               
               setWorksList(prev => {
                  const newList = [...prev];
                  const idx = newList.findIndex(w => w.taskId === taskId);
                  if (idx !== -1) {
                      newList[idx] = newData;
                  }
                  return newList;
               });

               // 同步更新全局 Redux userWorks 数据（uid 在底层自动获取）
               dispatch(fetchUserWorks());
          }
      } catch (e) {
          console.error('[Preview] 刷新失败', e);
      }
  };

  const isAsyncTask = activeWork?.activity_type === 'asyncTask';
  
  // 辅助函数：获取状态
  const getTaskStatus = (work: UserWorkModel) => {
    if (work.taskStatus) return work.taskStatus;
    try {
        if (work.ext_data) {
            const ext = JSON.parse(work.ext_data);
            return ext.task_status;
        }
    } catch(e) {}
    return null;
  };

  // 自动刷新逻辑
  useEffect(() => {
      if (activeWork && activeWork.taskId) {
          const currentStatus = getTaskStatus(activeWork);
          if (currentStatus === TaskStatus.PENDING) {
              const taskInRedux = tasks.find(t => t.taskId === activeWork.taskId);
              if (!taskInRedux || taskInRedux.status === TaskStatus.PENDING) {
                 console.log('[Preview] 自动触发 handleRefreshTask'); // LOG
                 handleRefreshTask();
              }
          }
      }
  }, [activeWork?._id]);
  
  // 当切换作品时，重置视频过期状态
  useEffect(() => {
    setIsVideoExpired(false);
  }, [activeWork?._id]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleDownloadPress = async () => {
    const currentResultImage = activeWork?.result_data?.[0]?.result_image;
    if (currentResultImage) {
      try {
        const extData = (() => {
          try {
            return activeWork?.ext_data ? (JSON.parse(activeWork.ext_data) as Record<string, unknown>) : null;
          } catch {
            return null;
          }
        })();
        const taskType = typeof extData?.task_type === 'string' ? extData.task_type : '';
        const isVideo =
          currentResultImage.toLowerCase().endsWith('.mp4') ||
          currentResultImage.toLowerCase().includes('.mp4?') ||
          taskType === 'image_to_video' ||
          taskType === 'video_effect';

        const result = isVideo
          ? await shareService.saveVideoToAlbum(currentResultImage)
          : await shareService.saveImageToAlbum(currentResultImage);
        if (result.success) {
          showSuccessToast(isVideo ? '视频已保存到相册' : '图片已保存到相册');
        } else {
          Alert.alert('下载失败', result.error || (isVideo ? '保存视频失败' : '保存图片失败'));
        }
      } catch (error) {
        console.error('下载失败:', error);
        Alert.alert('下载失败', '保存到相册时发生错误');
      }
    }
  };

  const handleSharePress = () => {
    const currentResultImage = activeWork?.result_data?.[0]?.result_image;
    if (currentResultImage) {
      setShareImageUrl(currentResultImage);
      setShowShareModal(true);
    }
  };

  const handleRefreshTask = useCallback(() => {
      console.log('[Preview] 主动触发 handleRefreshTask'); // LOG
      try {
          let targetTaskId = activeWork?.taskId;
          if (!targetTaskId && activeWork?.ext_data) {
              try {
                  const ext = JSON.parse(activeWork.ext_data);
                  targetTaskId = ext.task_id;
              } catch(e) {}
          }

          if (activeWork && targetTaskId) {
               const task: AsyncTask = {
                   taskId: targetTaskId,
                   workId: activeWork._id!,
                   status: TaskStatus.PENDING,
                   activityTitle: activeWork.activity_title || 'Task',
                   startTime: Date.now(),
                   coverImage: activeWork.activity_image
               };
               dispatch(pollAsyncTask(task));
          }
      } catch (e) {
          console.error('Failed to parse ext_data for refresh', e);
      }
  }, [activeWork, dispatch]);

  const handleRegenerateActiveWork = useCallback((albumId: string) => {
    if (!albumId) {
      console.error('albumId 为空，无法跳转');
      return;
    }

    // 直接从 redux 中查找对应的 album
    const targetAlbum = allAlbums.find(album => album.album_id === albumId);
    
    if (!targetAlbum) {
      console.error('未找到对应的相册数据，albumId:', albumId);
      Alert.alert('错误', '未找到对应的相册数据，请稍后再试');
      return;
    }

    // 跳转到BeforeCreation页面
    navigation.navigate('BeforeCreation', {
      albumData: targetAlbum,
      activityId: targetAlbum.activityId,
    });
  }, [allAlbums, navigation]);

  const getShareOptions = () => [
    {
      id: 'save',
      icon: '💾',
      iconName: 'download',
      iconColor: '#4CAF50', 
      label: '保存到相册',
      onPress: async () => {
        const lower = shareImageUrl.toLowerCase();
        const isVideo = lower.endsWith('.mp4') || lower.includes('.mp4?');
        const result = isVideo
          ? await shareService.saveVideoToAlbum(shareImageUrl)
          : await shareService.saveImageToAlbum(shareImageUrl);
        if (result.success) {
          showSuccessToast(isVideo ? '视频已保存到相册' : '图片已保存到相册');
        }
      },
    },
  ];

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveWorkIndex(viewableItems[0].index);
    }
  }).current;

  const handleInteractionStart = useCallback(() => {
    setIsVerticalScrollEnabled(false);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setIsVerticalScrollEnabled(true);
  }, []);

  const renderWorkItem = useCallback(({ item, index }: { item: UserWorkModel; index: number }) => {
    const isItemVisible = activeWorkIndex === index;
    return (
      <WorkSlide
        work={item}
        showComparison={showComparison}
        onInteractionStart={handleInteractionStart}
        onInteractionEnd={handleInteractionEnd}
        onRefresh={handleRefreshTask}
        isVisible={isItemVisible}
        onRegenerate={handleRegenerateActiveWork}
        onVideoExpiredChange={setIsVideoExpired}
      />
    );
  }, [showComparison, handleInteractionStart, handleInteractionEnd, handleRefreshTask, activeWorkIndex, handleRegenerateActiveWork]);

  if (!activeWork) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackButton iconType="arrow" onPress={handleBackPress} absolute={false} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeWork.activity_title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={worksList}
        renderItem={renderWorkItem}
        keyExtractor={(item) => item._id || (item.createdAt ? item.createdAt!.toString() : Math.random().toString())}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenHeight}
        snapToAlignment="start"
        scrollEnabled={isVerticalScrollEnabled}
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
      />

      {!isAsyncTask && (
      <View style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.comparisonToggle}>
          <GradientButton
            title="对比模式"
            onPress={() => setShowComparison(true)}
            variant={showComparison ? "primary" : "secondary"}
            size="medium"
            style={styles.toggleButton}
            colors={showComparison ? undefined : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
          />
          <GradientButton
            title="单图模式"
            onPress={() => setShowComparison(false)}
            variant={!showComparison ? "primary" : "secondary"}
            size="medium"
            style={styles.toggleButton}
            colors={!showComparison ? undefined : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
          />
        </View>
      </View>
      )}

      {/* 下载/分享按钮区域（右下角偏上） */}
      {activeWork?.result_data?.[0]?.result_image && !isVideoExpired && (
        <View style={[styles.actionButtonsContainer, { paddingBottom: Math.max(insets.bottom, 20) + 100 }]}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleDownloadPress}
            activeOpacity={0.7}
          >
            <FontAwesome name="download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>下载</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleSharePress}
            activeOpacity={0.7}
          >
            <FontAwesome name="share-square" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>分享</Text>
          </TouchableOpacity>
        </View>
      )}

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        options={getShareOptions()}
        title="分享作品"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  workContainer: {
    width: screenWidth,
    height: screenHeight,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pageContainer: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  comparisonToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextBig: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  smallOriginalContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    width: 120, 
    height: 120, 
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    zIndex: 10,
  },
  smallOriginalImage: {
    width: '100%',
    height: '100%',
  },
  loadingHintContainer: {
    position: 'absolute',
    bottom: 100, // Adjust as needed
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loadingHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  manualRefreshButton: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  manualRefreshText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 10,
  },
  videoLoadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    maxWidth: '82%',
  },
  videoLoadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  videoLoadingSubText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
  },
  videoRetryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  videoExpiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  videoExpiredCover: {
    width: '100%',
    height: '100%',
  },
  videoExpiredBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoRetryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'column',
    zIndex: 10,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default UserWorkPreviewScreen;

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Animated,
  ScrollView,
  Text,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeColors } from '../config/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MasonryList from '@react-native-seoul/masonry-list';
import FastImage from 'react-native-fast-image';

import { RootStackParamList } from '../types/navigation';
import HomeHeader, { HomeHeaderRef } from '../components/HomeHeader';
import SelfieModule from '../components/SelfieModule';
import DefaultSelfieSelector from '../components/DefaultSelfieSelector';
import { useUser, useUserSelfies } from '../hooks/useUser';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { authService } from '../services/auth/authService';
import { albumService } from '../services/database/albumService';
import { userDataService } from '../services/database/userDataService';
import { CoinRewardModal, CoinRewardModalRef } from '../components/CoinRewardModal';
import { AlbumRecord } from '../types/model/album';
import { CategoryConfigRecord, CategoryType } from '../types/model/config';
import { NewAlbumCard } from '../components/NewAlbumCard';
import { FilterSection } from '../components/FilterSection';
import { useAppDispatch } from '../store/hooks';
import { setAllAlbums } from '../store/slices/activitySlice';
import { aegisService } from '../services/monitoring/aegisService';
import { eventService } from '../services/eventService';
import { readHomeAlbumCache, writeHomeAlbumCache } from '../services/storage/homeAlbumCache';
import { readCategoryCache, writeCategoryCache } from '../services/storage/categoryCache';

type NewHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: screenWidth } = Dimensions.get('window');

const NewHomeScreen: React.FC = () => {
  const navigation = useNavigation<NewHomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { userInfo } = useUser();
  const { hasSelfies, selfies } = useUserSelfies();
  const insets = useSafeAreaInsets();
  
  const scrollRef = useRef<ScrollView>(undefined);
  const homeHeaderRef = useRef<HomeHeaderRef>(null);
  const previousBalanceRef = useRef<number>(0);
  const coinRewardModalRef = useRef<CoinRewardModalRef>(null);
  
  // 滚动距离动画值
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // 检测设备类型：通过安全区域top值判断
  // 刘海屏（iPhone X系列）：top值约为44-50
  // 灵动岛（iPhone 14 Pro系列及以上）：top值约为59左右
  const isDynamicIsland = Platform.OS === 'ios' && insets.top >= 54;
  const capsuleTop = isDynamicIsland ? 15 : 5; // 灵动岛设备向下移动更多

  // State
  const [albums, setAlbums] = useState<AlbumRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDefaultSelfieSelector, setShowDefaultSelfieSelector] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // 缓存机制：根据筛选条件缓存数据
  const cacheRef = useRef<Map<string, { albums: AlbumRecord[]; page: number; hasMore: boolean }>>(new Map());

  const [stickyThreshold, setStickyThreshold] = useState(180);

  // Config State
  const [functionTypes, setFunctionTypes] = useState<CategoryConfigRecord[]>([]);
  const [themeStyles, setThemeStyles] = useState<CategoryConfigRecord[]>([]);
  // 活动标签配置（用于徽章渲染）
  const [activityTags, setActivityTags] = useState<CategoryConfigRecord[]>([]);

  // Filter State
  const [selectedFunctionType, setSelectedFunctionType] = useState<string>('all');
  const [selectedThemeStyle, setSelectedThemeStyle] = useState<string>('all');
  
  // Load Config on Mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Preload images from COS
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const imagesToPreload = [
          { uri: 'https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/static/ai-result1.png' },
          { uri: 'https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/static/ai-result2.png' },
          { uri: 'https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/static/temp1.png' },
          { uri: 'https://myhh2-1257391807.cos.ap-nanjing.myqcloud.com/static/temp2.png' },
        ];
        
        await FastImage.preload(imagesToPreload);
        console.log('✅ 图片预加载完成');
      } catch (error) {
        console.warn('图片预加载失败:', error);
      }
    };
    
    preloadImages();
  }, []);

  const loadConfig = async () => {
    try {
      // 先尝试读取缓存
      const cached = await readCategoryCache();
      if (cached && cached.categories.length > 0) {
        console.log('📦 使用分类缓存数据:', cached.categories.length);
        const configs = cached.categories;
        const functionTypesList = configs.filter(c => c.category_type === CategoryType.FUNCTION_TYPE && c.is_active);
        const themeStylesList = configs.filter(c => c.category_type === CategoryType.THEME_STYLE && c.is_active);
        const activityTagsList = configs.filter(c => c.category_type === CategoryType.ACTIVITY_TAG && c.is_active);
        
        setFunctionTypes(functionTypesList);
        setThemeStyles(themeStylesList);
        setActivityTags(activityTagsList);
      }
      
      // 请求最新数据
      const response = await albumService.getCategoryConfig();
      if (response.code === 200) {
        const configs = response.data;
        const functionTypesList = configs.filter(c => c.category_type === CategoryType.FUNCTION_TYPE && c.is_active);
        const themeStylesList = configs.filter(c => c.category_type === CategoryType.THEME_STYLE && c.is_active);
        const activityTagsList = configs.filter(c => c.category_type === CategoryType.ACTIVITY_TAG && c.is_active);
        
        console.log('📋 [NewHomeScreen] Category Configs loaded:', {
          functionTypes: functionTypesList.length,
          themeStyles: themeStylesList.length,
          activityTags: activityTagsList.length,
          activityTags_detail: activityTagsList.map(t => ({ code: t.category_code, label: t.category_label }))
        });
        
        // 更新状态
        setFunctionTypes(functionTypesList);
        setThemeStyles(themeStylesList);
        setActivityTags(activityTagsList);
        
        // 写入缓存
        await writeCategoryCache(configs);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  // Derived: Available Theme Styles based on Selected Function Type
  // 按照 supported_theme_styles 数组的顺序渲染
  const getAvailableThemeStyles = () => {
    if (selectedFunctionType === 'all') {
      // 选择"全部"时，显示所有激活的 theme styles，按照 sort_order 排序
      return [...themeStyles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    const selectedFunc = functionTypes.find(f => f.category_code === selectedFunctionType);
    if (!selectedFunc || !selectedFunc.extra_config?.supported_theme_styles) {
      // 如果没有配置，按照 sort_order 排序（显示所有）
      return [...themeStyles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    const supported = selectedFunc.extra_config.supported_theme_styles;
    // 按照 supported_theme_styles 数组的顺序排序
    const themeMap = new Map(themeStyles.map(t => [t.category_code, t]));
    return supported
      .map(code => themeMap.get(code))
      .filter(Boolean) as CategoryConfigRecord[];
  };

  const availableThemes = getAvailableThemeStyles();

  // 生成缓存 key
  const getCacheKey = (funcType: string, themeStyle: string) => {
    return `${funcType}_${themeStyle}`;
  };

  // Load Albums
  const loadAlbums = async (reset = false) => {
    if (loading && !reset) return;
    
    const currentPage = reset ? 1 : page;
    const cacheKey = getCacheKey(selectedFunctionType, selectedThemeStyle);
    let hadAnyCache = false;

    // 如果是重置且缓存中有数据，先展示缓存数据（但不阻止后续接口请求）
    if (reset) {
      setLoadError(null);
      
      // a) 先读内存缓存
      const cached = cacheRef.current.get(cacheKey);
      if (cached && cached.albums.length > 0) {
        console.log('📦 使用内存缓存数据:', cacheKey, cached.albums.length);
        setAlbums(cached.albums);
        setPage(cached.page);
        setHasMore(cached.hasMore);
        dispatch(setAllAlbums(cached.albums));
        hadAnyCache = true;
        // 不设置 loading，让用户看到缓存数据，但继续请求接口更新
      } else {
        // b) 内存未命中：读持久缓存
        const persistentCache = await readHomeAlbumCache(cacheKey);
        if (persistentCache && persistentCache.albums.length > 0) {
          console.log('📦 使用持久缓存数据:', cacheKey, persistentCache.albums.length);
          setAlbums(persistentCache.albums);
          setPage(persistentCache.page);
          setHasMore(persistentCache.hasMore);
          // 同步写回内存缓存
          cacheRef.current.set(cacheKey, {
            albums: persistentCache.albums,
            page: persistentCache.page,
            hasMore: persistentCache.hasMore
          });
          dispatch(setAllAlbums(persistentCache.albums));
          hadAnyCache = true;
          // 不设置 loading，让用户看到缓存数据，但继续请求接口更新
        } else {
          // c) 两种缓存都没有：显示 loading
          setLoading(true);
        }
      }
    } else {
      // 加载更多时显示 loading
      setLoading(true);
    }

    try {
      const params: any = {
        page: currentPage,
        page_size: 20,
        sort_by: 'default'
      };

      if (selectedFunctionType !== 'all') {
        params.function_types = [selectedFunctionType];
      }
      
      if (selectedThemeStyle !== 'all') {
        params.theme_styles = [selectedThemeStyle];
      }

      const response = await albumService.getAlbumList(params);
      
      if (response.code === 200) {
        const newAlbums = response.data.albums;
        
        // 如果返回空数组且无缓存，显示友好提示
        if (reset && newAlbums.length === 0 && !hadAnyCache) {
          setLoadError('暂无数据');
          setAlbums([]);
          setPage(1);
          setHasMore(false);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        // 如果有缓存但接口返回空，不做任何响应（保持缓存数据）
        if (reset && newAlbums.length === 0 && hadAnyCache) {
          console.log('⚠️ 接口返回空，但已有缓存，保持缓存数据');
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        // 接口请求成功，更新最新数据并缓存
        let updatedAlbums: AlbumRecord[];
        
        if (reset) {
          updatedAlbums = newAlbums;
          setAlbums(updatedAlbums);
          setLoadError(null); // 清除错误状态
          const newPage = 2;
          setPage(newPage);
          setHasMore(response.data.has_more);
          
          // 更新内存缓存（使用最新数据）
          cacheRef.current.set(cacheKey, {
            albums: updatedAlbums,
            page: newPage,
            hasMore: response.data.has_more
          });
          
          // 写持久缓存（使用最新数据）
          await writeHomeAlbumCache(cacheKey, {
            albums: updatedAlbums,
            page: newPage,
            hasMore: response.data.has_more
          });
          
          dispatch(setAllAlbums(updatedAlbums));
        } else {
          setAlbums(prev => {
            updatedAlbums = [...prev, ...newAlbums];
            const newPage = prev.length > 0 ? Math.floor(prev.length / 20) + 2 : 2;
            setPage(newPage);
            setHasMore(response.data.has_more);
            
            // 更新内存缓存
            const cached = cacheRef.current.get(cacheKey);
            if (cached) {
              const updatedCache = {
                albums: updatedAlbums,
                page: newPage,
                hasMore: response.data.has_more
              };
              cacheRef.current.set(cacheKey, updatedCache);
              // 写持久缓存
              writeHomeAlbumCache(cacheKey, updatedCache);
            }
            
            dispatch(setAllAlbums(updatedAlbums));
            return updatedAlbums;
          });
        }
      }
    } catch (error) {
      console.error('Failed to load albums:', error);
      
      // 有缓存的情况下，接口失败不做任何响应（保持缓存数据）
      if (hadAnyCache) {
        console.log('⚠️ 接口请求失败，但已有缓存，保持缓存数据');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // 无缓存失败空白页逻辑
      if (reset && !hadAnyCache) {
        setLoadError(error instanceof Error ? error.message : '加载失败，请检查网络连接');
        setAlbums([]);
        setPage(1);
        setHasMore(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload when filters change
  useEffect(() => {
    // Fix layout jump: Scroll to top when filter changes to reset view
    // This prevents the "empty space" issue when switching from a long list to a short list
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: false });
    }
    loadAlbums(true);
  }, [selectedFunctionType, selectedThemeStyle]);

  // 初始化时记录余额
  useEffect(() => {
    if (userInfo.balance !== undefined) {
      previousBalanceRef.current = userInfo.balance;
    }
  }, []);

  // 监听奖励弹窗事件
  useEffect(() => {
    const handleShowRewardModal = async (data: { rewardAmount: number }) => {
      const rewardAmount = data.rewardAmount;
      console.log('🎁 [NewHome] 收到显示奖励弹窗事件', { rewardAmount });
          
      // 刷新用户数据（uid 在底层自动获取）
      await dispatch(fetchUserProfile());
          
          // 等待页面渲染完成，然后串行执行：展示弹窗 -> 播放coins动画
          setTimeout(() => {
            // 1. 展示弹窗
            coinRewardModalRef.current?.show(rewardAmount);
        console.log('✅ [NewHome] 展示奖励弹窗');
            
            // 2. 等待弹窗显示动画完成（约300ms），然后播放coins动画
            setTimeout(() => {
              homeHeaderRef.current?.playCoinIconAnimation();
          console.log('✅ [NewHome] 播放coins动画');
            }, 400);
          }, 100);
    };

    // 订阅事件
    const unsubscribe = eventService.onShowRewardModal(handleShowRewardModal);
    
    // 清理函数
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  // Focus Effect - 页面获得焦点时刷新数据并检查余额变化
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        // 保存当前余额
        const oldBalance = previousBalanceRef.current || 0;
        
        // 刷新用户数据（uid 在底层自动获取）
        await dispatch(fetchUserProfile());
        
        // 等待数据更新后检查余额变化
        setTimeout(() => {
          // 从最新的 userInfo 中获取余额（需要重新获取，因为 refreshUserData 是异步的）
          // 这里我们需要重新获取一次用户数据来确保拿到最新值
          const checkBalanceChange = async () => {
            const currentUserId = authService.getCurrentUserId();
            if (currentUserId) {
              try {
                const userResult = await userDataService.getUserByUid();
                const newBalance = userResult.data?.record?.balance || 0;
                
                if (newBalance > oldBalance && oldBalance >= 0) {
                  // 余额增加了，播放手指动画
                  console.log('💰 余额增加，播放手指动画', { oldBalance, newBalance });
                  homeHeaderRef.current?.playCoinIconAnimation();
                }
                previousBalanceRef.current = newBalance;
              } catch (error) {
                console.error('检查余额变化失败:', error);
              }
            }
          };
          checkBalanceChange();
        }, 800);
      };
      loadData();
    }, [dispatch])
  );

  // Handlers
  const handleAlbumPress = (album: AlbumRecord) => {
    // 埋点：用户点击相册（使用 fg_click_ 前缀，包含专辑标题）
    aegisService.reportClick('album', {
      album_id: album.album_id,
      album_title: album.album_name || '', // 专辑标题，方便数据查看
      album_name: album.album_name || '',
      album_price: album.price || 0,
      activity_tag_type: album.activity_tag_type || '',
      function_type: album.function_type || '',
    });
    
    // Adapter for BeforeCreationScreen
    const legacyAlbumData: any = {
        album_id: album.album_id,
        album_name: album.album_name,
        album_description: album.album_description,
        album_image: album.album_image,
        level: album.level,
        price: album.price,
        template_list: album.template_list || [],
        srcImage: album.src_image,
        // Pass activity_tag info if needed
        activity_tag_text: album.activity_tag_text,
        activity_tag_type: album.activity_tag_type
    };
    
    navigation.navigate('BeforeCreation', {
      albumData: legacyAlbumData,
      activityId: album.function_type // Using function_type as activityId for now based on current mock
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlbums(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadAlbums(false);
    }
  };

  const handleAddSelfiePress = async () => {
    const authResult = await authService.requireRealUser();
    if (!authResult.success) {
      if (authResult.error?.code === 'ANONYMOUS_USER' || authResult.error?.code === 'NOT_LOGGED_IN') {
        navigation.navigate('NewAuth');
      }
      return;
    }
    // 判断是否为新用户（没有自拍）
    const isNewUser = !hasSelfies || selfies.length === 0;
    navigation.navigate('SelfieGuide', { isNewUser });
  };


  const renderStickyHeader = () => (
    <View style={[styles.stickyHeaderContainer, { width: screenWidth }]}>
        <FilterSection 
            functionTypes={functionTypes}
            selectedFunctionType={selectedFunctionType}
            onSelectFunctionType={(code) => {
                setSelectedFunctionType(code);
                setSelectedThemeStyle('all');
            }}
            themeStyles={availableThemes}
            selectedThemeStyle={selectedThemeStyle}
            onSelectThemeStyle={setSelectedThemeStyle}
        />
    </View>
  );

  const renderEmptyState = () => {
    if (!loadError) return null;
    return (
      <View style={styles.emptyPage}>
        <Text style={styles.emptyTitle}>加载失败</Text>
        <Text style={styles.emptyDesc}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => {
          setLoadError(null);
          loadAlbums(true);
        }}>
          <Text style={styles.retryBtnText}>点击重试</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.safeAreaTop} />
      
      {/* iPhone 刘海处的渐变胶囊 */}
      {Platform.OS === 'ios' && (
        <View style={[styles.notchCapsule, { top: capsuleTop }]}>
          <LinearGradient
            colors={themeColors.appIcon.gradient} // 使用 App 图标渐变配置
            start={themeColors.appIcon.start}
            end={themeColors.appIcon.end}
            style={styles.capsuleGradient}
          >
            <Text style={styles.capsuleText}>FaceGlow</Text>
          </LinearGradient>
        </View>
      )}
      
      <View style={styles.fixedHeader}>
        <HomeHeader
          ref={homeHeaderRef}
          onProfilePress={() => navigation.navigate('NewProfile')}
        />
      </View>
      
      {/* Use a container with relative positioning for list + sticky header */}
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Sticky Header Wrapper (Absolute Positioned relative to this container) */}
        <Animated.View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 5, 
            backgroundColor: '#131313',
            opacity: scrollY.interpolate({
              inputRange: [stickyThreshold - 1, stickyThreshold],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
            pointerEvents: 'box-none', 
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [stickyThreshold - 1, stickyThreshold],
                outputRange: [-100, 0], // 未吸顶时移出屏幕
                extrapolate: 'clamp',
              })
            }]
          }}
        >
           {renderStickyHeader()}
        </Animated.View>
        
        <MasonryList
            innerRef={scrollRef}
            data={albums}
            keyExtractor={(item: any): string => item.album_id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, i }: { item: any; i: number }) => (
                <View style={{ paddingLeft: i % 2 === 0 ? 8 : 4, paddingRight: i % 2 === 0 ? 4 : 8, marginBottom: 4 }}>
                    <NewAlbumCard 
                      album={item as AlbumRecord} 
                      onPress={handleAlbumPress}
                      activityTagConfigs={activityTags}
                    />
                </View>
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            ListHeaderComponent={
                <View style={styles.headerContent}>
                <View onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setStickyThreshold(height);
                }}>
                    <SelfieModule 
                    onAddSelfiePress={handleAddSelfiePress} 
                    onSelfieSelect={() => setShowDefaultSelfieSelector(true)}
                    />
                </View>
                {renderStickyHeader()}
                </View>
            }
            ListFooterComponent={
               (loading && !refreshing && page > 1) ? <ActivityIndicator color="#fff" style={{padding: 20}} /> : <View style={{ height: 40 }} />
            }
            ListEmptyComponent={!loading && !refreshing ? renderEmptyState() : null}
        />

        {/* Mask for Card Area when filtering (not initial load or refresh which usually show spinner/skeleton) */}
        {/* If loading is true, and not refreshing, and it's a reset (page 1 loading) */}
        {/* Actually, in loadAlbums(true), reset is true. */}
        {/* If reset is true, we want to mask the OLD content until new content arrives. */}
        {/* But in the code I updated, I setAlbums to new ones only AFTER response. */}
        {/* So during fetch, old albums are still there. */}
        {loading && !refreshing && page === 1 && (
             <View style={styles.loadingMask}>
                 <ActivityIndicator size="large" color="#FF6B9D" />
             </View>
        )}
      </View>

      <DefaultSelfieSelector
        visible={showDefaultSelfieSelector}
        onClose={() => setShowDefaultSelfieSelector(false)}
        onSelect={(url) => {
            console.log('Selected selfie:', url);
            setShowDefaultSelfieSelector(false);
        }}
      />

      {/* 美美币奖励弹窗 */}
      <CoinRewardModal
        ref={coinRewardModalRef}
        onClose={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  safeAreaTop: {
    backgroundColor: '#131313'
  },
  fixedHeader: {
    backgroundColor: '#131313',
    zIndex: 10,
  },
  headerContent: {
    marginBottom: 8,
  },
  stickyHeaderContainer: {
    backgroundColor: '#131313',
    paddingTop: 8,
  },
  filterContainer: {
    marginBottom: 12,
    width: '100%',
  },
  subFilterContainer: {
    marginBottom: 12,
    width: '100%',
  },
  filterList: {
    paddingHorizontal: 16,
  },
  loadingMask: {
      position: 'absolute',
      top: 0, // This covers list from top (including static filters)
      // We want to cover only the content area, but since static filters are inside list, they get covered.
      // To avoid covering static filters, we need to know their height or position.
      // But user said "switching capsules, add mask to card or card area".
      // Since we are switching capsules (filters), the filters themselves are clicked.
      // If we mask them, it might look like they are disabled, which is fine.
      // Actually, sticky header is absolute and zIndex 5. Mask should be below it?
      // Sticky header is only visible when scrolled up.
      // When at top, static header is visible.
      // Let's make mask zIndex 2.
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2, 
      justifyContent: 'center',
      alignItems: 'center',
  },
  notchCapsule: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000, // 确保在最上层
    pointerEvents: 'box-none', // 允许点击穿透
  },
  capsuleGradient: {
    borderRadius: 40, // 胶囊形状
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    // fontFamily: 'Helvetica Neue-Bold',
    letterSpacing: -0.5,
    marginHorizontal: 10,
    marginVertical: 4,
  },
  emptyPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NewHomeScreen;

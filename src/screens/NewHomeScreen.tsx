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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MasonryList from '@react-native-seoul/masonry-list';

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

type NewHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: screenWidth } = Dimensions.get('window');

const NewHomeScreen: React.FC = () => {
  const navigation = useNavigation<NewHomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { userInfo } = useUser();
  const { hasSelfies, selfies } = useUserSelfies();
  
  const scrollRef = useRef<ScrollView>(undefined);
  const homeHeaderRef = useRef<HomeHeaderRef>(null);
  const previousBalanceRef = useRef<number>(0);
  const coinRewardModalRef = useRef<CoinRewardModalRef>(null);
  
  // 滚动距离动画值
  const scrollY = useRef(new Animated.Value(0)).current;

  // State
  const [albums, setAlbums] = useState<AlbumRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDefaultSelfieSelector, setShowDefaultSelfieSelector] = useState(false);
  
  // 缓存机制：根据筛选条件缓存数据
  const cacheRef = useRef<Map<string, { albums: AlbumRecord[]; page: number; hasMore: boolean }>>(new Map());

  const [stickyThreshold, setStickyThreshold] = useState(180);

  // Config State
  const [functionTypes, setFunctionTypes] = useState<CategoryConfigRecord[]>([]);
  const [themeStyles, setThemeStyles] = useState<CategoryConfigRecord[]>([]);
  // 预留：活动标签筛选（当前未使用）
  const [_activityTags, setActivityTags] = useState<CategoryConfigRecord[]>([]);

  // Filter State
  const [selectedFunctionType, setSelectedFunctionType] = useState<string>('all');
  const [selectedThemeStyle, setSelectedThemeStyle] = useState<string>('all');
  
  // Load Config on Mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await albumService.getCategoryConfig();
      if (response.code === 200) {
        const configs = response.data;
        setFunctionTypes(configs.filter(c => c.category_type === CategoryType.FUNCTION_TYPE && c.is_active));
        setThemeStyles(configs.filter(c => c.category_type === CategoryType.THEME_STYLE && c.is_active));
        setActivityTags(configs.filter(c => c.category_type === CategoryType.ACTIVITY_TAG && c.is_active));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  // Derived: Available Theme Styles based on Selected Function Type
  const getAvailableThemeStyles = () => {
    if (selectedFunctionType === 'all') {
      return themeStyles;
    }
    const selectedFunc = functionTypes.find(f => f.category_code === selectedFunctionType);
    if (!selectedFunc || !selectedFunc.extra_config?.supported_theme_styles) {
      return themeStyles;
    }
    const supported = selectedFunc.extra_config.supported_theme_styles;
    return themeStyles.filter(t => supported.includes(t.category_code));
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

    // 如果是重置且缓存中有数据，先展示缓存数据
    if (reset) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && cached.albums.length > 0) {
        console.log('📦 使用缓存数据:', cacheKey, cached.albums.length);
        setAlbums(cached.albums);
        setPage(cached.page);
        setHasMore(cached.hasMore);
        dispatch(setAllAlbums(cached.albums));
        // 不设置 loading，让用户看到缓存数据
      } else {
        // 没有缓存，显示 loading
        setLoading(true);
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
        let updatedAlbums: AlbumRecord[];
        
        if (reset) {
          updatedAlbums = newAlbums;
          setAlbums(updatedAlbums);
          setPage(2);
          setHasMore(response.data.has_more);
          
          // 更新缓存
          cacheRef.current.set(cacheKey, {
            albums: updatedAlbums,
            page: 2,
            hasMore: response.data.has_more
          });
          
          dispatch(setAllAlbums(updatedAlbums));
        } else {
          setAlbums(prev => {
            updatedAlbums = [...prev, ...newAlbums];
            setPage(prevPage => prevPage + 1);
            setHasMore(response.data.has_more);
            
            // 更新缓存
            const cached = cacheRef.current.get(cacheKey);
            if (cached) {
              cacheRef.current.set(cacheKey, {
                albums: updatedAlbums,
                page: cached.page + 1,
                hasMore: response.data.has_more
              });
            }
            
            dispatch(setAllAlbums(updatedAlbums));
            return updatedAlbums;
          });
        }
      }
    } catch (error) {
      console.error('Failed to load albums:', error);
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
      
      // 刷新用户数据
      const currentUserId = authService.getCurrentUserId();
      if (currentUserId) {
        await dispatch(fetchUserProfile({ userId: currentUserId }));
      }
      
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
        
        // 刷新用户数据
        const currentUserId = authService.getCurrentUserId();
        if (currentUserId) {
          await dispatch(fetchUserProfile({ userId: currentUserId }));
        }
        
        // 等待数据更新后检查余额变化
        setTimeout(() => {
          // 从最新的 userInfo 中获取余额（需要重新获取，因为 refreshUserData 是异步的）
          // 这里我们需要重新获取一次用户数据来确保拿到最新值
          const checkBalanceChange = async () => {
            const currentUserId = authService.getCurrentUserId();
            if (currentUserId) {
              try {
                const userResult = await userDataService.getUserByUid(currentUserId);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.safeAreaTop} />
      
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
                    <NewAlbumCard album={item as AlbumRecord} onPress={handleAlbumPress} />
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
  }
});

export default NewHomeScreen;

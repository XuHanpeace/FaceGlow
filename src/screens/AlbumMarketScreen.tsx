import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTypedSelector, useAppDispatch } from '../store/hooks';
import { fetchActivities } from '../store/slices/activitySlice';
import { Album } from '../types/model/activity';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (screenWidth - 60) / numColumns;

type AlbumMarketScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AlbumMarketScreenRouteProp = RouteProp<RootStackParamList, 'AlbumMarket'>;

const AlbumMarketScreen: React.FC = () => {
  const navigation = useNavigation<AlbumMarketScreenNavigationProp>();
  const route = useRoute<AlbumMarketScreenRouteProp>();
  const { activityId, activityName } = route.params;
  
  const dispatch = useAppDispatch();
  
  // 从Redux获取活动数据
  const activities = useTypedSelector((state) => state.activity.activities);
  const isLoading = useTypedSelector((state) => state.activity.isLoading);
  const error = useTypedSelector((state) => state.activity.error);

  // 找到对应的Activity并获取其album列表
  const currentActivity = activities.find(activity => activity.activiy_id === activityId);
  const albums: Album[] = currentActivity?.album_id_list || [];

  useEffect(() => {
    // 如果活动数据为空，则发起请求
    if (activities.length === 0) {
      dispatch(fetchActivities({ page_size: 20, page_number: 1 }));
    }
  }, [activities.length, dispatch]);

  const handleAlbumPress = (albumId: string) => {
    // 找到对应的Album数据
    const selectedAlbum = albums.find(album => album.album_id === albumId);
    
    if (selectedAlbum) {
      // 直接传递album数据到BeforeCreation页面
      navigation.navigate('BeforeCreation', {
        albumData: selectedAlbum,
        activityId: activityId,
      });
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderAlbumItem = ({ item }: { item: Album }) => {
    // 取第一个template作为封面
    const coverImage = item.template_list[0]?.template_url || item.album_image;
    
    // 计算总点赞数（所有template的点赞数之和）
    const totalLikes = item.template_list.reduce((sum, template) => {
      return sum + Math.floor(Math.random() * 100);
    }, 0);

    return (
      <TouchableOpacity
        style={styles.albumItem}
        onPress={() => handleAlbumPress(item.album_id)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: coverImage }}
            style={styles.albumImage}
            resizeMode="cover"
          />
          {item.level !== '0' && (
            <View style={styles.premiumBadge}>
              <FontAwesome name="star" size={12} color="#FFD700" />
            </View>
          )}
          {/* 显示相册内模板数量 */}
          <View style={styles.templateCountBadge}>
            <Text style={styles.templateCountText}>
              {item.template_list.length} 模板
            </Text>
          </View>
        </View>
        
        <View style={styles.itemInfo}>
          <View style={styles.textContent}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.album_name}
            </Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.album_description}
            </Text>
          </View>
          <View style={styles.likesContainer}>
            <FontAwesome name="heart" size={14} color="#FF6B9D" style={styles.likesIcon} />
            <Text style={styles.likesText}>
              {totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : totalLikes}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* 头部 */}
        <View style={styles.header}>
          <BackButton iconType="arrow" onPress={handleBackPress} absolute={false} />
          <Text style={styles.headerTitle}>{activityName}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 加载状态 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>加载相册中...</Text>
        </View>
      </View>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* 头部 */}
        <View style={styles.header}>
          <BackButton iconType="arrow" onPress={handleBackPress} absolute={false} />
          <Text style={styles.headerTitle}>{activityName}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 错误状态 */}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>加载失败: {error}</Text>
          <GradientButton
            title="重试"
            onPress={() => dispatch(fetchActivities({ page_size: 20, page_number: 1 }))}
            variant="primary"
            size="medium"
            width={100}
            height={40}
            fontSize={14}
            borderRadius={20}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <BackButton iconType="arrow" onPress={handleBackPress} absolute={false} />
        <Text style={styles.headerTitle}>{activityName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 相册列表 */}
      <FlatList
        data={albums}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.album_id}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  albumItem: {
    width: itemWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: itemWidth * 1.5,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  templateCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  itemInfo: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    flex: 1,
    flexDirection: 'column',
  },
  textContent: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
  },
  likesIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  likesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 8,
  },
});

export default AlbumMarketScreen;

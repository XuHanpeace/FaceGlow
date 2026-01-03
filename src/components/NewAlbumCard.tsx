import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { AlbumRecord } from '../types/model/album';
import { CategoryConfigRecord, CategoryType } from '../types/model/config';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { LoadingImage } from './LoadingImage';
import { getAlbumMediaInfo } from '../utils/albumUtils';

const { width: screenWidth } = Dimensions.get('window');
// 2 column layout: Screen Width / 2 - Padding
// We want flexible width, but we need a base for height calculation.
// MasonryList divides width by 2.
// If we assume container padding is minimal (e.g. 8 total), then column width is ~ (W-8)/2.
// Let's use a slightly larger base width for calculation to ensure it fills.
const COLUMN_WIDTH = (screenWidth - 16) / 2; // Adjusted for smaller margins

interface NewAlbumCardProps {
  album: AlbumRecord;
  onPress: (album: AlbumRecord) => void;
  activityTagConfigs?: CategoryConfigRecord[]; // 活动标签配置，用于动态渲染徽章
}

export const NewAlbumCard: React.FC<NewAlbumCardProps> = ({
  album,
  onPress,
  activityTagConfigs = [],
}) => {
  // 渐隐渐显动画
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  useEffect(() => {
    // 卡片出现时渐显
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // 确保视频自动播放
    setIsVideoPaused(false);
  }, []);

  // 统一入口：视频相册判断 + 封面/预览字段选择
  const { isVideoAlbum, coverImageUrl, previewVideoUrl } = getAlbumMediaInfo(album);
  const hasPreviewVideo = typeof previewVideoUrl === 'string' && previewVideoUrl.length > 0;

  // Generate aspect ratio with jitter based on album type
  const aspectRatio = useMemo(() => {
    const seed = album.album_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitter = (seed % 6) * 0.06;
    
    if (album.src_image) {
      return 1.15 + jitter; // image_to_image 类型，不再是正方形
    }
    
    if (isVideoAlbum || hasPreviewVideo) {
      return 1.35 + jitter; // 视频类型
    }
    
    return 1.10 + jitter; // 其他类型
  }, [album.album_id, album.src_image, isVideoAlbum, hasPreviewVideo]);

  const cardHeight = COLUMN_WIDTH * aspectRatio;

  // Badge Logic with Gradient - 使用 activity_tags 数组的第一项作为最高优先级
  const renderBadge = () => {
    // 获取 activity_tags 的第一项
    const firstTag = album.activity_tags && album.activity_tags.length > 0 
      ? album.activity_tags[0] 
      : null;

    if (!firstTag) {
      return null;
    }

    // 根据 tag 查找对应的配置
    const activityTagConfig = activityTagConfigs.find(
      config => config.category_type === CategoryType.ACTIVITY_TAG && 
      config.category_code === firstTag
    );

    if (activityTagConfig) {
      // 使用配置中的信息
      const text = activityTagConfig.category_label || '';
      const icon = activityTagConfig.icon || 'tag';
      const gradientColors = getGradientColors(firstTag);
      
      return renderBadgeView(gradientColors, icon, text);
    } else {
      // 如果没有找到配置，使用默认值
      const text = firstTag;
      const icon = 'tag';
      const gradientColors = getGradientColors(firstTag);
      
      return renderBadgeView(gradientColors, icon, text);
    }
  };

  // 获取渐变颜色
  const getGradientColors = (tagCode: string): string[] => {
    switch (tagCode) {
      case 'new':
        return ['#4CAF50', '#66BB6A']; // Green gradient
      case 'discount':
        return ['#FF5722', '#FF7043']; // Deep Orange gradient
      case 'free':
        return ['#2196F3', '#42A5F5']; // Blue gradient
      case 'premium':
      case 'hot':
        return ['#FF6B9D', '#FF6B35']; // Purple gradient
      case 'member':
      case 'vip_only':
        return ['#FFD700', '#FFE082']; // Gold gradient
      default:
        return ['#FF6B9D', '#FF6B35']; // 主特色渐变（粉色到橙色）
    }
  };

  // 渲染徽章视图
  const renderBadgeView = (gradientColors: string[], icon: string, text: string) => {
    if (!text) return null;
    
    return (
      <View style={styles.activityBadge}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badgeContent}>
          <FontAwesome name={icon} size={10} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.activityBadgeText}>{text}</Text>
        </View>
      </View>
    );
  };

  // Price Logic with Coin Icon
  const renderPrice = () => {
      if (album.price > 0) {
          return (
              <View style={styles.priceContainer}>
                <Image 
                  source={require('../assets/mm-coins.png')} 
                  style={styles.coinIcon}
                  resizeMode="contain"
                />
                <Text style={styles.priceText}>{album.price}</Text>
                {album.original_price && (
                    <Text style={styles.originalPriceText}>{album.original_price}</Text>
                )}
              </View>
          );
      }
      return null;
  };

  return (
    <Animated.View
      style={[
        { width: '100%', opacity: fadeAnim },
        {
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.container, { width: '100%' }]} // Use 100% width to fill Masonry column
        onPress={() => onPress(album)}
        activeOpacity={0.8}
      >
        <View style={[styles.imageContainer, { height: cardHeight }]}>
        {/* 如果有预览视频，显示视频播放器；否则显示图片 */}
        {hasPreviewVideo && isVideoAlbum ? (
          <Video
            source={{ uri: previewVideoUrl as string }}
            style={styles.video}
            resizeMode="cover"
            paused={false}
            muted={true}
            repeat={true}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            poster={coverImageUrl}
            posterResizeMode="cover"
            onError={(error) => {
              console.warn('视频播放错误:', error);
            }}
          />
        ) : (
          <LoadingImage
            source={{ uri: coverImageUrl }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
            placeholderColor="#2A2A2A"
            fadeDuration={400}
          />
        )}
        
        {renderBadge()}
        
        {/* 视频类型标识 */}
        {isVideoAlbum && (
          <View style={styles.videoBadge}>
            <FontAwesome name="play-circle" size={12} color="#fff" />
            <Text style={styles.videoBadgeText}>视频</Text>
          </View>
        )}
        
        {/* Template count for template-based albums */}
        {(!isVideoAlbum && !album.src_image && album.template_list && album.template_list.length > 0) && (
          <View style={styles.templateCountBadge}>
            <Text style={styles.templateCountText}>
              {album.template_list.length} 模板
            </Text>
          </View>
        )}
        
        {/* Src Image for Image-to-Image albums */}
        {/* 如果是视频类型，不展示左下角原始图 */}
        {!isVideoAlbum && (
          <>
            {/* 多人合拍模式：显示两张 src_images */}
            {album.is_multi_person === true && album.src_images && album.src_images.length >= 2 && (
              <View style={styles.multiSrcImageContainer}>
                <View style={styles.multiSrcImageItem}>
                  <LoadingImage 
                    source={{ uri: album.src_images[0] }} 
                    style={styles.multiSrcImage} 
                    resizeMode={FastImage.resizeMode.cover}
                    placeholderColor="#1A1A1A"
                    fadeDuration={300}
                  />
                </View>
                <View style={styles.plusContainer}>
                  <Text style={styles.plusText}>+</Text>
                </View>
                <View style={styles.multiSrcImageItem}>
                  <LoadingImage 
                    source={{ uri: album.src_images[1] }} 
                    style={styles.multiSrcImage} 
                    resizeMode={FastImage.resizeMode.cover}
                    placeholderColor="#1A1A1A"
                    fadeDuration={300}
                  />
                </View>
              </View>
            )}
            {/* 单人模式或数据不完整：显示单张 src_image */}
            {(!album.is_multi_person || !album.src_images || album.src_images.length < 2) && album.src_image && (
              <View style={styles.srcImageContainer}>
                <LoadingImage 
                  source={{ uri: album.src_image }} 
                  style={styles.srcImage} 
                  resizeMode={FastImage.resizeMode.contain}
                  placeholderColor="#1A1A1A"
                  fadeDuration={300}
                />
              </View>
            )}
          </>
        )}
        
        {/* Likes - 放在右上角 */}
        <View style={styles.likesContainer}>
          <FontAwesome name="heart" size={10} color="#FF6B9D" style={styles.likesIcon} />
          <Text style={styles.likesText}>
            {album.likes >= 1000 ? `${(album.likes / 1000).toFixed(1)}K` : album.likes}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {album.album_name}
          </Text>
          {renderPrice()}
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Width handled inline
    marginBottom: 8, // Reduced vertical spacing
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#2A2A2A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  activityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 20,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  templateCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  templateCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  srcImageContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#ccc',
  },
  multiSrcImageContainer: {
    position: 'absolute',
    bottom: '15%', // 中间偏下位置
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  multiSrcImageItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  multiSrcImage: {
    width: '100%',
    height: '100%',
  },
  plusContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  plusText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  srcImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  priceText: {
      color: '#FFD700',
      fontSize: 14,
      fontWeight: 'bold',
      marginRight: 4,
  },
  originalPriceText: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 10,
      textDecorationLine: 'line-through',
  },
  likesContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  likesIcon: {
    marginRight: 3,
  },
  likesText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});

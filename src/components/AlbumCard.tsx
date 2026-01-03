import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Album } from '../types/model/activity';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.35;
const cardHeight = cardWidth * 1.7;

interface AlbumCardProps {
  album: Album;
  onPress: (albumId: string) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onPress,
}) => {
  // 取第一个template作为封面
  const coverImage = album.template_list[0]?.template_url || album.album_image;
  
  // 计算总点赞数（所有template的点赞数之和）
  const totalLikes = album.template_list.reduce((sum, template) => {
    // 这里可以根据需要设置每个template的点赞数，暂时使用随机数
    return sum;
  }, 0);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(album.album_id)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: coverImage }}
          style={styles.image}
          resizeMode="cover"
        />
        {album.level !== '0' && !album.srcImage && (
          <View style={styles.premiumBadge}>
            <FontAwesome name="star" size={12} color="#FFD700" />
          </View>
        )}
        {/* 显示相册内模板数量，如果是异步任务(有srcImage)则不显示 */}
        {!album.srcImage && (
          <View style={styles.templateCountBadge}>
            <Text style={styles.templateCountText}>
              {album.template_list.length} 模板
            </Text>
          </View>
        )}
        
        {/* 异步任务源图片 */}
        {/* 多人合拍模式：显示两张 src_images */}
        {album.is_multi_person === true && album.src_images && album.src_images.length >= 2 && (
          <View style={styles.multiSrcImageContainer}>
            <View style={styles.multiSrcImageItem}>
              <Image source={{ uri: album.src_images[0] }} style={styles.multiSrcImage} />
            </View>
            <View style={styles.plusContainer}>
              <Text style={styles.plusText}>+</Text>
            </View>
            <View style={styles.multiSrcImageItem}>
              <Image source={{ uri: album.src_images[1] }} style={styles.multiSrcImage} />
            </View>
          </View>
        )}
        {/* 单人模式或数据不完整：显示单张 srcImage */}
        {(!album.is_multi_person || !album.src_images || album.src_images.length < 2) && album.srcImage && (
          <View style={styles.srcImageContainer}>
            <Image source={{ uri: album.srcImage }} style={styles.srcImage} />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {album.album_name}
          </Text>
          <View style={styles.likesContainer}>
            <FontAwesome name="heart" size={12} color="#FF6B9D" style={styles.likesIcon} />
            <Text style={styles.likesText}>
              {totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : totalLikes}
            </Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {album.album_description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginRight: 20,
    height: cardHeight,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardWidth * 1.4,
  },
  image: {
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
  infoContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  likesContainer: {
    height: 18,
    lineHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesIcon: {
    marginRight: 4,
  },
  likesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  srcImageContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
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
});

export default AlbumCard;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Album } from '../types/model/activity';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.35;

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
    return sum + Math.floor(Math.random() * 100);
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
        {album.level !== '0' && (
          <View style={styles.premiumBadge}>
            <FontAwesome name="star" size={12} color="#FFD700" />
          </View>
        )}
        {/* 显示相册内模板数量 */}
        <View style={styles.templateCountBadge}>
          <Text style={styles.templateCountText}>
            {album.template_list.length} 模板
          </Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginRight: 20,
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
    padding: 10,
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
  likesContainer: {
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
  priceContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default AlbumCard;

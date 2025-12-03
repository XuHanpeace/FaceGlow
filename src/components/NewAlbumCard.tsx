import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { AlbumRecord, AlbumLevel } from '../types/model/album';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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
}

export const NewAlbumCard: React.FC<NewAlbumCardProps> = ({
  album,
  onPress,
}) => {
  // Determine cover image
  const coverImage = album.template_list?.[0]?.template_url || album.album_image;

  // Generate a random aspect ratio for waterfall effect (between 1.2 and 1.6)
  // Use album_id as seed to keep it consistent
  const aspectRatio = useMemo(() => {
    if (album.src_image) return 1.0; // Square for tasks like img2img usually
    const seed = album.album_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 1.2 + (seed % 5) * 0.1; // 1.2, 1.3, 1.4, 1.5, 1.6
  }, [album.album_id, album.src_image]);

  const cardHeight = COLUMN_WIDTH * aspectRatio;

  // Badge Logic
  const renderBadge = () => {
    if (album.activity_tag_type) {
        let bgColor = '#000';
        let icon = 'tag';
        let text = album.activity_tag_text || '';

        switch (album.activity_tag_type) {
            case 'new':
                bgColor = '#4CAF50'; // Green
                icon = 'bolt';
                text = text || 'NEW';
                break;
            case 'discount':
                bgColor = '#FF5722'; // Deep Orange
                icon = 'percent';
                text = text || 'SALE';
                break;
            case 'free':
                bgColor = '#2196F3'; // Blue
                icon = 'gift';
                text = text || 'FREE';
                break;
            case 'premium':
                bgColor = '#9C27B0'; // Purple
                icon = 'diamond';
                text = text || 'HOT';
                break;
             case 'member':
                bgColor = '#FFD700'; // Gold
                icon = 'crown';
                text = text || 'VIP';
                break;
        }

        return (
            <View style={[styles.activityBadge, { backgroundColor: bgColor }]}>
                <FontAwesome name={icon} size={10} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.activityBadgeText}>{text}</Text>
            </View>
        );
    }
    
    // Fallback to level badge if no activity tag
    if (album.level !== AlbumLevel.FREE) {
       return (
          <View style={[styles.activityBadge, { backgroundColor: '#FFD700' }]}>
            <FontAwesome name="crown" size={10} color="#000" style={{ marginRight: 4 }} />
            <Text style={[styles.activityBadgeText, { color: '#000' }]}>VIP</Text>
          </View>
       );
    }
    return null;
  };

  // Price Logic
  const renderPrice = () => {
      if (album.price > 0) {
          return (
              <View style={styles.priceContainer}>
                <FontAwesome name="dollar" size={10} color="#FFD700" style={{ marginRight: 2 }} />
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
    <TouchableOpacity
      style={[styles.container, { width: '100%' }]} // Use 100% width to fill Masonry column
      onPress={() => onPress(album)}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, { height: cardHeight }]}>
        <Image
          source={{ uri: coverImage }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {renderBadge()}
        
        {/* Template count for template-based albums */}
        {(!album.src_image && album.template_list && album.template_list.length > 0) && (
          <View style={styles.templateCountBadge}>
            <Text style={styles.templateCountText}>
              {album.template_list.length} 模板
            </Text>
          </View>
        )}
        
        {/* Src Image for Image-to-Image albums */}
        {album.src_image && (
          <View style={styles.srcImageContainer}>
            <Image source={{ uri: album.src_image }} style={styles.srcImage} />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
                {album.album_name}
            </Text>
        </View>
        
        <View style={styles.metaRow}>
            {renderPrice()}
            {/* Likes */}
            <View style={[styles.likesContainer, album.price > 0 ? { marginLeft: 'auto' } : {}]}>
                <FontAwesome name="heart" size={10} color="#FF6B9D" style={styles.likesIcon} />
                <Text style={styles.likesText}>
                {album.likes >= 1000 ? `${(album.likes / 1000).toFixed(1)}K` : album.likes}
                </Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
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
  activityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
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
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesIcon: {
    marginRight: 3,
  },
  likesText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
});

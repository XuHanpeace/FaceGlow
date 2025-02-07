import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { ImageComparison } from './ImageComparison';

interface RecommendationCardProps {
  image: string;
  title: string;
  subtitle: string;
  count: number;
  onPress: () => void;
}

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http') || url.startsWith('file') || url.startsWith('data');
  } catch {
    return false;
  }
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  image,
  title,
  subtitle,
  count,
  onPress,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const onImageLoad = () => {
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const onImageError = () => {
    console.warn('Image failed to load:', image);
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const isValidImage = isValidUrl(image);

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View style={[styles.card, { opacity: 1 }]}>
        <View style={styles.imageContainer}>
          {isValidImage ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              onLoad={onImageLoad}
              onError={onImageError}
            />
          ) : (
            <View style={styles.fallbackBackground} />
          )}
        </View>
        <View style={styles.overlay}>
          <Text style={styles.count}>{count}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const cardWidth = (Dimensions.get('window').width - 55) / 2;
const cardHeight = 240;

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: 169,
    height: 240,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  shimmer: {
    backgroundColor: '#ebebeb',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  count: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  textContainer: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
  },
  fallbackBackground: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: '#d3d3d3',
    position: 'absolute',
  },
});

export default RecommendationCard;

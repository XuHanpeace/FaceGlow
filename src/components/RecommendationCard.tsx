import React, {useState} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, Animated, Dimensions} from 'react-native';

interface RecommendationCardProps {
  image: string;
  title: string;
  subtitle: string;
  count: number;
  onPress: () => void;
}

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({image, title, subtitle, count, onPress}) => {
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

  const isValidImage = isValidUrl(image);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <View style={[styles.imagePlaceholder, styles.shimmer]} />
        {isValidImage ? (
          <Animated.Image
            source={{uri: image}}
            style={[
              styles.image,
              {
                opacity: fadeAnim,
                position: 'absolute',
              },
            ]}
            onLoad={onImageLoad}
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (Dimensions.get('window').width - 75) / 2,
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  shimmer: {
    backgroundColor: '#ebebeb',
    backgroundImage: 'linear-gradient(to right, #ebebeb 0%, #f5f5f5 50%, #ebebeb 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1000px 100%',
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
    width: '100%',
    height: '100%',
    backgroundColor: '#d3d3d3',
    position: 'absolute',
  },
});

export default RecommendationCard; 
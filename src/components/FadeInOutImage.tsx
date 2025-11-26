import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';

interface FadeInOutImageProps {
  images: any[]; // 图片资源数组（require() 或 { uri: string }）
  width?: number;
  height?: number;
  duration?: number; // 每张图片显示时长（毫秒）
  fadeDuration?: number; // 渐隐渐显动画时长（毫秒）
}

/**
 * 渐隐渐显图片组件
 * 自动循环显示多张图片，带有渐隐渐显动画效果
 */
export const FadeInOutImage: React.FC<FadeInOutImageProps> = ({
  images,
  width = 300,
  height = 400,
  duration = 3000, // 默认每张图片显示3秒
  fadeDuration = 1200, // 默认渐隐渐显动画1200毫秒
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      // 渐隐
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => {
        // 切换图片
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        
        // 渐显
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: fadeDuration,
          useNativeDriver: true,
        }).start();
      });
    }, duration);

    return () => clearInterval(interval);
  }, [images.length, duration, fadeDuration, fadeAnim]);

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  
  // 判断图片类型：number 表示 require()，object 表示 { uri: string }
  const isLocalImage = typeof currentImage === 'number';
  const imageSource = isLocalImage 
    ? currentImage 
    : (typeof currentImage === 'object' && currentImage.uri 
        ? { uri: currentImage.uri } 
        : currentImage);

  // 判断是否为圆形（宽高相等时）
  const isCircular = width === height;
  const borderRadius = isCircular ? width / 2 : 0;

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.imageContainer,
          { width, height, borderRadius, opacity: fadeAnim },
        ]}
      >
        {typeof currentImage === 'number' ? (
          <Image
            source={currentImage}
            style={[styles.image, { width, height }]}
            resizeMode="cover"
          />
        ) : (
          <FastImage
            source={imageSource}
            style={[styles.image, { width, height }]}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});


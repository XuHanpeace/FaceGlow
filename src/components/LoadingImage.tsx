import React, { useState, useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, StyleProp, ImageStyle } from 'react-native';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';

interface LoadingImageProps extends Omit<Omit<FastImageProps, 'source'>, 'style'> {
  source: Source | number;
  style?: StyleProp<ImageStyle>;
  placeholderColor?: string;
  fadeDuration?: number;
}

/**
 * 带加载过渡效果的图片组件
 * 在图片加载时显示占位背景，加载完成后渐显
 */
export const LoadingImage: React.FC<LoadingImageProps> = ({
  source,
  style,
  placeholderColor = '#2A2A2A',
  fadeDuration = 300,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      // 图片加载完成后，渐显
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();
    } else {
      // 开始加载时，重置透明度
      fadeAnim.setValue(0);
    }
  }, [isLoading, fadeDuration]);

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 占位背景 - 渐变效果，让加载过程更柔和 */}
      {isLoading && (
        <LinearGradient
          colors={[
            placeholderColor,
            adjustColor(placeholderColor, 0.1),
            placeholderColor,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      
      {/* 图片层 - 渐显效果 */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <FastImage
          source={source}
          style={StyleSheet.absoluteFill}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onLoadEnd={handleLoadEnd}
          {...props}
        />
      </Animated.View>
    </View>
  );
};

/**
 * 调整颜色亮度（用于生成渐变占位背景）
 */
function adjustColor(color: string, amount: number): string {
  // 简单的颜色调整，如果是十六进制颜色
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const num = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16);
    if (isNaN(num)) return color;
    
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(amount * 255)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(amount * 255)));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(amount * 255)));
    
    const newHex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return `#${newHex}`;
  }
  return color;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});


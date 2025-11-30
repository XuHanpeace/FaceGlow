import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, ImageStyle, LayoutChangeEvent, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface CrossFadeImageProps {
  image1: string; // Source Image
  image2: string; // Result Image
  duration?: number; // 扫描一趟的时间
  interval?: number; // 停留时间
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const CrossFadeImage: React.FC<CrossFadeImageProps> = ({
  image1,
  image2,
  duration = 4000,
  interval = 1000,
  containerStyle,
  imageStyle
}) => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [layoutHeight, setLayoutHeight] = useState(0);

  useEffect(() => {
    if (layoutHeight === 0) return;

    const loop = Animated.loop(
      Animated.sequence([
        // 1. Reset
        Animated.parallel([
            Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 0, useNativeDriver: false }),
        ]),
        // 2. Scan Down (Reveal Result)
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: false, // height animation needs false
          easing: Easing.inOut(Easing.ease),
        }),
        // 3. Wait
        Animated.delay(interval),
        // 4. Fade Out Result (Reveal Source again)
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [duration, interval, layoutHeight]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutHeight(event.nativeEvent.layout.height);
  };

  return (
    <View 
      style={[styles.container, containerStyle]} 
      onLayout={handleLayout}
    >
      {/* Layer 1: Source Image (Background) - Always visible */}
      <Animated.Image
        source={{ uri: image1 }}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
      />

      {/* Layer 2: Result Image (Foreground) - Revealed by Height */}
      {layoutHeight > 0 && (
        <Animated.View
          style={[
            styles.absolute,
            {
              height: scanAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, layoutHeight],
              }),
              opacity: opacityAnim,
              overflow: 'hidden',
            },
          ]}
        >
          {/* Result Image - Must stay at fixed height */}
          <Animated.Image
            source={{ uri: image2 }}
            style={[styles.image, imageStyle, { height: layoutHeight }]}
            resizeMode="cover"
          />

          {/* Scan Light Trail (Gradient) - At the bottom of the revealed area */}
          <LinearGradient
            colors={[
              'rgba(0, 224, 150, 0)', 
              'rgba(0, 224, 150, 0.1)', 
              'rgba(0, 224, 150, 0.5)',
              'rgba(200, 255, 230, 0.8)' // Tip highlight
            ]}
            locations={[0, 0.5, 0.9, 1]}
            start={{x: 0, y: 0}} 
            end={{x: 0, y: 1}}
            style={styles.scanTrail}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  scanTrail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // 拖尾长度
  }
});

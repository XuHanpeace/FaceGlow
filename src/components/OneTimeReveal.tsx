import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, ImageStyle, LayoutChangeEvent, Easing, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface OneTimeRevealProps {
  image1: string; // Source/Cover Image (Background)
  image2?: string; // Result Image (Foreground) - Optional
  duration?: number; // Animation duration
  trigger?: boolean; // Trigger to start animation
  revealed?: boolean; // If true, shows fully revealed immediately (no animation)
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const OneTimeReveal: React.FC<OneTimeRevealProps> = ({
  image1,
  image2,
  duration = 3000,
  trigger = false,
  revealed = false,
  onAnimationStart,
  onAnimationEnd,
  containerStyle,
  imageStyle
}) => {
  const scanAnim = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    // If already revealed, don't animate
    if (revealed) return;

    if (trigger && image2 && layoutHeight > 0 && !hasStarted) {
      setHasStarted(true);
      if (onAnimationStart) onAnimationStart();

      Animated.timing(scanAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false, // height animation
        easing: Easing.inOut(Easing.ease),
      }).start(({ finished }) => {
        if (finished) {
          setHasFinished(true);
          if (onAnimationEnd) onAnimationEnd();
        }
      });
    }
  }, [trigger, image2, layoutHeight, hasStarted, revealed]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutHeight(event.nativeEvent.layout.height);
  };

  return (
    <View 
      style={[styles.container, containerStyle]} 
      onLayout={handleLayout}
    >
      {/* Layer 1: Background (Source/Cover) */}
      <Image
        source={{ uri: image1 }}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
      />

      {/* Layer 2: Foreground (Result) - Revealed */}
      {revealed ? (
          // Static Revealed State - Immediate render, no layout dependency
          image2 && (
            <View style={[styles.absolute, { height: '100%', width: '100%' }]}>
                <Image
                    source={{ uri: image2 }}
                    style={[styles.image, imageStyle]}
                    resizeMode="cover"
                    fadeDuration={0}
                />
            </View>
          )
      ) : (
          // Animated Reveal State
          layoutHeight > 0 && image2 && (
            <Animated.View
              style={[
                styles.absolute,
                {
                  height: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, layoutHeight],
                  }),
                  overflow: 'hidden',
                },
              ]}
            >
              {/* Result Image - Fixed height */}
              <Image
                source={{ uri: image2 }}
                style={[styles.image, imageStyle, { height: layoutHeight }]}
                resizeMode="cover"
              />

              {/* Scan Light Trail - Hide if finished */}
              {!hasFinished && (
                 <LinearGradient
                  colors={[
                    'rgba(0, 224, 150, 0)', 
                    'rgba(0, 224, 150, 0.1)', 
                    'rgba(0, 224, 150, 0.5)',
                    'rgba(200, 255, 230, 0.8)' // Tip
                  ]}
                  locations={[0, 0.5, 0.9, 1]}
                  start={{x: 0, y: 0}} 
                  end={{x: 0, y: 1}}
                  style={styles.scanTrail}
                />
              )}
            </Animated.View>
          )
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
    height: 120,
  }
});

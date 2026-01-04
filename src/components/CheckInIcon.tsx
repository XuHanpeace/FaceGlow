import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface CheckInIconProps {
  onPress: () => void;
  showRedDot?: boolean;
  shouldShake?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: number;
  iconColor?: string;
}

export const CheckInIcon: React.FC<CheckInIconProps> = ({
  onPress,
  showRedDot = false,
  shouldShake = false,
  style,
  size = 24,
  iconColor = '#fff',
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldShake) {
      // 以自身中心为圆心的左右摇晃动画
      const startShake = () => {
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      };

      startShake();

      return () => {
        shakeAnim.stopAnimation();
      };
    } else {
      // 如果不应该晃动，重置动画值
      shakeAnim.setValue(0);
    }
  }, [shouldShake, shakeAnim]);

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'], // 左右旋转角度
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        shouldShake && { transform: [{ rotate }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.iconButton, { width: size, height: size }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <FontAwesome name="gift" size={size * 0.8} color={iconColor} />
        {showRedDot && (
          <View style={styles.redDot}>
            <View style={styles.redDotInner} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
});


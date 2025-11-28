import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

interface DeleteIconProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export const DeleteIcon: React.FC<DeleteIconProps> = ({ 
  onPress, 
  style,
  size = 24 
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 开始抖动动画
    const startShake = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // 触发极短震动（使用 HapticFeedback 库）
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };
    
    // 使用 'impactLight' 或 'impactMedium' 可以获得类似"点"一下的极短触感
    // 也可以尝试 'soft' 或 'rigid'
    ReactNativeHapticFeedback.trigger("impactLight", options);
    
    startShake();

    return () => {
      rotateAnim.stopAnimation();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View style={[styles.container, style, { transform: [{ rotate }] }]}>
      <TouchableOpacity 
        style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <FontAwesome name="minus" size={size * 0.5} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  button: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});


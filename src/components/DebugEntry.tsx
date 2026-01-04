import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { themeColors } from '../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DebugEntryProps {
  onPress: () => void;
}

const DebugEntry: React.FC<DebugEntryProps> = ({ onPress }) => {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        
        // 边界检查，确保按钮不会移出屏幕
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        
        let finalX = currentX;
        let finalY = currentY;
        
        // 限制在屏幕范围内
        const buttonSize = 60;
        const minX = 0;
        const maxX = SCREEN_WIDTH - buttonSize;
        const minY = 0;
        const maxY = SCREEN_HEIGHT - buttonSize;
        
        if (currentX < minX) finalX = minX;
        if (currentX > maxX) finalX = maxX;
        if (currentY < minY) finalY = minY;
        if (currentY > maxY) finalY = maxY;
        
        // 如果超出边界，动画回到边界内
        if (finalX !== currentX || finalY !== currentY) {
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.button}
      >
        <LinearGradient
          colors={themeColors.error.gradient}
          start={themeColors.error.start}
          end={themeColors.error.end}
          style={styles.gradient}
        >
          <Text style={styles.text}>🐛</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 9998,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
});

export default DebugEntry;


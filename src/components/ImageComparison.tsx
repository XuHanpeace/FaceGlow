import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, PanResponder, Animated } from 'react-native';

interface ImageComparisonProps {
  beforeImage: string;  // 处理前图片URL
  afterImage: string;   // 处理后图片URL
  width?: number;       // 组件宽度
  height?: number;      // 组件高度
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeImage,
  afterImage,
  width = 300,
  height = 400,
}) => {
  const [sliderPosition, setSliderPosition] = useState(width / 2);
  const panX = useRef(new Animated.Value(width / 2)).current;

  // 创建拖动手势处理器
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newPosition = Math.max(0, Math.min(width, gestureState.moveX));
      setSliderPosition(newPosition);
      panX.setValue(newPosition);
    },
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {/* 处理后的图片（底层） */}
      <Image
        source={{ uri: afterImage }}
        style={[styles.image, { width, height }]}
        resizeMode="cover"
      />
      
      {/* 处理前的图片（上层，被裁切） */}
      <Animated.View
        style={[
          styles.beforeImageContainer,
          {
            width: panX,
            height,
          },
        ]}
      >
        <Image
          source={{ uri: beforeImage }}
          style={[styles.image, { width, height }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* 滑动条 */}
      <Animated.View
        style={[
          styles.sliderLine,
          {
            transform: [{ translateX: panX }],
            height,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderButton}>
          <View style={styles.sliderArrows}>
            <View style={styles.arrowLeft} />
            <View style={styles.arrowRight} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  beforeImageContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  sliderLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  sliderButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 20,
  },
  arrowLeft: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#666',
  },
  arrowRight: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#666',
  },
}); 
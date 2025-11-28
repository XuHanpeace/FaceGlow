import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

// 获取屏幕尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageComparisonProps {
  beforeImage: string; // 处理前图片URL
  afterImage: string; // 处理后图片URL
  width?: number; // 组件宽度
  height?: number; // 组件高度
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeImage,
  afterImage,
  width = 300,
  height = 400,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAfterImageLoaded, setIsAfterImageLoaded] = useState(false);
  const panX = useRef(new Animated.Value(width / 2)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 计算全屏时的尺寸（使用固定屏幕比例）
  const fullscreenDimensions = React.useMemo(() => {
    return {
      width: SCREEN_WIDTH * 0.9,  // 使用90%的屏幕宽度
      height: SCREEN_HEIGHT * 0.5, // 使用80%的屏幕高度
    };
  }, []);  // 不再依赖 width 和 height

  // 当 afterImage 改变时重置动画状态
  React.useEffect(() => {
    setIsAfterImageLoaded(false);
    fadeAnim.setValue(0);
  }, [afterImage, fadeAnim]);

  // 创建拖动手势处理器
  const createPanResponder = (containerWidth: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // 拒绝其他组件请求终止响应
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(containerWidth, gestureState.moveX));
        panX.setValue(newPosition);
      },
    });

  const renderComparison = (containerWidth: number, containerHeight: number) => (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {/* 处理后的图片（底层） */}
      <Image
        source={{ uri: afterImage }}
        style={[styles.image, { width: containerWidth, height: containerHeight }]}
        resizeMode="cover"
        onLoad={() => {
          setIsAfterImageLoaded(true);
          // 启动淡入动画
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }}
      />

      {/* 处理前的图片（上层，被裁切） */}
      <Animated.View
        style={[
          styles.beforeImageContainer,
          {
            width: panX,
            height: containerHeight,
          },
        ]}
      >
        <Image
          source={{ uri: beforeImage }}
          style={[styles.image, { width: containerWidth, height: containerHeight }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* 加载状态遮罩层 - 当 afterImage 未加载完成时显示 */}
      <Animated.View 
        style={[
          styles.loadingOverlay, 
          { 
            width: containerWidth, 
            height: containerHeight,
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }
        ]}
        pointerEvents={isAfterImageLoaded ? 'none' : 'auto'}
      >
        <Image
          source={{ uri: beforeImage }}
          style={[styles.image, { width: containerWidth, height: containerHeight }]}
          resizeMode="cover"
        />
        <View style={styles.blurOverlay} />
      </Animated.View>

      {/* 滑动条 */}
      <Animated.View
        style={[
          styles.sliderLine,
          {
            transform: [{ translateX: panX }],
            height: containerHeight,
          },
        ]}
        {...createPanResponder(containerWidth).panHandlers}
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

  return (
    <>
      <View>
        {renderComparison(width, height)}
      </View>

      <Modal
        visible={isFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFullscreen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {renderComparison(fullscreenDimensions.width, fullscreenDimensions.height)}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // 白色半透明背景
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

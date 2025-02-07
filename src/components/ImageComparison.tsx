import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Modal,
  TouchableOpacity,
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
  const [sliderPosition, setSliderPosition] = useState(width / 2);
  const panX = useRef(new Animated.Value(width / 2)).current;

  // 计算全屏时的尺寸（保持原始比例，但略微放大）
  const fullscreenDimensions = React.useMemo(() => {
    const scale = 1.2; // 放大倍数
    const screenRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    const imageRatio = width / height;

    if (screenRatio > imageRatio) {
      // 屏幕更宽，以高度为基准
      const fullHeight = SCREEN_HEIGHT * 0.8; // 留出一些边距
      const fullWidth = fullHeight * imageRatio;
      return {
        width: fullWidth * scale,
        height: fullHeight * scale,
      };
    } else {
      // 屏幕更窄，以宽度为基准
      const fullWidth = SCREEN_WIDTH * 0.8; // 留出一些边距
      const fullHeight = fullWidth / imageRatio;
      return {
        width: fullWidth * scale,
        height: fullHeight * scale,
      };
    }
  }, [width, height]);

  // 创建拖动手势处理器
  const createPanResponder = (containerWidth: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(containerWidth, gestureState.moveX));
        setSliderPosition(newPosition);
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
      <TouchableWithoutFeedback onPress={() => setIsFullscreen(true)}>
        {renderComparison(width, height)}
      </TouchableWithoutFeedback>

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
});

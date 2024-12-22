import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  TouchableWithoutFeedback,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maskClosable?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  maskClosable = true,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // 显示时从底部滑上来
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // 关闭时滑到底部
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleMaskPress = () => {
    if (maskClosable) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleMaskPress}>
        <View style={styles.mask}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <Animated.View 
              style={[
                styles.content,
                { 
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // 改为底部对齐
  },
  content: {
    width: '100%', // 改为全宽
    padding: 20,
    borderTopLeftRadius: 16, // 只设置顶部圆角
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // 阴影向上
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%', // 最大高度限制
  },
});

export default Modal; 
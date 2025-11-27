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
  const [localVisible, setLocalVisible] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setLocalVisible(true);
      // 显示时从底部滑上来
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else if (localVisible) {
      // 关闭时滑到底部（只有在 localVisible 为 true 时才执行关闭动画）
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // 只有在动画完成时才真正关闭modal
        if (finished) {
          setLocalVisible(false);
        }
      });
    }
  }, [visible, slideAnim, localVisible]);

  const handleMaskPress = () => {
    if (maskClosable) {
      onClose();
    }
  };

  if (!localVisible) {
    return null;
  }

  return (
    <RNModal
      visible={true}
      transparent={true}
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
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#1a1a1a',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end', // 改为底部对齐
  },
  content: {
    width: '100%', // 改为全宽
    padding: 20,
    minHeight: 400,
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
    maxHeight: '80%', // ��大高度限制
  },
});

export default Modal; 
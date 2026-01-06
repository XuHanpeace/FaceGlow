import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal as RNModal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import GradientButton from './GradientButton';
import { colors } from '../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  showCancel?: boolean;
}

/**
 * Dialog 组件
 * 屏幕居中显示，用于替代 Alert.alert，支持 Loading 状态和渐变按钮
 */
const Dialog: React.FC<DialogProps> = ({
  visible,
  title = '提示',
  message = '',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  loading = false,
  showCancel = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [localVisible, setLocalVisible] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setLocalVisible(true);
      // 显示动画：缩放 + 淡入
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (localVisible) {
      // 隐藏动画：缩放 + 淡出
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setLocalVisible(false);
        }
      });
    }
  }, [visible, scaleAnim, opacityAnim, localVisible]);

  const handleConfirm = () => {
    if (!loading && onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading && onCancel) {
      onCancel();
    }
  };

  if (!localVisible) {
    return null;
  }

  return (
    <RNModal
      visible={true}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : handleCancel}>
        <View style={styles.mask}>
          <Animated.View
            style={[
              styles.maskOverlay,
              {
                opacity: opacityAnim,
              },
            ]}
          />
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* 标题 */}
              {title && (
                <Text style={styles.title}>{title}</Text>
              )}

              {/* 内容 */}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* 按钮区域 */}
              <View style={styles.buttonContainer}>
                {showCancel && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <GradientButton
                  title={confirmText}
                  onPress={handleConfirm}
                  disabled={loading}
                  loading={loading}
                  variant="primary"
                  size="large"
                  height={48}
                  fontSize={16}
                  borderRadius={12}
                  style={[styles.confirmButton, showCancel && { flex: 1 }]}
                />
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: SCREEN_WIDTH - 80,
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Dialog;


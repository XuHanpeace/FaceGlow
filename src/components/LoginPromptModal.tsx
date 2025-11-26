import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Modal } from './modal';
import GradientButton from './GradientButton';
import { themeColors, colors } from '../config/theme';

interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

/**
 * 登录提示半屏弹窗
 * 引导用户登录/注册
 */
const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  onLogin,
  onRegister,
}) => {
  return (
    <Modal visible={visible} onClose={onClose} maskClosable={true}>
      <View style={styles.content}>
        {/* 关闭按钮 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="times" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.iconContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/brand-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 标题 */}
        <Text style={styles.title}>登录解锁更多功能</Text>

        {/* 描述 */}
        <Text style={styles.description}>
          登录后可以保存作品、管理自拍照、享受会员特权等更多精彩功能
        </Text>

        {/* 功能列表 */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>保存你的创作作品</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>管理个人自拍照</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>享受会员专属特权</Text>
          </View>
        </View>

        {/* 按钮区域 */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="立即登录"
            onPress={onLogin}
            variant="primary"
            size="large"
            width="100%"
            height={50}
            fontSize={16}
            borderRadius={12}
            style={styles.loginButton}
          />
          <TouchableOpacity
            style={styles.registerButton}
            onPress={onRegister}
          >
            <Text style={styles.registerButtonText}>还没有账号？去注册</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 40,
    minHeight: 500,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featuresList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    color: colors.white,
    fontSize: 15,
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
  },
  loginButton: {
    marginBottom: 16,
  },
  registerButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default LoginPromptModal;


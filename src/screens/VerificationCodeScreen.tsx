import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuthState } from '../hooks/useAuthState';
import { authService, verificationService } from '../services/auth';
import { Linking } from 'react-native';
import GradientButton from '../components/GradientButton';
import { showSuccessToast } from '../utils/toast';
import BackButton from '../components/BackButton';
import { aegisService } from '../services/monitoring/aegisService';

type VerificationCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type VerificationCodeScreenRouteProp = RouteProp<RootStackParamList, 'VerificationCode'>;

const VerificationCodeScreen: React.FC = () => {
  const navigation = useNavigation<VerificationCodeScreenNavigationProp>();
  const route = useRoute<VerificationCodeScreenRouteProp>();
  const { setAuthData } = useAuthState();
  
  const { phoneNumber, verificationId } = route.params;
  
  // 表单数据
  const [verificationCode, setVerificationCode] = useState('');
  
  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  // 输入框引用
  const codeInputRef = useRef<TextInput>(null);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 页面加载时自动聚焦
  useEffect(() => {
    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 300);
  }, []);

  const handleClosePress = () => {
    navigation.goBack();
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    if (countdown > 0) {
      return;
    }

    setIsLoading(true);
    try {
      await verificationService.sendPhoneVerification(phoneNumber);
      
      // 重新开始倒计时
      setCountdown(60);
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '验证码发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录/注册（合并逻辑：先尝试登录，失败则自动注册）
  const handlePhoneVerification = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    if (!verificationId) {
      Alert.alert('提示', '请先发送验证码');
      return;
    }

    setIsLoading(true);
    try {
      // 先尝试登录
      const loginResult = await authService.loginWithPhone(
        phoneNumber,
        verificationCode,
        verificationId
      );

      console.log('loginResult', loginResult);
      
      // 检查账户是否被删除
      if (!loginResult.success && loginResult.error?.code === 'ACCOUNT_DELETED') {
        Alert.alert(
          '账户已删除',
          loginResult.error.message || '您的账户已被删除。如需恢复账户，请发送邮件至 support@faceglow.app 申请恢复。',
          [
            { text: '确定', onPress: () => {
              // 尝试打开邮件客户端
              Linking.openURL('mailto:support@faceglow.app?subject=申请恢复账户&body=您好，我想申请恢复我的账户。');
            }}
          ]
        );
        return;
      }
      
      // 登录成功
      if (loginResult.success && loginResult.data) {
        setAuthData(loginResult.data);
        showSuccessToast('登录成功！');
        setTimeout(() => {
          navigation.popToTop();
        }, 500);
        return;
      }
      
      // 登录失败，检查是否是用户不存在
      const isUserNotFoundErrorCode = loginResult.error?.error_code === 5;
      const isUserNotFoundErrorMessage = loginResult.error?.error_type === 'not_found';
      const errorMessage = loginResult.error?.message || '';
      
      const isUserNotFound = isUserNotFoundErrorCode && isUserNotFoundErrorMessage;
      
      if (isUserNotFound) {
        // 生成用户名：移除手机号中的特殊字符，使用 phone 前缀
        // 用户名格式要求：必须以小写字母开头，长度6-25位，只能包含小写字母、数字、下划线和连字符
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        // phone 前缀（5个字符）+ 最多20位数字，确保总长度不超过25位
        const phoneSuffix = cleanPhone.slice(-20); // 取后20位
        const autoUsername = `phone${phoneSuffix}`;
        
        const registerResult = await authService.registerWithPhone(
          phoneNumber,
          autoUsername,
          verificationCode,
          verificationId,
          undefined  // 不设置密码
        );
        
        if (registerResult.success && registerResult.data) {
          setAuthData(registerResult.data);
          showSuccessToast('注册成功！');
          setTimeout(() => {
            navigation.popToTop();
          }, 500);
        } else {
          Alert.alert('注册失败', registerResult.error?.message || '未知错误');
        }
      } else {
        // 其他错误（如验证码错误等）
        Alert.alert('登录失败', errorMessage || '未知错误');
      }
    } catch (error: any) {
      Alert.alert('操作失败', error.message || '未知错误');
    } finally {
      setIsLoading(false);
    }
  };


  // 渲染标题
  const getTitle = () => {
    return '验证手机号';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {/* 返回按钮 */}
          <BackButton iconType="arrow" onPress={handleClosePress} />

          {/* 主要内容 */}
          <View style={styles.content}>
            {/* 标题 */}
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>
              验证码已发送至 {phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
            </Text>

            {/* 提示文字 */}
            <Text style={styles.hintText}>
              系统将自动识别您的账号，如未注册将自动为您创建账号
            </Text>

            {/* 验证码输入 */}
            <View style={styles.inputContainer}>

              <View style={styles.codeInputWrapper}>
                <TextInput
                  ref={codeInputRef}
                  style={styles.codeInput}
                  placeholder="请输入验证码"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={verificationCode}
                  onChangeText={(text) => setVerificationCode(text.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode" // iOS验证码自动填充
                  autoFocus
                />
              </View>

              <View style={styles.resendContainer}>
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={countdown > 0 || isLoading}
                >
                  <Text style={[
                    styles.resendText,
                    (countdown > 0 || isLoading) && styles.resendTextDisabled
                  ]}>
                    {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送验证码'}
                  </Text>
                </TouchableOpacity>
              </View>

              <GradientButton
                title="确认"
                onPress={handlePhoneVerification}
                disabled={!verificationCode.trim()}
                loading={isLoading}
                variant="primary"
                size="medium"
                fontSize={16}
                borderRadius={22}
                style={styles.submitButton}
              />
            </View>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  innerContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'left',
    marginBottom: 12,
    opacity: 0.8,
    lineHeight: 22,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'left',
    marginBottom: 28,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 40,
    width: '100%',
  },
  codeInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  codeInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: '#999',
  },
  submitButton: {
    marginTop: 8,
    width: '100%',
  },
  securityText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});

export default VerificationCodeScreen;

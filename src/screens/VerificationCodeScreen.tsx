import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthState } from '../hooks/useAuthState';
import { authService, verificationService } from '../services/auth';

type VerificationCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface VerificationCodeScreenProps {
  route: {
    params: {
      phoneNumber: string;
      verificationId: string;
      authMode: 'phone-verify' | 'register';
    };
  };
}

const VerificationCodeScreen: React.FC<VerificationCodeScreenProps> = ({ route }) => {
  const navigation = useNavigation<VerificationCodeScreenNavigationProp>();
  const { setAuthData } = useAuthState();
  
  const { phoneNumber, verificationId, authMode } = route.params;
  
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
      const result = await verificationService.sendPhoneVerification(phoneNumber);
      
      Alert.alert('成功', '验证码已重新发送，请查收');
      
      // 重新开始倒计时
      setCountdown(60);
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '验证码发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录/注册
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
      if (authMode === 'register') {
        // 注册模式 - 使用手机号作为用户名
        const autoUsername = `user_${phoneNumber}`;
        
        const result = await authService.registerWithPhone(
          phoneNumber,
          autoUsername,
          verificationCode,
          verificationId,
          undefined  // 不设置密码
        );
        
        if (result.success && result.data) {
          setAuthData(result.data);
          Alert.alert('成功', '注册成功！', [
            { text: '确定', onPress: () => {
              // 返回到根页面，关闭整个登录流程
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTab' }],
              });
            }}
          ]);
        } else {
          Alert.alert('注册失败', result.error?.message || '未知错误');
        }
      } else {
        // 验证码登录模式
        const result = await authService.loginWithPhone(
          phoneNumber,
          verificationCode,
          verificationId
        );
        
        if (result.success && result.data) {
          setAuthData(result.data);
          Alert.alert('成功', '登录成功！', [
            { text: '确定', onPress: () => {
              // 返回到根页面，关闭整个登录流程
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTab' }],
              });
            }}
          ]);
        } else {
          Alert.alert('登录失败', result.error?.message || '未知错误');
        }
      }
    } catch (error: any) {
      Alert.alert('操作失败', error.message || '未知错误');
    } finally {
      setIsLoading(false);
    }
  };


  // 打开用户协议
  const handleOpenUserAgreement = () => {
    Linking.openURL('https://xuhanpeace.github.io/facegolow-support/user-agreement.html');
  };

  // 打开隐私政策
  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://xuhanpeace.github.io/facegolow-support/privacy-policy.html');
  };

  // 渲染标题
  const getTitle = () => {
    return authMode === 'register' ? '验证手机号' : '验证码登录';
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
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
            <Text style={styles.closeIcon}>←</Text>
          </TouchableOpacity>

          {/* 主要内容 */}
          <View style={styles.content}>
            {/* 标题 */}
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>
              验证码已发送至 {phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
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

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!verificationCode.trim() || isLoading) && styles.submitButtonDisabled
                ]}
                onPress={handlePhoneVerification}
                disabled={!verificationCode.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {authMode === 'register' ? '完成注册' : '登录'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 安全提示 */}
            <Text style={styles.securityText}>
              您的个人信息将受到严格保护
            </Text>
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
    marginBottom: 40,
    opacity: 0.8,
    lineHeight: 22,
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
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch } from '../store/hooks';
import { sendVerificationCode, loginUser, registerUser } from '../store/middleware/asyncMiddleware';

type NewAuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NewAuthScreen: React.FC = () => {
  const navigation = useNavigation<NewAuthScreenNavigationProp>();
  const dispatch = useAppDispatch();
  
  // 状态管理
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // 输入框引用
  const phoneInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClosePress = () => {
    navigation.goBack();
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('手机号格式错误', '请输入正确的11位手机号码');
      return;
    }

    try {
      setIsLoading(true);
      const result = await dispatch(sendVerificationCode({ phone: phoneNumber })).unwrap();
      
      if (result.verification_id) {
        setStep('code');
        setCountdown(60);
        Alert.alert('验证码已发送', '请查看短信并输入验证码');
        // 自动聚焦验证码输入框
        setTimeout(() => {
          codeInputRef.current?.focus();
        }, 100);
      } else {
        Alert.alert('发送失败', '验证码发送失败，请重试');
      }
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '验证码发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('验证码错误', '请输入6位验证码');
      return;
    }

    try {
      setIsLoading(true);
      
      // 先尝试登录
      try {
        const loginResult = await dispatch(loginUser({
          phone: phoneNumber,
          verificationCode,
          verificationId: 'temp_verification_id' // TODO: 从sendVerificationCode返回中获取
        })).unwrap();
        
        if (loginResult.success) {
          setIsNewUser(false);
          Alert.alert('登录成功', '欢迎回来！', [
            { text: '确定', onPress: () => navigation.navigate('NewHome') }
          ]);
          return;
        }
      } catch (loginError) {
        // 登录失败，尝试注册
        console.log('登录失败，尝试注册');
      }

      // 尝试注册
      try {
        const registerResult = await dispatch(registerUser({
          phone: phoneNumber,
          verificationCode,
          verificationId: 'temp_verification_id' // TODO: 从sendVerificationCode返回中获取
        })).unwrap();
        
        if (registerResult.success) {
          setIsNewUser(true);
          Alert.alert('注册成功', '欢迎加入FaceGlow！', [
            { text: '确定', onPress: () => navigation.navigate('NewHome') }
          ]);
          return;
        }
      } catch (registerError: any) {
        Alert.alert('验证失败', registerError.message || '验证码错误，请重试');
      }
    } catch (error: any) {
      Alert.alert('验证失败', error.message || '验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setCountdown(0);
    phoneInputRef.current?.focus();
  };

  const formatPhoneNumber = (text: string) => {
    // 只允许数字，最多11位
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned;
    }
    return cleaned.slice(0, 11);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      {/* 关闭按钮 */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      {/* 主要内容 */}
      <View style={styles.content}>
        {/* 标题 */}
        <Text style={styles.title}>
          {step === 'phone' ? '欢迎使用FaceGlow' : '输入验证码'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone' 
            ? '请输入手机号开始体验AI头像创作' 
            : `验证码已发送至 ${phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`
          }
        </Text>

        {/* 手机号输入步骤 */}
        {step === 'phone' && (
          <View style={styles.inputContainer}>
            <View style={styles.phoneInputWrapper}>
              <Text style={styles.phonePrefix}>+86</Text>
              <TextInput
                ref={phoneInputRef}
                style={styles.phoneInput}
                placeholder="请输入手机号"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={11}
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.sendCodeButton,
                (!validatePhoneNumber(phoneNumber) || isLoading) && styles.sendCodeButtonDisabled
              ]}
              onPress={handleSendCode}
              disabled={!validatePhoneNumber(phoneNumber) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendCodeButtonText}>发送验证码</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 验证码输入步骤 */}
        {step === 'code' && (
          <View style={styles.inputContainer}>
            <View style={styles.codeInputWrapper}>
              <TextInput
                ref={codeInputRef}
                style={styles.codeInput}
                placeholder="请输入6位验证码"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />
            </View>
            
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (countdown > 0 || isLoading) && styles.resendButtonDisabled
                ]}
                onPress={handleSendCode}
                disabled={countdown > 0 || isLoading}
              >
                <Text style={styles.resendButtonText}>
                  {countdown > 0 ? `重新发送(${countdown}s)` : '重新发送'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToPhone}
              >
                <Text style={styles.backButtonText}>返回修改</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 流程说明 */}
        <View style={styles.processContainer}>
          <View style={styles.processStep}>
            <View style={styles.processIcon}>
              <Text style={styles.processIconText}>📱</Text>
            </View>
            <Text style={styles.processText}>手机号验证</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.processIcon}>
              <Text style={styles.processIconText}>🔐</Text>
            </View>
            <Text style={styles.processText}>安全登录</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.processIcon}>
              <Text style={styles.processIconText}>🎨</Text>
            </View>
            <Text style={styles.processText}>开始创作</Text>
          </View>
        </View>

        {/* 安全提示 */}
        <Text style={styles.securityText}>
          您的个人信息将受到严格保护
        </Text>
      </View>

      {/* 底部按钮 */}
      {step === 'code' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (verificationCode.length !== 6 || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleVerifyCode}
            disabled={verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>验证中...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>确认</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    alignItems: 'center',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  phonePrefix: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sendCodeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#666',
  },
  sendCodeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  processContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  processStep: {
    alignItems: 'center',
    flex: 1,
  },
  processIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  processIconText: {
    fontSize: 24,
  },
  processText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  arrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  securityText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewAuthScreen;

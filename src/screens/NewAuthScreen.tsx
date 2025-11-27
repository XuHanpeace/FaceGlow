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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthState } from '../hooks/useAuthState';
import { authService, verificationService } from '../services/auth';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';

type NewAuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type NewAuthScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'NewAuth'>['route'];

type AuthMode = 'phone-verify' | 'password' | 'register';

const NewAuthScreen: React.FC = () => {
  const navigation = useNavigation<NewAuthScreenNavigationProp>();
  const route = useRoute<NewAuthScreenRouteProp>();
  const { setAuthData } = useAuthState();
  
  // 判断初始模式：优先使用路由参数，否则根据是否曾经登录过决定默认模式
  // 曾经登录过 -> 默认手机号登录 (phone-verify)
  // 未登录过 -> 默认注册 (register)
  const getInitialAuthMode = (): AuthMode => {
    // 如果路由参数指定了初始模式，使用参数
    if (route.params?.initialMode) {
      return route.params.initialMode;
    }
    // 否则根据是否曾经登录过决定
    const hasLoggedInBefore = authService.hasLoggedInBefore();
    return hasLoggedInBefore ? 'phone-verify' : 'register';
  };
  
  const [authMode, setAuthMode] = useState<AuthMode>(getInitialAuthMode());
  
  // 表单数据
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 输入框引用
  const phoneInputRef = useRef<TextInput>(null);
  
  const screenWidth = Dimensions.get('window').width;

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 手机号到验证码的转场动画

  const handleClosePress = () => {
    navigation.goBack();
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('手机号格式错误', '请输入正确的11位手机号码');
      return;
    }

    if (countdown > 0) {
      return;
    }

    // 注册模式下检查是否同意用户协议
    if (authMode === 'register' && !agreeToTerms) {
      Alert.alert('提示', '请先同意用户协议');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verificationService.sendPhoneVerification(phoneNumber);
      
      // 导航到验证码输入页面
      navigation.navigate('VerificationCode', {
        phoneNumber: phoneNumber,
        verificationId: result.verification_id,
        authMode: authMode === 'register' ? 'register' : 'phone-verify',
      });
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '验证码发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };


  // 密码登录
  const handlePasswordLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请填写用户名和密码');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.loginWithPassword(username, password);
      
      if (result.success && result.data) {
        setAuthData(result.data);
        // 重置导航栈，关闭整个登录流程
        navigation.popToTop();
      } else {
        Alert.alert('登录失败', result.error?.message || '未知错误');
      }
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '未知错误');
    } finally {
      setIsLoading(false);
    }
  };


  // 切换到注册模式
  const switchToRegister = () => {
    setAuthMode('register');
    setPhoneNumber('');
    setUsername('');
    setPassword('');
    setAgreeToTerms(false);
  };

  // 切换到登录模式
  const switchToLogin = () => {
    setAuthMode('phone-verify');
    setPhoneNumber('');
    setUsername('');
    setPassword('');
    setAgreeToTerms(false);
  };

  // 切换到密码登录
  const switchToPasswordLogin = () => {
    setAuthMode('password');
    setUsername('');
    setPassword('');
  };

  // 切换到验证码登录
  const switchToPhoneVerify = () => {
    setAuthMode('phone-verify');
    setPhoneNumber('');
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 11);
  };

  // 打开用户协议
  const handleOpenUserAgreement = () => {
    navigation.navigate('WebView', {
      url: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
      title: '服务条款',
    });
  };

  // 打开隐私政策
  const handleOpenPrivacyPolicy = () => {
    navigation.navigate('WebView', {
      url: 'https://xuhanpeace.github.io/facegolow-support/privacy-policy.html',
      title: '隐私政策',
    });
  };

  // 渲染标题
  const getTitle = () => {
    if (authMode === 'register') return '欢迎来到美颜换换';
    if (authMode === 'password') return '账号密码登录';
    return '手机号登录';
  };

  const getSubtitle = () => {
    if (authMode === 'password') return '请输入账号密码登录';
    return authMode === 'register' ? '请输入手机号开始体验' : '请输入手机号开始体验';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {/* 关闭按钮 */}
          <BackButton iconType="close" onPress={handleClosePress} />

          {/* 主要内容 */}
          <View style={styles.content}>
        {/* 标题 */}
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {/* 验证码登录/注册模式 */}
        {(authMode === 'phone-verify' || authMode === 'register') && (
          <View style={styles.stepContainer}>
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
                    autoFocus
                  />
                </View>

                <GradientButton
                  title="获取验证码"
                  onPress={handleSendCode}
                  disabled={!validatePhoneNumber(phoneNumber)}
                  loading={isLoading}
                  variant="primary"
                  size="medium"
                  fontSize={16}
                  borderRadius={25}
                  style={styles.sendCodeButton}
                />

                {/* 用户协议勾选 - 仅注册模式显示 */}
                {authMode === 'register' && (
                  <View style={styles.agreementContainer}>
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => setAgreeToTerms(!agreeToTerms)}
                    >
                      <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                        {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.agreementText}>
                        我已阅读并同意
                        <Text style={styles.linkText} onPress={handleOpenUserAgreement}>《美颜换换用户协议》</Text>
                        和
                        <Text style={styles.linkText} onPress={handleOpenPrivacyPolicy}>《美颜换换隐私政策》</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
          </View>
        )}

        {/* 密码登录模式 */}
        {authMode === 'password' && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="用户名"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            
            <TextInput
              style={styles.input}
              placeholder="密码"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <GradientButton
              title="登录"
              onPress={handlePasswordLogin}
              disabled={!username.trim() || !password.trim()}
              loading={isLoading}
              variant="primary"
              size="medium"
              fontSize={16}
              borderRadius={22}
              style={styles.submitButton}
            />
          </View>
        )}

        {/* 底部入口 */}
        <View style={styles.switchContainer}>
          {authMode === 'phone-verify' && (
            <>
              <TouchableOpacity onPress={switchToPasswordLogin}>
                <Text style={styles.switchText}>账号密码登录</Text>
              </TouchableOpacity>
              <Text style={styles.divider}>|</Text>
              <TouchableOpacity onPress={switchToRegister}>
                <Text style={styles.switchText}>没有账号？去注册</Text>
              </TouchableOpacity>
            </>
          )}

          {authMode === 'password' && (
            <>
              <TouchableOpacity onPress={switchToPhoneVerify}>
                <Text style={styles.switchText}>验证码登录</Text>
              </TouchableOpacity>
              <Text style={styles.divider}>|</Text>
              <TouchableOpacity onPress={switchToRegister}>
                <Text style={styles.switchText}>没有账号？去注册</Text>
              </TouchableOpacity>
            </>
          )}

          {authMode === 'register' && (
            <TouchableOpacity onPress={switchToLogin}>
              <Text style={styles.switchText}>已有账号，去登录</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 40,
    opacity: 0.8,
    lineHeight: 22,
  },
  stepContainer: {
    width: '100%',
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
    width: '100%',
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    width: '100%',
  },
  passwordContainer: {
    marginBottom: 20,
  },
  sendCodeButton: {
    marginTop: 8,
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
    width: '100%',
  },
  agreementContainer: {
    marginTop: 20,
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  agreementText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: '#FF6B9D',
    textDecorationLine: 'underline',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
    gap: 12,
  },
  switchText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
  divider: {
    color: '#666',
    fontSize: 14,
  },
  securityText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});

export default NewAuthScreen;

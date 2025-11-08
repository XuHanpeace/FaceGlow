import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { verificationService, authService } from '../services/auth';
import { useAuthState } from '../hooks/useAuthState';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// 判断是否是新设备（从未登录过正式账号）
const isNewDevice = (): boolean => {
  const accessToken = storage.getString('accessToken');
  const isAnonymous = storage.getBoolean('isAnonymous');
  
  // 如果没有token，或者只有匿名token，则认为是新设备
  if (!accessToken || isAnonymous) {
    return true;
  }
  return false;
};

type AuthMode = 'phone-verify' | 'password' | 'register';
type Step = 'phone' | 'code';

export const LoginScreen: React.FC = () => {
  // 判断初始模式：新设备显示注册，老设备显示登录
  const [authMode, setAuthMode] = useState<AuthMode>(isNewDevice() ? 'register' : 'phone-verify');
  const [step, setStep] = useState<Step>('phone');
  
  // 表单数据
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  
  const { setAuthData } = useAuthState();
  const navigation = useNavigation();

  // 手机号到验证码的转场动画
  const animateToCodeStep = () => {
    Animated.spring(slideAnim, {
      toValue: -300,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const animateBackToPhoneStep = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('提示', '请先输入手机号');
      return;
    }

    if (countdown > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await verificationService.sendPhoneVerification(phoneNumber);
      setVerificationId(result.verification_id);
      
      // 转到验证码输入页面
      setStep('code');
      animateToCodeStep();
      
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '发送验证码失败');
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
        // 注册模式
        if (!username.trim()) {
          Alert.alert('提示', '请输入用户名');
          setIsLoading(false);
          return;
        }

        const usernameRegex = /^[a-z][0-9a-z_-]{5,24}$/;
        if (!usernameRegex.test(username)) {
          Alert.alert('提示', '用户名格式不正确，必须以小写字母开头，长度6-25位，只能包含小写字母、数字、下划线和连字符');
          setIsLoading(false);
          return;
        }

        const result = await authService.registerWithPhone(
          phoneNumber,
          username,
          verificationCode,
          verificationId,
          password || undefined
        );
        
        if (result.success && result.data) {
          setAuthData(result.data);
          Alert.alert('成功', '注册成功！', [
            { text: '确定', onPress: () => navigation.goBack() }
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
            { text: '确定', onPress: () => navigation.goBack() }
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
        Alert.alert('成功', '登录成功！', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('登录失败', result.error?.message || '未知错误');
      }
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 匿名登录
  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      const result = await authService.anonymousLogin();
      
      if (result.success && result.data) {
        setAuthData(result.data);
        navigation.goBack();
      } else {
        Alert.alert('登录失败', result.error?.message || '未知错误');
      }
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 返回到手机号输入
  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    animateBackToPhoneStep();
  };

  // 切换到注册模式
  const switchToRegister = () => {
    setAuthMode('register');
    setStep('phone');
    setPhoneNumber('');
    setUsername('');
    setPassword('');
    setVerificationCode('');
    setVerificationId('');
    animateBackToPhoneStep();
  };

  // 切换到登录模式
  const switchToLogin = () => {
    setAuthMode('phone-verify');
    setStep('phone');
    setPhoneNumber('');
    setUsername('');
    setPassword('');
    setVerificationCode('');
    setVerificationId('');
    animateBackToPhoneStep();
  };

  // 切换到密码登录
  const switchToPasswordLogin = () => {
    setAuthMode('password');
    setStep('phone');
    setUsername('');
    setPassword('');
    animateBackToPhoneStep();
  };

  // 切换到验证码登录
  const switchToPhoneVerify = () => {
    setAuthMode('phone-verify');
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    animateBackToPhoneStep();
  };

  // 渲染标题
  const renderTitle = () => {
    if (authMode === 'register') return '手机号注册';
    if (authMode === 'password') return '账号密码登录';
    return '手机号登录';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/icons/home-active.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>美颜换换</Text>
          <Text style={styles.subtitle}>AI智能换脸工具</Text>
        </View>

        {/* 主表单区域 */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{renderTitle()}</Text>

          {/* 验证码登录/注册模式 */}
          {(authMode === 'phone-verify' || authMode === 'register') && (
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
              <View style={styles.slideContainer}>
                {/* 手机号输入页 */}
                <View style={styles.stepContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入手机号"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={11}
                    editable={step === 'phone'}
                  />
                  
                  {authMode === 'register' && step === 'phone' && (
                    <TextInput
                      style={styles.input}
                      placeholder="设置用户名（6-25位，小写字母开头）"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                  
                  {authMode === 'register' && step === 'phone' && (
                    <TextInput
                      style={styles.input}
                      placeholder="设置密码（可选）"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  )}

                  {step === 'phone' && (
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (!phoneNumber.trim() || isLoading) && styles.submitButtonDisabled
                      ]}
                      onPress={handleSendVerificationCode}
                      disabled={!phoneNumber.trim() || isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>获取验证码</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* 验证码输入页 */}
                <View style={styles.stepContainer}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handleBackToPhone}
                  >
                    <Text style={styles.backButtonText}>← 返回修改手机号</Text>
                  </TouchableOpacity>

                  <Text style={styles.phoneHint}>
                    验证码已发送至 {phoneNumber}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="请输入验证码"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode" // iOS验证码自动填充
                    autoFocus={step === 'code'}
                  />

                  <View style={styles.resendContainer}>
                    <TouchableOpacity
                      onPress={handleSendVerificationCode}
                      disabled={countdown > 0}
                    >
                      <Text style={[
                        styles.resendText,
                        countdown > 0 && styles.resendTextDisabled
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
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {authMode === 'register' ? '注册' : '登录'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* 密码登录模式 */}
          {authMode === 'password' && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="用户名"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TextInput
                style={styles.input}
                placeholder="密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!username.trim() || !password.trim() || isLoading) && styles.submitButtonDisabled
                ]}
                onPress={handlePasswordLogin}
                disabled={!username.trim() || !password.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>登录</Text>
                )}
              </TouchableOpacity>
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

        {/* 其他登录方式 */}
        <View style={styles.otherLoginContainer}>
          <Text style={styles.otherLoginTitle}>其他登录方式</Text>
          
          <TouchableOpacity
            style={styles.otherLoginButton}
            onPress={handleAnonymousLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#666" />
            ) : (
              <Text style={styles.otherLoginText}>游客登录</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 底部说明 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            登录即表示同意《用户协议》和《隐私政策》
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 40,
    height: 40,
    tintColor: '#FF6B9D',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  slideContainer: {
    flexDirection: 'row',
    width: 600,
  },
  stepContainer: {
    width: 300,
    paddingRight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#FF6B9D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
  phoneHint: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  switchText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
  divider: {
    color: '#ddd',
    fontSize: 14,
  },
  otherLoginContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  otherLoginTitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  otherLoginButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  otherLoginText: {
    color: '#666',
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});

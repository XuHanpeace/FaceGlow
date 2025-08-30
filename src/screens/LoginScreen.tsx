import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { verificationService, authService } from '../services/auth';
import { useAuthState } from '../hooks/useAuthState';

export const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('15773209147');
  const [username, setUsername] = useState('xh');
  const [password, setPassword] = useState('xh');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState(''); // 保存验证码ID
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // 认证状态管理
  const { setAuthData } = useAuthState();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const navigation = useNavigation();

  const handleWechatLogin = async () => {
    Alert.alert('提示', '微信登录功能待实现');
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('提示', '请先输入手机号');
      return;
    }

    if (countdown > 0) {
      Alert.alert('提示', `请等待${countdown}秒后重试`);
      return;
    }

    setIsLoading(true);
    try {
      // 调用真实的发送验证码API
      const result = await verificationService.sendPhoneVerification(phoneNumber);
      
      // 保存验证码ID
      setVerificationId(result.verification_id);
      
      Alert.alert('成功', '验证码已发送，请查收');
      
      // 开始倒计时（10秒，方便测试）
      setCountdown(10);
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

  // 用户名密码登录
  const handleLogin = async (username: string, password: string): Promise<any> => {
    try {
      setAuthLoading(true);
      const result = await authService.loginWithPassword(username, password);
      
      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: { message: error.message || '登录失败' } };
    } finally {
      setAuthLoading(false);
    }
  };

  // 匿名登录
  const handleAnonymousLogin = async (): Promise<any> => {
    try {
      setAuthLoading(true);
      const result = await authService.anonymousLogin();
      
      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: { message: error.message || '匿名登录失败' } };
    } finally {
      setAuthLoading(false);
    }
  };

  // 清除错误
  const clearAuthError = () => {
    setAuthError('');
  };

  const handlePasswordAuth = async () => {
    if (isRegisterMode) {
      // 注册模式
      if (!phoneNumber || !username || !verificationCode) {
        Alert.alert('提示', '请填写完整信息');
        return;
      }

      if (!verificationId) {
        Alert.alert('提示', '请先发送验证码');
        return;
      }

      // 验证用户名格式
      const usernameRegex = /^$|^[a-z][0-9a-z_-]{5,24}$/;
      if (!usernameRegex.test(username)) {
        Alert.alert('提示', '用户名格式不正确，必须以小写字母开头，长度6-25位，只能包含小写字母、数字、下划线和连字符');
        return;
      }

      setIsLoading(true);
      try {
        // 调用真实的注册API
        const result = await authService.registerWithPhone(phoneNumber, username, verificationCode, verificationId, password);
        
                  if (result.success && result.data) {
            // 更新全局认证状态
            setAuthData(result.data);
            Alert.alert('成功', '注册成功！', [
              { text: '确定', onPress: () => navigation.goBack() }
            ]);
          } else {
          Alert.alert('注册失败', result.error?.message || '未知错误');
        }
      } catch (error: any) {
        Alert.alert('注册失败', error.message || '未知错误');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 登录模式
      if (!username || !password) {
        Alert.alert('提示', '请填写用户名和密码');
        return;
      }

      setIsLoading(true);
      try {
        const result = await handleLogin(username, password);

                  if (result.success && result.data) {
            // 更新全局认证状态
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
    }
  };

  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    if (!showPasswordForm) {
      setPhoneNumber('');
      setUsername('');
      setPassword('');
      setVerificationCode('');
      setVerificationId('');
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setPhoneNumber('');
    setUsername('');
    setPassword('');
    setVerificationCode('');
    setVerificationId('');
    clearAuthError();
  };

  const isFormValid = () => {
    if (isRegisterMode) {
      return phoneNumber && username && verificationCode;
    }
    return username && password;
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
          <Text style={styles.title}>FaceGlow</Text>
          <Text style={styles.subtitle}>AI智能换脸工具</Text>
        </View>

        {/* 错误提示 */}
        {authError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{authError}</Text>
            <TouchableOpacity onPress={clearAuthError} style={styles.clearErrorButton}>
              <Text style={styles.clearErrorText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 密码表单 */}
        {showPasswordForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isRegisterMode ? '手机号注册' : '用户登录'}
            </Text>

            {/* 手机号输入（仅注册模式） */}
            {isRegisterMode && (
              <TextInput
                style={[styles.input, (authError && isRegisterMode) && styles.inputError]}
                placeholder="手机号（+86开头）"
                defaultValue={phoneNumber}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={13}
              />
            )}

            {/* 用户名输入 */}
            <TextInput
              style={[styles.input, (authError && !isRegisterMode) && styles.inputError]}
              placeholder="用户名（6-25位，小写字母开头）"
              defaultValue={username}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* 密码输入 */}
            <TextInput
              style={[styles.input, (authError && !isRegisterMode) && styles.inputError]}
              placeholder="密码（可选）"
              defaultValue={password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* 注册模式验证码 */}
            {isRegisterMode && (
              <View style={styles.verificationContainer}>
                <TextInput
                  style={[styles.input, styles.verificationInput, (authError && isRegisterMode) && styles.inputError]}
                  placeholder="验证码"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[
                    styles.sendCodeButton,
                    (countdown > 0 || isLoading) && styles.sendCodeButtonDisabled
                  ]}
                  onPress={handleSendVerificationCode}
                  disabled={countdown > 0 || isLoading}
                >
                  <Text style={styles.sendCodeText}>
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 提交按钮 */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid() || isLoading || authLoading) && styles.submitButtonDisabled
              ]}
              onPress={handlePasswordAuth}
              disabled={!isFormValid() || isLoading || authLoading}
            >
              {(isLoading || authLoading) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isRegisterMode ? '注册' : '登录'}
                </Text>
              )}
            </TouchableOpacity>

            {/* 切换模式按钮 */}
            <TouchableOpacity style={styles.switchModeButton} onPress={toggleMode}>
              <Text style={styles.switchModeText}>
                {isRegisterMode ? '已有账号？点击登录' : '没有账号？点击注册'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 登录方式选择 */}
        {!showPasswordForm && (
          <View style={styles.loginOptionsContainer}>
            <TouchableOpacity
              style={styles.loginOptionButton}
              onPress={togglePasswordForm}
            >
              <Text style={styles.loginOptionText}>用户名密码登录</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginOptionButton}
              onPress={handleWechatLogin}
            >
              <Text style={styles.loginOptionText}>微信登录</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginOptionButton}
              onPress={handleAnonymousLogin}
              disabled={isLoading || authLoading}
            >
              {isLoading || authLoading ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Text style={styles.loginOptionText}>匿名登录</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 40,
    height: 40,
    tintColor: '#007AFF',
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#c62828',
    flex: 1,
  },
  clearErrorButton: {
    padding: 4,
  },
  clearErrorText: {
    color: '#c62828',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verificationInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
  },
  sendCodeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendCodeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginOptionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginOptionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loginOptionText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
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

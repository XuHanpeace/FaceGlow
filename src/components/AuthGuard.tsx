import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthState } from '../hooks/useAuthState';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

type AuthGuardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 * 在应用初始化时检查登录状态，如果没有登录则自动拉起登录页面
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigation = useNavigation<AuthGuardNavigationProp>();
  const { isLoggedIn, isLoading } = useAuthState();

  useEffect(() => {
    // 当加载完成且未登录时，导航到登录页面
    if (!isLoading && !isLoggedIn) {
      console.log('🔐 检测到未登录状态，自动拉起登录页面');
      // 使用replace而不是navigate，避免用户返回到未登录状态
      navigation.reset({
        index: 0,
        routes: [{ name: 'NewAuth' }],
      });
    }
  }, [isLoading, isLoggedIn, navigation]);

  // 加载中显示加载指示器
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 如果已登录，渲染子组件
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // 未登录时不渲染任何内容（会导航到登录页面）
  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default AuthGuard;

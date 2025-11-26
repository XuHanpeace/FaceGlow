/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, View, StatusBar} from 'react-native';
import { Provider } from 'react-redux';
import ToastProvider from 'toastify-react-native';
import StackNavigator from './src/navigation/StackNavigator';
import CustomToast from './src/components/CustomToast';
import {RootStackParamList} from './src/types/navigation';
import { ModalProvider } from './src/components/modal';
import { store } from './src/store';
import { shareService } from './src/services/shareService';
import { appLifecycleManager } from './src/services/auth/appLifecycleManager';
import { revenueCatService } from './src/services/revenueCat/revenueCatService';
import { authService } from './src/services/auth/authService';
import { loginPromptService } from './src/services/loginPromptService';
import CLOUDBASE_CONFIG from './src/config/cloudbase';
import LoginPromptManager from './src/components/LoginPromptManager';
import { navigationRef } from './src/navigation/navigationUtils';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

function App(): JSX.Element {
  // 初始化应用服务
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 初始化应用生命周期管理器（包括长期认证）
        console.log('🚀 初始化应用生命周期管理器...');
        await appLifecycleManager.initialize();
        console.log('✅ 应用生命周期管理器初始化完成');

        // 初始化登录提示服务
        console.log('🚀 初始化登录提示服务...');
        loginPromptService.initialize();
        console.log('✅ 登录提示服务初始化完成');

        // 初始化 RevenueCat SDK
        try {
          // 获取当前用户 ID（如果有）
          const currentUserId = authService.getCurrentUserId();
          console.log('🔄 初始化 RevenueCat SDK...');
          await revenueCatService.initialize(currentUserId || undefined);
          console.log('✅ RevenueCat SDK 初始化成功');
        } catch (error) {
          console.error('❌ RevenueCat SDK 初始化失败:', error);
          // RevenueCat 初始化失败不影响其他功能
        }

        // 初始化微信SDK
        const { APP_ID, UNIVERSAL_LINK } = CLOUDBASE_CONFIG.WECHAT;
        
        // 如果配置了真实的AppId（不是占位符），则初始化
        if (APP_ID && !APP_ID.includes('your_app_id')) {
          console.log('🔄 初始化微信SDK...');
          const success = await shareService.initWeChat(APP_ID);
          if (success) {
            console.log('✅ 微信SDK初始化成功');
          } else {
            console.warn('⚠️ 微信SDK初始化失败（不影响其他功能）');
          }
        } else {
          console.log('ℹ️ 微信AppId未配置，跳过微信SDK初始化');
        }
      } catch (error) {
        console.error('❌ 应用初始化异常:', error);
      }
    };
    
    initializeApp();

    // 清理函数
    return () => {
      console.log('🛑 应用卸载，停止生命周期管理器...');
      appLifecycleManager.stop();
      loginPromptService.cleanup();
    };
  }, []);
  
  return (
    <Provider store={store}>
      <ModalProvider>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <View style={styles.container}>
          <NavigationContainer ref={navigationRef}>
            <StackNavigator />
          </NavigationContainer>
        </View>
        <ToastProvider
          config={{
            success: (props) => <CustomToast {...props} type="success" />,
            error: (props) => <CustomToast {...props} type="error" />,
            info: (props) => <CustomToast {...props} type="info" />,
            warn: (props) => <CustomToast {...props} type="warn" />,
          }}
          position="top"
          theme="dark"
        />
        <LoginPromptManager />
      </ModalProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default App;

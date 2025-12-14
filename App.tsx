/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { Provider } from 'react-redux';
import ToastProvider from 'toastify-react-native';
import StackNavigator from './src/navigation/StackNavigator';
import CustomToast from './src/components/CustomToast';
import { RootStackParamList } from './src/types/navigation';
import { ModalProvider } from './src/components/modal';
import { store } from './src/store';
import { appLifecycleManager } from './src/services/auth/appLifecycleManager';
import { revenueCatService } from './src/services/revenueCat/revenueCatService';
import { authService } from './src/services/auth/authService';
import { loginPromptService } from './src/services/loginPromptService';
import { aegisService } from './src/services/monitoring/aegisService';
import LoginPromptManager from './src/components/LoginPromptManager';
import AsyncTaskFloatBar from './src/components/AsyncTaskFloatBar';
import AsyncTaskPanel from './src/components/AsyncTaskPanel';
import DebugEntry from './src/components/DebugEntry';
import { navigationRef } from './src/navigation/navigationUtils';

// Pushy 集成
import { Pushy, UpdateProvider } from 'react-native-update';
import _updateConfig from './update.json';
const { appKey } = _updateConfig[Platform.OS as keyof typeof _updateConfig] || {};

// 初始化 Pushy Client
// 开发环境：初始化但不响应版本更新（checkStrategy 和 updateStrategy 设为 null）
// 正式环境：静默更新（启动时和进入前台时都检查，但静默下载和应用）
const pushyClient = new Pushy({
  appKey: appKey, // 如果 appKey 不存在，传 undefined 而不是空字符串
  checkStrategy: __DEV__ ? null : "both", // 开发环境不检查，正式环境启动时和进入前台时都检查
  updateStrategy: __DEV__ ? null : "silentAndLater", // 开发环境不更新，正式环境静默下载和应用
  debug: __DEV__, // 开发环境开启 debug，正式环境关闭
});

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

        // 初始化 Aegis 监控
        try {
          const currentUserId = authService.getCurrentUserId();
          console.log('🚀 初始化 Aegis 监控...');
          aegisService.initialize(currentUserId || undefined);
          console.log('✅ Aegis 监控初始化完成');
        } catch (error) {
          console.error('❌ Aegis 监控初始化失败:', error);
          // Aegis 初始化失败不影响其他功能
        }

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
  
  const AppContent = (
    <Provider store={store}>
      <ModalProvider>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <View style={styles.container}>
          <NavigationContainer 
            ref={navigationRef}
            onStateChange={(state) => {
              // 获取当前路由名称
              const currentRoute = state?.routes[state.index];
              if (currentRoute?.name) {
                // 上报页面访问（使用规范命名：将驼峰命名转为下划线命名）
                const pageName = currentRoute.name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
                aegisService.reportPageView(pageName);
              }
            }}
          >
            <StackNavigator />
          </NavigationContainer>
        </View>
       
        <LoginPromptManager />
        <AsyncTaskFloatBar />
        <AsyncTaskPanel />
        {__DEV__ && (
          <DebugEntry
            onPress={() => {
              navigationRef.current?.navigate('DebugTest' as never);
            }}
          />
        )}
      </ModalProvider>
       <View style={styles.toastContainer} pointerEvents="box-none">
        <ToastProvider
          useModal={false}
          config={{
            success: (props) => <CustomToast {...props} type="success" />,
            error: (props) => <CustomToast {...props} type="error" />,
            info: (props) => <CustomToast {...props} type="info" />,
            warn: (props) => <CustomToast {...props} type="warn" />,
          }}
          position="bottom"
          theme="dark"
          />
       </View>
    </Provider>
  );

  // 始终渲染 UpdateProvider，但在开发环境中传入 null 以禁用功能
  // 这样可以避免 useUpdate hook 报错
  return (
    <UpdateProvider client={pushyClient}>
      {AppContent}
    </UpdateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

export default App;

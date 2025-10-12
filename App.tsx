/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StyleSheet, View, SafeAreaView, StatusBar} from 'react-native';
import { Provider } from 'react-redux';
import StackNavigator from './src/navigation/StackNavigator';
import {RootStackParamList} from './src/types/navigation';
import { ModalProvider } from './src/components/modal';
import { store } from './src/store';
import { shareService } from './src/services/shareService';
import CLOUDBASE_CONFIG from './src/config/cloudbase';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

function App(): JSX.Element {
  // 初始化微信SDK
  useEffect(() => {
    const initWeChatSDK = async () => {
      try {
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
        console.error('❌ 微信SDK初始化异常:', error);
      }
    };
    
    initWeChatSDK();
  }, []);
  
  return (
    <Provider store={store}>
      <ModalProvider>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <View style={styles.container}>
          <NavigationContainer>
            <StackNavigator />
          </NavigationContainer>
        </View>
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

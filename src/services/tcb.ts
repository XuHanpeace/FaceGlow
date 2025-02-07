import cloudbase from '@cloudbase/js-sdk';
import ReactNativeAdapter from '../adapters/react-native-adapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 注册适配器
cloudbase.useAdapters(ReactNativeAdapter);

// 正确初始化（补充缺失的appSecret）
const app = cloudbase.init({
  env: 'your-env-id',
  appSign: 'your-app-sign',
  appSecret: {
    appAccessKeyId: '1', // 凭证版本号
    appAccessKey: 'your-access-key', // 从控制台获取
  },
  persistence: 'local',
});

// 修复3：使用正确的微信登录方法
export const loginWithWechat = async () => {
  const auth = app.auth({persistence: 'local'});
  const provider = auth.weixinAuthProvider({
    appid: 'your-appid',
    scope: 'snsapi_base',
  });
  provider.getRedirectResult().then(loginState => {
    if (loginState) {
      // 登录成功，本地已存在登录态
    } else {
      // 未登录，唤起微信登录
      provider.signInWithRedirect();
    }
  });
};

export const checkLoginStatus = async () => {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('检查登录状态错误:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    const auth = app.auth({persistence: 'local'});
    await auth.signOut();
    await AsyncStorage.removeItem('userInfo');
    return {success: true};
  } catch (error) {
    console.error('登出错误:', error);
    return {success: false, error};
  }
};

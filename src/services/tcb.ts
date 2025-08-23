import { cloudbaseHttpApi, callFunction as httpCallFunction, checkLoginStatus as httpCheckLoginStatus, logout as httpLogout } from './cloudbaseHttpApi';

// 保持原有的导出接口，但内部使用 HTTP API
export const app = {
  // 模拟 app 对象，保持兼容性
  callFunction: httpCallFunction,
};

export const auth = {
  // 模拟 auth 对象，保持兼容性
  anonymousAuthProvider: () => ({
    signIn: async () => {
      const success = await cloudbaseHttpApi.anonymousLogin();
      if (success) {
        return { success: true };
      } else {
        throw new Error('匿名登录失败');
      }
    },
  }),
  signOut: httpLogout,
};

export const doAnonymousLogin = async () => {
  try {
    const success = await cloudbaseHttpApi.anonymousLogin();
    if (success) {
      console.log('匿名登录成功');
      return { success: true };
    } else {
      throw new Error('匿名登录失败');
    }
  } catch (err: any) {
    console.log('login error', err);
    throw err;
  }
};

export const checkLoginStatus = async () => {
  try {
    const isLoggedIn = await httpCheckLoginStatus();
    return isLoggedIn ? { loggedIn: true } : null;
  } catch (error) {
    console.error('检查登录状态错误:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await httpLogout();
    return { success: true };
  } catch (error) {
    console.error('登出错误:', error);
    return { success: false, error };
  }
};

interface GenerateResponse<T> {
  code: number;
  message: string;
  data?: T;
}

interface FusionParams {
  /** 人脸融合活动ID @see https://console.cloud.tencent.com/facefusion/activities*/
  projectId: string;
  /** 人脸融合模型ID 
   * @see https://console.cloud.tencent.com/facefusion/activities/at_1888958525505814528
  */
  modelId: string;
  imageUrl: string;
}

interface FusionResult { 
  FusedImage: string;
}

export const callFusion = async (params: FusionParams): Promise<GenerateResponse<FusionResult>> => {
  try {
    // 调用云函数
    const result = await cloudbaseHttpApi.callFunction<FusionResult>('fusion', params);

    console.log('Generate function response:', result);
    return {
      code: 0,
      message: 'success',
      data: result,
    };
  } catch (error: any) {
    console.error('Generate function error:', error);
    return {
      code: -1,
      message: error.message || '调用失败',
    };
  }
};

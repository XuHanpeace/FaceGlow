import { http } from './http';
import { ApiResponse } from './types';

interface LoginParams {
  phone: string;
  password: string;
}

interface WechatLoginParams {
  code: string;
}

interface LoginResponse {
  token: string;
  userInfo: {
    id: string;
    nickname: string;
    avatar: string;
  };
}

export const loginApi = {
  // 手机号密码登录
  phoneLogin: (params: LoginParams) => {
    return http.post<ApiResponse<LoginResponse>>('/auth/login', params);
  },

  // 微信登录
  wechatLogin: (params: WechatLoginParams) => {
    return http.post<ApiResponse<LoginResponse>>('/auth/wechat/login', params);
  },

  // 退出登录
  logout: () => {
    return http.post('/auth/logout');
  },
}; 
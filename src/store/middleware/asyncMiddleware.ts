import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth/authService';

// 模拟API调用
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 类型定义
interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  phoneNumber: string;
  username: string;
  verificationCode: string;
  verificationId: string;
  password?: string;
}

interface UserProfile {
  id: string;
  username: string;
  phoneNumber?: string;
  avatar?: string;
  balance: number;
  isPremium: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface SelfieItem {
  id: string;
  imageUrl: string;
  createdAt: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  aiGeneratedImages?: string[];
  templateId?: string;
}

export interface Template {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  isPremium: boolean;
  categoryId: string;
  createdAt?: string;
  description?: string;
}

// 1. 用户认证相关异步操作

// 用户登录
export const loginUser = createAsyncThunk<
  { user: UserProfile; token: string },
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.loginWithPassword(credentials.username, credentials.password);
      
      if (result.success && result.data) {
        const user: UserProfile = {
          id: result.data.uid,
          username: credentials.username,
          phoneNumber: '15773209147',
          avatar: undefined,
          balance: 25,
          isPremium: false,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        
        return { user, token: result.data.accessToken };
      } else {
        return rejectWithValue(result.error?.message || '登录失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败');
    }
  }
);

// 用户注册
export const registerUser = createAsyncThunk<
  { user: UserProfile; token: string },
  RegisterCredentials,
  { rejectValue: string }
>(
  'auth/registerUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.registerWithPhone(
        credentials.phoneNumber,
        credentials.username,
        credentials.verificationCode,
        credentials.verificationId,
        credentials.password
      );
      
      if (result.success && result.data) {
        const user: UserProfile = {
          id: result.data.uid,
          username: credentials.username,
          phoneNumber: credentials.phoneNumber,
          avatar: undefined,
          balance: 25,
          isPremium: false,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        
        return { user, token: result.data.accessToken };
      } else {
        return rejectWithValue(result.error?.message || '注册失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败');
    }
  }
);

// 发送验证码
export const sendVerificationCode = createAsyncThunk<
  { verificationId: string },
  { phoneNumber: string },
  { rejectValue: string }
>(
  'auth/sendVerificationCode',
  async ({ phoneNumber }, { rejectWithValue }) => {
    try {
      const result = await authService.sendPhoneVerification(phoneNumber);
      
      if (result.verification_id) {
        return { verificationId: result.verification_id };
      } else {
        return rejectWithValue('发送验证码失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '发送验证码失败');
    }
  }
);

// 用户登出
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || '登出失败');
    }
  }
);

// 2. 用户信息相关异步操作

// 获取用户个人信息
export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  { userId: string },
  { rejectValue: string }
>(
  'user/fetchUserProfile',
  async ({ userId }, { rejectWithValue }) => {
    try {
      // 模拟API调用
      await delay(1000);
      
      // 模拟返回用户信息
      const userProfile: UserProfile = {
        id: userId,
        username: 'User6849a7a2',
        phoneNumber: '15773209147',
        avatar: undefined,
        balance: 25,
        isPremium: false,
        createdAt: '2024-01-01',
        lastLoginAt: new Date().toISOString(),
      };
      
      return userProfile;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败');
    }
  }
);

// 更新用户余额
export const updateUserBalance = createAsyncThunk<
  number,
  { amount: number },
  { rejectValue: string }
>(
  'user/updateUserBalance',
  async ({ amount }, { rejectWithValue }) => {
    try {
      // 模拟API调用
      await delay(500);
      
      return amount;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新余额失败');
    }
  }
);

// 3. 自拍照相关异步操作

// 上传自拍照
export const uploadSelfie = createAsyncThunk<
  SelfieItem,
  { imageData: { uri: string; type: string; name: string } },
  { rejectValue: string }
>(
  'selfies/uploadSelfie',
  async ({ imageData }, { rejectWithValue }) => {
    try {
      // 模拟上传过程
      await delay(2000);
      
      // 模拟上传成功
      const newSelfie: SelfieItem = {
        id: Date.now().toString(),
        imageUrl: imageData.uri,
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      
      return newSelfie;
    } catch (error: any) {
      return rejectWithValue(error.message || '上传失败');
    }
  }
);

// 获取用户自拍照列表
export const fetchUserSelfies = createAsyncThunk<
  SelfieItem[],
  { userId: string },
  { rejectValue: string }
>(
  'selfies/fetchUserSelfies',
  async ({ userId }, { rejectWithValue }) => {
    try {
      // 模拟API调用
      await delay(1000);
      
      // 模拟返回自拍照列表
      const selfies: SelfieItem[] = [
        {
          id: '1',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
          createdAt: '2024-01-15',
          status: 'completed',
        },
        {
          id: '2',
          imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
          createdAt: '2024-01-10',
          status: 'completed',
        },
      ];
      
      return selfies;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取自拍照列表失败');
    }
  }
);

// 删除自拍照
export const deleteSelfie = createAsyncThunk<
  string,
  { selfieId: string },
  { rejectValue: string }
>(
  'selfies/deleteSelfie',
  async ({ selfieId }, { rejectWithValue }) => {
    try {
      // 模拟API调用
      await delay(500);
      
      return selfieId;
    } catch (error: any) {
      return rejectWithValue(error.message || '删除自拍照失败');
    }
  }
);

// 4. 模板相关异步操作

// 获取模板列表
export const fetchTemplates = createAsyncThunk<
  { categoryId: string; templates: Template[] },
  { categoryId: string },
  { rejectValue: string }
>(
  'templates/fetchTemplates',
  async ({ categoryId }, { rejectWithValue }) => {
    try {
      // 模拟API调用
      await delay(1000);
      
      // 模拟返回模板数据
      const templatesData: Record<string, Template[]> = {
        'art-branding': [
          {
            id: 'art-1',
            title: 'Glam AI',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
            likes: 6000,
            isPremium: true,
            categoryId: 'art-branding',
            createdAt: '2024-01-15',
            description: 'Professional glamour style',
          },
          {
            id: 'art-2',
            title: 'Glam AI',
            imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
            likes: 10000,
            isPremium: true,
            categoryId: 'art-branding',
            createdAt: '2024-01-10',
            description: 'Elegant portrait style',
          },
          {
            id: 'art-3',
            title: 'Glam AI',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
            likes: 8500,
            isPremium: true,
            categoryId: 'art-branding',
            createdAt: '2024-01-05',
            description: 'Modern artistic style',
          },
        ],
        'community': [
          {
            id: 'community-1',
            title: 'Product Showcase',
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop',
            likes: 3200,
            isPremium: false,
            categoryId: 'community',
            createdAt: '2024-01-12',
            description: 'Product photography style',
          },
          {
            id: 'community-2',
            title: 'Pet Portrait',
            imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=600&fit=crop',
            likes: 4500,
            isPremium: false,
            categoryId: 'community',
            createdAt: '2024-01-08',
            description: 'Pet photography style',
          },
          {
            id: 'community-3',
            title: 'Lifestyle',
            imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
            likes: 2800,
            isPremium: false,
            categoryId: 'community',
            createdAt: '2024-01-03',
            description: 'Lifestyle photography style',
          },
        ],
      };
      
      return { 
        categoryId, 
        templates: templatesData[categoryId] || [] 
      };
    } catch (error: any) {
      return rejectWithValue(error.message || '获取模板失败');
    }
  }
);

// 点赞模板
export const likeTemplate = createAsyncThunk<
  { templateId: string; newLikesCount: number },
  { templateId: string },
  { rejectValue: string }
>(
  'templates/likeTemplate',
  async ({ templateId }, { rejectWithValue }) => {
    try {
      // 模拟API调用
      await delay(300);
      
      // 模拟返回新的点赞数
      const newLikesCount = Math.floor(Math.random() * 1000) + 1000;
      
      return { templateId, newLikesCount };
    } catch (error: any) {
      return rejectWithValue(error.message || '点赞失败');
    }
  }
);

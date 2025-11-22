import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchUserProfile, updateUserBalance } from '../middleware/asyncMiddleware';
import { User } from '../../types/model/user';

export interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
  default_selfie_url: string | null;
  preferences: {
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
    notifications: boolean;
  };
}

const initialState: UserState = {
  profile: null, // 初始状态为空，等待从API获取真实数据
  loading: false,
  error: null,
  default_selfie_url: null,
  preferences: {
    theme: 'dark',
    language: 'zh',
    notifications: true,
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.balance = action.payload;
      }
    },
    deductBalance: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.balance = Math.max(0, state.profile.balance - action.payload);
      }
    },
    addBalance: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.balance += action.payload;
      }
    },
    setPremium: (state, action: PayloadAction<boolean>) => {
      if (state.profile) {
        state.profile.is_premium = action.payload;
      }
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.preferences.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'zh' | 'en'>) => {
      state.preferences.language = action.payload;
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.preferences.notifications = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.default_selfie_url = null; // 同时清除默认自拍URL
    },
    setDefaultSelfie: (state, action: PayloadAction<string | null>) => {
      state.default_selfie_url = action.payload;
    },
    resetUser: (state) => {
      // 重置所有用户状态为初始值
      state.profile = null;
      state.default_selfie_url = null;
      state.loading = false;
      state.error = null;
      state.preferences = {
        theme: 'dark',
        language: 'zh',
        notifications: true,
      };
    },
  },
  extraReducers: (builder) => {
    // 处理获取用户信息异步操作
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '获取用户信息失败';
      })
      // 处理更新余额异步操作
      .addCase(updateUserBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserBalance.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.balance = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUserBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '更新余额失败';
      });
  },
});

export const {
  setLoading,
  setError,
  setProfile,
  updateProfile,
  updateBalance,
  deductBalance,
  addBalance,
  setPremium,
  updatePreferences,
  setTheme,
  setLanguage,
  setNotifications,
  clearProfile,
  setDefaultSelfie,
  resetUser,
} = userSlice.actions;

export default userSlice.reducer;

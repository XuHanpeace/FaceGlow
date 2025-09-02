import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchUserProfile, updateUserBalance } from '../middleware/asyncMiddleware';

export interface UserProfile {
  id: string;
  username: string;
  phoneNumber?: string;
  avatar?: string;
  balance: number;
  isPremium: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  preferences: {
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
    notifications: boolean;
  };
}

const initialState: UserState = {
  profile: {
    id: 'user-1',
    username: 'processdontkill',
    phoneNumber: '15773209147',
    avatar: undefined,
    balance: 25,
    isPremium: false,
    createdAt: '2024-01-01',
    lastLoginAt: new Date().toISOString(),
  },
  loading: false,
  error: null,
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
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
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
        state.profile.isPremium = action.payload;
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
} = userSlice.actions;

export default userSlice.reducer;

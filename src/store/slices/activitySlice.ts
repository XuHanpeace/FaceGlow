import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Activity, ActivityType, ActivityStatus } from '../../types/model/activity';
import { activityService } from '../../services';

// Activity状态接口
interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: ActivityState = {
  activities: [],
  isLoading: false,
  error: null,
};

// 异步获取活动数据
export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (params?: { page_size?: number; page_number?: number }) => {
    try {
      console.log('🚀 开始获取活动数据...');
      const response = await activityService.getActivities(params);
      console.log('📊 活动数据响应:', response);
      
      if (response.code === 200 && response.data) {
        return response.data;
      } else {
        // 如果API调用失败，返回默认数据
        console.log('⚠️ API调用失败，使用默认数据');
        return [];
      }
    } catch (error) {
      console.error('❌ 获取活动数据失败:', error);
      // 发生错误时返回默认数据
      return [];
    }
  }
);

// Activity Slice
const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // 设置活动数据
    setActivities: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
      state.error = null;
    },
    // 清空活动数据
    clearActivities: (state) => {
      state.activities = [];
      state.error = null;
    },
    // 设置加载状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // 设置错误信息
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchActivities pending
      .addCase(fetchActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log('⏳ 正在获取活动数据...');
      })
      // fetchActivities fulfilled
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload;
        state.error = null;
        console.log('✅ 活动数据获取成功:', action.payload);
      })
      // fetchActivities rejected
      .addCase(fetchActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '获取活动数据失败';
        // 发生错误时使用默认数据
        state.activities = [];
        console.error('❌ 活动数据获取失败:', action.error);
      });
  },
});

// 导出actions
export const { setActivities, clearActivities, setLoading, setError } = activitySlice.actions;

// 导出reducer
export default activitySlice.reducer;

// 导出selectors
export const selectActivities = (state: { activity: ActivityState }) => state.activity.activities;
export const selectActivitiesLoading = (state: { activity: ActivityState }) => state.activity.isLoading;
export const selectActivitiesError = (state: { activity: ActivityState }) => state.activity.error;

// 导出默认数据供其他模块使用

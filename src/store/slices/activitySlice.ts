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

// 默认活动数据
const defaultActivities: Activity[] = [
  {
    activiy_id: 'activity_001',
    activity_type: ActivityType.ALBUM,
    activity_status: ActivityStatus.ACTIVE,
    album_id_list: [
      {
        album_id: 'album_001',
        album_name: '艺术风格相册',
        album_description: '包含多种艺术风格的模板',
        album_image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
        level: '0' as any,
        price: 0,
        template_list: [
          {
            template_id: 'template_001',
            template_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
            template_name: '艺术风格模板1',
            template_description: '经典艺术风格'
          },
          {
            template_id: 'template_002',
            template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
            template_name: '艺术风格模板2',
            template_description: '现代艺术风格'
          }
        ]
      }
    ]
  },
  {
    activiy_id: 'activity_002',
    activity_type: ActivityType.ALBUM,
    activity_status: ActivityStatus.ACTIVE,
    album_id_list: [
      {
        album_id: 'album_002',
        album_name: '社区精选相册',
        album_description: '社区用户喜爱的精选模板',
        album_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
        level: '1' as any,
        price: 1999,
        template_list: [
          {
            template_id: 'template_003',
            template_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
            template_name: '社区精选模板1',
            template_description: '社区热门模板'
          },
          {
            template_id: 'template_004',
            template_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
            template_name: '社区精选模板2',
            template_description: '用户推荐模板'
          }
        ]
      }
    ]
  }
];

// 异步获取活动数据
export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (params?: { pageSize?: number; pageNumber?: number }) => {
    try {
      console.log('🚀 开始获取活动数据...');
      const response = await activityService.getActivities(params);
      console.log('📊 活动数据响应:', response);
      
      if (response.code === 200 && response.data) {
        return response.data;
      } else {
        // 如果API调用失败，返回默认数据
        console.log('⚠️ API调用失败，使用默认数据');
        return defaultActivities;
      }
    } catch (error) {
      console.error('❌ 获取活动数据失败:', error);
      // 发生错误时返回默认数据
      return defaultActivities;
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
        state.activities = defaultActivities;
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
export { defaultActivities };

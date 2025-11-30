import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Activity, ActivityType, ActivityStatus, Album } from '../../types/model/activity';
import { activityService } from '../../services';

// 扩展 Album 类型，包含 activityId
export interface AlbumWithActivityId extends Album {
  activityId: string;
}

// Activity状态接口
interface ActivityState {
  activities: Activity[];
  allAlbums: AlbumWithActivityId[];
  isLoading: boolean;
  error: string | null;
}

// 辅助函数：从 activities 计算 allAlbums
const computeAllAlbums = (activities: Activity[]): AlbumWithActivityId[] => {
  if (!activities || activities.length === 0) {
    return [];
  }
  
  const albums: AlbumWithActivityId[] = [];
  activities.forEach(activity => {
    // 兼容 activity_id 和 activiy_id (以防拼写错误被修正或混用)
    const actId = (activity as any).activity_id || activity.activiy_id;
    
    if (activity.activity_type === ActivityType.ASYNC_TASK && activity.promptData) {
      // 如果是 asyncTask，也构建一个 Album 加入列表
      albums.push({
        album_id: actId,
        album_name: activity.promptData.styleTitle || activity.activity_title,
        album_description: activity.promptData.styleDesc || '',
        album_image: activity.promptData.resultImage || '',
        level: '0', // default
        price: 0,
        template_list: [],
        activityId: actId,
        srcImage: activity.promptData.srcImage
      } as AlbumWithActivityId);
    } else if (activity.album_id_list) {
      activity.album_id_list.forEach(album => {
        albums.push({
          ...album,
          activityId: actId
        });
      });
    }
  });
  
  return albums;
};

// 初始状态
const initialState: ActivityState = {
  activities: [],
  allAlbums: [],
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
      state.allAlbums = [];
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
        // 自动计算 allAlbums
        state.allAlbums = computeAllAlbums(action.payload);
        state.error = null;
        console.log('✅ 活动数据获取成功:', action.payload);
        console.log('✅ allAlbums 已计算:', state.allAlbums.length, '个相册');
      })
      // fetchActivities rejected
      .addCase(fetchActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '获取活动数据失败';
        // 发生错误时使用默认数据
        state.activities = [];
        state.allAlbums = [];
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
export const selectAllAlbums = (state: { activity: ActivityState }) => state.activity.allAlbums;
export const selectActivitiesLoading = (state: { activity: ActivityState }) => state.activity.isLoading;
export const selectActivitiesError = (state: { activity: ActivityState }) => state.activity.error;

// 导出默认数据供其他模块使用

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userWorkService, QueryUserWorksRequest } from '../../services/database/userWorkService';
import { UserWorkModel } from '../../types/model/user_works';

interface UserWorksState {
  works: UserWorkModel[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  hasMore: boolean;
}

const initialState: UserWorksState = {
  works: [],
  status: 'idle',
  error: null,
  hasMore: true,
};

// Fetch user works
export const fetchUserWorks = createAsyncThunk(
  'userWorks/fetchUserWorks',
  async (params: QueryUserWorksRequest, { rejectWithValue }) => {
    try {
      const response = await userWorkService.getUserWorks(params);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.error);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const userWorksSlice = createSlice({
  name: 'userWorks',
  initialState,
  reducers: {
    resetUserWorks: (state) => {
      state.works = [];
      state.status = 'idle';
      state.hasMore = true;
    },
    updateWorkItem: (state, action: PayloadAction<UserWorkModel>) => {
        const updatedWork = action.payload;
        
        // 确保 taskStatus 字段正确设置（优先使用顶层字段，否则从 ext_data 中提取）
        let finalTaskStatus = updatedWork.taskStatus;
        if (!finalTaskStatus && updatedWork.ext_data) {
          try {
            const extData = JSON.parse(updatedWork.ext_data);
            if (extData.task_status) {
              finalTaskStatus = extData.task_status;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
        
        // 创建更新后的作品对象，确保包含 taskStatus
        const workToUpdate = {
          ...updatedWork,
          taskStatus: finalTaskStatus || updatedWork.taskStatus
        };
        
        const index = state.works.findIndex(w => w._id === workToUpdate._id);
        if (index !== -1) {
            // 完全替换，确保所有字段都更新
            state.works[index] = workToUpdate;
        } else {
            // Optional: Add if not exists (e.g. new creation)
            state.works.unshift(workToUpdate);
        }
        
        // Re-sort after update
        state.works.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
    },
    removeWork: (state, action: PayloadAction<string>) => {
        // 根据作品ID从列表中移除
        state.works = state.works.filter(w => w._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserWorks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserWorks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payload = action.payload as any;
        
        let list: UserWorkModel[] = [];
        
        if (Array.isArray(payload)) {
            list = payload;
        } else if (payload && Array.isArray(payload.records)) {
            // TCB list query returns { records: [...] }
            list = payload.records;
        } else if (payload && payload.data && Array.isArray(payload.data)) {
            list = payload.data;
        } else if (payload && payload.data && Array.isArray(payload.data.records)) {
            list = payload.data.records;
        }
        
        // 确保每个作品都有正确的 taskStatus 字段（从 ext_data 中提取）
        list.forEach(work => {
          if (!work.taskStatus && work.ext_data) {
            try {
              const extData = JSON.parse(work.ext_data);
              if (extData.task_status) {
                work.taskStatus = extData.task_status;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        });
        
        // Force sort by createdAt desc
        list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
        
        // 智能合并：保留现有列表中不在新列表中的作品（可能是分页导致的新作品）
        // 这样可以避免因为分页限制（只返回前20个）而丢失新创建的作品
        const existingWorksMap = new Map<string, UserWorkModel>();
        state.works.forEach(work => {
          if (work._id) {
            existingWorksMap.set(work._id, work);
          }
        });
        
        // 合并新列表和现有列表
        const mergedWorks: UserWorkModel[] = [];
        const newWorksIds = new Set<string>();
        
        // 先添加新列表中的作品（这些是最新的，按时间排序）
        list.forEach(work => {
          if (work._id) {
            newWorksIds.add(work._id);
            mergedWorks.push(work);
          }
        });
        
        // 再添加现有列表中不在新列表中的作品（可能是分页导致的新作品）
        existingWorksMap.forEach((work, workId) => {
          if (!newWorksIds.has(workId)) {
            mergedWorks.push(work);
          }
        });
        
        // 重新排序（按创建时间倒序）
        mergedWorks.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        
        state.works = mergedWorks;
      })
      .addCase(fetchUserWorks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { resetUserWorks, updateWorkItem, removeWork } = userWorksSlice.actions;
export default userWorksSlice.reducer;

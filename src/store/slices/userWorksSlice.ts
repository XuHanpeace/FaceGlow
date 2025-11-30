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
        const index = state.works.findIndex(w => w._id === updatedWork._id);
        if (index !== -1) {
            state.works[index] = updatedWork;
        } else {
            // Optional: Add if not exists (e.g. new creation)
            state.works.unshift(updatedWork);
        }
        
        // Re-sort after update
        state.works.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
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
        
        // Force sort by createdAt desc
        list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
        
        state.works = list;
      })
      .addCase(fetchUserWorks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { resetUserWorks, updateWorkItem } = userWorksSlice.actions;
export default userWorksSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { uploadSelfie, fetchUserSelfies, deleteSelfie as deleteSelfieAsync } from '../middleware/asyncMiddleware';

export interface SelfieItem {
  id: string;
  imageUrl: string;
  createdAt: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  aiGeneratedImages?: string[];
  templateId?: string;
}

export interface SelfieState {
  selfies: SelfieItem[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadProgress: number;
}

const initialState: SelfieState = {
  selfies: [
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
  ],
  loading: false,
  error: null,
  uploading: false,
  uploadProgress: 0,
};

const selfieSlice = createSlice({
  name: 'selfies',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    addSelfie: (state, action: PayloadAction<SelfieItem>) => {
      state.selfies.unshift(action.payload);
    },
    updateSelfie: (state, action: PayloadAction<{ id: string; updates: Partial<SelfieItem> }>) => {
      const { id, updates } = action.payload;
      const selfie = state.selfies.find(s => s.id === id);
      if (selfie) {
        Object.assign(selfie, updates);
      }
    },
    deleteSelfie: (state, action: PayloadAction<string>) => {
      state.selfies = state.selfies.filter(selfie => selfie.id !== action.payload);
    },
    setSelfieStatus: (state, action: PayloadAction<{ id: string; status: SelfieItem['status'] }>) => {
      const { id, status } = action.payload;
      const selfie = state.selfies.find(s => s.id === id);
      if (selfie) {
        selfie.status = status;
      }
    },
    setSelfieProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const { id, progress } = action.payload;
      const selfie = state.selfies.find(s => s.id === id);
      if (selfie) {
        selfie.progress = progress;
      }
    },
    addAiGeneratedImage: (state, action: PayloadAction<{ id: string; imageUrl: string }>) => {
      const { id, imageUrl } = action.payload;
      const selfie = state.selfies.find(s => s.id === id);
      if (selfie) {
        if (!selfie.aiGeneratedImages) {
          selfie.aiGeneratedImages = [];
        }
        selfie.aiGeneratedImages.push(imageUrl);
      }
    },
    clearUploadState: (state) => {
      state.uploading = false;
      state.uploadProgress = 0;
      state.error = null;
    },
    clearAllSelfies: (state) => {
      state.selfies = [];
      state.loading = false;
      state.error = null;
      state.uploading = false;
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    // 处理上传自拍照异步操作
    builder
      .addCase(uploadSelfie.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadSelfie.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.selfies.unshift(action.payload);
        state.error = null;
      })
      .addCase(uploadSelfie.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload || '上传失败';
      })
      // 处理获取用户自拍照列表异步操作
      .addCase(fetchUserSelfies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSelfies.fulfilled, (state, action) => {
        state.loading = false;
        state.selfies = action.payload;
        state.error = null;
      })
      .addCase(fetchUserSelfies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '获取自拍照列表失败';
      })
      // 处理删除自拍照异步操作
      .addCase(deleteSelfieAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSelfieAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selfies = state.selfies.filter(selfie => selfie.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteSelfieAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '删除自拍照失败';
      });
  },
});

export const {
  setLoading,
  setError,
  setUploading,
  setUploadProgress,
  addSelfie,
  updateSelfie,
  deleteSelfie,
  setSelfieStatus,
  setSelfieProgress,
  addAiGeneratedImage,
  clearUploadState,
  clearAllSelfies,
} = selfieSlice.actions;

export default selfieSlice.reducer;

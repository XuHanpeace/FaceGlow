import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTemplates, likeTemplate as likeTemplateAsync } from '../middleware/asyncMiddleware';

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

export interface TemplateState {
  templates: Record<string, Template[]>;
  loading: boolean;
  error: string | null;
  selectedTemplate: Template | null;
}

const initialState: TemplateState = {
  templates: {
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
  },
  loading: false,
  error: null,
  selectedTemplate: null,
};

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTemplates: (state, action: PayloadAction<{ categoryId: string; templates: Template[] }>) => {
      state.templates[action.payload.categoryId] = action.payload.templates;
    },
    addTemplate: (state, action: PayloadAction<Template>) => {
      const categoryId = action.payload.categoryId;
      if (!state.templates[categoryId]) {
        state.templates[categoryId] = [];
      }
      state.templates[categoryId].push(action.payload);
    },
    updateTemplate: (state, action: PayloadAction<{ id: string; updates: Partial<Template> }>) => {
      const { id, updates } = action.payload;
      Object.values(state.templates).forEach(templates => {
        const template = templates.find(t => t.id === id);
        if (template) {
          Object.assign(template, updates);
        }
      });
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      const templateId = action.payload;
      Object.keys(state.templates).forEach(categoryId => {
        state.templates[categoryId] = state.templates[categoryId].filter(
          template => template.id !== templateId
        );
      });
    },
    setSelectedTemplate: (state, action: PayloadAction<Template | null>) => {
      state.selectedTemplate = action.payload;
    },
    likeTemplate: (state, action: PayloadAction<string>) => {
      const templateId = action.payload;
      Object.values(state.templates).forEach(templates => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          template.likes += 1;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // 处理获取模板列表异步操作
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates[action.payload.categoryId] = action.payload.templates;
        state.error = null;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '获取模板失败';
      })
      // 处理点赞模板异步操作
      .addCase(likeTemplateAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likeTemplateAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { templateId, newLikesCount } = action.payload;
        Object.values(state.templates).forEach(templates => {
          const template = templates.find(t => t.id === templateId);
          if (template) {
            template.likes = newLikesCount;
          }
        });
        state.error = null;
      })
      .addCase(likeTemplateAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '点赞失败';
      });
  },
});

export const {
  setLoading,
  setError,
  setTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  setSelectedTemplate,
  likeTemplate,
} = templateSlice.actions;

export default templateSlice.reducer;

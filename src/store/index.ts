import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import activitySlice from './slices/activitySlice';
import selfieSlice from './slices/selfieSlice';
import userSlice from './slices/userSlice';
import asyncTaskSlice from './slices/asyncTaskSlice';
import userWorksSlice from './slices/userWorksSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    activity: activitySlice,
    selfies: selfieSlice,
    user: userSlice,
    asyncTask: asyncTaskSlice,
    userWorks: userWorksSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

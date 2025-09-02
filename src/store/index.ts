import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import templateSlice from './slices/templateSlice';
import selfieSlice from './slices/selfieSlice';
import userSlice from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    templates: templateSlice,
    selfies: selfieSlice,
    user: userSlice,
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

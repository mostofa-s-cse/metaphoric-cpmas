/**
 * CPMAS — Redux Store
 * Central store combining all slices and RTK Query middleware.
 */
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { cpmasApi } from './api/cpmasApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [cpmasApi.reducerPath]: cpmasApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cpmasApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable automatic refetch on focus/reconnect (RTK Query)
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * CPMAS — UI Slice
 * Global UI state: toasts, sidebar collapse, modals, etc.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  sidebarCollapsed: boolean;
  globalLoading: boolean;
}

const initialState: UIState = {
  toasts: [],
  sidebarCollapsed: false,
  globalLoading: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
  },
  selectors: {
    selectToasts: (state) => state.toasts,
    selectSidebarCollapsed: (state) => state.sidebarCollapsed,
    selectGlobalLoading: (state) => state.globalLoading,
  },
});

export const { addToast, removeToast, clearToasts, setSidebarCollapsed, setGlobalLoading } =
  uiSlice.actions;
export const { selectToasts, selectSidebarCollapsed, selectGlobalLoading } = uiSlice.selectors;
export default uiSlice.reducer;

/**
 * CPMAS — Auth Slice
 * Manages the authenticated user state globally.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'PROJECT_MANAGER'
  | 'DATA_ENTRY_OPERATOR';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean; // true once the /api/auth/me check is done
}

const initialState: AuthState = {
  user: null,
  loading: true,
  initialized: false,
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  ACCOUNTANT: 2,
  PROJECT_MANAGER: 1,
  DATA_ENTRY_OPERATOR: 0,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.initialized = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.initialized = true;
    },
  },
  selectors: {
    selectUser: (state) => state.user,
    selectLoading: (state) => state.loading,
    selectInitialized: (state) => state.initialized,
    selectRole: (state) => state.user?.role ?? null,
    selectHasPermission: (state) => (requiredRole: UserRole) => {
      if (!state.user) return false;
      return ROLE_HIERARCHY[state.user.role] >= ROLE_HIERARCHY[requiredRole];
    },
  },
});

export const { setUser, setLoading, clearUser } = authSlice.actions;
export const { selectUser, selectLoading, selectInitialized, selectRole, selectHasPermission } =
  authSlice.selectors;
export default authSlice.reducer;

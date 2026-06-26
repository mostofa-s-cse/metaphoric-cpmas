'use client';

/**
 * CPMAS — useAuth Hook
 * Drop-in replacement for the old AuthContext useAuth().
 * Now powered by Redux Toolkit instead of React Context.
 */
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectUser,
  selectLoading,
  selectInitialized,
  setUser,
  clearUser,
  AuthUser,
  UserRole,
} from '@/store/slices/authSlice';
import { useLoginMutation, useLogoutMutation } from '@/store/api/cpmasApi';
import { addToast } from '@/store/slices/uiSlice';
import { cpmasApi } from '@/store/api/cpmasApi';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  ACCOUNTANT: 2,
  PROJECT_MANAGER: 1,
  DATA_ENTRY_OPERATOR: 0,
};

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoading);
  const initialized = useAppSelector(selectInitialized);

  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(setUser(result.user));
      dispatch(addToast({ message: `Welcome back, ${result.user.fullName}!`, variant: 'success' }));
      router.push('/dashboard');
      return { success: true };
    } catch (err: any) {
      const message = err?.data?.error || 'Authentication failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(clearUser());
      // Reset all RTK Query cache on logout
      dispatch(cpmasApi.util.resetApiState());
      router.push('/login');
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  };

  return {
    user,
    loading,
    initialized,
    isLoggingIn,
    isLoggingOut,
    login,
    logout,
    hasPermission,
  };
}

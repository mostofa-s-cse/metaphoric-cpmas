'use client';

/**
 * Backward-compatible bridge to route the old AuthContext imports
 * to the new Redux-powered hooks and providers.
 */
export { useAuth } from '@/hooks/useAuth';
export { StoreProvider as AuthProvider } from '@/store/StoreProvider';
export type { AuthUser as User } from '@/store/slices/authSlice';

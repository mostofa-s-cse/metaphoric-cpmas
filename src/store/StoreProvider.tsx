'use client';

/**
 * CPMAS — Redux Store Provider
 * Wraps the app with the Redux Provider. Must be a Client Component.
 */
import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useGetMeQuery } from '@/store/api/cpmasApi';
import { setUser, clearUser } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Inner bootstrap component that fetches /api/auth/me on mount
 * and seeds the auth slice — replaces the old AuthContext useEffect.
 */
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  const isLoginPage = pathname?.includes('/login');
  const isDashboardPage = pathname?.startsWith('/dashboard');

  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    skip: isLoginPage, // Skip API call entirely on login page
  });

  useEffect(() => {
    if (isLoginPage) {
      dispatch(clearUser());
      return;
    }

    if (!isLoading) {
      if (data?.user) {
        dispatch(setUser(data.user));
      } else if (isError) {
        dispatch(clearUser());
        if (isDashboardPage) {
          router.push('/login');
        }
      } else {
        dispatch(clearUser());
      }
    }
  }, [data, isLoading, isError, dispatch, isLoginPage, isDashboardPage, router]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}

'use client';

/**
 * CPMAS — useToast Hook
 * Convenience hook to dispatch toast notifications via Redux UI slice.
 */
import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addToast, ToastVariant } from '@/store/slices/uiSlice';

export function useToast() {
  const dispatch = useAppDispatch();

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration?: number) => {
      dispatch(addToast({ message, variant, duration }));
    },
    [dispatch]
  );

  const success = useCallback(
    (message: string, duration?: number) => toast(message, 'success', duration),
    [toast]
  );

  const error = useCallback(
    (message: string, duration?: number) => toast(message, 'error', duration),
    [toast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => toast(message, 'warning', duration),
    [toast]
  );

  const info = useCallback(
    (message: string, duration?: number) => toast(message, 'info', duration),
    [toast]
  );

  return { toast, success, error, warning, info };
}

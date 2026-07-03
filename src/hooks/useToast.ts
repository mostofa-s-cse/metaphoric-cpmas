'use client';

/**
 * CPMAS — useToast Hook
 * Convenience hook to dispatch toast notifications via Redux UI slice.
 * Includes advanced handlers to automatically resolve API promises and toast dynamic messages.
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

  /**
   * Automatically handles an API response promise,
   * showing success or error messages dynamically.
   */
  const handlePromise = useCallback(
    async <T>(
      promise: Promise<T>,
      options?: {
        successMessage?: string | ((res: T) => string);
        errorMessage?: string | ((err: any) => string);
      }
    ): Promise<T> => {
      try {
        const res = await promise;
        // Extract the envelope success message if attached
        const envelopeMsg = (res as any)?._envelopeMessage;
        const msg =
          typeof options?.successMessage === 'function'
            ? options.successMessage(res)
            : options?.successMessage || envelopeMsg || 'Operation successful';
        success(msg);
        return res;
      } catch (err: any) {
        // Extract the envelope or network error message
        const errorMsg =
          err?.data?.error ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          'An unexpected error occurred';
        const msg =
          typeof options?.errorMessage === 'function'
            ? options.errorMessage(err)
            : options?.errorMessage || errorMsg;
        error(msg);
        throw err;
      }
    },
    [success, error]
  );

  return { toast, success, error, warning, info, handlePromise };
}

'use client';

/**
 * AlertDialog — for dangerous actions like delete (shadcn Alert Dialog style).
 *
 * Usage:
 *   <AlertDialog
 *     open={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     onConfirm={handleDelete}
 *     title="Are you absolutely sure?"
 *     description="This action cannot be undone. This will permanently delete the item."
 *     confirmText="Delete"
 *     isConfirming={isDeleting}
 *   />
 */

import React, { useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  isConfirming = false,
}: AlertDialogProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConfirming) onClose();
    },
    [onClose, isConfirming]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="alertdialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !isConfirming && onClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mt-0.5 border border-rose-500/20">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{title}</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-sm font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Wait...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

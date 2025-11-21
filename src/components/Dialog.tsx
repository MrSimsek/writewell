'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: DialogProps) {
  const { theme } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/60' : 'bg-black/40'}`}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative z-50 w-full max-w-md mx-4 rounded-lg shadow-xl ${
          theme === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-zinc-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3
            className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm mb-6 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600'
                  : 'text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200'
              }`}
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                variant === 'danger'
                  ? theme === 'dark'
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                  : theme === 'dark'
                  ? 'bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-zinc-100'
                  : 'bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


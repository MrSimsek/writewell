'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Dialog from '@/components/Dialog';

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogOptions & { isOpen: boolean } | null>(null);

  const showDialog = useCallback((options: DialogOptions) => {
    setDialogState({ ...options, isOpen: true });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      {dialogState && (
        <Dialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          onConfirm={dialogState.onConfirm}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          variant={dialogState.variant}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}


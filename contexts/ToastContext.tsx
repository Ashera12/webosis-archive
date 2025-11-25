'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '@/components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

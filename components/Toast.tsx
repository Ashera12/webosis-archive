'use client';

import React, { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    success: 'fa-check-circle',
    error: 'fa-times-circle'
  };

  const colors = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    success: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <div className="fixed top-24 right-4 z-[9999] animate-slideInRight">
      <div className={`${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[300px] max-w-md`}>
        <i className={`fas ${icons[type]} text-2xl`}></i>
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;

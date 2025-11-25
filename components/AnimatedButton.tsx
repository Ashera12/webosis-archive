'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/hooks/useTranslation';

interface AnimatedButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  href,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-yellow-400/30 overflow-hidden group';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:from-yellow-500 hover:to-amber-600 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 backdrop-blur-sm',
    ghost: 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) return;

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    if (href) {
      // Check if href is empty or just "#"
      if (!href || href === '#' || href === '') {
        e.preventDefault();
        showToast(t('toast.linkNotActive'), 'warning');
        return;
      }
      e.preventDefault();
      router.push(href);
    } else if (onClick) {
      onClick();
    } else {
      // No href and no onClick - show notification
      showToast(t('toast.linkNotActive'), 'warning');
    }
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
    ${isPressed ? 'scale-95' : ''}
    ${className}
  `;

  const ButtonContent = () => (
    <>
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Ripple Effect */}
      <div className="absolute inset-0 bg-yellow-400/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-300" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center space-x-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </span>
      
      {/* Glow Effect */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/50 to-amber-500/50 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      )}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={buttonClasses}
      >
        <ButtonContent />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      <ButtonContent />
    </button>
  );
};

export default AnimatedButton;
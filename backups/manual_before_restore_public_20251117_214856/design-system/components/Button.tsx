"use client";
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export default function DSButton({ variant = 'primary', className = '', children, ...rest }: Props) {
  const base = 'ds-btn';
  const v = variant === 'primary' ? '' : 'bg-white text-gray-800';
  return (
    <button className={`${base} ${v} ${className}`} {...rest}>
      {children}
    </button>
  );
}

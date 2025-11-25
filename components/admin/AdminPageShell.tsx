"use client";
import React from 'react';

// Simple classnames utility
const clsx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface AdminPageShellProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  gradient?: string; // tailwind gradient classes e.g. from-indigo-600 to-violet-600
  children: React.ReactNode;
  padded?: boolean;
}

// Reusable shell providing consistent header + container spacing.
export default function AdminPageShell({
  icon,
  title,
  subtitle,
  actions,
  gradient = 'from-indigo-600 to-violet-600',
  children,
  padded = true
}: AdminPageShellProps) {
  return (
    <div className={clsx('min-h-screen', padded && 'pb-8')}>      
      <div className={clsx('rounded-2xl shadow-xl p-8 mb-8 text-white bg-gradient-to-r', gradient)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            {icon && (
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold leading-tight">{title}</h1>
              {subtitle && <p className="text-indigo-100 mt-1 max-w-2xl text-sm md:text-base">{subtitle}</p>}
            </div>
          </div>
          {actions && (
            <div className="flex items-center flex-wrap gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

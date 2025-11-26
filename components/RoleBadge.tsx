























++++++++++++

+++++++
















+










































































































































"use client";

import { FaCrown, FaShield, FaUserShield, FaStar, FaChalkboardTeacher, FaUser } from 'react-icons/fa';

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'osis' | 'guru' | 'siswa' | 'other' | string;

interface RoleBadgeProps {
  role?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const roleConfig: Record<string, { 
  label: string; 
  icon: typeof FaCrown; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  super_admin: {
    label: 'Super Admin',
    icon: FaCrown,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-600',
  },
  admin: {
    label: 'Admin',
    icon: FaShield,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-600',
  },
  moderator: {
    label: 'Moderator',
    icon: FaUserShield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-600',
  },
  osis: {
    label: 'OSIS',
    icon: FaStar,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-600',
  },
  guru: {
    label: 'Guru',
    icon: FaChalkboardTeacher,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-600',
  },
  siswa: {
    label: 'Siswa',
    icon: FaUser,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
};

export default function RoleBadge({ role, size = 'sm', showLabel = true, className = '' }: RoleBadgeProps) {
  if (!role) return null;

  // Normalize role
  const normalizedRole = role.trim().toLowerCase();
  
  // Check for keyword matching
  let config = roleConfig[normalizedRole];
  
  if (!config) {
    // Keyword matching for flexibility
    if (normalizedRole.includes('super') || normalizedRole.includes('superadmin')) {
      config = roleConfig.super_admin;
    } else if (normalizedRole.includes('admin')) {
      config = roleConfig.admin;
    } else if (normalizedRole.includes('moderator') || normalizedRole.includes('mod')) {
      config = roleConfig.moderator;
    } else if (normalizedRole.includes('osis')) {
      config = roleConfig.osis;
    } else if (normalizedRole.includes('guru') || normalizedRole.includes('teacher')) {
      config = roleConfig.guru;
    } else if (normalizedRole.includes('siswa') || normalizedRole.includes('student')) {
      config = roleConfig.siswa;
    } else {
      // Don't show badge for 'other' or unknown roles
      return null;
    }
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-semibold
        ${sizeClasses[size]}
        ${config.color}
        ${config.bgColor}
        ${config.borderColor}
        ${className}
      `}
      title={config.label}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span className="whitespace-nowrap">{config.label}</span>}
    </span>
  );
}

// Export helper to check if role should show badge
export function shouldShowRoleBadge(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return (
    normalized in roleConfig ||
    normalized.includes('admin') ||
    normalized.includes('super') ||
    normalized.includes('moderator') ||
    normalized.includes('mod') ||
    normalized.includes('osis') ||
    normalized.includes('guru') ||
    normalized.includes('teacher')
  );
}

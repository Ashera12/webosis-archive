"use client";

import { FaCrown, FaShieldAlt, FaUserShield, FaStar, FaChalkboardTeacher, FaUser, FaGraduationCap } from 'react-icons/fa';

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'osis' | 'guru' | 'siswa' | 'other' | string;

interface RoleBadgeProps {
  role?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  showGlow?: boolean;
}

const roleConfig: Record<string, { 
  label: string; 
  icon: typeof FaCrown; 
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  shadow: string;
}> = {
  super_admin: {
    label: 'Super Admin',
    icon: FaCrown,
    color: 'text-yellow-600 dark:text-yellow-300',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/20',
    borderColor: 'border-yellow-400 dark:border-yellow-500',
    gradient: 'from-yellow-400 to-amber-500',
    shadow: 'shadow-lg shadow-yellow-500/50 dark:shadow-yellow-400/30',
  },
  admin: {
    label: 'Admin',
    icon: FaShieldAlt,
    color: 'text-red-600 dark:text-red-300',
    bgColor: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20',
    borderColor: 'border-red-400 dark:border-red-500',
    gradient: 'from-red-500 to-rose-600',
    shadow: 'shadow-lg shadow-red-500/50 dark:shadow-red-400/30',
  },
  moderator: {
    label: 'Moderator',
    icon: FaUserShield,
    color: 'text-blue-600 dark:text-blue-300',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/20',
    borderColor: 'border-blue-400 dark:border-blue-500',
    gradient: 'from-blue-500 to-cyan-600',
    shadow: 'shadow-lg shadow-blue-500/50 dark:shadow-blue-400/30',
  },
  osis: {
    label: 'OSIS',
    icon: FaStar,
    color: 'text-purple-600 dark:text-purple-300',
    bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20',
    borderColor: 'border-purple-400 dark:border-purple-500',
    gradient: 'from-purple-500 to-violet-600',
    shadow: 'shadow-lg shadow-purple-500/50 dark:shadow-purple-400/30',
  },
  guru: {
    label: 'Guru',
    icon: FaChalkboardTeacher,
    color: 'text-green-600 dark:text-green-300',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20',
    borderColor: 'border-green-400 dark:border-green-500',
    gradient: 'from-green-500 to-emerald-600',
    shadow: 'shadow-lg shadow-green-500/50 dark:shadow-green-400/30',
  },
  siswa: {
    label: 'Siswa',
    icon: FaGraduationCap,
    color: 'text-indigo-600 dark:text-indigo-300',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20',
    borderColor: 'border-indigo-400 dark:border-indigo-500',
    gradient: 'from-indigo-500 to-blue-600',
    shadow: 'shadow-lg shadow-indigo-500/50 dark:shadow-indigo-400/30',
  },
  other: {
    label: 'Other',
    icon: FaUser,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/20',
    borderColor: 'border-gray-400 dark:border-gray-500',
    gradient: 'from-gray-500 to-slate-600',
    shadow: 'shadow-lg shadow-gray-500/50 dark:shadow-gray-400/30',
  },
};

export default function RoleBadge({ role, size = 'md', showLabel = true, className = '', showGlow = false }: RoleBadgeProps) {
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
      // Show 'other' badge for unknown roles
      config = roleConfig.other;
    }
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
    xl: 'text-lg px-5 py-2.5',
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border-2 font-bold
        transition-all duration-300 hover:scale-105
        ${sizeClasses[size]}
        ${config.color}
        ${config.bgColor}
        ${config.borderColor}
        ${showGlow ? config.shadow : ''}
        ${className}
      `}
      title={config.label}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span className="whitespace-nowrap tracking-wide">{config.label}</span>}
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

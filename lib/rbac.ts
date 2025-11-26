/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions for each user role in the admin panel
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'osis'
  | 'siswa'
  | 'other'
  | 'guru'
  // legacy roles kept for compatibility
  | 'editor'
  | 'viewer';

export type Permission =
  // Content Management
  | 'posts:read'
  | 'posts:create'
  | 'posts:edit'
  | 'posts:delete'
  | 'events:read'
  | 'events:create'
  | 'events:edit'
  | 'events:delete'
  | 'gallery:read'
  | 'gallery:create'
  | 'gallery:edit'
  | 'gallery:delete'
  // Data Management
  | 'members:read'
  | 'members:create'
  | 'members:edit'
  | 'members:delete'
  | 'sekbid:read'
  | 'sekbid:create'
  | 'sekbid:edit'
  | 'sekbid:delete'
  | 'proker:read'
  | 'proker:create'
  | 'proker:edit'
  | 'proker:delete'
  | 'announcements:read'
  | 'announcements:create'
  | 'announcements:edit'
  | 'announcements:delete'
  | 'polls:read'
  | 'polls:create'
  | 'polls:edit'
  | 'polls:delete'
  // User Management
  | 'users:read'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:approve'
  | 'users:role_assign'
  // System
  | 'settings:read'
  | 'settings:write'
  | 'tools:access'
  | 'tools:terminal';

/**
 * Role definitions with their permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Super Admin: Full access to everything
  super_admin: [
    // Content
    'posts:read', 'posts:create', 'posts:edit', 'posts:delete',
    'events:read', 'events:create', 'events:edit', 'events:delete',
    'gallery:read', 'gallery:create', 'gallery:edit', 'gallery:delete',
    // Data
    'members:read', 'members:create', 'members:edit', 'members:delete',
    'sekbid:read', 'sekbid:create', 'sekbid:edit', 'sekbid:delete',
    'proker:read', 'proker:create', 'proker:edit', 'proker:delete',
    'announcements:read', 'announcements:create', 'announcements:edit', 'announcements:delete',
    'polls:read', 'polls:create', 'polls:edit', 'polls:delete',
    // Users
    'users:read', 'users:create', 'users:edit', 'users:delete', 'users:approve', 'users:role_assign',
    // System
    'settings:read', 'settings:write', 'tools:access', 'tools:terminal',
  ],
  
  // Admin: Can manage content and users, but limited system access
  admin: [
    // Content
    'posts:read', 'posts:create', 'posts:edit', 'posts:delete',
    'events:read', 'events:create', 'events:edit', 'events:delete',
    'gallery:read', 'gallery:create', 'gallery:edit', 'gallery:delete',
    // Data
    'members:read', 'members:create', 'members:edit', 'members:delete',
    'sekbid:read', 'sekbid:create', 'sekbid:edit', 'sekbid:delete',
    'proker:read', 'proker:create', 'proker:edit', 'proker:delete',
    'announcements:read', 'announcements:create', 'announcements:edit', 'announcements:delete',
    'polls:read', 'polls:create', 'polls:edit', 'polls:delete',
    // Users
    'users:read', 'users:approve',
    // System (read-only)
    'settings:read',
  ],
  
  // Moderator: Full content moderation (create/edit/delete) across posts/events/gallery/announcements/polls,
  // read-only for data entities (members/sekbid/proker). No user management or system access.
  moderator: [
    // Content (full moderation)
    'posts:read', 'posts:create', 'posts:edit', 'posts:delete',
    'events:read', 'events:create', 'events:edit', 'events:delete',
    'gallery:read', 'gallery:create', 'gallery:edit', 'gallery:delete',
    'announcements:read', 'announcements:create', 'announcements:edit', 'announcements:delete',
    'polls:read', 'polls:create', 'polls:edit', 'polls:delete',
    // Data (read-only)
    'members:read', 'sekbid:read', 'proker:read',
  ],
  
  // Editor: Can create and edit content, but cannot delete or manage users
  editor: [
    // Content
    'posts:read', 'posts:create', 'posts:edit',
    'events:read', 'events:create', 'events:edit',
    'gallery:read', 'gallery:create', 'gallery:edit',
    // Data
    'members:read', 'members:create', 'members:edit',
    'sekbid:read',
    'proker:read', 'proker:create', 'proker:edit',
    'announcements:read', 'announcements:create', 'announcements:edit',
    'polls:read', 'polls:create', 'polls:edit',
  ],
  
  // Viewer: Read-only access to content
  viewer: [
    'posts:read',
    'events:read',
    'gallery:read',
    'members:read',
    'sekbid:read',
    'proker:read',
    'announcements:read',
    'polls:read',
  ],
  
  // OSIS: Full admin powers (same as admin role)
  osis: [
    // Content (full CRUD)
    'posts:read', 'posts:create', 'posts:edit', 'posts:delete',
    'events:read', 'events:create', 'events:edit', 'events:delete',
    'gallery:read', 'gallery:create', 'gallery:edit', 'gallery:delete',
    // Data (full CRUD)
    'members:read', 'members:create', 'members:edit', 'members:delete',
    'sekbid:read', 'sekbid:create', 'sekbid:edit', 'sekbid:delete',
    'proker:read', 'proker:create', 'proker:edit', 'proker:delete',
    'announcements:read', 'announcements:create', 'announcements:edit', 'announcements:delete',
    'polls:read', 'polls:create', 'polls:edit', 'polls:delete',
    // Users (read and approve)
    'users:read', 'users:approve',
    // System (read-only)
    'settings:read',
  ],
  
  // Siswa: Read-only everywhere (same as viewer)
  siswa: [
    'posts:read',
    'events:read',
    'gallery:read',
    'members:read',
    'sekbid:read',
    'proker:read',
    'announcements:read',
    'polls:read',
  ],
  
  // Other: Minimal read-only (same as siswa/viewer)
  other: [
    'posts:read',
    'events:read',
    'gallery:read',
    'members:read',
    'sekbid:read',
    'proker:read',
    'announcements:read',
    'polls:read',
  ],

  // Guru: Similar to osis but no announcements/polls creation; can read users list
  guru: [
    'posts:read', 'posts:create', 'posts:edit',
    'events:read', 'events:create', 'events:edit',
    'gallery:read', 'gallery:create', 'gallery:edit',
    'members:read',
    'sekbid:read',
    'proker:read', 'proker:create', 'proker:edit',
    'announcements:read',
    'polls:read',
    // User management limited: can view list only
    'users:read'
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  
  const userRole = role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) return false;
  
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: string | undefined | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: string | undefined | null, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: string | undefined | null): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as UserRole] || [];
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === 'super_admin';
}

/**
 * Check if user is admin or super admin
 */
export function isAdmin(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

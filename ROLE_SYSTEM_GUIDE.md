# Role System & Permissions Guide

## Role Hierarchy

Sistem menggunakan Role-Based Access Control (RBAC) dengan hierarki berikut:

### 1. **Super Admin** 🔴
- **Full Access** ke semua fitur sistem
- Dapat mengelola users, settings, terminal
- Dapat assign role ke user lain
- Badge: Merah dengan gradien yellow-amber

### 2. **Admin** 🔴
- Akses penuh ke content management
- Dapat mengelola users (approve, edit, delete)
- Tidak dapat akses terminal dan beberapa system settings
- Badge: Merah-pink

### 3. **Moderator** 🔵
- Dapat mengelola content (posts, events, gallery)
- Dapat melihat data users (read-only)
- Tidak dapat edit/delete users
- Badge: Biru-cyan

### 4. **OSIS** 🟢
- Akses ke content management
- Dapat mengelola data members, sekbid, proker
- Read-only access ke users
- Badge: Hijau

### 5. **Guru** 🟡
- Akses terbatas ke content
- Dapat melihat posts dan events
- Tidak dapat edit data
- Badge: Kuning-orange

### 6. **Siswa** 🟣
- Akses read-only
- Dapat melihat posts, events, gallery
- Dapat comment dan participate di polls
- Badge: Ungu dengan graduation cap icon

## Cara Kerja Role System

### 1. **Registrasi & Approval**
```
User Register → Email Verification → Admin Approval → Role Assigned → Access Granted
```

**Flow Detail:**
1. User registrasi dengan `requested_role` (siswa/osis/guru)
2. Email verification dikirim otomatis
3. User klik link verifikasi → `email_verified = true`
4. Admin review di `/admin/users`
5. Admin approve & set role final → `approved = true`, `role = 'admin'/'osis'/etc`
6. User bisa login dengan role yang diberikan

### 2. **Middleware Protection**

File: `middleware.ts`

```typescript
// Admin routes hanya untuk: super_admin, admin, osis
if (pathname.startsWith('/admin')) {
  const adminRoles = ['super_admin', 'admin', 'osis'];
  if (!adminRoles.includes(userRole)) {
    return redirect('/404'); // No access
  }
}
```

**Exception:** `/admin/profile` - semua authenticated users bisa akses untuk edit profile sendiri.

### 3. **API Permission Check**

File: `lib/apiAuth.ts`, `lib/rbac.ts`

```typescript
// Di API route
const authErr = await requirePermission('users:edit');
if (authErr) return authErr; // Return 403 if no permission

// Check role permissions
hasPermission(userRole, 'posts:create') // true/false
```

### 4. **Session Management**

**Auth Callbacks:** `lib/auth.ts`

```typescript
// JWT callback - simpan role di token
jwt({ token, user }) {
  token.role = user.role;
  token.id = user.id;
}

// Session callback - copy role ke session
session({ session, token }) {
  session.user.role = token.role;
  session.user.id = token.id;
}
```

**Auto-Refresh:** Dashboard auto-refresh setiap 30 detik untuk detect role changes

### 5. **Role Update Flow**

**Scenario:** Admin mengubah role user dari 'siswa' → 'super_admin'

1. Admin edit user di `/admin/users`
2. PUT `/api/admin/users/[id]` dengan `role: 'super_admin'`
3. Database updated: `users.role = 'super_admin'`
4. User dashboard auto-refresh (30s) atau manual click "Refresh Data"
5. Session di-update dengan role baru
6. Badge berubah dari Siswa (ungu) → Super Admin (merah-kuning)
7. Middleware mengizinkan akses ke semua admin routes

## Permission Matrix

| Permission | Super Admin | Admin | Moderator | OSIS | Guru | Siswa |
|------------|-------------|-------|-----------|------|------|-------|
| **Content Management** |
| posts:create/edit/delete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| events:create/edit/delete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| gallery:create/edit/delete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Data Management** |
| members:create/edit/delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| sekbid:create/edit/delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| proker:create/edit/delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| polls:create/edit/delete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **User Management** |
| users:read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| users:edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:role_assign | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **System** |
| settings:write | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| tools:terminal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Testing Role Changes

### Test Scenario 1: Role Badge Update
1. Login sebagai super_admin di `/admin/login`
2. Buka `/admin/users`
3. Edit user (misalnya: user@test.com)
4. Ubah role dari 'siswa' → 'admin'
5. Klik Save
6. Login sebagai user@test.com di tab/browser lain
7. Buka `/dashboard`
8. Klik tombol "Refresh Data" atau tunggu 30 detik
9. ✅ Badge harus berubah dari Siswa (ungu) → Admin (merah)
10. ✅ Coba akses `/admin/users` - harus bisa akses

### Test Scenario 2: Permission Check
1. Login sebagai user dengan role 'siswa'
2. Coba akses `/admin/users`
3. ✅ Harus redirect ke `/404` (no access)
4. Coba akses `/admin/profile`
5. ✅ Harus bisa akses (exception untuk edit profile sendiri)

### Test Scenario 3: API Permission
1. Login sebagai 'moderator'
2. Coba DELETE user via API: `DELETE /api/admin/users/[id]`
3. ✅ Harus return 403 Forbidden (moderator tidak punya permission 'users:delete')

## Troubleshooting

### Badge Tidak Update Setelah Role Diubah

**Penyebab:**
- Session cache belum refresh
- Browser cache

**Solusi:**
1. Klik tombol "Refresh Data" di dashboard
2. Atau tunggu 30 detik (auto-refresh)
3. Atau logout dan login lagi
4. Atau hard refresh browser (Ctrl+Shift+R)

### User Tidak Bisa Akses Admin Panel

**Check:**
1. Apakah `email_verified = true`? (klik link di email)
2. Apakah `approved = true`? (admin harus approve dulu)
3. Apakah role termasuk `['super_admin', 'admin', 'osis']`?
4. Cek session: buka `/api/debug-session` untuk lihat role di session

### Permission Denied di API

**Check:**
1. Lihat error message: "required_permission: 'xxx:xxx'"
2. Buka `lib/rbac.ts` → cek apakah role punya permission tersebut
3. Pastikan session.user.role sudah benar

## File Reference

- **Middleware:** `middleware.ts` - Route protection
- **Auth Config:** `lib/auth.ts` - Session callbacks
- **RBAC Rules:** `lib/rbac.ts` - Permission definitions
- **API Auth:** `lib/apiAuth.ts` - Permission helpers
- **User Interface:** `app/admin/users/page.tsx` - User management
- **Dashboard:** `app/dashboard/page.tsx` - Auto-refresh role

## Security Notes

⚠️ **Important:**
- Role hanya bisa diubah oleh admin via `/admin/users`
- User tidak bisa ubah role sendiri
- Middleware di-enforce di Edge Runtime (sebelum request masuk ke app)
- API permission di-check di setiap endpoint
- Session di-sign dengan JWT secret (tidak bisa di-tamper)

✅ **Best Practices:**
- Selalu gunakan `requirePermission()` di API routes
- Jangan trust client-side role check saja
- Validate role di server-side (middleware + API)
- Log semua role changes untuk audit trail

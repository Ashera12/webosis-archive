# Panduan Role-Based Access Control (RBAC)

## 📋 Daftar Isi
- [Overview](#overview)
- [Roles & Permissions](#roles--permissions)
- [Konfigurasi User](#konfigurasi-user)
- [Implementasi di API](#implementasi-di-api)
- [Testing](#testing)

## Overview

Sistem RBAC memungkinkan kontrol akses berbasis role untuk semua fitur admin panel. Setiap user yang telah **approved** oleh admin dapat mengakses fitur sesuai dengan role yang diberikan.

### ✅ Requirements
1. User harus **email verified**
2. User harus **approved** oleh admin
3. User harus memiliki **role** yang valid

## Roles & Permissions

### 🔴 Super Admin
**Full access** ke semua fitur sistem.

**Permissions:**
- ✅ Content Management: Create, Read, Update, Delete (Posts, Events, Gallery)
- ✅ Data Management: Create, Read, Update, Delete (Members, Sekbid, Proker, Announcements, Polls)
- ✅ User Management: Create, Read, Update, Delete, Approve, Assign Roles
- ✅ System Settings: Read & Write
- ✅ Tools: Terminal Access

**Use Case:** Owner sistem, developer

---

### 🟠 Admin
Dapat mengelola konten dan user, tapi **tidak bisa** mengubah system settings atau akses terminal.

**Permissions:**
- ✅ Content Management: Create, Read, Update, Delete (Posts, Events, Gallery)
- ✅ Data Management: Create, Read, Update, Delete (Members, Sekbid, Proker, Announcements, Polls)
- ✅ User Management: Read, Approve (tidak bisa delete atau assign role)
- ✅ System Settings: Read only
- ❌ Tools: No terminal access

**Use Case:** Ketua OSIS, Wakil Ketua

---

### 🟡 Editor
Dapat membuat dan mengedit konten, tapi **tidak bisa** menghapus atau mengelola user.

**Permissions:**
- ✅ Content Management: Create, Read, Update (Posts, Events, Gallery)
- ✅ Data Management: Create, Read, Update (Members, Proker, Announcements, Polls)
- ✅ Sekbid: Read only
- ❌ Delete operations: Tidak bisa delete apapun
- ❌ User Management: Tidak ada akses
- ❌ System Settings: Tidak ada akses

**Use Case:** Anggota OSIS yang mengelola konten

---

### 🟢 Viewer
**Read-only** access ke semua konten.

**Permissions:**
- ✅ Read all content (Posts, Events, Gallery, Members, Sekbid, Proker, Announcements, Polls)
- ❌ Cannot create, edit, or delete anything

**Use Case:** Observer, guest admin

---

## Konfigurasi User

### 1. Register User Baru

User mendaftar melalui `/register`:
```
Email: user@example.com
Password: ********
Name: John Doe
```

**Status awal:**
- ✅ `email_verified: false`
- ❌ `approved: false`
- 🔵 `role: null`

### 2. Verifikasi Email

User klik link verifikasi di email.

**Status setelah verifikasi:**
- ✅ `email_verified: true`
- ❌ `approved: false` (masih menunggu approval admin)
- 🔵 `role: null`

### 3. Approval & Role Assignment (Super Admin Only)

Super Admin masuk ke **Admin Panel → Users**:

1. Klik user yang perlu di-approve
2. Toggle **"Active"** switch → `approved: true`
3. Pilih **Role** dari dropdown:
   - Super Admin
   - Admin
   - Editor
   - Viewer

**Status setelah approval:**
- ✅ `email_verified: true`
- ✅ `approved: true`
- ✅ `role: 'editor'` (contoh)

### 4. User Dapat Login

Setelah approved + role assigned, user bisa login dan mengakses fitur sesuai permissions role-nya.

---

## Implementasi di API

### Struktur File

```
lib/
├── rbac.ts          # Role & permission definitions
├── apiAuth.ts       # API authorization helpers
└── auth.ts          # NextAuth configuration

app/api/admin/
├── posts/
│   └── route.ts     # Posts API dengan RBAC
├── events/
│   └── route.ts     # Events API dengan RBAC
└── users/
    └── route.ts     # Users API dengan RBAC
```

### Contoh Implementasi

#### GET (Read) - Semua role dengan read permission
```typescript
import { requirePermission } from '@/lib/apiAuth';

export async function GET() {
  // Check permission
  const authError = await requirePermission('posts:read');
  if (authError) return authError;
  
  // Fetch data
  const { data } = await supabaseAdmin.from('posts').select('*');
  return NextResponse.json({ posts: data });
}
```

#### POST (Create) - Hanya yang punya create permission
```typescript
export async function POST(request: NextRequest) {
  // Check permission
  const authError = await requirePermission('posts:create');
  if (authError) return authError;
  
  const body = await request.json();
  // Create logic...
}
```

#### PUT (Update) - Hanya yang punya edit permission
```typescript
export async function PUT(request: NextRequest) {
  const authError = await requirePermission('posts:edit');
  if (authError) return authError;
  
  // Update logic...
}
```

#### DELETE - Hanya yang punya delete permission
```typescript
export async function DELETE(request: NextRequest) {
  const authError = await requirePermission('posts:delete');
  if (authError) return authError;
  
  // Delete logic...
}
```

### Multiple Permissions

Untuk action yang memerlukan beberapa permission:

```typescript
import { requireAllPermissions, requireAnyPermission } from '@/lib/apiAuth';

// Harus punya SEMUA permission
const authError = await requireAllPermissions(['posts:edit', 'posts:delete']);

// Harus punya SALAH SATU permission
const authError = await requireAnyPermission(['posts:edit', 'events:edit']);
```

---

## Testing

### 1. Test Role Assignment

```bash
# Login sebagai super_admin
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 2. Test Permission Check

```bash
# Try to create post dengan editor role (should succeed)
curl -X POST http://localhost:3000/api/admin/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"title":"Test Post","content":"Hello"}'

# Try to delete post dengan viewer role (should fail 403)
curl -X DELETE http://localhost:3000/api/admin/posts/123 \
  -H "Cookie: next-auth.session-token=..."
```

### 3. Expected Responses

**✅ Success (200)**
```json
{
  "posts": [...]
}
```

**❌ Unauthorized (401) - Tidak login**
```json
{
  "error": "Unauthorized",
  "message": "Login diperlukan"
}
```

**❌ Forbidden (403) - Login tapi tidak punya permission**
```json
{
  "error": "Forbidden",
  "message": "Anda tidak memiliki izin untuk melakukan aksi ini",
  "required_permission": "posts:delete"
}
```

---

## Quick Reference

### Permission Matrix

| Feature | super_admin | admin | editor | viewer |
|---------|-------------|-------|--------|--------|
| Posts CRUD | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅❌ | ✅❌❌❌ |
| Events CRUD | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅❌ | ✅❌❌❌ |
| Gallery CRUD | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅❌ | ✅❌❌❌ |
| Members CRUD | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅❌ | ✅❌❌❌ |
| Users Approve | ✅ | ✅ | ❌ | ❌ |
| Users Delete | ✅ | ❌ | ❌ | ❌ |
| Role Assign | ✅ | ❌ | ❌ | ❌ |
| Settings Write | ✅ | ❌ | ❌ | ❌ |
| Terminal | ✅ | ❌ | ❌ | ❌ |

Legend: Create, Read, Update, Delete

---

## Troubleshooting

### User tidak bisa login
1. ✅ Cek `email_verified` di database
2. ✅ Cek `approved` di database
3. ✅ Cek `role` tidak null

### User dapat login tapi error 403
1. ✅ Cek role di session: `console.log(session.user.role)`
2. ✅ Cek permission di `lib/rbac.ts`
3. ✅ Pastikan API menggunakan `requirePermission`

### Super Admin tidak bisa akses
1. ✅ Pastikan role = `'super_admin'` (bukan `'superadmin'`)
2. ✅ Cek di database: `SELECT role FROM users WHERE email='...'`

---

## 🎉 Selesai!

Sekarang sistem RBAC sudah aktif. Semua user yang **approved** dapat akses admin panel sesuai role mereka.

**Next Steps:**
1. Login sebagai super admin
2. Approve user yang mendaftar
3. Assign role sesuai kebutuhan
4. Test akses fitur

**Support:**
- 📧 Email: osis@smaitfi.sch.id
- 📚 Docs: `/docs/rbac`

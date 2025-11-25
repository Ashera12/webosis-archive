# 🔐 Panduan Registration & User Management System

## 📋 Overview

Sistem autentikasi dan manajemen user yang lengkap dengan:
- **Public Registration**: User bisa daftar sendiri dengan role terbatas (OSIS, Siswa, Other)
- **Email Verification**: Token verifikasi email (manual untuk saat ini)
- **Admin Approval**: User baru harus disetujui admin sebelum bisa login
- **Role Management**: Super Admin bisa ubah role user (termasuk promote ke Admin)
- **Admin-only Access**: Role Admin/Super Admin hanya bisa diberikan oleh Super Admin

---

## 🚀 Quick Start

### 1️⃣ Setup Database

Jalankan SQL di Supabase SQL Editor (sudah di `supabase-schema.sql`):

```sql
-- Kolom baru di tabel users:
-- email_verified boolean (default: false)
-- approved boolean (default: false)
-- verification_token text
-- verification_expires timestamptz
-- role: 'super_admin' | 'admin' | 'moderator' | 'osis' | 'siswa' | 'other'
```

### 2️⃣ Seed Super Admin

Generate password hash:
```bash
npm run hash:pw yourStrongPassword123
```

Insert ke Supabase:
```sql
INSERT INTO public.users (email, name, password_hash, role, email_verified, approved)
VALUES ('admin@osis.example.com', 'Super Admin', 'PASTE_HASH_DISINI', 'super_admin', true, true);
```

### 3️⃣ Test Registration Flow

1. Buka http://localhost:3001/register
2. Isi form (nama, email, password, role: pilih OSIS/Siswa/Other)
3. Klik "Daftar Sekarang"
4. Token verifikasi muncul → klik "Verifikasi Email Sekarang"
5. Status: `email_verified = true`, tapi `approved = false`
6. Coba login → ditolak: "Akun Anda belum disetujui admin"

### 4️⃣ Approve User sebagai Admin

1. Login sebagai Super Admin (email: admin@osis.example.com)
2. Buka http://localhost:3001/admin/users
3. Lihat user pending approval (badge kuning "Pending")
4. Klik tombol "Approve" → user bisa login

---

## 🎭 Role System

### Public Roles (Bisa Dipilih Saat Register)
- **OSIS**: Anggota OSIS
- **Siswa**: Siswa biasa
- **Other**: Role lainnya

### Admin Roles (Hanya Super Admin yang Bisa Set)
- **Moderator**: Bisa moderasi konten
- **Admin**: Full admin access (kecuali promote user ke admin)
- **Super Admin**: Akses penuh, termasuk promote user ke Admin/Super Admin

### Role Hierarchy
```
Super Admin > Admin > Moderator > OSIS/Siswa/Other
```

---

## 📄 Pages & Routes

### Public Pages
- `/register` - Form pendaftaran akun baru
- `/admin/login` - Login page (ada link ke /register)

### Admin Pages (Protected)
- `/admin` - Dashboard utama
- `/admin/users` - **User Management** (list semua user, approve/reject, ubah role)

### API Endpoints

#### Public APIs
- `POST /api/auth/register` - Daftar akun baru
  - Body: `{ email, name, password, role }`
  - Role allowed: `osis`, `siswa`, `other`
  - Returns: `{ success: true, verification_token }`

- `POST /api/auth/verify` - Verifikasi email dengan token
  - Body: `{ token }`
  - Returns: `{ success: true }`

#### Admin APIs (Require admin/super_admin role)
- `GET /api/admin/users` - List semua user
- `POST /api/admin/users/approve` - Approve/revoke user
  - Body: `{ userId, approved: true/false }`
- `POST /api/admin/users/role` - Ubah role user (super_admin only)
  - Body: `{ userId, role: 'admin' | 'moderator' | ... }`

---

## 🔒 Security Features

### Login Gate
User harus memenuhi syarat:
1. ✅ Email terverifikasi (`email_verified = true`)
2. ✅ Sudah disetujui admin (`approved = true`)
3. ✅ Password cocok

Kalau salah satu gagal → error message spesifik.

### Role Promotion Protection
- Hanya **Super Admin** yang bisa ubah role user
- Hanya Super Admin yang bisa promote ke `admin` atau `super_admin`
- Admin biasa **tidak bisa** promote user lain ke Admin

### API Protection
- Middleware proteksi `/admin/*` routes
- Session JWT dengan role di token
- API endpoint cek role sebelum execute

---

## 💡 Usage Tips

### Untuk User Baru
1. Daftar di `/register`
2. Pilih role sesuai (OSIS/Siswa/Other)
3. Verifikasi email (saat ini manual dengan token)
4. Tunggu approval dari admin
5. Cek email untuk notifikasi (jika email sudah dikonfigurasi)

### Untuk Super Admin
1. Login di `/admin/login`
2. Masuk ke **Users** di sidebar
3. Filter "Menunggu Approval" untuk lihat user pending
4. Klik **Approve** untuk izinkan login
5. Ubah role di dropdown jika perlu (misal promote ke Moderator/Admin)
6. Klik **Revoke** untuk batalkan approval

### Untuk Mengubah Role User
1. Buka `/admin/users`
2. Pilih role baru di dropdown
3. Otomatis tersimpan (hanya Super Admin yang bisa)

---

## 🎨 UI Features di /admin/users

### Filter Tabs
- **Semua User**: Tampilkan semua
- **Menunggu Approval**: Hanya yang `approved = false`
- **Sudah Disetujui**: Hanya yang `approved = true`

### Table Columns
- **User**: Nama + email
- **Role**: Dropdown untuk ubah role (super_admin only)
- **Email Verified**: ✅ hijau (verified) / ❌ merah (belum)
- **Approved**: Badge hijau "Approved" / kuning "Pending"
- **Registered**: Tanggal daftar
- **Actions**: Tombol Approve (hijau) / Revoke (merah)

### Color Coding
- 🟢 Green: Approved, Verified
- 🟡 Yellow: Pending approval
- 🔴 Red: Revoked, Not verified

---

## 🔧 Customization

### Tambah Role Baru
1. Update `supabase-schema.sql`:
   ```sql
   role text check (role in ('super_admin','admin','moderator','osis','siswa','other','NEW_ROLE'))
   ```
2. Update `app/api/auth/register/route.ts`:
   ```ts
   const PUBLIC_ROLES = ['osis', 'siswa', 'other', 'NEW_ROLE'];
   ```
3. Update form di `app/register/page.tsx`

### Enable Email Sending
1. Install nodemailer: `npm install nodemailer`
2. Update `app/api/auth/register/route.ts`:
   - Kirim email dengan link verifikasi
   - Format: `http://yoursite.com/verify?token=TOKEN`
3. Buat page `/verify?token=...` yang call API `/api/auth/verify`

### Custom Approval Workflow
- Tambah notifikasi ke admin saat ada user baru
- Kirim email ke user saat approved
- Tambah alasan reject (textarea)

---

## 📊 Database Schema Reference

```sql
users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text,
  role text DEFAULT 'siswa',
  sekbid_id int,
  photo_url text,
  email_verified boolean DEFAULT false,
  approved boolean DEFAULT false,
  verification_token text,
  verification_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

---

## ✅ Checklist Implementasi

- [x] Update database schema (email_verified, approved, token)
- [x] Public registration endpoint
- [x] Email verification endpoint
- [x] Login gate (cek verified + approved)
- [x] Register page UI
- [x] User management page
- [x] Approve/reject API
- [x] Change role API (super_admin only)
- [x] Link "Daftar" di login page
- [x] Filter tabs di user management
- [ ] Email sending (SMTP belum configured)
- [ ] Halaman verify dari email link
- [ ] Notifikasi ke admin saat user baru daftar

---

## 🎯 Next Steps

1. **Setup SMTP** untuk auto-send verification email
2. **Tambah notifikasi** di admin dashboard (badge "3 pending approval")
3. **Export user list** ke CSV/Excel
4. **Bulk actions** (approve semua, delete selected)
5. **User activity log** (track login, actions)

---

**Dibuat dengan ❤️ untuk OSIS SMK Informatika Fithrah Insani**

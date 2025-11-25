# ⚡ Quick Start - Registration & User Management

## 🎯 Alur Lengkap

### 1. Setup Database
Jalankan di Supabase SQL Editor:
```sql
-- File: supabase-schema.sql (sudah ada di root project)
-- Copy-paste semua isi file dan jalankan
```

### 2. Buat Super Admin
```bash
# Generate password hash
npm run hash:pw admin123

# Insert ke Supabase (ganti HASH dengan output di atas)
INSERT INTO users (email, name, password_hash, role, email_verified, approved)
VALUES ('admin@osis.com', 'Super Admin', 'HASH', 'super_admin', true, true);
```

### 3. Test User Registration
1. Buka: `http://localhost:3001/register`
2. Daftar dengan role: OSIS/Siswa/Other
3. Klik "Verifikasi Email Sekarang"
4. Coba login → ditolak (belum approved)

### 4. Approve User
1. Login sebagai Super Admin
2. Buka: `http://localhost:3001/admin/users`
3. Klik tombol "Approve" di user pending
4. User sekarang bisa login!

## 🔐 Role System

**Public Roles** (bisa dipilih saat register):
- `osis` - Anggota OSIS
- `siswa` - Siswa biasa  
- `other` - Lainnya

**Admin Roles** (hanya Super Admin yang bisa set):
- `moderator` - Moderasi konten
- `admin` - Full admin access
- `super_admin` - God mode (bisa promote user lain ke admin)

## 📍 URLs Penting

- Register: `/register`
- Login Admin: `/admin/login`
- User Management: `/admin/users`

## ✅ Login Requirements

User harus:
1. ✅ Email terverifikasi
2. ✅ Disetujui admin  
3. ✅ Password benar

Kalau belum, muncul error spesifik!

---

**Detail lengkap**: Lihat `REGISTRATION_GUIDE.md`

# 🔧 Quick Fix: Admin Settings RLS Error

## Problem
Error saat save settings di `/admin/settings`:
```
❌ new row violates row-level security policy
```

## Solution
Jalankan SQL file untuk fix RLS policies pada table `admin_settings`.

---

## Cara Menjalankan

### Opsi 1: Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka SQL Editor**
   - Sidebar kiri → klik **SQL Editor**
   - Klik **New Query**

3. **Copy-Paste SQL**
   - Buka file: `supabase-fix-admin-settings-rls.sql`
   - Copy seluruh isi file
   - Paste ke SQL Editor

4. **Run Query**
   - Klik tombol **Run** (atau Ctrl+Enter)
   - Tunggu sampai selesai

5. **Verify**
   - Scroll ke bawah output
   - Pastikan ada 4 policies terbuat:
     - `admin_settings_select`
     - `admin_settings_insert`
     - `admin_settings_update`
     - `admin_settings_delete`

---

### Opsi 2: PowerShell (Windows)

```powershell
# Set environment variable
$env:DATABASE_URL = "postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Run SQL file
psql $env:DATABASE_URL -f supabase-fix-admin-settings-rls.sql
```

**Ganti:**
- `xxx` dengan project ID Supabase Anda
- `password` dengan database password

---

## Verifikasi Berhasil

### 1. Check di Supabase Dashboard
- Buka **Table Editor** → `admin_settings`
- Tab **RLS** (Row Level Security)
- Pastikan status: **RLS enabled**
- Lihat 4 policies terdaftar

### 2. Test di Website
- Buka `/admin/settings`
- Ubah salah satu setting (contoh: `GLOBAL_BG_COLOR`)
- Klik **"Simpan Settings"**
- Jika muncul **"Settings berhasil disimpan"** → ✅ FIXED!

---

## What This Fix Does

1. **Drop existing policies** (clean slate)
2. **Enable RLS** pada table `admin_settings`
3. **Create new policies** untuk super_admin:
   - **SELECT**: Baca semua settings
   - **INSERT**: Tambah setting baru
   - **UPDATE**: Edit setting existing
   - **DELETE**: Hapus setting
4. **Grant permissions** ke authenticated users
5. **Grant sequence usage** untuk auto-increment ID

---

## Policy Details

### Who Can Access?
**Only super_admin users** yang terdaftar di table `users` dengan `role = 'super_admin'`

### Security Check
Setiap operation (SELECT/INSERT/UPDATE/DELETE) verify:
```sql
EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'super_admin'
)
```

---

## Troubleshooting

### Error: "permission denied for table users"
**Solusi**: Table `users` belum ada atau RLS terlalu ketat
```sql
-- Temporary fix: allow select on users table
GRANT SELECT ON users TO authenticated;
```

### Error: "policy with same name already exists"
**Solusi**: Drop policies manual terlebih dahulu
```sql
DROP POLICY IF EXISTS "admin_settings_select" ON admin_settings;
DROP POLICY IF EXISTS "admin_settings_insert" ON admin_settings;
DROP POLICY IF EXISTS "admin_settings_update" ON admin_settings;
DROP POLICY IF EXISTS "admin_settings_delete" ON admin_settings;
```

### Settings masih tidak bisa disimpan
**Check:**
1. User Anda sudah login sebagai super_admin?
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```
2. RLS benar-benar enabled?
   ```sql
   SELECT relname, relrowsecurity 
   FROM pg_class 
   WHERE relname = 'admin_settings';
   ```

---

## Prevention untuk Next Time

### Best Practice untuk New Tables
Saat buat table baru yang perlu admin access:

```sql
-- 1. Create table
CREATE TABLE your_table (...);

-- 2. Enable RLS immediately
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "your_table_admin_all"
ON your_table
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);

-- 4. Grant permissions
GRANT ALL ON your_table TO authenticated;
```

---

**Created**: November 12, 2025
**Status**: Ready to deploy
**Applies to**: Background image upload feature & all admin settings

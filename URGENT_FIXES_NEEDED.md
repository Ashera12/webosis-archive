# ⚠️ URGENT FIXES NEEDED

Ada 2 masalah critical yang perlu diperbaiki sekarang:

## 🔴 Problem 1: Error Fetching Published Posts
**Error di Console:**
```
Error fetching published posts (joined): {}
PGRST116 - The result contains 0 rows
🔧 AI Fix Suggestion: Run FIX-ALL-RLS-ERRORS.sql Part 3
```

**Penyebab:** RLS policies belum ada di tabel `posts`

**Solusi:** ✅ **LANGKAH 1** - Jalankan SQL Fix

### Cara Fix:
1. Buka **Supabase Dashboard** → https://supabase.com/dashboard/project/YOUR_PROJECT
2. Klik **SQL Editor** (ikon database di sidebar kiri)
3. Klik **New Query**
4. Copy isi file `fix-posts-rls.sql` ke SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`
6. Tunggu sampai muncul "Success. No rows returned"
7. Verify dengan query ini:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'posts';
   ```
   Harus muncul 5-7 policies

### Expected Result:
- Console error "Error fetching published posts" **HILANG**
- Halaman home bisa load posts tanpa error
- RLS policies terlihat di Supabase Dashboard → Authentication → Policies

---

## 🔴 Problem 2: JWT Decryption Error
**Error di Console:**
```
JWTSessionError: no matching decryption secret
```

**Penyebab:** `NEXTAUTH_SECRET` berubah atau tidak ada di `.env.local`

**Solusi:** ✅ **LANGKAH 2** - Generate Secret Baru

### Cara Fix:
1. **Buka PowerShell** (bukan Command Prompt!)
2. **Generate secret baru:**
   ```powershell
   $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
   ```
3. **Copy output** (contoh: `Kix2f5gRa9x4yQ+8vP7lM2nB3cD4eF5gH6iJ7kL8mN9o=`)
4. **Buka `.env.local`** di VS Code
5. **Update/tambah baris:**
   ```bash
   NEXTAUTH_SECRET=paste-secret-di-sini
   ```
   Contoh:
   ```bash
   NEXTAUTH_SECRET=Kix2f5gRa9x4yQ+8vP7lM2nB3cD4eF5gH6iJ7kL8mN9o=
   ```
6. **Save file** (`Ctrl+S`)
7. **Restart dev server:**
   - Tekan `Ctrl+C` di terminal
   - Jalankan `npm run dev` lagi
8. **Clear browser cookies (optional):**
   - Buka DevTools (`F12`)
   - Application → Cookies → http://localhost:3000
   - Klik kanan → Clear
9. **Login lagi** di `/admin/login`

### Expected Result:
- JWT error **HILANG** dari console
- Login berfungsi normal
- Session tersimpan dengan benar

---

## 📋 Checklist Lengkap

### ✅ Step 1: Fix RLS (5 menit)
- [ ] Buka Supabase Dashboard
- [ ] Buka SQL Editor
- [ ] Paste & run `fix-posts-rls.sql`
- [ ] Verify policies created
- [ ] Refresh homepage di browser
- [ ] Check console - error posts HILANG

### ✅ Step 2: Fix JWT (5 menit)
- [ ] Buka PowerShell
- [ ] Generate secret baru
- [ ] Update `.env.local`
- [ ] Restart `npm run dev`
- [ ] Clear browser cookies
- [ ] Login lagi
- [ ] Check console - JWT error HILANG

---

## 🎯 Verification

Setelah kedua fix dijalankan, cek:

### 1. Console Browser (F12)
✅ **TIDAK ADA ERROR** seperti:
- ❌ "Error fetching published posts"
- ❌ "JWTSessionError: no matching decryption secret"

### 2. Homepage
✅ **Posts section muncul** tanpa error

### 3. Admin Login
✅ **Login sukses** dan redirect ke `/admin`

### 4. Admin Sidebar
✅ **Sidebar muncul** dengan menu Settings, Members, Dashboard, Tools

---

## 📁 File Locations

- **RLS Fix SQL:** `fix-posts-rls.sql` (di root project)
- **JWT Guide:** `FIX_JWT_ERROR.md` (di root project)
- **Environment:** `.env.local` (di root project)

---

## ⏭️ Next Steps (Setelah Fix)

1. ✅ **Verify semua page responsive** (HP/Tablet/Laptop)
2. ✅ **Test upload member photo** dengan drag-drop
3. ✅ **Run data import** (sekbid & members)
4. ✅ **Production build:** `npm run build`

---

## 🆘 Troubleshooting

### RLS Fix Gagal?
- **Error "permission denied":**
  - Gunakan service role key di Supabase SQL Editor (sudah otomatis)
  - Atau run dari Dashboard (bukan local psql)

### JWT Still Error?
- **Check `.env.local` formatting:**
  - Tidak ada spasi sebelum/sesudah `=`
  - Tidak ada quotes (`"`) di sekitar secret
  - Secret tidak terputus/multi-line
  
- **Restart tidak mempan:**
  ```powershell
  # Kill all node processes
  Stop-Process -Name node -Force
  # Then restart
  npm run dev
  ```

### Browser Cache Issue?
- **Hard refresh:**
  - Chrome/Edge: `Ctrl+Shift+R`
  - Firefox: `Ctrl+F5`
  
- **Incognito mode:**
  - Test di incognito untuk isolasi cookies

---

**🕐 Estimasi Total: 10-15 menit**

**Priority: URGENT - Blocking frontend functionality**

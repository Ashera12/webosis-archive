# ⚡ SOLUSI CEPAT: Role Tidak Update / Masih 404

## 🎯 Masalah Kamu

- ✅ Admin sudah update role user di database
- ❌ User masih tidak bisa akses halaman admin
- ❌ Halaman admin masih 404
- ❌ Role lama masih terdeteksi

## 🔥 ROOT CAUSE

Role disimpan di **JWT token** yang di-cache di browser selama **5 menit**.

Saat admin update role, database berubah tapi JWT di browser user masih pakai role lama.

## ✅ SOLUSI (3 Cara)

### Cara 1: REFRESH BROWSER 2X (TERCEPAT)

**User yang role-nya diubah harus:**

1. **Tekan F5** atau Ctrl+R (refresh pertama)
2. **Tunggu 5 detik**
3. **Tekan F5** lagi (refresh kedua)
4. ✅ Role baru aktif!

**Kenapa 2x?**
- Refresh 1: Trigger JWT refresh
- Refresh 2: Pakai JWT baru

### Cara 2: LOGOUT & LOGIN (PALING AMAN)

**User yang role-nya diubah harus:**

1. Klik **Logout**
2. **Login** kembali
3. ✅ Role baru langsung aktif!

### Cara 3: TUNGGU 5 MENIT (OTOMATIS)

- JWT expire setelah 5 menit
- Role otomatis refresh
- User cukup refresh browser setelah 5 menit

---

## 🚀 PERUBAHAN YANG SUDAH DILAKUKAN

### 1. JWT Token Sekarang Refresh Setiap 5 Menit

**Sebelumnya:** 8 jam (role stuck 8 jam!)
**Sekarang:** 5 menit (role update max 5 menit)

File: `lib/auth.ts`
```typescript
session: { 
  maxAge: 5 * 60,      // 5 menit
  updateAge: 60,        // Check setiap 60 detik
}
```

### 2. JWT Callback Selalu Fetch Role dari Database

**Sebelumnya:** Hanya fetch saat login
**Sekarang:** Fetch setiap JWT callback (setiap 60 detik)

File: `lib/auth.ts`
```typescript
// ALWAYS refresh role from database on EVERY jwt callback
const { data: userData } = await supabase
  .from('users')
  .select('role, approved, email_verified')
  .eq('id', userId)
  .single();
```

### 3. Alert Jelas Saat Admin Update Role

**Sekarang saat admin update role, muncul alert:**

```
✅ User berhasil disimpan!

⚠️ PENTING: Role berubah dari "siswa" ke "admin".

User harus:
1. REFRESH browser (F5 atau Ctrl+R)
2. Atau LOGOUT dan LOGIN kembali

Baru role baru akan aktif!
```

File: `app/admin/users/page.tsx`

### 4. API Endpoint untuk Force Refresh Session

Buat endpoint baru: `/api/auth/refresh-session`

User bisa hit endpoint ini untuk trigger refresh session.

---

## 📋 INSTRUKSI UNTUK ADMIN

Setelah update role user:

1. ✅ **WAJIB beritahu user** untuk:
   - Refresh browser 2x (F5 → tunggu 5 detik → F5)
   - Atau logout dan login kembali

2. ✅ **Jangan update role** saat user sedang aktif login
   - Lebih baik update saat user offline

3. ✅ **Test sendiri** dulu:
   - Buat user dummy
   - Update role
   - Login sebagai user tersebut
   - Refresh 2x
   - Cek bisa akses admin panel

---

## 🔍 CARA TEST

### Test di Local:

1. Buka user di admin panel
2. Update role dari `siswa` ke `admin`
3. **PENTING:** Buka browser baru (Incognito)
4. Login sebagai user tersebut
5. Seharusnya sudah bisa akses admin (karena JWT baru)

### Test Role Update Mid-Session:

1. Login sebagai user role `siswa`
2. Buka tab lain, login admin
3. Admin update role user ke `admin`
4. Kembali ke tab user
5. **Refresh 2x** (F5 → tunggu → F5)
6. Cek bisa akses `/admin`

---

## 🚨 TROUBLESHOOTING

### User sudah refresh 2x tapi masih 404

**Solusi:**
```
1. Clear browser cache & cookies
2. Logout dan login kembali
3. Cek di database: role sudah berubah?
```

**Cek Database:**
```sql
SELECT email, role, approved, email_verified 
FROM users 
WHERE email = 'user@example.com';
```

### User sudah logout-login tapi masih 404

**Kemungkinan:**
1. Database belum ter-update
2. Middleware error di Vercel

**Cek Vercel Logs:**
1. Buka Vercel Dashboard → Logs
2. Filter: Runtime Logs
3. Cari: `[NextAuth] jwt - ROLE CHANGED`
4. Cari: `[Middleware] Fetched fresh role from DB`

### Semua user tiba-tiba logout

**Penyebab:** `NEXTAUTH_SECRET` berubah di Vercel

**Fix:**
1. Cek environment variables di Vercel
2. Pastikan `NEXTAUTH_SECRET` sama dengan sebelumnya
3. Jangan ganti `NEXTAUTH_SECRET` kecuali perlu reset semua session

---

## ✅ CHECKLIST DEPLOYMENT

Sebelum test di production:

- [ ] Push ke GitHub ✅ (sudah done)
- [ ] Vercel auto-deploy (~3 menit)
- [ ] Set environment variables di Vercel:
  - [ ] `NEXTAUTH_URL=https://osissmktest.biezz.my.id`
  - [ ] `NEXTAUTH_SECRET=...` (generate: `openssl rand -base64 32`)
  - [ ] `AUTH_TRUST_HOST=true`
- [ ] Redeploy Vercel setelah set env vars
- [ ] Test: login → update role → refresh 2x → role baru aktif

---

## 📖 Dokumentasi Lengkap

Baca: `ROLE_SYSTEM_EXPLAINED.md` untuk penjelasan teknis lengkap.

---

**Commit:** `61c32b3` - CRITICAL FIX: Role system  
**Status:** ✅ Fixed - User harus refresh browser setelah role diubah  
**Next Step:** Set env vars di Vercel dan test

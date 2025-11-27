# ⚡ LANGKAH CEPAT: Fix 404 & Logout di Vercel

## 🎯 Yang Harus Dilakukan SEKARANG:

### Step 1: Set Environment Variables di Vercel

1. **Buka:** https://vercel.com/ashera12/webosis-archive/settings/environment-variables

2. **Tambahkan environment variables ini satu per satu:**

   **NEXTAUTH_URL**
   - Value: `https://osissmktest.biezz.my.id`
   - Environment: ✅ Production ✅ Preview ✅ Development
   
   **NEXTAUTH_SECRET**
   - Value: Generate dengan command ini di terminal:
     ```bash
     openssl rand -base64 32
     ```
   - Copy hasilnya dan paste sebagai value
   - Environment: ✅ Production ✅ Preview ✅ Development
   
   **AUTH_TRUST_HOST**
   - Value: `true`
   - Environment: ✅ Production ✅ Preview ✅ Development

3. **Cek environment variables yang sudah ada:**
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
   - `SUPABASE_SERVICE_ROLE_KEY` ✅
   
   Kalau belum ada, tambahkan juga (ambil dari file `.env.local` lokal).

### Step 2: Redeploy

1. **Buka:** https://vercel.com/ashera12/webosis-archive/deployments

2. **Pilih deployment paling atas** (yang terbaru)

3. **Klik tombol ⋮** (tiga titik) di kanan → **Redeploy**

4. **Konfirmasi** dengan klik Redeploy lagi

5. **Tunggu 3-5 menit** sampai status berubah jadi "Ready"

### Step 3: Test

1. **Clear browser cache & cookies** atau gunakan Incognito/Private window

2. **Buka:** https://osissmktest.biezz.my.id/admin/login

3. **Login** dengan akun super_admin/admin/osis

4. **Test halaman-halaman ini:**
   - https://osissmktest.biezz.my.id/admin (dashboard)
   - https://osissmktest.biezz.my.id/admin/users
   - https://osissmktest.biezz.my.id/admin/data/sekbid
   - https://osissmktest.biezz.my.id/admin/data/members
   
5. **Test logout:**
   - Klik tombol Logout
   - **Harus redirect ke:** `https://osissmktest.biezz.my.id/` 
   - **BUKAN ke:** `http://localhost:3000`

## ✅ Checklist Cepat

- [ ] NEXTAUTH_URL di-set ke `https://osissmktest.biezz.my.id`
- [ ] NEXTAUTH_SECRET di-generate dan di-set
- [ ] AUTH_TRUST_HOST di-set ke `true`
- [ ] Semua env vars di-set untuk Production, Preview, Development
- [ ] Redeploy sudah dilakukan
- [ ] Deployment status = Ready
- [ ] Browser cache sudah di-clear
- [ ] Login berhasil
- [ ] Admin pages bisa diakses (tidak 404)
- [ ] Logout redirect ke domain publik (bukan localhost)

## 🚨 Kalau Masih Bermasalah

### Logout masih ke localhost?
```
✅ Cek NEXTAUTH_URL sudah https://osissmktest.biezz.my.id
✅ Cek AUTH_TRUST_HOST = true
✅ Hard refresh browser (Ctrl+Shift+R)
✅ Test di incognito window
✅ Clear all cookies for domain
```

### Masih 404?
```
✅ Cek Function Logs di Vercel → ada error?
✅ Cek Build Logs → build sukses?
✅ Cek middleware logs → user ter-redirect kemana?
✅ Redeploy ulang setelah yakin semua env vars benar
```

## 📞 Debug Info yang Perlu

Kalau masih error, kirim info ini:
1. Screenshot environment variables di Vercel (sensor secret values)
2. Screenshot deployment status (Ready/Error)
3. URL halaman yang 404
4. Screenshot browser console (F12 → Console tab)
5. Screenshot network tab (F12 → Network → reload page)

---

**Update Terakhir:** Commit `100a659` sudah di-push
**Status:** ✅ Code sudah fix, tinggal set env vars di Vercel

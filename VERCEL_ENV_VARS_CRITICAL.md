# 🚨 CRITICAL: Environment Variables untuk Vercel

## ⚠️ WAJIB DI-SET UNTUK MENGATASI 404 DAN LOGOUT ISSUE

Buka https://vercel.com → Project Settings → Environment Variables

### 1️⃣ NEXTAUTH Configuration (PENTING!)

```env
NEXTAUTH_URL=https://osissmktest.biezz.my.id
NEXTAUTH_SECRET=your-32-char-secret
AUTH_TRUST_HOST=true
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2️⃣ Supabase (WAJIB)

```env
NEXT_PUBLIC_SUPABASE_URL=https://eilrnslorvfrtwjwvbaw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Email (Opsional tapi disarankan)

```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@osissmktest.biezz.my.id
ADMIN_NOTIFICATION_EMAILS=admin@email.com
```

### 4️⃣ Node Environment

```env
NODE_ENV=production
```

## ✅ Checklist Setup Vercel

1. [ ] Masuk ke Vercel Dashboard
2. [ ] Pilih project `webosis-archive`
3. [ ] Klik Settings → Environment Variables
4. [ ] Tambahkan SEMUA env vars di atas
5. [ ] **PENTING**: Set untuk Environment: Production, Preview, Development (pilih semua)
6. [ ] Klik Save untuk setiap variable
7. [ ] Klik Deployments → Redeploy (pilih deployment terakhir → ⋮ → Redeploy)
8. [ ] Tunggu deployment selesai (~3-5 menit)
9. [ ] Test logout → harus ke domain publik, bukan localhost
10. [ ] Test admin pages → tidak boleh 404

## 🔧 Cara Set Environment Variables di Vercel

### Via Dashboard (Recommended):
1. Buka https://vercel.com/ashera12/webosis-archive/settings/environment-variables
2. Click "Add New"
3. Pilih Key (nama variable)
4. Isi Value
5. **Centang semua**: Production, Preview, Development
6. Click Save
7. Ulangi untuk semua variables

### Via Vercel CLI (Alternatif):
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variable
vercel env add NEXTAUTH_URL production
# Paste: https://osissmktest.biezz.my.id

vercel env add NEXTAUTH_SECRET production
# Paste: your-secret-key

vercel env add AUTH_TRUST_HOST production
# Paste: true
```

## 🚀 Redeploy Setelah Set Env Vars

**WAJIB REDEPLOY** agar env vars baru digunakan:

### Via Dashboard:
1. Klik tab "Deployments"
2. Pilih deployment terakhir
3. Klik ⋮ (tiga titik) → "Redeploy"
4. Klik "Redeploy" lagi untuk konfirmasi
5. Tunggu selesai

### Via CLI:
```bash
vercel --prod
```

## 🔍 Verifikasi Env Vars Sudah Ter-Set

1. Buka Vercel Dashboard → Project → Settings → Environment Variables
2. Pastikan semua variable terlihat di list
3. Pastikan ada ikon ✓ di kolom Production

## ❌ Troubleshooting

### Masalah: Logout masih ke localhost
**Solusi:**
- Cek `NEXTAUTH_URL` = domain production (https://osissmktest.biezz.my.id)
- Cek `AUTH_TRUST_HOST` = true
- Clear browser cache & cookies
- Hard refresh (Ctrl+Shift+R)
- Test di incognito/private window

### Masalah: Masih 404 di admin pages
**Solusi:**
- Cek build logs di Vercel → ada error?
- Cek `NEXTAUTH_URL` sudah benar
- Cek middleware logs di Functions logs
- Redeploy ulang setelah set env vars

### Masalah: Environment variables tidak terdeteksi
**Solusi:**
- Pastikan sudah Save setiap variable
- Pastikan centang Production
- **WAJIB Redeploy** setelah tambah env vars
- Wait 3-5 menit untuk propagation

## 📊 Cek Logs untuk Debug

### Function Logs (untuk middleware & API):
1. Vercel Dashboard → Project
2. Tab "Logs" atau "Functions"
3. Filter by: Runtime Logs
4. Cari error messages

### Build Logs:
1. Tab "Deployments"
2. Click deployment terakhir
3. Scroll ke "Build Logs"
4. Cek ada error atau warning

## 💡 Tips

- **Copy exact value** dari .env.local ke Vercel
- **Jangan ada trailing space** di value
- **URL harus lengkap** dengan https:// 
- **Redeploy wajib** setelah ubah env vars
- **Test di incognito** untuk avoid cache

---

**Status**: 🔴 CRITICAL - Wajib di-set sebelum production
**Priority**: TINGGI
**Impact**: Logout & routing tidak berfungsi tanpa ini

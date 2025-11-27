# Panduan Setup Vercel untuk Production

## 📋 Environment Variables yang Diperlukan

### 1. Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. NextAuth Configuration
```env
NEXTAUTH_SECRET=your-secret-key-min-32-char
NEXTAUTH_URL=https://osissmktest.biezz.my.id
AUTH_TRUST_HOST=true
```

### 3. Site URL (Opsional, untuk konsistensi)
```env
NEXT_PUBLIC_SITE_URL=https://osissmktest.biezz.my.id
```

### 4. Email Configuration (Resend)
```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### 5. AI Features (Opsional)
```env
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
```

### 6. Admin Operations (Opsional)
```env
ALLOW_ADMIN_OPS=true
```

## 🚀 Langkah Setup di Vercel

### 1. Login ke Vercel
- Buka https://vercel.com
- Login dengan akun GitHub

### 2. Import Project
- Klik "Add New..." → "Project"
- Pilih repository `webosis-archive`
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

### 3. Konfigurasi Environment Variables
1. Masuk ke Project Settings
2. Klik tab "Environment Variables"
3. Tambahkan semua environment variables di atas
4. **PENTING**: Set untuk Environment: Production, Preview, dan Development

### 4. Deploy
- Klik "Deploy"
- Tunggu build selesai (~2-5 menit)

### 5. Setup Custom Domain (Jika ada)
1. Masuk ke Project Settings → Domains
2. Tambahkan domain: `osissmktest.biezz.my.id`
3. Ikuti instruksi DNS configuration
4. **PENTING**: Setelah domain aktif, update `NEXTAUTH_URL` dengan domain yang sama

## ✅ Checklist Setelah Deploy

### Security & Access
- [ ] Login dengan akun `super_admin` berhasil
- [ ] Logout redirect ke domain publik (bukan localhost)
- [ ] Middleware memblok user non-admin dari `/admin/*`
- [ ] API RBAC berfungsi (hanya super_admin/admin/osis bisa akses)

### Admin Pages (Cek semua halaman ini)
- [ ] `/admin` - Dashboard utama
- [ ] `/admin/users` - Manajemen user
- [ ] `/admin/data/sekbid` - Data seksi bidang
- [ ] `/admin/data/members` - Data anggota
- [ ] `/admin/posts` - Manajemen postingan
- [ ] `/admin/events` - Manajemen event
- [ ] `/admin/gallery` - Manajemen galeri
- [ ] `/admin/announcements` - Pengumuman
- [ ] `/admin/polls` - Polling
- [ ] `/admin/proker` - Program kerja
- [ ] `/admin/settings` - Pengaturan sistem
- [ ] `/admin/terminal` - Terminal admin (khusus super_admin)

### Data & Features
- [ ] Comment menampilkan nickname (`@username`)
- [ ] Instagram username dengan prefix `@`
- [ ] Kelas field tampil di profil
- [ ] NISN field tidak menampilkan data korup
- [ ] Upload gambar/video berfungsi
- [ ] Real-time updates berfungsi

## 🔧 Troubleshooting

### Masalah: 404 di halaman admin
**Solusi:**
1. Cek middleware logs di Vercel Functions logs
2. Pastikan `NEXTAUTH_URL` sama dengan domain production
3. Pastikan `AUTH_TRUST_HOST=true` sudah di-set
4. Redeploy setelah update env variables

### Masalah: Logout ke localhost
**Solusi:**
1. Set `NEXTAUTH_URL=https://osissmktest.biezz.my.id` di Vercel
2. Set `AUTH_TRUST_HOST=true`
3. Redeploy

### Masalah: Session/JWT error
**Solusi:**
1. Cek `NEXTAUTH_SECRET` sudah di-set dan min 32 karakter
2. Generate baru jika perlu: `openssl rand -base64 32`
3. Update di Vercel dan redeploy

### Masalah: Unauthorized meski sudah login
**Solusi:**
1. Cek role di database: `SELECT id, email, role FROM users WHERE email='your@email.com'`
2. Pastikan role salah satu dari: `super_admin`, `admin`, `osis`
3. Role check dilakukan dari DB (bukan session), jadi role update langsung berlaku

### Masalah: Upload file gagal
**Solusi:**
1. Cek Supabase Storage policies (RLS)
2. Cek `SUPABASE_SERVICE_ROLE_KEY` sudah di-set di Vercel
3. Lihat logs di Vercel untuk error detail

## 📊 Monitoring

### 1. Vercel Logs
- Masuk ke Project → Logs
- Filter by: Functions, Runtime Logs
- Cari error atau warning

### 2. Supabase Logs
- Masuk ke Supabase Dashboard → Logs
- Cek API logs untuk query errors
- Cek Auth logs untuk login issues

### 3. Browser Console
- Buka DevTools (F12)
- Cek Console tab untuk error client-side
- Cek Network tab untuk failed API calls

## 🔐 Keamanan

### Best Practices
1. **RBAC Enforcement**: Middleware + API level checks
2. **Service Role Key**: Hanya untuk server-side operations
3. **Session Refresh**: JWT callbacks selalu fetch role dari DB
4. **RLS Policies**: Supabase Row Level Security aktif
5. **Input Validation**: Semua input divalidasi di API

### Data Protection
- NISN, NIK: Hanya admin yang bisa lihat
- Email: Protected by RLS
- Password: Hashed dengan bcrypt
- Session: Encrypted JWT

## 📞 Support

Jika ada masalah:
1. Cek dokumentasi ini terlebih dahulu
2. Lihat logs di Vercel dan Supabase
3. Cek kode di repository untuk understanding
4. Test di local development dulu sebelum deploy

---

**Terakhir diupdate**: 27 November 2025
**Status**: Production Ready ✅

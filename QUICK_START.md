# 🚀 Quick Start Guide

Panduan cepat untuk setup dan menjalankan Website OSIS SMK Informatika Fithrah Insani dalam 10 menit.

---

## ⚡ Prerequisites Check

Pastikan sudah terinstall:

```bash
node --version    # v20.x atau lebih tinggi
npm --version     # v10.x atau lebih tinggi
git --version     # v2.x atau lebih tinggi
```

Belum install? Lihat [INSTALLATION.md](./INSTALLATION.md)

---

## 📦 Step 1: Clone & Install (2 menit)

```bash
# Clone repository
git clone https://github.com/yourusername/webosis-archive.git
cd webosis-archive

# Install dependencies
npm install
```

---

## ⚙️ Step 2: Setup Environment (3 menit)

```bash
# Copy environment template
cp .env.example .env.local

# Edit dengan text editor favorit
code .env.local  # VS Code
nano .env.local  # Terminal
notepad .env.local  # Windows Notepad
```

**Minimal configuration** (untuk development local):

```bash
# Supabase (WAJIB)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth (WAJIB)
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=generate-random-32-char-string

# Generate NEXTAUTH_SECRET:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Belum punya Supabase?** Lihat [SUPABASE_SETUP_LENGKAP.md](./SUPABASE_SETUP_LENGKAP.md)

---

## 🗄️ Step 3: Setup Database (3 menit)

### Option A: Quick Setup (Recommended untuk testing)

1. Buka Supabase Dashboard
2. SQL Editor → New query
3. Copy paste isi file `supabase-schema.sql`
4. Klik "RUN"
5. Ulangi untuk `supabase-super-admin-seed.sql`

### Option B: Detailed Setup

Ikuti panduan lengkap di [SUPABASE_SETUP_LENGKAP.md](./SUPABASE_SETUP_LENGKAP.md)

---

## 🎯 Step 4: Run Development Server (1 menit)

```bash
npm run dev
```

**Output yang diharapkan:**

```
   ▲ Next.js 15.5.4
   - Local:        http://localhost:3001
   - Network:      http://192.168.x.x:3001

 ✓ Ready in 2.3s
```

---

## 🌐 Step 5: Open in Browser (1 menit)

Buka browser dan akses:

**Homepage:** <http://localhost:3001>

**Admin Login:** <http://localhost:3001/admin>

**Default Admin Credentials:**

```
Email:    admin@osissmaitfi.com
Password: admin123
```

⚠️ **PENTING:** Ganti password default setelah login pertama!

---

## ✅ Verification Checklist

Pastikan semua berfungsi:

- [ ] Homepage loads tanpa error
- [ ] Navbar dan Footer muncul
- [ ] Bisa login ke admin panel
- [ ] Dashboard admin shows data
- [ ] Bisa upload image di gallery (optional - butuh storage setup)

---

## 🐛 Troubleshooting Quick Fixes

### Port already in use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Database connection error

1. Check `.env.local` - pastikan SUPABASE_URL dan keys benar
2. Verify di Supabase Dashboard - project aktif
3. Restart dev server: `npm run dev`

### "Module not found" error

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build error

```bash
# Clean build cache
npm run clean
npm run build
```

---

## 📚 Next Steps

Setelah quick start berhasil:

### 1. Configure Social Media APIs (Optional)

Untuk fitur auto-sync Instagram, YouTube, Spotify:

→ [SETUP_API_KEYS.md](./SETUP_API_KEYS.md)

### 2. Setup File Storage

Untuk upload images di gallery dan member photos:

→ [SETUP_STORAGE_BUCKET.md](./SETUP_STORAGE_BUCKET.md)

### 3. Customize Content

- Update member data di Admin Panel
- Upload gallery photos
- Create events dan announcements
- Edit bidang & program kerja

### 4. Deploy to Production

Siap untuk production?

→ [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📖 Complete Documentation

| Dokumen | Untuk Apa |
|---------|-----------|
| [README.md](./README.md) | Overview lengkap proyek |
| [INSTALLATION.md](./INSTALLATION.md) | Instalasi detail semua platform |
| [CONFIGURATION.md](./CONFIGURATION.md) | Konfigurasi lengkap environment |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy ke production |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Panduan kontribusi |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Dokumentasi API endpoints |

---

## 🆘 Need Help?

- 💬 **GitHub Issues:** <https://github.com/yourusername/webosis-archive/issues>
- 📧 **Email:** osis@smaitfi.sch.id
- 📖 **Dokumentasi:** Check folder docs/

---

## 🎉 You're All Set!

Website sudah berjalan! Sekarang Anda bisa:

- ✅ Explore fitur-fitur yang ada
- ✅ Customize sesuai kebutuhan
- ✅ Develop fitur baru
- ✅ Deploy ke production

**Happy coding! 🚀**

---

<div align="center">

Made with ❤️ by OSIS SMK Informatika Fithrah Insani

*Dirgantara 2025 - Bermanfaat bersama, bersinar selamanya*

</div>

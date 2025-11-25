# 🌟 OSIS SMK Informatika Fithrah Insani - Dirgantara 2025

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e?style=for-the-badge&logo=supabase)

**Website resmi OSIS SMK Informatika Fithrah Insani**  
*"Dirgantara 2025 - Bermanfaat bersama, bersinar selamanya"*

[🌐 Live Demo](#) | [📖 Dokumentasi](#dokumentasi) | [🚀 Quick Start](#quick-start)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Prasyarat](#-prasyarat)
- [Quick Start](#-quick-start)
- [Instalasi Lengkap](#-instalasi-lengkap)
- [Konfigurasi](#-konfigurasi)
- [Deployment](#-deployment)
- [Dokumentasi](#-dokumentasi)
- [Struktur Proyek](#-struktur-proyek)
- [Scripts](#-scripts)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

Website OSIS SMK Informatika Fithrah Insani adalah platform web modern yang dirancang untuk mempermudah komunikasi dan informasi antara pengurus OSIS dengan seluruh siswa sekolah. Website ini dilengkapi dengan sistem manajemen konten (CMS), galeri foto, integrasi media sosial, dan dashboard admin yang canggih.

### 🎨 Tema: Dirgantara 2025

"Dirgantara" berasal dari bahasa Sanskerta yang berarti "pemberi cahaya". Tema ini mencerminkan visi OSIS untuk menjadi sumber inspirasi dan manfaat bagi seluruh warga sekolah.

---

## ✨ Fitur Utama

### 🏠 Frontend
- ✅ **Homepage Dinamis** - Hero section dengan animasi modern
- ✅ **Profil OSIS** - Informasi lengkap tentang pengurus dan bidang
- ✅ **Galeri Foto** - Upload dan tampilkan kegiatan dengan infinite scroll
- ✅ **Event & Pengumuman** - Sistem event dan announcement real-time
- ✅ **Program Kerja** - Tampilan program kerja setiap bidang
- ✅ **Integrasi Media Sosial** - Auto-sync dari Instagram, YouTube, Spotify
- ✅ **Multi-bahasa** - Support Bahasa Indonesia & English
- ✅ **Dark Mode** - Theme switcher otomatis
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **PWA Ready** - Progressive Web App support

### 🔐 Admin Panel
- ✅ **Dashboard Analytics** - Statistics dan visualisasi data
- ✅ **Content Management** - CRUD untuk semua konten
- ✅ **Member Management** - Kelola data pengurus OSIS
- ✅ **Gallery Management** - Upload & organize foto
- ✅ **Event Management** - Buat dan kelola event
- ✅ **User Management** - Role-based access control
- ✅ **Rich Text Editor** - TipTap editor untuk konten
- ✅ **Image Upload** - Drag & drop file upload
- ✅ **QR Code Generator** - Generate QR untuk registrasi event

### 🔌 Backend & Database
- ✅ **Supabase Integration** - Real-time database
- ✅ **Authentication** - NextAuth.js dengan multiple providers
- ✅ **API Routes** - RESTful API endpoints
- ✅ **File Storage** - Supabase Storage untuk media
- ✅ **Auto Backup** - Scheduled backup system

---

## 🛠 Teknologi

### Core Framework
- **[Next.js 15.5](https://nextjs.org/)** - React framework dengan App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Type safety

### Styling & UI
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion 12](https://www.framer.com/motion/)** - Animation library
- **[React Icons 5.5](https://react-icons.github.io/react-icons/)** - Icon library

### Database & Auth
- **[Supabase](https://supabase.com/)** - PostgreSQL database & storage
- **[NextAuth.js 5](https://next-auth.js.org/)** - Authentication
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing

### Forms & Validation
- **[React Hook Form 7](https://react-hook-form.com/)** - Form management
- **[Zod 4](https://zod.dev/)** - Schema validation

### Data Visualization
- **[Chart.js 4](https://www.chartjs.org/)** - Chart library
- **[Recharts 3](https://recharts.org/)** - React charts

### Other Libraries
- **[TipTap](https://tiptap.dev/)** - Rich text editor
- **[React Dropzone](https://react-dropzone.js.org/)** - File upload
- **[date-fns](https://date-fns.org/)** - Date utilities
- **[QRCode](https://www.npmjs.com/package/qrcode)** - QR code generator
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

---

## 📦 Prasyarat

### Sistem Requirements

| Software | Versi Minimum | Versi Recommended |
|----------|---------------|-------------------|
| **Node.js** | 18.18.0 | 20.x LTS atau 22.x |
| **npm** | 9.0.0 | 10.x |
| **Git** | 2.0.0 | Latest |

### Akun yang Dibutuhkan
- **Supabase Account** (gratis) - [Daftar di sini](https://supabase.com)
- **Instagram Developer** (optional) - Untuk integrasi Instagram
- **Google Cloud Console** (optional) - Untuk YouTube API
- **Spotify Developer** (optional) - Untuk Spotify integration

### Check Versi yang Terinstall

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

---

## 🚀 Quick Start

Untuk setup cepat dalam 5 menit:

```bash
# 1. Clone repository
git clone https://github.com/yourusername/webosis-archive.git
cd webosis-archive

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan text editor favorit

# 4. Run development server
npm run dev
```

Buka browser di http://localhost:3001

> **Note:** Port default adalah 3001. Untuk mengubahnya, edit `package.json` script `dev`.

---

## 📥 Instalasi Lengkap

### 1️⃣ Clone Repository

```bash
# HTTPS
git clone https://github.com/yourusername/webosis-archive.git

# atau SSH
git clone git@github.com:yourusername/webosis-archive.git

cd webosis-archive
```

### 2️⃣ Install Dependencies

```bash
# Install semua dependencies
npm install

# atau install dengan exact version (recommended untuk production)
npm ci
```

### 3️⃣ Setup Environment Variables

Salin file `.env.example` menjadi `.env.local`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

Edit `.env.local` dan isi dengan kredensial Anda. Lihat [CONFIGURATION.md](./CONFIGURATION.md) untuk panduan lengkap.

### 4️⃣ Setup Database (Supabase)

1. **Buat Supabase Project**
   - Buka https://supabase.com
   - Sign up atau login
   - Klik "New Project"
   - Isi nama project, database password, dan region
   - Tunggu hingga project siap (~2 menit)

2. **Jalankan SQL Migrations**
   - Buka SQL Editor di Supabase Dashboard
   - Copy & paste konten dari `supabase-schema.sql`
   - Klik "Run"
   - Ulangi untuk file SQL lainnya sesuai kebutuhan

3. **Setup Storage Buckets**
   - Lihat panduan di [SETUP_STORAGE_BUCKET.md](./SETUP_STORAGE_BUCKET.md)

4. **Copy API Keys**
   - Buka Project Settings > API
   - Copy `URL` dan `anon/public` key ke `.env.local`

### 5️⃣ Setup Social Media APIs (Optional)

Untuk fitur auto-sync social media, ikuti panduan di:
- [SETUP_API_KEYS.md](./SETUP_API_KEYS.md) - Setup Instagram, YouTube, Spotify

### 6️⃣ Run Development Server

```bash
# Development mode (dengan hot reload)
npm run dev

# Development mode dengan Turbo (lebih cepat)
npm run dev:turbo

# Development mode dengan network access
npm run dev:fast
```

Aplikasi akan berjalan di:
- Local: http://localhost:3001
- Network: http://[YOUR_IP]:3001

---

## ⚙️ Konfigurasi

### Environment Variables

File `.env.local` berisi konfigurasi penting. Template lengkap ada di `.env.example`.

#### Wajib Diisi:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_random_secret_minimum_32_characters
```

#### Optional (untuk fitur tambahan):

```bash
# Social Media APIs
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=...
NEXT_PUBLIC_YOUTUBE_API_KEY=...
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=...
```

**Generate NEXTAUTH_SECRET:**

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Untuk panduan lengkap, lihat [CONFIGURATION.md](./CONFIGURATION.md).

---

## 🚢 Deployment

### Deploy ke Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/webosis-archive)

1. **Push ke GitHub**
   ```bash
   git push origin main
   ```

2. **Import ke Vercel**
   - Login ke [Vercel](https://vercel.com)
   - Klik "Add New Project"
   - Import repository GitHub
   - Configure Project:
     - Framework Preset: Next.js
     - Root Directory: ./
   
3. **Set Environment Variables**
   - Copy semua dari `.env.local`
   - Paste di Vercel Environment Variables
   - Pisahkan untuk Production, Preview, Development

4. **Deploy**
   - Klik "Deploy"
   - Tunggu hingga selesai (~2-3 menit)

### Deploy ke Platform Lain

Panduan lengkap untuk deployment ke:
- Netlify
- Railway
- Digital Ocean
- VPS/Self-hosted

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk detail lengkap.

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [INSTALLATION.md](./INSTALLATION.md) | Panduan instalasi detail untuk Windows, macOS, Linux |
| [CONFIGURATION.md](./CONFIGURATION.md) | Konfigurasi environment variables dan sistem |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Panduan deployment ke berbagai platform |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Panduan untuk kontributor |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Dokumentasi API endpoints |
| [SUPABASE_SETUP_LENGKAP.md](./SUPABASE_SETUP_LENGKAP.md) | Setup Supabase step-by-step |
| [SETUP_API_KEYS.md](./SETUP_API_KEYS.md) | Setup API keys social media |
| [ADMIN_CREDENTIALS.md](./ADMIN_CREDENTIALS.md) | Default admin credentials |
| [TESTING_GUIDE_COMPLETE.md](./TESTING_GUIDE_COMPLETE.md) | Panduan testing |

---

## 📁 Struktur Proyek

```
webosis-archive/
├── app/                      # Next.js App Router
│   ├── (routes)/            # Route groups
│   │   ├── about/           # Halaman About
│   │   ├── admin/           # Admin Panel
│   │   ├── gallery/         # Gallery
│   │   ├── people/          # People/Members
│   │   └── ...
│   ├── api/                 # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── gallery/         # Gallery API
│   │   ├── members/         # Members API
│   │   └── ...
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
│
├── components/              # React Components
│   ├── ui/                  # Reusable UI components
│   ├── admin/               # Admin-specific components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
│
├── lib/                     # Utilities & Helpers
│   ├── supabase/            # Supabase client & helpers
│   ├── utils.ts             # Utility functions
│   └── validators.ts        # Validation schemas
│
├── contexts/                # React Context providers
│   ├── LanguageContext.tsx
│   └── ThemeContext.tsx
│
├── hooks/                   # Custom React Hooks
│   ├── useLocalStorage.ts
│   └── useAuth.ts
│
├── public/                  # Static assets
│   ├── images/
│   ├── icons/
│   └── ...
│
├── scripts/                 # Utility scripts
│   ├── hash-password.js
│   └── ...
│
├── .env.example             # Environment variables template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies & scripts
└── README.md                # This file
```

---

## 📜 Scripts

### Development

```bash
# Start development server (port 3001)
npm run dev

# Start dengan Turbo mode (lebih cepat)
npm run dev:turbo

# Start dengan network access (bisa diakses dari device lain)
npm run dev:fast
```

### Build & Production

```bash
# Build production
npm run build

# Start production server (port 3000)
npm start

# Start production di port 3000
npm run start:prod

# Clean build cache
npm run clean
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Utilities

```bash
# Hash password untuk admin
npm run hash:pw
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### npm install Error

```bash
# Clear cache
npm cache clean --force

# Delete node_modules dan package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Build Error

```bash
# Clean dan rebuild
npm run clean
npm run build
```

### Database Connection Error

1. Check `.env.local` - pastikan SUPABASE_URL dan keys benar
2. Verify di Supabase Dashboard - project aktif
3. Check internet connection
4. Restart dev server

### Image Upload Error

1. Check Supabase Storage buckets sudah dibuat
2. Verify bucket policies (public atau private)
3. Check file size (max 50MB by default)
4. Check file type (hanya image/* allowed)

---

## 🤝 Kontribusi

Kami sangat menghargai kontribusi dari siapapun! Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk panduan lengkap.

### Quick Contribution Guide

1. **Fork** repository ini
2. **Clone** fork Anda
3. **Create branch** untuk fitur/fix Anda
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Commit** perubahan Anda
   ```bash
   git commit -m "Add: amazing feature"
   ```
5. **Push** ke branch
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Create Pull Request**

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](./LICENSE).

---

## 👥 Tim Pengembang

**OSIS SMK Informatika Fithrah Insani - Dirgantara 2025**

- **Ketua OSIS:** [Nama]
- **Sekretaris:** [Nama]
- **Lead Developer:** [Nama]
- **UI/UX Designer:** [Nama]

---

## 📞 Kontak & Support

- **Website:** https://osissmaitfi.com
- **Email:** osis@smaitfi.sch.id
- **Instagram:** [@osissmaitfi](https://instagram.com/osissmaitfi)
- **GitHub Issues:** [Report Bug](https://github.com/yourusername/webosis-archive/issues)

---

## 🙏 Acknowledgments

- Next.js Team untuk framework yang luar biasa
- Vercel untuk platform hosting gratis
- Supabase untuk backend-as-a-service
- Semua contributor dan supporter

---

<div align="center">

**Dibuat dengan ❤️ oleh OSIS SMK Informatika Fithrah Insani**

*Dirgantara 2025 - Bermanfaat bersama, bersinar selamanya*

⭐ Jangan lupa berikan star jika proyek ini bermanfaat!

</div>

## Deployment

Rekomendasi: deploy ke Vercel (integrasi Next.js native). Alternatif: deploy ke Netlify atau platform container.

- Vercel: import repository dan jalankan build command `npm run build`.
- Pastikan environment variables (jika ada) ditetapkan di dashboard deployment.

## Continuous Integration

A GitHub Actions workflow telah ditambahkan: `.github/workflows/ci.yml`. Ia akan menjalankan `npm ci` dan `npm run build` pada setiap push atau pull request ke cabang `main`.

## Struktur Halaman

- `app/page.tsx` - Halaman utama
- `components/*` - Komponen UI
- `public/images/*` - Asset gambar

## Menambahkan SSH Key & Push

Jika Anda menggunakan SSH remote (disarankan):

```bash
# jika belum, buat key: (ganti email)
ssh-keygen -t ed25519 -C "youremail@example.com"
# tambahkan ke GitHub (Settings > SSH and GPG keys)
# lalu push:
git remote add origin git@github.com:biezz-2/osissmaitfi-2.0.git
git branch -M main
git push -u origin main
```

## Lisensi

Proyek ini dilisensikan di bawah MIT License — lihat file `LICENSE`.

## Kontak

Jika perlu bantuan atau ingin kontribusi, buka issue di repository atau hubungi pemilik: https://github.com/biezz-2
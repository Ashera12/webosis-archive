# 🚀 QUICK FIX: Error Setup Guide

## ❌ Error yang Kamu Alami

```
Error parsing `/admin/(?!login).*`
Pattern cannot start with "?" at 8
Invalid source '/admin/(?!login).*'
```

### ✅ **SUDAH DIPERBAIKI!**

File `middleware.ts` sudah diupdate untuk menghilangkan regex pattern yang tidak didukung Next.js.

---

## 🔧 Setup Steps (Wajib Sebelum npm run dev)

### 1. Setup Environment Variables

**Buat file `.env.local`** (copy dari `.env.example`):

```bash
# Di root project
cp .env.example .env.local
```

**Edit `.env.local` dan isi dengan nilai-nilai ini:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=generate_random_secret_here

# Email (Optional - untuk email verification)
EMAIL_FROM=noreply@osis.sch.id
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

### 2. Generate NextAuth Secret

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy output dan paste ke `NEXTAUTH_SECRET` di `.env.local`

---

### 3. Setup Supabase (Jika Belum)

#### A. Buat Project Supabase

1. Go to https://supabase.com
2. Sign in / Sign up
3. Click "New Project"
4. Isi:
   - **Name**: OSIS Web
   - **Database Password**: (simpan password ini!)
   - **Region**: Southeast Asia (Singapore)
5. Wait ~2 minutes untuk project ready

#### B. Get Supabase Credentials

1. Di Supabase Dashboard → **Settings** → **API**
2. Copy nilai-nilai ini:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### C. Run SQL Migrations

1. Di Supabase Dashboard → **SQL Editor**
2. Click "New Query"
3. Copy & paste isi file ini **secara berurutan**:

**Migration 1: Main Schema**
```sql
-- Copy isi file: supabase-schema.sql
-- Run
```

**Migration 2: CMS Schema**
```sql
-- Copy isi file: supabase-cms-schema.sql
-- Run
```

**Migration 3: Data Management**
```sql
-- Copy isi file: supabase-data-management.sql
-- Run
```

**Migration 4: Super Admin Account**
```sql
-- Copy isi file: supabase-super-admin-seed.sql
-- Run
```

4. Verify tables created:
   - Go to **Table Editor**
   - Check tables: `users`, `posts`, `sekbid`, `members`, `page_content`, dll

---

### 4. Verify Setup

```bash
# Run pre-dev check
node scripts/pre-dev-check.js
```

Kalau semua ✅, lanjut ke step 5.

---

### 5. Run Development Server

```bash
npm run dev
```

Server akan jalan di:
- **Local**: http://localhost:3001
- **Network**: http://10.183.248.156:3001 (untuk akses dari device lain)

---

## 🔐 Login ke Admin Panel

1. **Open Browser**: http://localhost:3001/admin/login

2. **Login dengan Super Admin**:
   ```
   Email:    admin@osis.sch.id
   Password: SuperAdmin123!
   ```

3. **Test Features**:
   - Content Management → `/admin/content`
   - Posts CRUD → `/admin/posts`
   - Data Sekbid → `/admin/data/sekbid`
   - Data Members → `/admin/data/members`

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@/lib/supabase/server'"

**Fix:**
```bash
# Install missing dependencies
npm install @supabase/supabase-js @supabase/ssr
```

### Error: "Invalid session strategy"

**Fix:** Check `lib/auth.ts` - pastikan ada:
```typescript
session: { strategy: 'jwt' }
```

### Error: "Middleware failed"

**Fix:** File `middleware.ts` sudah diperbaiki. Pastikan isinya:
```typescript
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Error: "Unauthorized" saat akses admin

**Fix:** 
1. Check `.env.local` - pastikan semua variables ada
2. Restart dev server: `Ctrl+C` → `npm run dev`
3. Clear browser cookies & cache
4. Login ulang

### Error: Database connection failed

**Fix:**
1. Check Supabase project status (buka dashboard)
2. Verify credentials di `.env.local`
3. Check internet connection
4. Restart Supabase project (Settings → General → Pause → Resume)

---

## ✅ Checklist Setup

- [ ] `.env.local` file created & filled
- [ ] NextAuth secret generated
- [ ] Supabase project created
- [ ] Supabase credentials copied to `.env.local`
- [ ] SQL migrations run (4 files)
- [ ] Tables verified in Supabase Table Editor
- [ ] `npm install` completed
- [ ] `node scripts/pre-dev-check.js` passed
- [ ] `npm run dev` running successfully
- [ ] Can access http://localhost:3001
- [ ] Can login to admin panel
- [ ] All admin pages load without errors

---

## 📁 Files Fixed

1. ✅ **middleware.ts** - Removed invalid regex pattern
2. ✅ **lib/auth.ts** - Added `authorized` callback
3. ✅ **contexts/ThemeContext.tsx** - localStorage sync
4. ✅ **contexts/LanguageContext.tsx** - localStorage sync
5. ✅ **All admin pages** - No compilation errors

---

## 🎯 What's Working Now

### ✅ Theme & Language Sync
- **Theme Toggle**: Light/Dark mode persists in localStorage
- **Language Toggle**: ID/EN persists in localStorage
- **Auto-load**: Theme & language restored on page reload
- **Smooth transition**: Animated toggle buttons

### ✅ Authentication
- **Login page**: `/admin/login` accessible without auth
- **Protected routes**: All `/admin/*` routes require login
- **Authorized callback**: Properly checks auth status
- **Session management**: JWT-based sessions

### ✅ Admin Features
- **Content CMS**: Edit all website text/images
- **Posts CRUD**: Create, edit, delete posts with TipTap
- **Data Management**: Manage Sekbid & Members
- **User Management**: Approve/manage users
- **Role-based access**: Super Admin, Admin, OSIS, Moderator

---

## 🚀 Next Steps After Setup

1. **Customize Content**:
   - Go to `/admin/content`
   - Edit homepage title, about text, etc.

2. **Add Sekbid**:
   - Go to `/admin/data/sekbid`
   - Click "Tambah Sekbid"
   - Fill form & save

3. **Add Members**:
   - Go to `/admin/data/members`
   - Click "Tambah Member"
   - Assign to Sekbid

4. **Create Posts**:
   - Go to `/admin/posts/new`
   - Write berita/kegiatan
   - Publish

5. **Change Password**:
   - Go to `/admin/settings`
   - Update default password

---

## 📞 Need Help?

Check documentation files:
- **ADMIN_CREDENTIALS.md** - Login credentials & permissions
- **DATA_MANAGEMENT_GUIDE.md** - How to manage data
- **REGISTRATION_GUIDE.md** - User registration system

---

**🎉 Sekarang error sudah fix dan sistem siap dipakai!**

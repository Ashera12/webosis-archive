# 📘 PANDUAN LENGKAP SETUP SUPABASE - Step by Step

## 🎯 Overview

Kamu akan setup:
1. ✅ Buat Supabase Project (5 menit)
2. ✅ Konfigurasi Database (10 menit)
3. ✅ Run SQL Migrations (5 menit)
4. ✅ Update Environment Variables (2 menit)
5. ✅ Test Connection (3 menit)

**Total Time: ~25 menit**

---

## 📋 Pre-requisites

- [ ] Browser (Chrome/Firefox/Edge)
- [ ] Email untuk sign up Supabase
- [ ] Text editor (VS Code)
- [ ] Terminal/Command Prompt

---

## STEP 1: Buat Supabase Account & Project

### 1.1 Sign Up Supabase

1. **Buka browser** → Go to **https://supabase.com**

2. **Click "Start your project"** atau **"Sign In"**

3. **Sign up dengan:**
   - Option 1: GitHub account (recommended - cepat)
   - Option 2: Email + Password

4. **Verify email** (kalau pakai email signup)
   - Check inbox
   - Click link verifikasi

5. **Login** ke Supabase Dashboard

---

### 1.2 Create New Project

1. **Di Dashboard**, click **"New Project"** (tombol hijau)

2. **Isi Form Project:**

   **Organization:**
   - Kalau belum punya, buat baru: "OSIS Projects" (atau nama bebas)
   - Kalau sudah ada, pilih existing organization

   **Project Details:**
   ```
   Name:              OSIS Web
   Database Password: [PENTING! Simpan password ini!]
                      Contoh: OsisWeb2024!Secure
                      (minimal 8 karakter, ada huruf besar, kecil, angka, simbol)
   
   Region:            Southeast Asia (Singapore)
                      ↑ Pilih ini untuk latency terbaik dari Indonesia
   
   Pricing Plan:      Free (cukup untuk development)
   ```

3. **SIMPAN DATABASE PASSWORD!**
   ```
   Database Password: ___________________________
   (tulis di notepad/notes - kamu akan butuh ini nanti!)
   ```

4. **Click "Create new project"**

5. **Wait ~2-3 minutes** - Supabase akan setup database
   - Status akan berubah dari "Setting up project..." → "Ready"
   - Jangan tutup tab!

---

### 1.3 Get Project Credentials

Setelah project ready (ada checkmark hijau):

1. **Go to Settings** (icon gear di sidebar kiri)

2. **Click "API"** di submenu

3. **Copy 3 Credentials ini:**

   **A. Project URL**
   ```
   Configuration → Project URL
   
   Contoh: https://abcdefghijklmnop.supabase.co
   
   Copy → Simpan di notepad:
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   ```

   **B. Anon (Public) Key**
   ```
   Project API keys → anon public
   
   Format: eyJhbGci... (panjang banget ~200+ characters)
   
   Copy → Simpan di notepad:
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

   **C. Service Role Key**
   ```
   Project API keys → service_role
   ⚠️ WARNING: Keep this secret! Jangan share ke public!
   
   Click "Reveal" → Copy
   Format: eyJhbGci... (juga panjang)
   
   Copy → Simpan di notepad:
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

4. **Sekarang kamu punya 3 credentials!** ✅

---

## STEP 2: Update Environment Variables

### 2.1 Buka File `.env.local`

```bash
# Di VS Code atau text editor
# File location: webosis-archive/.env.local
```

### 2.2 Replace Placeholder Values

**SEBELUM:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
```

**SESUDAH:** (paste credentials yang tadi kamu copy)
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTU4NzU5MCwiZXhwIjoxOTU1MTYzNTkwfQ.abc123...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM5NTg3NTkwLCJleHAiOjE5NTUxNjM1OTB9.xyz789...
```

### 2.3 Save File

```bash
Ctrl+S (Windows) atau Cmd+S (Mac)
```

✅ Environment variables ready!

---

## STEP 3: Run SQL Migrations

### 3.1 Buka SQL Editor

1. **Di Supabase Dashboard** → Click **"SQL Editor"** (icon di sidebar kiri)

2. **Click "New Query"** (tombol +)

---

### 3.2 Migration 1: Main Database Schema

1. **Buka file**: `supabase-schema.sql` di VS Code

2. **Select ALL** (Ctrl+A) → **Copy** (Ctrl+C)

3. **Paste** di SQL Editor Supabase

4. **Click "Run"** (tombol play biru) atau tekan **Ctrl+Enter**

5. **Wait ~5 seconds** - akan muncul "Success. No rows returned"

6. **Verify Tables Created:**
   - Click **"Table Editor"** di sidebar
   - Harusnya ada tables: `users`, `posts`, `events`, `gallery_items`, dll
   - Total ~10+ tables

✅ **Migration 1 DONE!**

---

### 3.3 Migration 2: CMS Schema

1. **New Query** lagi (click tombol +)

2. **Buka file**: `supabase-cms-schema.sql`

3. **Copy ALL** → **Paste** → **Run**

4. **Verify:**
   - Check Table Editor
   - Harusnya ada table baru: `page_content`, `media`

✅ **Migration 2 DONE!**

---

### 3.4 Migration 3: Data Management Schema

1. **New Query** lagi

2. **Buka file**: `supabase-data-management.sql`

3. **Copy ALL** → **Paste** → **Run**

4. **Verify:**
   - Check Table Editor
   - Harusnya ada: `sekbid`, `members`
   - Harusnya sudah ada data seed (6 sekbid, 4 sample members)

5. **Check Seed Data:**
   - Click table `sekbid` → Browse rows
   - Harusnya ada 6 rows (Sekbid 1-6)

✅ **Migration 3 DONE!**

---

### 3.5 Migration 4: Super Admin Account

1. **New Query** lagi

2. **Buka file**: `supabase-super-admin-seed.sql`

3. **Copy ALL** → **Paste** → **Run**

4. **Verify Admin Created:**
   ```sql
   -- Run query ini di SQL Editor untuk check:
   SELECT 
     id, 
     email, 
     name, 
     role, 
     email_verified, 
     approved,
     created_at
   FROM users
   WHERE email = 'admin@osis.sch.id';
   ```

5. **Expected Output:**
   ```
   id  | email              | name                  | role        | email_verified | approved | created_at
   ----+--------------------+-----------------------+-------------+----------------+----------+------------------
   1   | admin@osis.sch.id  | Super Administrator   | super_admin | true           | true     | 2024-11-11...
   ```

✅ **Migration 4 DONE!**

---

### 3.6 Final Verification - Check All Tables

Run this query untuk list semua tables:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Tables (minimum):**
```
Table Name          | Columns
--------------------+---------
announcements       | 8
events              | 12
gallery_items       | 10
media               | 7
members             | 11
page_content        | 9
polls               | 9
poll_options        | 6
posts               | 14
program_kerja       | 9
sekbid              | 8
users               | 13
```

✅ **All Tables Created!**

---

## STEP 4: Test Database Connection

### 4.1 Test dari VS Code Terminal

```bash
# Restart server untuk load new env vars
# Ctrl+C untuk stop server yang lagi jalan
npm run dev
```

### 4.2 Check Console Output

Harusnya muncul:
```
✓ Ready in 3.2s
○ Compiling /
✓ Compiled / in 1234ms
```

**Kalau ada error:**
```
Error: Invalid Supabase URL
```
→ Check `.env.local`, pastikan URL benar (no typos!)

---

### 4.3 Test Login

1. **Buka Browser** → http://localhost:3001/admin/login

2. **Login dengan:**
   ```
   Email:    admin@osis.sch.id
   Password: SuperAdmin123!
   ```

3. **Expected:**
   - ✅ Redirect ke `/admin` (dashboard)
   - ✅ Sidebar shows menu
   - ✅ No errors in browser console (F12)

4. **Kalau sukses login** → 🎉 **DATABASE CONNECTION WORKING!**

---

## STEP 5: Verify Data Access

### 5.1 Test Content Management

1. **Go to**: http://localhost:3001/admin/content

2. **Expected:**
   - List of editable content (Home, About, Navbar)
   - No "Error fetching" messages

3. **Try Edit:**
   - Click "Edit" on any item
   - Change value
   - Click "Save"
   - Should show success message

---

### 5.2 Test Data Management

1. **Go to**: http://localhost:3001/admin/data/sekbid

2. **Expected:**
   - 6 cards showing Sekbid 1-6
   - Icons, colors, descriptions

3. **Go to**: http://localhost:3001/admin/data/members

4. **Expected:**
   - 4 sample members (Ketua, Wakil, Sekretaris, Bendahara)

---

### 5.3 Test Posts

1. **Go to**: http://localhost:3001/admin/posts

2. **Click**: "Buat Post Baru"

3. **Fill form:**
   - Title: "Test Post"
   - Content: Type something
   - Category: Berita
   - Sekbid: Any

4. **Click**: "Simpan sebagai Draft"

5. **Expected:**
   - Success message
   - Redirect to posts list
   - Your post appears in list

✅ **All Features Working!**

---

## 🔍 Troubleshooting

### Problem: "Invalid Supabase URL"

**Solution:**
1. Check `.env.local` - pastikan URL format benar:
   ```
   ✅ Correct: https://abcdefgh.supabase.co
   ❌ Wrong:   https://abcdefgh.supabase.co/
   ❌ Wrong:   abcdefgh.supabase.co
   ```

2. No trailing slash!
3. Must start with `https://`

---

### Problem: "Invalid API Key"

**Solution:**
1. Re-copy keys dari Supabase Dashboard
2. Pastikan copy FULL key (jangan kepotong)
3. Keys biasanya 200+ characters
4. Start dengan `eyJhbGci...`

---

### Problem: "Failed to connect to database"

**Solution:**
1. Check Supabase project status:
   - Dashboard → Home
   - Status harus "Healthy" (hijau)
   
2. Kalau "Paused":
   - Click "Restore project"
   - Wait 1 minute

3. Check internet connection

---

### Problem: "Table does not exist"

**Solution:**
1. SQL migrations belum jalan semua
2. Re-run migrations yang gagal
3. Check Table Editor - pastikan table ada

---

### Problem: "Row Level Security policy violation"

**Solution:**
1. RLS policies belum aktif
2. Re-run migration yang bersangkutan
3. Check di SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
   Should return multiple policies

---

### Problem: Login gagal "Invalid credentials"

**Possible causes:**

1. **Admin account belum dibuat**
   - Re-run `supabase-super-admin-seed.sql`
   - Verify dengan query di Step 3.5

2. **Password salah**
   - Default: `SuperAdmin123!` (case-sensitive!)
   - Ada uppercase S, A, angka 123, exclamation mark

3. **Email typo**
   - Must be exactly: `admin@osis.sch.id`
   - No spaces!

---

## 📊 Database Schema Overview

### Core Tables

**users** - All user accounts
- Columns: id, email, password, name, role, email_verified, approved
- Roles: super_admin, admin, osis, moderator, siswa, other

**posts** - Blog posts/news
- Columns: id, title, slug, content, excerpt, featured_image, category, sekbid_id, author_id, status, views, published_at
- Categories: Berita, Kegiatan, Pengumuman, Tips

**events** - Event management
- Columns: id, title, description, start_date, end_date, location, max_participants, registration_open, qr_code

**sekbid** - Seksi Bidang OSIS
- Columns: id, nama, deskripsi, icon, color, order_index, active

**members** - OSIS Members
- Columns: id, nama, jabatan, sekbid_id, foto_url, instagram, email, quotes, order_index, active

**page_content** - CMS editable content
- Columns: id, page_key, content_type, content_value, category, editable_by, metadata

---

## 🎯 Quick Checklist

Setelah setup selesai, check semua ini:

- [ ] Supabase project created & healthy
- [ ] Database password saved securely
- [ ] 3 credentials copied to `.env.local`
- [ ] All 4 SQL migrations run successfully
- [ ] 15+ tables visible in Table Editor
- [ ] 6 sekbid seed data exists
- [ ] 4 sample members exists
- [ ] Super Admin account exists
- [ ] Server restart (npm run dev)
- [ ] Login works with admin@osis.sch.id
- [ ] Dashboard loads without errors
- [ ] Content page loads data
- [ ] Sekbid page shows 6 cards
- [ ] Can create test post

---

## 🎓 Understanding Supabase Concepts

### What is Supabase?

Supabase = "Open source Firebase alternative"
- **Database**: PostgreSQL (SQL database)
- **Auth**: Built-in authentication
- **Storage**: File storage
- **Realtime**: Live data updates
- **APIs**: Auto-generated REST & GraphQL APIs

### How Our App Uses Supabase

1. **Database (PostgreSQL)**
   - Stores users, posts, events, members, etc.
   - SQL queries via Supabase client

2. **Row Level Security (RLS)**
   - Table-level permissions
   - Example: Only admin can delete posts
   - Automatically enforced

3. **API Keys**
   - `anon key`: Public, safe for frontend
   - `service_role key`: Private, admin access, server-only

4. **NextAuth Integration**
   - NextAuth handles login UI
   - Supabase stores user data
   - Password hashing with bcrypt

---

## 📚 Next Steps After Setup

### 1. Customize Content
- Go to `/admin/content`
- Edit homepage title, about text
- Upload images (use image URLs for now)

### 2. Add Real Sekbid Data
- Go to `/admin/data/sekbid`
- Edit existing sekbid or add new ones
- Customize icons, colors, descriptions

### 3. Add Real Members
- Go to `/admin/data/members`
- Replace sample members with real OSIS members
- Add photos, Instagram handles, quotes

### 4. Create Posts
- Go to `/admin/posts/new`
- Write berita/kegiatan
- Use TipTap editor for rich formatting
- Publish or save as draft

### 5. Invite Users
- Share registration link: http://localhost:3001/register
- Users sign up → you approve via `/admin/users`
- Assign roles (OSIS, Moderator, etc.)

---

## 🔒 Security Best Practices

### DO's ✅

1. **Keep `service_role` key SECRET**
   - Never commit to Git
   - Never share publicly
   - Only use server-side

2. **Change default admin password**
   - After first login
   - Use strong password (12+ chars)

3. **Enable 2FA** (when available)

4. **Regular backups**
   - Supabase auto-backups (Free tier: daily)
   - Manual backup: SQL Editor → Export

5. **Monitor usage**
   - Dashboard → Usage
   - Check queries, storage, bandwidth

### DON'Ts ❌

1. **Don't share database password**
2. **Don't commit `.env.local` to Git** (already in .gitignore)
3. **Don't use production keys in development**
4. **Don't disable RLS policies** (unless you know what you're doing)

---

## 🆘 Getting Help

### If Stuck:

1. **Check Supabase Logs**
   - Dashboard → Logs → Postgres Logs
   - Look for errors

2. **Check Browser Console**
   - F12 → Console tab
   - Look for network errors

3. **Check Server Logs**
   - Terminal where `npm run dev` runs
   - Look for Supabase connection errors

4. **Supabase Docs**
   - https://supabase.com/docs
   - Very detailed & helpful

5. **Our Documentation**
   - `ADMIN_CREDENTIALS.md` - Login info
   - `DATA_MANAGEMENT_GUIDE.md` - How to use admin
   - `FINAL_STATUS.md` - System overview

---

## ✅ Success Criteria

You're done when:

✅ Supabase Dashboard shows "Healthy" status
✅ All 15+ tables exist in Table Editor
✅ Can login to admin panel
✅ Dashboard loads with stats
✅ Content management page shows data
✅ Sekbid page shows 6 cards
✅ Members page shows 4 members
✅ Can create & save new post
✅ No errors in browser console
✅ No errors in terminal

---

**🎉 SELAMAT! Supabase setup complete! Sekarang kamu bisa pakai semua fitur admin!**

---

## 📞 Quick Reference

### Supabase Dashboard
- URL: https://supabase.com/dashboard
- SQL Editor: Run queries & migrations
- Table Editor: View/edit data
- Logs: Debug errors
- Settings → API: Get credentials

### Local Development
- Admin Panel: http://localhost:3001/admin
- Login: admin@osis.sch.id / SuperAdmin123!
- Public Site: http://localhost:3001

### Important Files
- `.env.local` - Environment variables (DO NOT COMMIT!)
- `supabase-*.sql` - Database migrations (4 files)
- `lib/supabase/server.ts` - Supabase client config

### Commands
```bash
# Start dev server
npm run dev

# Pre-dev check
node scripts/pre-dev-check.js

# Generate admin password hash
node scripts/generate-admin-hashes.js
```

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0
**Author:** Your Dev Team

# 🚀 Setup Supabase Storage untuk Gallery

## Step 1: Buat Storage Bucket

1. **Buka Supabase Dashboard**: https://app.supabase.com
2. **Pilih project kamu**
3. **Klik Storage di sidebar kiri**
4. **Klik "New bucket"**
5. **Isi form:**
   - Name: `gallery`
   - Public bucket: **CENTANG (ON)** ✅
   - File size limit: 50 MB (atau sesuai kebutuhan)
   - Allowed MIME types: `image/*` (atau kosongkan untuk semua)
6. **Klik "Create bucket"**

## Step 2: Set Storage Policy (Public Read Access)

Setelah bucket dibuat:

1. **Klik bucket "gallery"** yang baru dibuat
2. **Klik tab "Policies"** di atas
3. **Klik "New Policy"**
4. **Pilih template: "Enable read access for all users"**
   - Atau manual buat policy:
     - Policy name: `Public Read Access`
     - Allowed operation: **SELECT** ✅
     - Target roles: `public`
5. **Klik "Review"** → **"Save policy"**

## Step 3: Enable Insert for Authenticated Users (Optional)

Kalau mau authenticated users bisa upload langsung dari browser:

1. **Masih di Policies**, klik "New Policy"
2. **Pilih template: "Enable insert for authenticated users only"**
   - Atau manual:
     - Policy name: `Authenticated Insert`
     - Allowed operation: **INSERT** ✅
     - Target roles: `authenticated`
3. **Save**

## Step 4: Test Upload

Test apakah bucket sudah bekerja:

1. **Klik bucket "gallery"**
2. **Klik "Upload file"**
3. **Upload foto test** (jpg, png, dll)
4. **Setelah upload, klik file → klik "Get URL"**
5. **Copy URL**, formatnya: 
   ```
   https://[project-id].supabase.co/storage/v1/object/public/gallery/[filename]
   ```
6. **Paste URL di browser** - foto harus langsung muncul! ✅

## Step 5: Cek di Code

Setelah bucket ready, restart dev server dan test upload!

## Troubleshooting

**Kalau bucket tidak muncul:**
- Refresh browser
- Cek apakah Supabase project sudah aktif

**Kalau upload error "Policy not found":**
- Pastikan policy "Public Read Access" sudah dibuat
- Cek policy target roles = `public`

**Kalau image tidak bisa diakses:**
- Pastikan bucket setting **"Public bucket" = ON**
- Cek URL format benar

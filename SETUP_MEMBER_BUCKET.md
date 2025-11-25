# Setup Bucket Members di Supabase Storage

## Quick Guide - Buat Bucket "members"

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com/dashboard
- Pilih project Anda
- Klik **Storage** di menu kiri

### 2. Buat Bucket Baru
```sql
-- Atau via SQL Editor, jalankan:
INSERT INTO storage.buckets (id, name, public)
VALUES ('members', 'members', true);
```

**Via UI:**
- Klik **New Bucket**
- Name: `members`
- Public: **ON** ✅
- Klik **Create Bucket**

### 3. Set Policy Public (agar bisa diakses publik)
Buka **Policies** di bucket `members`, tambah policy:

```sql
-- Policy: Public Access (Read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'members' );

-- Policy: Authenticated Upload (hanya user login bisa upload)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'members'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated Delete (hanya user login bisa hapus)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'members'
  AND auth.role() = 'authenticated'
);
```

### 4. Update .env.local
Tambahkan baris ini di `.env.local`:

```bash
NEXT_PUBLIC_MEMBER_BUCKET=members
```

### 5. Restart Dev Server
```powershell
# Stop server (Ctrl+C), lalu:
npm run dev
```

## Verifikasi
- Upload foto member baru via Admin → Members
- Cek folder `members/` di Supabase Storage dashboard
- URL publik: `https://your-project.supabase.co/storage/v1/object/public/members/members/filename.jpg`

## Troubleshooting
- **403 Forbidden saat upload**: Cek policy authenticated upload ada & benar.
- **404 saat akses foto**: Pastikan bucket `public = true` dan policy SELECT public ada.
- **CORS error**: Tambahkan domain di Storage Settings → CORS allowed origins.

---
**Catatan:** Jika tidak buat bucket `members`, sistem otomatis pakai bucket `gallery` (default).

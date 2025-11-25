# 🔧 Panduan Fix Gallery & Members

## ❌ Masalah yang Diperbaiki

1. **Gallery Edit Error**: "Could not find the 'updated_at' column of 'gallery' in the schema cache"
2. **Members Sekbid Dropdown**: Tidak ada pilihan sekbid saat tambah/edit member

## ✅ Solusi yang Diterapkan

### 1. Gallery API Fix
- **File**: `app/api/admin/gallery/[id]/route.ts`
- **Perbaikan**: Menghapus manual `updated_at` update, biarkan database trigger yang handle
- **Reason**: Schema cache mungkin belum ter-refresh setelah migration

### 2. Members Sekbid Dropdown Fix
- **File**: `app/admin/data/members/page.tsx`
- **Perbaikan**: API `/api/admin/sekbid` mengembalikan array langsung, bukan `{sekbid: []}`
- **Changed**: `setSekbids(sekbidData.sekbid || [])` → `setSekbids(Array.isArray(sekbidData) ? sekbidData : [])`

### 3. Members API Enhancement
- **Files**: 
  - `app/api/admin/members/route.ts` (POST)
  - `app/api/admin/members/[id]/route.ts` (PUT)
- **Perbaikan**: Tambahkan support untuk field `email`, `quote`, dan `display_order`
- **Sekarang semua field ini disimpan ke database**:
  - ✅ name
  - ✅ role
  - ✅ sekbid_id
  - ✅ photo_url
  - ✅ class
  - ✅ instagram
  - ✅ email (NEW)
  - ✅ quote (NEW)
  - ✅ display_order (NEW)
  - ✅ is_active

### 4. Database Migration
- **File**: `FIX_GALLERY_MEMBERS.sql`
- **Isi**:
  - Memastikan `gallery.updated_at` column dan trigger exists
  - Memastikan `members.email` column exists
  - Refresh schema cache
  - Verify semua columns

## 🚀 Cara Menjalankan Fix

### Langkah 1: Jalankan SQL Migration
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy isi file `FIX_GALLERY_MEMBERS.sql`
3. Paste ke SQL Editor
4. Klik **Run**
5. Lihat output untuk memastikan semua berhasil

### Langkah 2: Test Gallery Edit
1. Buka admin panel → **Gallery**
2. Klik **Edit & Crop** pada salah satu foto
3. Ubah title atau description
4. Klik **Simpan**
5. ✅ Seharusnya berhasil tanpa error "updated_at column"

### Langkah 3: Test Members Sekbid Dropdown
1. Buka admin panel → **Data** → **Members**
2. Klik **Tambah Member** atau **Edit** member yang ada
3. Lihat dropdown **Sekbid**
4. ✅ Seharusnya tampil pilihan:
   - -- Tidak ada sekbid --
   - Ketaqwaan
   - Keilmuan
   - Keterampilan
   - Kewirausahaan
   - Olahraga & Seni
   - Sosial & Lingkungan

### Langkah 4: Test Members Form Lengkap
1. Test form dengan semua field:
   - ✅ Nama
   - ✅ Role (Ketua OSIS, Wakil Ketua, dll)
   - ✅ Sekbid (dropdown)
   - ✅ Urutan Tampil (number)
   - ✅ Instagram (@username)
   - ✅ Email
   - ✅ Kelas
   - ✅ Member Aktif (checkbox)
   - ✅ Quote / Motto (textarea)
   - ✅ Foto (upload)
2. Klik **Simpan**
3. ✅ Refresh halaman, data harus tersimpan semua

## 📋 Checklist Verifikasi

- [ ] SQL migration berhasil dijalankan
- [ ] Gallery edit berfungsi tanpa error
- [ ] Members sekbid dropdown menampilkan 6 sekbid
- [ ] Members form menyimpan semua field dengan benar
- [ ] Email field tersimpan di database
- [ ] Quote field tersimpan di database
- [ ] Display order field tersimpan di database
- [ ] Photo upload berfungsi
- [ ] Edit member existing data berfungsi
- [ ] Delete member berfungsi

## 🐛 Troubleshooting

### Jika Gallery Masih Error
```sql
-- Jalankan ini di Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gallery' AND table_schema = 'public';

-- Pastikan ada kolom 'updated_at' dengan tipe 'timestamp with time zone'
```

### Jika Sekbid Dropdown Masih Kosong
1. Buka Browser Console (F12)
2. Lihat tab Network
3. Cari request ke `/api/admin/sekbid`
4. Lihat response - harus return array dengan 6 items
5. Jika kosong, cek database apakah ada data di tabel `sekbid`

### Jika Email/Quote Tidak Tersimpan
```sql
-- Verify kolom email exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'members' 
  AND table_schema = 'public' 
  AND column_name = 'email';

-- Jika tidak ada, jalankan:
ALTER TABLE public.members ADD COLUMN email TEXT;
```

## 📝 Notes

- **Gallery updated_at**: Sekarang di-handle otomatis oleh database trigger, tidak perlu manual update dari API
- **Members API**: Semua field form sekarang properly tersimpan ke database
- **Sekbid Dropdown**: Data di-fetch langsung dari `/api/admin/sekbid` yang return array 6 sekbid (id 1-6)
- **Schema Cache**: SQL migration include `NOTIFY pgrst, 'reload schema'` untuk refresh cache

## ✨ Hasil Akhir

Setelah fix ini:
- ✅ Gallery edit berfungsi sempurna dengan auto updated_at
- ✅ Members form lengkap dengan semua field (nama, role, sekbid, email, quote, instagram, class, photo, display_order, is_active)
- ✅ Sekbid dropdown menampilkan 6 pilihan + opsi "Tidak ada sekbid"
- ✅ Semua data tersimpan dengan benar ke database
- ✅ Edit dan delete member berfungsi
- ✅ Role dropdown berfungsi dengan 6 opsi role

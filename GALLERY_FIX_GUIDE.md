# 🔧 PANDUAN FIX GALLERY ERROR

## ❌ ERROR YANG MUNCUL:
```
Error fetching gallery: {}
```

## 🎯 PENYEBAB:
Gallery table kemungkinan belum dibuat di Supabase atau RLS policy bermasalah.

## ✅ SOLUSI - IKUTI LANGKAH INI:

### Step 1: Buka Supabase Dashboard
1. Buka https://supabase.com/dashboard
2. Login dengan akun kamu
3. Pilih project: **eilrnslorvfrtwjwvbaw**
4. Klik **SQL Editor** di sidebar kiri

### Step 2: Test Gallery Table
1. Di SQL Editor, buat **New Query**
2. Copy-paste isi file `test-gallery-table.sql`
3. Klik **Run** atau tekan `Ctrl + Enter`
4. Lihat hasil:
   - Jika `table_exists` = 0 → Table belum dibuat
   - Jika `table_exists` = 1 → Table sudah ada

### Step 3: Jika Table Belum Ada
1. Buat New Query lagi
2. Copy-paste isi file `supabase-schema.sql`
3. Klik **Run**
4. Tunggu sampai selesai (biasanya 5-10 detik)
5. Cek di **Table Editor** → Harus ada table `gallery`

### Step 4: Test di Website
1. Buka http://localhost:3001/gallery
2. Seharusnya tidak ada error lagi
3. Kembali ke http://localhost:3001/admin/gallery
4. Coba tambah foto baru

---

## 🚀 TESTING SYNC

### Test Gallery Sync:
1. Login admin: http://localhost:3001/admin/login
2. Masuk Gallery: http://localhost:3001/admin/gallery
3. Klik **Tambah Foto**
4. Isi form:
   - **Judul**: Test Foto OSIS
   - **URL Gambar**: https://picsum.photos/800/600
   - **Deskripsi**: Foto testing sync
5. Klik **Tambah**
6. Buka tab baru: http://localhost:3001/gallery
7. **Foto harus LANGSUNG muncul!** ✅

### Test Edit:
1. Di admin, klik **Edit** pada foto
2. Ubah judul jadi: "Test Edit Berhasil"
3. Klik **Update**
4. Refresh tab public gallery
5. Judul harus berubah ✅

### Test Delete:
1. Di admin, klik **Hapus** pada foto
2. Confirm delete
3. Refresh tab public gallery
4. Foto harus hilang ✅

---

## 🎨 FITUR BARU YANG SUDAH DITAMBAHKAN:

### 1. ✅ Button "View Public Website"
- **Lokasi**: Sidebar admin (paling atas)
- **Warna**: Biru gradient
- **Icon**: 🌐 Globe
- **Fungsi**: Buka website public di tab baru
- **Tetap login** saat buka public web

### 2. ✅ Gallery Sync Complete
- Admin tambah → Langsung di public
- Admin edit → Update realtime
- Admin hapus → Hilang dari public
- Loading state saat fetch data
- Empty state saat belum ada foto

---

## 📋 FITUR SELANJUTNYA (BELUM AKTIF):

### 1. Events System
- [ ] Admin bisa CRUD events
- [ ] Public bisa lihat calendar events
- [ ] Registrasi peserta event
- [ ] Download Excel list peserta

### 2. Announcements
- [ ] Admin bisa CRUD pengumuman
- [ ] Muncul di homepage (sidebar)
- [ ] Priority level (urgent, high, medium, low)
- [ ] Auto-hide setelah expire

### 3. Polls/Voting
- [ ] Admin buat polling
- [ ] Siswa bisa vote (sekali per user)
- [ ] Real-time hasil voting
- [ ] Chart pie/bar hasil

### 4. Theme & Language Persist
- [ ] Dark mode tetap saat pindah admin ↔ public
- [ ] Bahasa (ID/EN) tetap tersimpan
- [ ] Simpan di localStorage
- [ ] Auto-sync antar tab

---

## 🐛 TROUBLESHOOTING:

### Error: "Cannot find name 'supabaseAdmin'"
**Fix**: Sudah diperbaiki di `lib/supabase/client.ts`

### Error: "Property 'src' does not exist"
**Fix**: Sudah diganti jadi `image_url`

### Gallery masih kosong setelah tambah foto
1. Check console browser (F12)
2. Lihat Network tab → Cari request ke `/api/admin/gallery`
3. Status harus 200 atau 201
4. Jika 401 → Login ulang
5. Jika 500 → Check Supabase dashboard

### Foto tidak muncul (broken image)
1. URL gambar harus valid (https://...)
2. URL harus bisa diakses public
3. Test URL di browser dulu sebelum submit
4. Gunakan placeholder: `https://picsum.photos/800/600?random=1`

---

## 📞 NEXT STEPS:

1. **Jalankan test-gallery-table.sql** di Supabase
2. **Test tambah foto** di admin
3. **Verify sync** ke public web
4. **Report hasil** testing
5. **Lanjut aktivasi** Events/Announcements/Polls

---

Dibuat: November 2025
Update terakhir: Sekarang

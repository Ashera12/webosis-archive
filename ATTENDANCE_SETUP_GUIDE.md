# Setup Absensi Siswa & Guru - Panduan Lengkap

## 📋 Overview

Sistem absensi dengan keamanan berlapis:
- ✅ **Role-based access**: super_admin, admin, osis (full access) | siswa, guru (restricted)
- ✅ **WiFi validation**: Harus terhubung ke WiFi sekolah
- ✅ **Geofencing**: Harus berada di area sekolah (radius tertentu)
- ✅ **Biometric**: Fingerprint hash + foto selfie
- ✅ **First-time setup**: Wajib registrasi biometrik sebelum absen pertama

---

## 🗄️ Step 1: Setup Database di Supabase

### 1.1 Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project **webosis-archive**
3. Klik **SQL Editor** di sidebar kiri

### 1.2 Eksekusi SQL Schema
1. Copy seluruh isi file `CREATE_ATTENDANCE_TABLES.sql`
2. Paste ke SQL Editor
3. Klik **Run** atau tekan `Ctrl+Enter`
4. Pastikan muncul pesan sukses

**File yang akan dibuat:**
- ✅ Table `attendance` - Data absensi check-in/out
- ✅ Table `user_biometric` - Data fingerprint & foto referensi
- ✅ Table `school_location_config` - Konfigurasi lokasi sekolah
- ✅ RLS Policies - Row-level security untuk semua table
- ✅ Indexes - Optimasi performa query

### 1.3 Verifikasi Tables
```sql
-- Cek apakah tables sudah dibuat
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attendance', 'user_biometric', 'school_location_config');
```

---

## 📦 Step 2: Setup Storage Bucket

### 2.1 Buat Bucket "attendance"
1. Klik **Storage** di sidebar Supabase
2. Klik **Create a new bucket**
3. Nama bucket: `attendance`
4. **Public bucket**: ✅ Yes (centang)
5. Klik **Create bucket**

### 2.2 Buat Folders
Buat 2 folder di dalam bucket `attendance`:
1. `selfies/` - Untuk foto selfie saat check-in
2. `reference/` - Untuk foto referensi biometric setup

### 2.3 Konfigurasi Security
```sql
-- Jalankan di SQL Editor untuk set bucket policies
CREATE POLICY "Allow authenticated users to upload selfies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attendance' AND (storage.foldername(name))[1] = 'selfies');

CREATE POLICY "Allow authenticated users to read selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attendance' AND (storage.foldername(name))[1] = 'selfies');

CREATE POLICY "Allow authenticated users to upload reference photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attendance' AND (storage.foldername(name))[1] = 'reference');
```

---

## 📍 Step 3: Konfigurasi Lokasi Sekolah

### 3.1 Dapatkan Koordinat GPS Sekolah
Gunakan salah satu cara:
1. **Google Maps**: Klik kanan pada lokasi sekolah → Copy coordinates
2. **GPS Phone**: Buka Maps di HP, tap lokasi sekolah
3. **Manual Input**: Latitude & Longitude

Contoh koordinat:
- SMK Fithrah Insani: `-6.xxxxx, 106.xxxxx`

### 3.2 Insert Data Lokasi Sekolah
```sql
-- Jalankan di SQL Editor Supabase
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_wifi_ssids,
  is_active
) VALUES (
  'SMK Fithrah Insani',        -- Ganti dengan nama sekolah
  -6.xxxxx,                     -- Ganti dengan latitude sekolah
  106.xxxxx,                    -- Ganti dengan longitude sekolah
  100,                          -- Radius dalam meter (100m = area sekolah)
  ARRAY['SchoolWiFi', 'AdminWiFi', 'OSISWiFi'],  -- Ganti dengan SSID WiFi sekolah
  true                          -- Aktif
);
```

### 3.3 Update Setelah Setup
Jika perlu update konfigurasi:
```sql
-- Update koordinat
UPDATE school_location_config 
SET latitude = -6.xxxxx, longitude = 106.xxxxx
WHERE location_name = 'SMK Fithrah Insani';

-- Update WiFi yang diizinkan
UPDATE school_location_config 
SET allowed_wifi_ssids = ARRAY['WiFiSekolah1', 'WiFiSekolah2', 'WiFiKantor']
WHERE location_name = 'SMK Fithrah Insani';

-- Update radius (dalam meter)
UPDATE school_location_config 
SET radius_meters = 150  -- Perbesar radius jika area sekolah luas
WHERE location_name = 'SMK Fithrah Insani';
```

---

## 📦 Step 4: Install Dependencies

### 4.1 Install FingerprintJS (untuk browser fingerprinting)
```powershell
npm install @fingerprintjs/fingerprintjs
```

### 4.2 Verifikasi Installation
```powershell
npm list @fingerprintjs/fingerprintjs
```

---

## 🧪 Step 5: Testing

### 5.1 Test sebagai Admin
1. Login sebagai user dengan role `super_admin`, `admin`, atau `osis`
2. Buka: `http://localhost:3000/admin/attendance`
3. Pastikan halaman admin panel terbuka tanpa error
4. Cek fitur:
   - ✅ Filter by role (siswa/guru)
   - ✅ Filter by status
   - ✅ Filter by tanggal
   - ✅ Export to CSV

### 5.2 Test sebagai Siswa/Guru (First-time Setup)
1. Login sebagai user dengan role `siswa` atau `guru`
2. Buka: `http://localhost:3000/attendance`
3. Akan muncul modal **Biometric Setup**:
   - Kamera akan menyala untuk ambil foto selfie
   - Browser akan generate fingerprint hash
   - Klik **Setup Biometric**
   - Tunggu hingga sukses
4. Setelah setup, halaman reload dan siap untuk absen

### 5.3 Test Check-in (siswa/guru)
**Persyaratan:**
- ✅ Sudah setup biometric
- ✅ Terhubung ke WiFi sekolah (atau WiFi yang ada di `allowed_wifi_ssids`)
- ✅ Berada di area sekolah (dalam radius yang ditentukan)

**Flow:**
1. Buka halaman attendance
2. Browser akan:
   - Cek WiFi connection
   - Minta izin akses lokasi (Allow)
   - Validasi jarak dari sekolah
   - Cek biometric data
3. Jika semua validasi pass:
   - Tombol **Check In** akan aktif (hijau)
   - Kamera akan menyala untuk foto selfie
   - Klik **Check In**
4. Sukses: Muncul notifikasi sukses check-in

### 5.4 Test Check-out
1. Setelah check-in, tombol berubah jadi **Check Out**
2. Klik **Check Out**
3. Sistem akan hitung durasi kehadiran
4. Data disimpan dengan status complete

### 5.5 Test Admin View
1. Login sebagai admin
2. Buka `/admin/attendance`
3. Pastikan data absensi siswa/guru muncul:
   - Nama user
   - Role (siswa/guru)
   - Check-in time
   - Check-out time (jika sudah checkout)
   - Durasi
   - Status verified (pending/verified)
4. Test fitur:
   - Klik **Detail** untuk lihat foto selfie dan lokasi
   - Klik **Verify** untuk verifikasi absensi
   - Klik **Export CSV** untuk download data

---

## 🚀 Step 6: Deployment

### 6.1 Commit & Push ke GitHub
```powershell
git add .
git commit -m "feat: Complete attendance system setup"
git push origin main
```

### 6.2 Vercel Auto-Deploy
Setelah push ke GitHub, Vercel akan otomatis deploy.

### 6.3 Set Environment Variables di Vercel
Pastikan environment variables sudah ada:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=your_production_url
NEXTAUTH_SECRET=your_nextauth_secret
```

### 6.4 Test Production
1. Buka URL production (https://webosis-archive.vercel.app)
2. Test semua flow seperti di localhost
3. Pastikan WiFi validation, location check, biometric berfungsi

---

## 📊 Monitoring & Maintenance

### Check Total Absensi Hari Ini
```sql
SELECT COUNT(*) as total_today
FROM attendance
WHERE DATE(check_in_time) = CURRENT_DATE;
```

### Check User Belum Check-out
```sql
SELECT u.full_name, a.check_in_time, u.role
FROM attendance a
JOIN users u ON a.user_id = u.id
WHERE DATE(a.check_in_time) = CURRENT_DATE
AND a.check_out_time IS NULL;
```

### Attendance Rate Siswa (Bulan Ini)
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'present') * 100.0 / COUNT(*) as attendance_rate
FROM attendance a
JOIN users u ON a.user_id = u.id
WHERE u.role = 'siswa'
AND DATE_TRUNC('month', a.check_in_time) = DATE_TRUNC('month', CURRENT_DATE);
```

### Top 10 Siswa Paling Rajin
```sql
SELECT 
  u.full_name,
  COUNT(*) as total_hadir,
  COUNT(*) FILTER (WHERE a.status = 'late') as terlambat
FROM attendance a
JOIN users u ON a.user_id = u.id
WHERE u.role = 'siswa'
AND DATE_TRUNC('month', a.check_in_time) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.full_name
ORDER BY total_hadir DESC
LIMIT 10;
```

---

## ⚠️ Troubleshooting

### Error: "WiFi not connected"
**Solusi:**
- Pastikan WiFi SSID sudah ditambahkan ke `allowed_wifi_ssids`
- Browser tidak bisa langsung detect WiFi SSID (privacy)
- Untuk production: gunakan manual input atau native app

### Error: "Location not available"
**Solusi:**
- Pastikan browser sudah dapat izin akses lokasi
- Cek apakah GPS HP/laptop aktif
- Pastikan HTTPS (geolocation hanya jalan di HTTPS)

### Error: "Outside school bounds"
**Solusi:**
- Cek koordinat sekolah sudah benar
- Perbesar `radius_meters` jika area sekolah luas
- Verifikasi lokasi user dengan Google Maps

### Error: "Biometric not setup"
**Solusi:**
- User harus setup biometric terlebih dahulu
- Buka `/attendance` dan ikuti wizard setup
- Pastikan kamera bisa diakses oleh browser

### Error: "Camera access denied"
**Solusi:**
- Browser meminta izin kamera, klik **Allow**
- Cek settings browser jika kamera diblock
- Pastikan HTTPS (camera hanya jalan di HTTPS)

---

## 📱 Mobile Optimization

Untuk pengalaman terbaik di HP:
1. Gunakan PWA (Progressive Web App)
2. Install app di home screen
3. Notifikasi reminder untuk absen
4. Offline support (coming soon)

---

## 🎯 Next Features (Optional)

- [ ] QR Code untuk check-in cepat
- [ ] Notifikasi email jika tidak absen
- [ ] Dashboard analytics untuk admin
- [ ] Export ke Excel dengan grafik
- [ ] Integrasi dengan sistem nilai
- [ ] Auto check-out di jam pulang sekolah
- [ ] Rekap absensi bulanan PDF
- [ ] SMS gateway untuk orang tua

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi ini dulu
2. Lihat console browser untuk error details
3. Check Supabase logs di dashboard
4. Contact: [Your contact info]

---

**Status:** ✅ Ready for Production (setelah setup database & storage)

**Last Updated:** 29 November 2025

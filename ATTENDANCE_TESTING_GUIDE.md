# Panduan Testing Sistem Absensi

## ✅ Checklist Testing Lengkap

### 1. Setup Database (WAJIB DILAKUKAN PERTAMA)

#### a. Buat Tabel di Supabase
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy isi file `CREATE_ATTENDANCE_TABLES.sql`
5. Paste dan **Run** query
6. Verifikasi tabel terbuat:
   - `attendance_records`
   - `biometric_data`
   - `school_location_config`

#### b. Setup Storage Bucket
1. Buka **Storage** di Supabase
2. Klik **New Bucket**
3. Nama: `attendance`
4. Public: ✅ (centang)
5. Klik **Create Bucket**
6. Buka bucket `attendance`
7. Buat 2 folder:
   - `selfies/` (untuk foto check-in)
   - `reference/` (untuk foto referensi biometrik)

#### c. Install Dependencies
```bash
# FingerprintJS TIDAK DIPERLUKAN - sudah menggunakan Web Crypto API native
npm install qrcode.react
```

Verifikasi instalasi:
```bash
npm list qrcode.react
```

---

### 2. Konfigurasi Lokasi & WiFi (Admin)

#### a. Login sebagai Admin
1. Buka: `https://webosis.vercel.app/admin/login`
2. Login dengan akun admin/super_admin/osis

#### b. Setup Lokasi Sekolah
1. Dari dashboard admin, klik **"Absensi"** (Quick Actions card)
2. Klik **"Konfigurasi"** di pojok kanan atas
3. Di bagian **Lokasi Sekolah**:
   - Nama Lokasi: `SMK Fithrah Insani` (contoh)
   - Klik **"Gunakan Lokasi Saat Ini"** (browser akan minta izin GPS)
   - Atau masukkan manual:
     - Latitude: `-6.123456` (contoh)
     - Longitude: `106.123456` (contoh)
   - Radius: `100` meter (default, bisa diubah 50-500m)
4. Verifikasi preview: Klik link **"Lihat di Google Maps"**

#### c. Tambah WiFi SSID
1. Di bagian **WiFi yang Diizinkan**:
   - Ketik nama WiFi sekolah: `WiFiSekolah1`
   - Klik **Tambah**
   - Tambahkan semua WiFi sekolah (WiFi kantor, lab, dll)
   - Minimal 1 SSID harus ada
2. Klik **"Simpan Konfigurasi"**
3. Tunggu notifikasi: ✅ **"Konfigurasi berhasil disimpan!"**

#### d. QR Code
1. Scroll ke bagian **QR Code Link Absensi**
2. Screenshot QR code
3. Bagikan ke siswa/guru via WhatsApp/email/print

---

### 3. Test sebagai Siswa/Guru

#### a. Login dan Navigasi
1. Login sebagai user dengan role `siswa` atau `guru`
2. Setelah login, Anda akan di dashboard
3. **Verifikasi widget absensi muncul**:
   - ✅ Ada card "Absensi Hari Ini"
   - ✅ Menampilkan status: "Belum Absen Hari Ini"
   - ✅ Ada tombol "Absen Sekarang"

#### b. Akses Halaman Absensi (3 Cara)
**Cara 1: Dari Dashboard**
- Klik tombol **"Absen Sekarang"** di widget

**Cara 2: Dari Quick Actions**
- Klik tombol biru **"Absensi"** (dengan ikon kalender)

**Cara 3: Scan QR Code**
- Scan QR code yang dibagikan admin
- Akan langsung ke halaman absensi

#### c. Setup Biometrik (Pertama Kali)
1. Halaman akan menampilkan wizard **"Setup Biometrik"**
2. **Step 1 - Browser Fingerprint**:
   - Klik **"Generate Fingerprint"**
   - Tunggu proses (2-3 detik)
   - ✅ Muncul: "Fingerprint berhasil dibuat"
   
3. **Step 2 - Foto Referensi**:
   - Klik **"Ambil Foto"**
   - Browser minta izin kamera → **Allow**
   - Posisikan wajah di depan kamera
   - Klik **"Capture"**
   - Preview foto muncul
   - Klik **"Simpan & Lanjutkan"**
   - ✅ Muncul: "Biometrik berhasil didaftarkan"

#### d. Check-in Pertama Kali
**Persiapan:**
- ✅ Terhubung ke WiFi sekolah (SSID yang terdaftar)
- ✅ GPS aktif di perangkat
- ✅ Berada di area sekolah (dalam radius)

**Proses Check-in:**
1. Halaman akan otomatis validasi:
   - 🔍 Mengecek WiFi... ✅
   - 🔍 Mengecek Lokasi GPS... ✅
   - 🔍 Verifikasi Biometrik... ✅

2. Jika semua valid, muncul tombol **"Check-in"**
3. Klik **"Check-in"**
4. Kamera akan terbuka otomatis
5. Ambil foto selfie
6. Klik **"Submit Absensi"**
7. ✅ Notifikasi: **"Absensi berhasil disimpan!"**

#### e. Verifikasi di Dashboard
1. Kembali ke dashboard
2. **Widget Absensi** sekarang menampilkan:
   - Status: ✅ **"Hadir"** (atau **"Terlambat"** jika telat)
   - Check-in: `07:30` (waktu Anda check-in)
   - Check-out: **Belum**
   - Tombol: **"Check-out Sekarang"**

#### f. Check-out
1. Saat pulang sekolah, buka halaman absensi lagi
2. Halaman otomatis deteksi sudah check-in
3. Muncul tombol **"Check-out"**
4. Klik **"Check-out"**
5. Ambil foto selfie lagi
6. Klik **"Submit"**
7. ✅ Notifikasi: **"Check-out berhasil!"**

#### g. Lihat Riwayat
1. Di halaman absensi, scroll ke bawah
2. Tabel **"Riwayat Absensi"** menampilkan:
   - Tanggal
   - Check-in / Check-out
   - Status (Hadir/Terlambat)
   - Durasi
   - Verifikasi admin (✅/⏳)

---

### 4. Test sebagai Admin

#### a. Lihat Data Absensi
1. Login sebagai admin
2. Dashboard → Klik **"Absensi"**
3. Halaman menampilkan:
   - Total absensi hari ini
   - Filter: Tanggal, Role (Siswa/Guru), Status
   - Tabel semua absensi

#### b. Filter Data
1. **Filter by Date:**
   - Pilih tanggal: `2024-01-15`
   - Data otomatis update

2. **Filter by Role:**
   - Pilih: `siswa` → Hanya siswa
   - Pilih: `guru` → Hanya guru
   - Pilih: `all` → Semua

3. **Filter by Status:**
   - Pilih: `present` → Hanya hadir
   - Pilih: `late` → Hanya terlambat

#### c. Detail & Verifikasi
1. Klik tombol **"Detail"** pada salah satu record
2. Modal muncul menampilkan:
   - Nama lengkap
   - Role & kelas
   - Waktu check-in/out
   - Foto selfie check-in
   - Foto selfie check-out (jika ada)
   - Lokasi GPS
   - WiFi SSID
   - Browser fingerprint
   - Device info

3. Klik **"Verifikasi Absensi"**
4. ✅ Status berubah jadi **Verified**

#### d. Export Data
1. Klik **"Export CSV"** di pojok kanan atas
2. File `attendance_YYYY-MM-DD.csv` otomatis download
3. Buka di Excel/Google Sheets
4. Data berisi: ID, Nama, Role, Tanggal, Check-in, Check-out, Status, Verified

---

### 5. Test Keamanan & Validasi

#### a. Test WiFi Validation
**Scenario 1: WiFi Salah**
- Disconnect dari WiFi sekolah
- Connect ke WiFi lain (rumah/hotspot)
- Buka halaman absensi
- ❌ Error: **"Anda harus terhubung ke WiFi sekolah"**

**Scenario 2: WiFi Benar**
- Connect ke WiFi sekolah (SSID terdaftar)
- Buka halaman absensi
- ✅ Validasi WiFi berhasil

**Catatan:** 
WiFi detection di browser terbatas. Untuk produksi penuh gunakan:
- Native mobile app (iOS/Android)
- Browser extension
- Backend validation

#### b. Test Location Validation
**Scenario 1: Lokasi Jauh**
- Buka halaman absensi dari rumah (>100m dari sekolah)
- Browser minta izin GPS → Allow
- ❌ Error: **"Anda berada di luar area sekolah"**
- Menampilkan jarak: "Jarak Anda: 2.5 km dari sekolah"

**Scenario 2: Lokasi Valid**
- Buka dari area sekolah (dalam radius)
- ✅ Validasi lokasi berhasil
- Tombol check-in aktif

**Test GPS Akurasi:**
1. Gunakan `enableHighAccuracy: true` (sudah diimplementasi)
2. Akurasi biasanya 5-20 meter di outdoor
3. Indoor bisa 20-100 meter

#### c. Test Biometric Security
**Scenario 1: Belum Setup**
- User baru login pertama kali
- ❌ Tidak bisa check-in
- Muncul wizard setup biometrik

**Scenario 2: Ganti Device**
- Login dari device berbeda
- Fingerprint berbeda
- ❌ Error: **"Device tidak dikenali"**
- Harus setup ulang biometrik (admin bisa reset)

**Scenario 3: Device Sama**
- Login dari device yang sama
- Fingerprint match
- ✅ Langsung bisa check-in

#### d. Test Foto Selfie
**Scenario 1: Kamera Tidak Diizinkan**
- Browser minta izin kamera
- User klik **Block**
- ❌ Error: **"Kamera diperlukan untuk absensi"**

**Scenario 2: Kamera Diizinkan**
- User klik **Allow**
- Webcam aktif
- ✅ Bisa ambil foto

**Verifikasi Foto:**
1. Admin buka detail absensi
2. Lihat foto selfie
3. Bandingkan dengan foto referensi
4. Verifikasi manual jika perlu

---

### 6. Test Edge Cases

#### a. Double Check-in
**Test:**
- User sudah check-in pagi
- Coba check-in lagi
- ❌ Error: **"Anda sudah check-in hari ini"**
- Tombol berubah jadi **"Check-out"**

#### b. Check-out Tanpa Check-in
**Test:**
- User belum check-in
- Coba akses halaman absensi sore
- ❌ Hanya ada tombol **"Check-in"**
- Tidak bisa check-out

#### c. Absensi Tengah Malam
**Test:**
- Buka halaman jam 00:30 (lewat tengah malam)
- Sistem reset untuk hari baru
- ✅ Bisa check-in untuk hari baru
- Data kemarin tersimpan di riwayat

#### d. Concurrent Check-in
**Test:**
- 2 siswa check-in bersamaan (dalam 1 detik)
- ✅ Keduanya berhasil
- Database handle concurrent writes

---

### 7. Performance & Mobile Testing

#### a. Mobile Responsiveness
**Test di berbagai device:**

**Phone (320px - 640px):**
- ✅ Text readable (text-xs, sm)
- ✅ Buttons min 44px height (touch target)
- ✅ Images scaled properly
- ✅ No horizontal scroll
- ✅ Forms easy to fill

**Tablet (640px - 1024px):**
- ✅ 2 columns layout
- ✅ Larger text (text-sm, base)
- ✅ More spacing

**Desktop (>1024px):**
- ✅ Full layout
- ✅ 3+ columns where applicable
- ✅ Max-width containers

**Real Device Testing:**
1. iPhone (Safari): Test camera, GPS
2. Android (Chrome): Test camera, GPS
3. Desktop (Chrome/Firefox/Safari): All features

#### b. Load Time
**Metrics:**
- Page load: < 2s
- Check-in submit: < 3s
- Camera open: < 1s
- GPS detection: < 5s

**Tools:**
- Chrome DevTools → Lighthouse
- Target: 90+ Performance Score

#### c. Offline Handling
**Test:**
- Disconnect internet
- Buka halaman absensi
- ❌ Error: **"Koneksi internet diperlukan"**
- Data tidak hilang (localStorage backup)

---

### 8. Data Validation & Sync

#### a. Users Table Sync
**Verifikasi:**
1. Buka Supabase → Table Editor → `attendance_records`
2. Pilih record mana saja
3. Check kolom `user_id`
4. Buka tabel `users` → cari user dengan ID sama
5. ✅ Data match: full_name, email, role, kelas

**Test JOIN Query:**
```sql
SELECT 
  a.*,
  u.full_name,
  u.email,
  u.role,
  u.kelas
FROM attendance_records a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.date = CURRENT_DATE;
```

#### b. Configuration Changes
**Test:**
1. Admin ubah lokasi sekolah
2. Ubah radius dari 100m → 200m
3. Klik **Simpan**
4. User langsung refresh halaman
5. ✅ Validasi menggunakan radius baru (200m)

**Test:**
1. Admin tambah WiFi SSID baru: `WiFiLab`
2. Klik **Simpan**
3. User connect ke `WiFiLab`
4. ✅ Validasi WiFi berhasil

---

### 9. Security Testing

#### a. Role-Based Access
**Test 1: Viewer Role**
- Login sebagai `viewer`
- Coba akses `/attendance`
- ❌ Error: **"Anda tidak memiliki akses"**

**Test 2: Guest (Not Logged In)**
- Logout
- Akses `/attendance`
- ❌ Redirect ke `/login`

**Test 3: Admin Access**
- Login sebagai `admin`
- Akses `/admin/attendance`
- ✅ Bisa lihat semua data

**Test 4: Siswa Lihat Data Lain**
- Login sebagai siswa
- Coba akses `/api/attendance/history?userId=OTHER_ID`
- ❌ Error atau hanya dapat data sendiri

#### b. RLS (Row Level Security)
**Verifikasi di Supabase:**
```sql
-- Test as siswa
SELECT * FROM attendance_records;
-- Should only return own records

-- Test as admin
SELECT * FROM attendance_records;
-- Should return all records
```

#### c. SQL Injection
**Test:**
- Input nama WiFi: `'; DROP TABLE attendance_records; --`
- Klik Tambah
- ✅ Disimpan sebagai string biasa
- ✅ Tidak execute SQL

#### d. XSS (Cross-Site Scripting)
**Test:**
- Input nama lokasi: `<script>alert('XSS')</script>`
- Klik Simpan
- ✅ Di-escape, tidak execute script

---

### 10. Error Handling

#### a. API Errors
**Test 500 Error:**
- Temporary putuskan Supabase connection
- Coba check-in
- ❌ Error: **"Terjadi kesalahan server"**
- ✅ Error message user-friendly

**Test 400 Bad Request:**
- Send invalid data via API
- ❌ Error: **"Data tidak valid"**

#### b. Network Errors
**Test:**
- Set Chrome DevTools → Network → Offline
- Coba submit absensi
- ❌ Error: **"Koneksi terputus"**
- ✅ Data tersimpan di localStorage (untuk retry)

#### c. Permission Errors
**Test Camera:**
- Block camera permission
- ❌ Error: **"Izin kamera diperlukan"**
- ✅ Tampilkan instruksi cara enable

**Test GPS:**
- Block location permission
- ❌ Error: **"Izin lokasi diperlukan"**
- ✅ Tampilkan instruksi cara enable

---

## 📊 Checklist Lengkap

### Setup (Sekali Saja)
- [ ] Database tables created
- [ ] Storage bucket created (`attendance/selfies`, `attendance/reference`)
- [ ] Dependencies installed (`qrcode.react`)
- [ ] Admin configured location & WiFi
- [ ] QR code shared to users

### Functionality Testing
- [ ] User can access attendance page (3 ways)
- [ ] Widget shows on dashboard (siswa/guru only)
- [ ] Biometric setup works (fingerprint + photo)
- [ ] Check-in successful with photo
- [ ] Check-out successful
- [ ] History displays correctly
- [ ] Admin can view all data
- [ ] Admin can filter data (date/role/status)
- [ ] Admin can export CSV
- [ ] Admin can verify attendance
- [ ] QR code generates correctly

### Security Testing
- [ ] WiFi validation works
- [ ] GPS location validation works
- [ ] Biometric fingerprint validation works
- [ ] Role-based access control works
- [ ] RLS policies work
- [ ] No SQL injection
- [ ] No XSS vulnerabilities
- [ ] Double check-in prevented

### Mobile Testing
- [ ] Responsive on phone (320px-640px)
- [ ] Responsive on tablet (640px-1024px)
- [ ] Responsive on desktop (>1024px)
- [ ] Camera works on mobile
- [ ] GPS works on mobile
- [ ] Touch targets are 44px+
- [ ] Text is readable

### Data Validation
- [ ] User data syncs with `users` table
- [ ] Configuration changes apply immediately
- [ ] CSV export contains correct data
- [ ] Timestamps are correct (timezone)
- [ ] Photos upload to storage successfully

---

## 🐛 Known Limitations

### 1. WiFi Detection
**Current Status:** Limited in browsers
- Browser API tidak expose WiFi SSID untuk security
- Saat ini menggunakan mock/placeholder
- **Solusi Produksi:**
  - Native mobile app (React Native/Flutter)
  - Browser extension dengan network access
  - Server-side validation via network logs

### 2. GPS Accuracy
**Indoor:** 20-100 meter akurasi
**Outdoor:** 5-20 meter akurasi
**Solusi:**
- Set radius lebih besar (200m+) untuk area luas
- Combine dengan WiFi validation
- Manual verification oleh admin jika perlu

### 3. Face Recognition
**Current:** Hanya simpan foto, tidak ada face matching
**Upgrade Future:**
- Integrate face-api.js atau AWS Rekognition
- Auto-detect face similarity antara selfie dan foto referensi
- Alert admin jika wajah tidak match

### 4. Browser Fingerprint
**Current:** Menggunakan Web Crypto API native
**Coverage:**
- User agent, screen resolution, timezone, language
- Canvas fingerprinting untuk uniqueness lebih tinggi
- WebGL fingerprinting untuk GPU detection
- SHA-256 hashing untuk privacy

**Accuracy:** ~85-95% (cukup untuk identify device yang sama)
**Privacy:** Hash tidak reversible, tidak menyimpan data mentah

---

## 🚀 Next Steps

### Phase 2 Features (Optional)
1. **Advanced Biometric**
   - Integrate face-api.js untuk face matching
   - Compare selfie dengan foto referensi
   - Alert admin jika wajah tidak match (similarity < 70%)

2. **Push Notifications**
   - Reminder check-in (07:00)
   - Reminder check-out (15:00)

3. **Analytics Dashboard**
   - Grafik kehadiran per hari/minggu/bulan
   - Siswa paling rajin/sering telat
   - Export monthly report

3. **Email Notifications**
   - Email ke ortu jika siswa tidak hadir
   - Weekly summary untuk admin

4. **Leave Management**
   - Siswa bisa ajukan izin/sakit via app
   - Admin approve/reject
   - Auto-update attendance status

5. **Beacon/NFC Support**
   - Siswa tap NFC tag di gate sekolah
   - More accurate location than GPS

---

## 📞 Troubleshooting

### "Cannot find module 'qrcode.react'"
```bash
npm install qrcode.react --save
npm install --save-dev @types/qrcode.react
```

### "Geolocation not supported"
- Pastikan HTTPS (bukan HTTP)
- Vercel auto-deploy uses HTTPS ✅

### "Camera not working"
- Pastikan HTTPS
- Check browser permissions
- Try different browser

### "RLS policy error"
- Verify user role di session
- Check RLS policies di Supabase
- Re-run CREATE_ATTENDANCE_TABLES.sql

### "Data tidak sinkron dengan users table"
- Verify foreign key exists: `attendance_records.user_id → users.id`
- Check JOIN query di `/api/admin/attendance/route.ts`

---

## ✅ Production Deployment Checklist

- [ ] Database tables created in production Supabase
- [ ] Storage bucket created with public access
- [ ] RLS policies enabled
- [ ] Environment variables set in Vercel
- [ ] HTTPS enabled (Vercel default)
- [ ] QR code updated with production URL
- [ ] Admin configured production location/WiFi
- [ ] Test on real devices (iOS + Android)
- [ ] Load testing (50+ concurrent users)
- [ ] Backup strategy in place
- [ ] Error monitoring (Sentry/LogRocket)
- [ ] User training completed
- [ ] Documentation shared with admin

---

**Dibuat:** 29 November 2024  
**Update Terakhir:** 29 November 2024  
**Versi:** 1.0.0

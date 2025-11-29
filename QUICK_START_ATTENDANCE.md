# 🚀 Quick Start - Sistem Absensi

## 1. Setup Database (5 Menit)

### Buka Supabase SQL Editor
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

### Copy-Paste Query Ini:
```sql
-- 1. Tabel Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present',
  selfie_url TEXT,
  checkout_selfie_url TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  wifi_ssid TEXT,
  browser_fingerprint TEXT,
  device_info JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Biometric Data
CREATE TABLE IF NOT EXISTS biometric_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  fingerprint_template TEXT NOT NULL,
  reference_photo_url TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel School Location Config
CREATE TABLE IF NOT EXISTS school_location_config (
  id BIGSERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  allowed_wifi_ssids TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes untuk Performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_biometric_user ON biometric_data(user_id);

-- 5. RLS Policies untuk Security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_location_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own attendance
CREATE POLICY IF NOT EXISTS "Users can view own attendance"
  ON attendance_records FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert own attendance
CREATE POLICY IF NOT EXISTS "Users can insert own attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admin can view all attendance
CREATE POLICY IF NOT EXISTS "Admin can view all attendance"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'osis')
    )
  );

-- Policy: Admin can update attendance
CREATE POLICY IF NOT EXISTS "Admin can update attendance"
  ON attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'osis')
    )
  );

-- Policy: Users can manage own biometric
CREATE POLICY IF NOT EXISTS "Users can manage own biometric"
  ON biometric_data FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Admin can view config
CREATE POLICY IF NOT EXISTS "Admin can view config"
  ON school_location_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'osis')
    )
  );

-- Policy: Admin can manage config
CREATE POLICY IF NOT EXISTS "Admin can manage config"
  ON school_location_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'osis')
    )
  );
```

### Klik **Run** (atau tekan F5)

✅ **Done!** Database siap.

---

## 2. Setup Storage Bucket (2 Menit)

### Buka Supabase Storage
1. Klik **Storage** di sidebar
2. Klik **New Bucket**
3. Nama bucket: **`attendance`**
4. Public: **✅ Centang** (agar foto bisa diakses)
5. Klik **Create Bucket**

### Buat Folders
1. Buka bucket **attendance**
2. Klik **New Folder** → Nama: **`selfies`** → Create
3. Klik **New Folder** → Nama: **`reference`** → Create

✅ **Done!** Storage siap.

---

## 3. Konfigurasi Lokasi Sekolah (1 Menit)

### Login sebagai Admin
1. Buka: `https://webosis.vercel.app/admin/login`
2. Login dengan akun **admin** atau **super_admin**

### Setup Lokasi
1. Di dashboard admin, klik card **"Absensi"**
2. Klik tombol **"Konfigurasi"** di pojok kanan atas
3. Scroll ke bagian **"Auto-Detect Lokasi"**
4. Klik tombol **"Gunakan Lokasi Saat Ini"**
5. Browser akan minta izin GPS → **Allow**
6. ✅ Koordinat otomatis terisi!

### Tambah WiFi Sekolah
1. Di bagian **"WiFi yang Diizinkan"**
2. Ketik nama WiFi: **`SMKFI2025 (5G)`**
3. Klik **"Tambah"**
4. Ulangi untuk WiFi lain jika ada (WiFi Lab, WiFi Kantor, dll)

### Simpan
1. Klik tombol besar **"Simpan Konfigurasi"**
2. ✅ Notifikasi: "Konfigurasi berhasil disimpan!"

---

## 4. Bagikan QR Code ke Siswa/Guru

### Screenshot QR Code
1. Masih di halaman konfigurasi
2. Scroll ke bagian **"QR Code Link Absensi"**
3. Screenshot QR code (Win+Shift+S atau PrtScn)

### Share
- Kirim via WhatsApp Group Kelas
- Email ke semua siswa/guru
- Print & tempel di papan pengumuman
- Upload ke Google Classroom

✅ **Done!** Siswa/guru bisa langsung scan & absen.

---

## 5. Test Absensi (Siswa/Guru)

### Cara 1: Scan QR Code
1. Buka kamera HP
2. Arahkan ke QR code
3. Klik link yang muncul

### Cara 2: Dari Dashboard
1. Login ke `https://webosis.vercel.app`
2. Di dashboard, klik tombol **"Absensi"** (biru)

### Setup Biometrik (Pertama Kali)
1. Halaman akan muncul wizard setup
2. **Step 1:** Klik **"Generate Fingerprint"** → Tunggu 2-3 detik
3. **Step 2:** Klik **"Ambil Foto"** → Izinkan kamera
4. Posisikan wajah di depan kamera
5. Klik **"Capture"** → Preview muncul
6. Klik **"Simpan & Lanjutkan"**
7. ✅ Setup selesai!

### Check-in
1. Pastikan:
   - ✅ Terhubung WiFi sekolah (**SMKFI2025 (5G)**)
   - ✅ GPS aktif
   - ✅ Berada di area sekolah
2. Halaman akan validasi otomatis:
   - ✅ WiFi: Connected
   - ✅ Lokasi: Valid
   - ✅ Biometrik: OK
3. Klik tombol **"Check-in"**
4. Kamera terbuka → Ambil foto selfie
5. Klik **"Submit Absensi"**
6. ✅ Berhasil!

### Check-out (Saat Pulang)
1. Buka halaman absensi lagi
2. Klik **"Check-out"**
3. Ambil foto selfie
4. Submit
5. ✅ Done!

---

## 6. Lihat Data (Admin)

### Akses Data Absensi
1. Dashboard Admin → Klik **"Absensi"**
2. Lihat tabel semua absensi hari ini

### Filter Data
- **Filter by Date:** Pilih tanggal tertentu
- **Filter by Role:** Siswa / Guru
- **Filter by Status:** Hadir / Terlambat

### Lihat Detail
1. Klik tombol **"Detail"** pada record
2. Modal muncul dengan:
   - Foto selfie check-in
   - Foto selfie check-out (jika ada)
   - Lokasi GPS
   - WiFi SSID
   - Device info

### Verifikasi
1. Di modal detail, klik **"Verifikasi Absensi"**
2. Status berubah jadi ✅ **Verified**

### Export Data
1. Klik **"Export CSV"** di pojok kanan atas
2. File `attendance_YYYY-MM-DD.csv` otomatis download
3. Buka di Excel/Google Sheets

---

## 🎯 Troubleshooting

### "Gagal menyimpan konfigurasi"
**Solusi:**
1. Buka browser Console (F12 → Console tab)
2. Lihat error message (screenshot & kirim ke developer)
3. Cek apakah database tables sudah dibuat
4. Pastikan login sebagai admin/super_admin

### "WiFi tidak terdeteksi"
**Catatan:**
- Browser tidak bisa langsung baca nama WiFi (privacy & security)
- Sistem akan check apakah device terhubung ke network local
- Untuk akurasi penuh, gunakan native mobile app

**Workaround Sementara:**
- Validasi WiFi berjalan otomatis (check local network)
- Admin bisa verify manual di halaman data

### "Lokasi tidak valid"
**Solusi:**
1. Pastikan GPS aktif di perangkat
2. Pastikan browser dapat izin lokasi (allow location)
3. Coba refresh halaman
4. Jika indoor, GPS bisa kurang akurat (error 20-100m)
5. Admin bisa perbesar radius di konfigurasi (100m → 200m)

### "Kamera tidak berfungsi"
**Solusi:**
1. Pastikan browser punya izin kamera
2. Chrome: Settings → Privacy → Camera → Allow
3. Pastikan HTTPS aktif (Vercel auto-HTTPS ✅)
4. Coba browser lain (Chrome/Edge recommended)

---

## ✅ Checklist Setup

- [ ] Database tables created (SQL query dijalankan)
- [ ] Storage bucket "attendance" created (public)
- [ ] Folders created: selfies/, reference/
- [ ] Admin login berhasil
- [ ] Lokasi sekolah dikonfigurasi (GPS)
- [ ] WiFi SMKFI2025 (5G) ditambahkan
- [ ] Konfigurasi disimpan berhasil
- [ ] QR code di-screenshot
- [ ] QR code dibagikan ke siswa/guru
- [ ] Test absensi sebagai siswa (berhasil)
- [ ] Admin bisa lihat data
- [ ] Export CSV berhasil

---

## 📱 Info Teknis

**WiFi Anda:**
- SSID: `SMKFI2025 (5G)`
- Security: WPA2-Personal
- Band: 5 GHz (802.11ac)
- IP: 192.168.1.10 (Local Network ✅)

**Sistem akan otomatis detect:**
- ✅ Koneksi ke local network (192.168.x.x)
- ✅ Koordinat GPS dalam radius sekolah
- ✅ Browser fingerprint unik per device

**Privacy & Security:**
- Hash SHA-256 untuk fingerprint (tidak reversible)
- Foto selfie tersimpan encrypted di Supabase
- RLS policies mencegah akses unauthorized
- Admin harus verify manual untuk extra security

---

**Setup Time Total: ~10 menit**  
**Dibuat:** 29 November 2024  
**Update:** 29 November 2024

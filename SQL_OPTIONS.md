# 🔐 SQL Configuration Options

Pilih salah satu opsi sesuai kebutuhan:

---

## ✅ OPSI 1: PERMISSIVE MODE (Untuk Testing)
**Kapan:** Testing, development, atau IP sekolah sering berubah  
**Keamanan:** GPS + Fingerprint + Face Recognition tetap aktif  
**WiFi:** Tidak divalidasi

```sql
-- IZINKAN SEMUA IP (Development/Testing)
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],
  require_wifi = false,
  updated_at = NOW()
WHERE id = 6;

-- Verifikasi
SELECT id, allowed_ip_ranges, require_wifi FROM school_location_config WHERE id = 6;
```

**Hasil:**
- ✅ Bisa absen dengan WiFi, Data Cellular, atau koneksi apapun
- ✅ Validasi GPS tetap aktif (harus dalam radius)
- ✅ Validasi Fingerprint tetap aktif
- ✅ Face recognition tetap aktif
- ⚠️ WiFi validation dinonaktifkan

---

## 🔒 OPSI 2: STRICT MODE + IP Range Sekolah
**Kapan:** Production dengan IP statis  
**Keamanan:** GPS + Fingerprint + Face + **WiFi/IP validation**  
**WiFi:** Divalidasi ketat

```sql
-- STRICT MODE - Tambah IP range sekolah
-- Ganti '192.168.100.0/24' dengan IP range sekolah yang sebenarnya
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.100.0/24',  -- WiFi sekolah
    '182.10.0.0/16'      -- Tambah IP range ISP sekolah (jika pakai data cellular sekolah)
  ],
  require_wifi = true,
  updated_at = NOW()
WHERE id = 6;

-- Verifikasi
SELECT id, allowed_ip_ranges, require_wifi FROM school_location_config WHERE id = 6;
```

**Cara cari IP range ISP:**
1. Buka https://www.iplocation.net/
2. Masukkan IP kamu: `182.10.97.87`
3. Lihat "IP Range" atau "CIDR"
4. Masukkan ke SQL di atas

**Hasil:**
- ✅ Semua validasi aktif (GPS + Fingerprint + Face + WiFi/IP)
- ✅ Hanya bisa absen dari jaringan sekolah
- ✅ Security maksimal
- ⚠️ Jika IP berubah, harus update SQL lagi

---

## 🎯 OPSI 3: HYBRID MODE (Recommended)
**Kapan:** Production dengan fleksibilitas  
**Keamanan:** GPS + Fingerprint + Face + WiFi/IP (flexible)  
**WiFi:** Divalidasi tapi ada IP fallback

```sql
-- HYBRID MODE - WiFi preferred, IP sebagai fallback
UPDATE school_location_config
SET 
  allowed_wifi_ssids = ARRAY['Villa Lembang', 'WiFi Sekolah'],
  allowed_ip_ranges = ARRAY[
    '192.168.100.0/24',  -- WiFi sekolah internal
    '182.10.0.0/16',     -- ISP sekolah (fallback untuk data cellular)
    '100.64.0.0/10'      -- CGNAT (fallback untuk mobile data)
  ],
  require_wifi = false,  -- Allow IP fallback
  updated_at = NOW()
WHERE id = 6;

-- Verifikasi
SELECT id, allowed_wifi_ssids, allowed_ip_ranges, require_wifi FROM school_location_config WHERE id = 6;
```

**Hasil:**
- ✅ Prioritas WiFi, tapi allow IP fallback
- ✅ Bisa pakai data cellular kalau di area sekolah
- ✅ GPS validation tetap enforce
- ✅ Balance antara security dan usability

---

## 🚀 OPSI 4: TESTING SEKARANG, STRICT NANTI
**Kapan:** Testing dulu, nanti production strict  

**Step 1: Enable testing sekarang**
```sql
-- PERMISSIVE untuk testing
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],
  require_wifi = false,
  updated_at = NOW()
WHERE id = 6;
```

**Step 2: Setelah testing OK, ganti ke strict**
```sql
-- STRICT untuk production (jalankan setelah testing)
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['192.168.100.0/24'],  -- IP sekolah saja
  require_wifi = true,
  updated_at = NOW()
WHERE id = 6;
```

---

## 📊 COMPARISON TABLE

| Feature | Opsi 1<br>Permissive | Opsi 2<br>Strict | Opsi 3<br>Hybrid | Opsi 4<br>Testing |
|---------|---------------------|-----------------|-----------------|------------------|
| GPS Validation | ✅ | ✅ | ✅ | ✅ |
| Fingerprint | ✅ | ✅ | ✅ | ✅ |
| Face Recognition | ✅ | ✅ | ✅ | ✅ |
| WiFi Validation | ❌ | ✅ | ⚠️ Optional | ❌ → ✅ |
| IP Validation | ❌ | ✅ | ✅ | ❌ → ✅ |
| Data Cellular | ✅ Allow | ❌ Block | ✅ Allow | ✅ → ❌ |
| Security Level | Medium | High | Medium-High | Medium → High |
| Flexibility | High | Low | High | High → Low |
| Best For | Testing | Production<br>(static IP) | Production<br>(dynamic IP) | Development |

---

## 🎯 REKOMENDASI SAYA

**Untuk saat ini (Testing):**
Gunakan **OPSI 1** (Permissive Mode)

```sql
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],
  require_wifi = false
WHERE id = 6;
```

**Alasan:**
- ✅ Bisa test semua fitur tanpa blocker
- ✅ GPS + Fingerprint + Face tetap aktif (security tetap ada)
- ✅ Tidak perlu cari IP range ISP dulu
- ✅ Fleksibel untuk testing berbagai skenario

**Untuk production nanti:**
Gunakan **OPSI 3** (Hybrid Mode)
- Balance antara security dan usability
- Siswa bisa pakai data cellular kalau WiFi bermasalah
- GPS validation pastikan mereka di area sekolah

---

## ❓ CARA MEMILIH

**Pilih OPSI 1 jika:**
- Sedang testing/development
- IP sekolah sering berubah
- Butuh fleksibilitas tinggi
- WiFi sekolah sering bermasalah

**Pilih OPSI 2 jika:**
- Production dengan IP statis
- Butuh security maksimal
- WiFi sekolah stabil
- Tidak ada masalah dengan strict enforcement

**Pilih OPSI 3 jika:**
- Production dengan IP dynamic
- Butuh balance security vs usability
- WiFi kadang bermasalah
- Siswa boleh pakai data cellular di area sekolah

**Pilih OPSI 4 jika:**
- Testing sekarang, production nanti
- Mau test fitur dulu baru enforce strict
- Development workflow

---

## 🔧 CARA JALANKAN SQL

1. Buka **Supabase Dashboard**
2. Klik **SQL Editor** (sidebar kiri)
3. Klik **New Query**
4. Copy paste SQL dari opsi yang dipilih
5. Klik **RUN** (atau Ctrl+Enter)
6. Lihat hasil di bawah (harus success)
7. **Tunggu 2 menit** untuk Vercel deployment
8. **Hard refresh** browser (Ctrl+Shift+R)
9. **Logout** dan **Login** ulang
10. Test attendance

---

## ✅ VERIFICATION

Setelah jalankan SQL, cek dengan query ini:

```sql
SELECT 
  id,
  location_name,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  is_active
FROM school_location_config
WHERE id = 6;
```

**Expected output tergantung opsi:**

**Opsi 1:**
```
allowed_ip_ranges: ["0.0.0.0/0"]
require_wifi: false
```

**Opsi 2:**
```
allowed_ip_ranges: ["192.168.100.0/24", "182.10.0.0/16"]
require_wifi: true
```

**Opsi 3:**
```
allowed_ip_ranges: ["192.168.100.0/24", "182.10.0.0/16", "100.64.0.0/10"]
require_wifi: false
```

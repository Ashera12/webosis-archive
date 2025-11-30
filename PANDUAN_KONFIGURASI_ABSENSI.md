# 📋 PANDUAN KONFIGURASI ABSENSI

## 🎯 Sistem Baru: Enterprise IP Whitelisting

Sistem absensi telah diupgrade menggunakan **standar internasional** (Google Workspace, Microsoft 365, Cisco Meraki).

---

## 🔐 CARA KERJA

### **Role-Based Access Control (RBAC)**

```
┌─────────────────────────────────────────────────────────┐
│  SISWA                                                  │
│  ✅ GPS validation (harus dalam radius sekolah)         │
│  ✅ IP whitelisting (harus dari jaringan sekolah)       │
│  ✅ Device fingerprint                                  │
│  ✅ Face recognition                                    │
│  ❌ Tidak bisa pakai data seluler                       │
│  ❌ Tidak bisa absen dari rumah                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GURU / ADMIN / DEVELOPER                               │
│  ✅ GPS validation (harus dalam radius sekolah)         │
│  🔓 IP bypass (bisa dari mana saja)                     │
│  ✅ Device fingerprint                                  │
│  ✅ Face recognition                                    │
│  ✅ Bisa pakai data seluler                             │
│  ✅ Bisa absen dari rumah/kantor/kafe                   │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ KONFIGURASI DATABASE

### **Langkah 1: Update IP Ranges**

Buka **Supabase Dashboard** → **SQL Editor**, jalankan:

```sql
UPDATE school_location_config
SET 
  -- IP Whitelist untuk jaringan sekolah
  allowed_ip_ranges = ARRAY[
    '192.168.0.0/16',    -- WiFi internal (192.168.0.0 - 192.168.255.255)
    '10.0.0.0/8',        -- LAN internal (10.0.0.0 - 10.255.255.255)
    '182.10.0.0/16'      -- Public IP ISP sekolah (182.10.0.0 - 182.10.255.255)
  ],
  
  -- WiFi SSID (opsional, tidak wajib)
  allowed_wifi_ssids = ARRAY['Villa Lembang', 'WiFi Sekolah'],
  
  -- Strict mode = false (IP whitelisting sudah cukup)
  require_wifi = false,
  
  -- Update timestamp
  updated_at = NOW()
WHERE id = 6;
```

### **Cara Mendapatkan IP Range Sekolah:**

1. **Sambung ke WiFi sekolah**
2. Buka browser, kunjungi: https://whatismyipaddress.com/
3. Catat IP yang muncul, contoh: `182.10.97.87`
4. Gunakan notasi CIDR:
   - `/24` = Range sempit (182.10.97.0 - 182.10.97.255) → 256 IP
   - `/16` = Range lebar (182.10.0.0 - 182.10.255.255) → 65,536 IP
   - `/8` = Range sangat lebar (182.0.0.0 - 182.255.255.255) → 16 juta IP

**Rekomendasi:** Gunakan `/16` untuk ISP yang IP-nya dynamic.

---

### **Langkah 2: Verifikasi Konfigurasi**

```sql
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  allowed_wifi_ssids,
  require_wifi,
  radius_meters,
  is_active
FROM school_location_config
WHERE id = 6;
```

**Expected Output:**
```
id: 6
location_name: Lembang
allowed_ip_ranges: ["192.168.0.0/16", "10.0.0.0/8", "182.10.0.0/16"]
allowed_wifi_ssids: ["Villa Lembang", "WiFi Sekolah"]
require_wifi: false
radius_meters: 200
is_active: true
```

---

## 📱 NOTIFIKASI YANG DITAMPILKAN

### **1. Siswa - WiFi SSID Tidak Terdeteksi (Normal)**

```
ℹ️ Validasi Jaringan (Siswa)

Browser tidak dapat membaca WiFi SSID

✅ Sistem akan memvalidasi IP address Anda
📍 IP terdeteksi: 182.10.97.87

Pastikan:
• Terhubung ke WiFi sekolah
• MATIKAN data seluler
• IP dalam range sekolah
```

**Penjelasan:**
- Browser tidak bisa baca nama WiFi (privacy restriction)
- Sistem pakai IP validation sebagai gantinya
- Ini **NORMAL**, bukan error!

---

### **2. Siswa - IP Tidak Cocok (DITOLAK)**

```
🚫 Akses Ditolak - IP Tidak Sesuai

Anda harus terhubung ke jaringan sekolah!

📱 IP Anda: 180.247.123.45
✅ IP yang diizinkan: 192.168.0.0/16, 182.10.0.0/16

Solusi:
• Matikan data seluler
• Hubungkan ke WiFi sekolah
• Refresh halaman (Ctrl+Shift+R)
```

**Penjelasan:**
- Siswa pakai data seluler atau WiFi rumah
- IP tidak dalam range sekolah
- Harus ganti ke WiFi sekolah

---

### **3. Guru/Admin - Bypass (DIIZINKAN)**

```
✅ GURU - Bypass Validasi

Anda dapat absen dari lokasi manapun

📍 IP: 100.87.220.23
🔓 Validasi IP di-bypass untuk guru
```

**Penjelasan:**
- Guru/Admin tidak terkena IP whitelisting
- Bisa absen dari mana saja
- GPS validation tetap aktif (harus dalam radius sekolah)

---

### **4. Validasi Berhasil**

```
✅ Validasi Keamanan Berhasil!

🟢 Security Score: 95/100

📍 85m dari sekolah • 📶 182.10.97.87
```

**Penjelasan:**
- Semua validasi passed
- Security score tinggi
- Siap untuk ambil foto selfie

---

## 🛠️ KONFIGURASI ROLE USER

Pastikan user punya role yang benar di database:

```sql
-- Cek role user
SELECT id, email, name, role 
FROM users 
WHERE email = 'siswa@example.com';

-- Update role jika salah
UPDATE users
SET role = 'siswa'  -- atau 'guru', 'admin', 'developer'
WHERE email = 'siswa@example.com';
```

**Role yang tersedia:**
- `siswa` → Strict IP whitelisting
- `guru` → Bypass IP validation
- `admin` → Bypass IP validation
- `developer` → Bypass IP validation

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### **Cek IP Address User**

Minta user buka halaman attendance, lalu buka **Console (F12)**, cari log:

```javascript
[Network Utils] ✅ Server-side IP detected: 182.10.97.87
[Security Validation] User: {role: "siswa", email: "...", clientIP: "182.10.97.87"}
[Security Validation] IP Whitelist Check: {clientIP: "182.10.97.87", isValid: true/false}
```

**Jika `isValid: false`:**
- IP user tidak dalam range sekolah
- Tambahkan IP range di database (SQL Langkah 1)

---

### **Cek Role User**

Di console, cari:

```javascript
[Security Validation] 👨‍🎓 STUDENT MODE - Strict IP validation enforced
// atau
[Security Validation] 👨‍🏫 ROLE BYPASS - Guru/Admin/Developer allowed from any IP
```

**Jika role salah:**
- Update di database (query di atas)
- User logout → login ulang

---

### **Test IP Range Match**

Console browser, jalankan:

```javascript
// Test apakah IP cocok dengan range
fetch('/api/attendance/validate-security', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    latitude: -6.813229,
    longitude: 107.601023,
    wifiSSID: 'Unknown',
    fingerprintHash: 'test',
    timestamp: Date.now(),
    networkInfo: {
      ipAddress: '182.10.97.87'  // Ganti dengan IP user
    }
  })
}).then(r => r.json()).then(console.log);
```

**Response success:**
```json
{
  "success": true,
  "message": "Validasi keamanan berhasil",
  "data": {
    "securityScore": 95,
    "distance": 85
  }
}
```

**Response failed (IP tidak cocok):**
```json
{
  "success": false,
  "error": "Akses ditolak! Anda harus terhubung ke jaringan sekolah.",
  "violations": ["IP_NOT_IN_WHITELIST"],
  "details": {
    "yourIP": "180.247.123.45",
    "allowedIPRanges": ["192.168.0.0/16", "182.10.0.0/16"]
  }
}
```

---

## 📊 MONITORING & LOGS

### **Security Events Log**

```sql
-- Lihat log security events
SELECT 
  event_type,
  severity,
  description,
  metadata,
  created_at
FROM security_events
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 20;
```

**Event types:**
- `ip_validation_success` → IP valid, access granted
- `ip_whitelist_failed` → IP tidak cocok, access denied
- `role_based_bypass` → Guru/Admin bypass IP check
- `permissive_mode_access` → Development mode (0.0.0.0/0)

---

### **User Activities Log**

```sql
-- Lihat aktivitas user
SELECT 
  activity_type,
  description,
  status,
  details,
  created_at
FROM user_activities
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 20;
```

---

## ⚙️ KONFIGURASI LANJUTAN

### **Opsi 1: Permissive Mode (Testing)**

Izinkan SEMUA IP (untuk development/testing):

```sql
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],
  require_wifi = false
WHERE id = 6;
```

⚠️ **Jangan gunakan di production!** Ini untuk testing saja.

---

### **Opsi 2: Strict Internal Only**

Hanya izinkan dari network internal (tidak ada akses internet):

```sql
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.100.0/24',  -- Hanya subnet WiFi sekolah
    '10.10.0.0/16'       -- Hanya subnet LAN sekolah
  ],
  require_wifi = false
WHERE id = 6;
```

---

### **Opsi 3: Multiple Locations**

Jika ada beberapa lokasi sekolah:

```sql
-- Lokasi 1: Campus A
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  allowed_wifi_ssids,
  require_wifi,
  is_active
) VALUES (
  'Campus A - Jakarta',
  '-6.2000',
  '106.8000',
  300,
  ARRAY['192.168.1.0/24', '202.10.0.0/16'],
  ARRAY['WiFi Campus A'],
  false,
  true
);

-- Lokasi 2: Campus B
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  allowed_wifi_ssids,
  require_wifi,
  is_active
) VALUES (
  'Campus B - Bandung',
  '-6.9175',
  '107.6191',
  300,
  ARRAY['192.168.2.0/24', '182.10.0.0/16'],
  ARRAY['WiFi Campus B'],
  false,
  true
);
```

**Note:** Sistem akan cek semua lokasi aktif, user bisa absen di lokasi mana saja yang cocok.

---

## 🔐 SECURITY BEST PRACTICES

1. **Gunakan IP range yang spesifik**
   - ❌ Jangan: `0.0.0.0/0` (terlalu lebar)
   - ✅ Pakai: `182.10.0.0/16` (ISP sekolah)

2. **Update IP range secara berkala**
   - ISP bisa ganti IP range
   - Monitor log IP validation failures
   - Update database jika banyak siswa ditolak

3. **Backup konfigurasi**
   ```sql
   -- Backup config
   SELECT * FROM school_location_config WHERE id = 6;
   ```

4. **Monitor security logs**
   - Cek `security_events` table regular
   - Alert jika ada anomaly (IP validation failure rate tinggi)

5. **Test sebelum deployment**
   - Test dengan akun siswa (dari WiFi sekolah)
   - Test dengan akun siswa (dari data seluler) → harus ditolak
   - Test dengan akun guru (dari mana saja) → harus diizinkan

---

## 📞 SUPPORT

**Jika ada masalah:**
1. Cek console browser (F12)
2. Cek database config (`SELECT * FROM school_location_config`)
3. Cek security_events log
4. Kirim screenshot console + SQL result untuk debugging

---

## ✅ CHECKLIST DEPLOYMENT

- [ ] SQL dijalankan di Supabase
- [ ] IP ranges sudah sesuai dengan network sekolah
- [ ] Role user sudah benar (siswa/guru/admin)
- [ ] Test dengan akun siswa dari WiFi sekolah → Success
- [ ] Test dengan akun siswa dari data seluler → Ditolak
- [ ] Test dengan akun guru dari rumah → Success (bypass)
- [ ] Vercel deployment completed (cek https://vercel.com/dashboard)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Notifikasi muncul sesuai role dan kondisi
- [ ] Security logs tercatat di database

---

**Status: PRODUCTION READY** ✅

Sistem menggunakan standar internasional (Google Workspace / Microsoft 365 / Cisco Meraki) dengan role-based access control (RBAC) yang professional.

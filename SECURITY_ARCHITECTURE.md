# 🔒 Arsitektur Keamanan Attendance System

## 📋 Ringkasan Keamanan Multi-Layer

Sistem attendance dirancang dengan **5 layer keamanan** untuk mencegah manipulasi oleh siswa sambil tetap fleksibel untuk admin testing.

---

## 🛡️ Layer 1: Server-Side Admin Settings (CRITICAL)

### Struktur Database
```sql
-- Table: admin_settings (key-value store)
CREATE TABLE admin_settings (
  key text PRIMARY KEY,           -- e.g., 'location_required'
  value text NOT NULL,             -- 'true' or 'false'
  is_secret boolean DEFAULT false, -- Hide dari client
  updated_at timestamptz DEFAULT now()
);
```

### Konfigurasi Keamanan
```sql
-- 🔒 PRODUCTION MODE (DEFAULT - STRICT)
INSERT INTO admin_settings (key, value) VALUES 
  ('location_required', 'true'),  -- Siswa HARUS di sekolah
  ('wifi_required', 'true');       -- Siswa HARUS pakai WiFi sekolah

-- 🧪 TESTING MODE (Temporary - Demo Only)
UPDATE admin_settings SET value = 'false' 
WHERE key IN ('location_required', 'wifi_required');
```

### Perlindungan Akses
- ✅ **RLS Policy**: Hanya admin yang bisa UPDATE
- ✅ **Server-side only**: Siswa tidak bisa akses tabel ini
- ✅ **Audit trail**: Semua perubahan logged dengan timestamp

---

## 🛡️ Layer 2: GPS & WiFi Validation

### A. Location Validation (validate-security route)
```typescript
// ✅ Read dari database (bukan hardcoded)
const { data: locationSetting } = await supabaseAdmin
  .from('admin_settings')
  .select('value')
  .eq('key', 'location_required')
  .single();

// Default STRICT jika setting tidak ada
const locationRequired = locationSetting?.value !== 'false';

if (locationRequired) {
  // Validasi jarak dari sekolah
  const distance = calculateDistance(userLat, userLng, schoolLat, schoolLng);
  if (distance > allowedRadius) {
    return { error: 'Anda berada di luar area sekolah!' };
  }
}
```

### B. WiFi Validation
```typescript
const wifiRequired = wifiSetting?.value !== 'false';

if (wifiRequired) {
  const isWiFiValid = allowedSSIDs.includes(userWiFiSSID);
  if (!isWiFiValid) {
    return { error: 'WiFi tidak valid!' };
  }
}
```

### Perlindungan dari Manipulasi
- ✅ **Server-side check**: Validasi di API route, bukan client
- ✅ **Haversine formula**: Perhitungan jarak akurat (tidak bisa dimanipulasi)
- ✅ **Fallback HTTPS**: Geolocation butuh HTTPS (secure context)
- ✅ **Audit log**: Semua bypass tercatat di `security_events` table

---

## 🛡️ Layer 3: Biometric Verification

### A. Face Analysis (AI-Powered)
```typescript
// Ambil foto realtime → Compare dengan reference photo
const faceAnalysis = await fetch('/api/ai/verify-face', {
  method: 'POST',
  body: JSON.stringify({
    currentPhoto: base64Image,      // Foto saat attendance
    referencePhoto: storedPhotoURL  // Foto dari enrollment
  })
});

// AI checks:
// - Face match confidence > 80%
// - Liveness detection (anti-spoofing)
// - Facial features comparison
```

### B. Fingerprint (Browser Fingerprinting)
```typescript
// Generate unique device signature
const fingerprint = {
  platform: navigator.platform,
  browser: navigator.userAgent,
  screen: `${screen.width}x${screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  colorDepth: screen.colorDepth,
  deviceMemory: navigator.deviceMemory,
  hardwareConcurrency: navigator.hardwareConcurrency
};

// Compare dengan stored fingerprint
const isMatch = compareFingerprints(fingerprint, storedFingerprint);
```

### C. WebAuthn (Optional - Hardware Security)
```typescript
// Windows Hello / Touch ID / Face ID
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: randomBytes,
    rp: { name: "Webosis" },
    user: { id: userId, name: email },
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required"
    }
  }
});
```

### Perlindungan
- ✅ **AI Face Match**: Tidak bisa pakai foto orang lain
- ✅ **Liveness Detection**: Tidak bisa pakai foto/video rekaman
- ✅ **Device Fingerprint**: Deteksi pergantian device
- ✅ **WebAuthn**: Hardware-level security (TPM/Secure Enclave)

---

## 🛡️ Layer 4: Anomaly Detection (AI-Powered)

### Pattern Recognition
```typescript
const anomalyAnalysis = await analyzeSecurityAnomaly({
  userId,
  currentIP,
  currentDevice,
  currentLocation,
  timeOfDay,
  attendanceHistory
});

// AI detects:
// - IP address changes (hopping)
// - Device switching
// - Location jumping (impossible travel)
// - Time pattern anomalies
// - Unusual attendance frequency
```

### Auto-Blocking
```sql
-- Jika anomaly score > 70
IF anomalyScore > 70 THEN
  -- Block attendance
  RETURN { error: 'Aktivitas mencurigakan terdeteksi!' };
  
  -- Log to security_events
  INSERT INTO security_events (user_id, event_type, severity)
  VALUES (userId, 'high_anomaly_detected', 'HIGH');
  
  -- Notify admin
  TRIGGER notification_to_admin;
END IF;
```

---

## 🛡️ Layer 5: Audit Trail & Monitoring

### Security Events Logging
```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT, -- 'location_bypass_used', 'anomaly_detected', etc.
  severity TEXT,   -- LOW, MEDIUM, HIGH, CRITICAL
  metadata JSONB,  -- Full context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example log
INSERT INTO security_events VALUES (
  gen_random_uuid(),
  'user-123',
  'location_bypass_used',
  'LOW',
  {
    "reason": "Admin disabled location_required",
    "actual_location": {"lat": -6.2088, "lng": 106.8456},
    "school_location": {"lat": -6.2000, "lng": 106.8500},
    "distance_meters": 11603,
    "bypass_authorized_by": "admin@school.com"
  },
  NOW()
);
```

### Real-time Monitoring
- ✅ **Dashboard Admin**: Lihat semua bypass events
- ✅ **Alerts**: Email/notif jika ada anomali tinggi
- ✅ **Reports**: Export logs untuk audit

---

## 🔐 Cara Siswa TIDAK BISA Manipulasi

### 1. ❌ Fake GPS / GPS Spoofing
**Perlindungan:**
- Server-side validation (client tidak bisa override)
- Cross-check dengan IP address geolocation
- Anomaly detection (deteksi location jumping)
- WiFi SSID validation (double check)

### 2. ❌ VPN / Proxy
**Perlindungan:**
- IP whitelisting (hanya allow range sekolah)
- WiFi SSID check (VPN tidak bisa fake WiFi)
- Device fingerprint (deteksi perubahan)

### 3. ❌ Pakai Foto Orang Lain
**Perlindungan:**
- AI liveness detection (deteksi foto vs orang asli)
- Face movement tracking
- Depth analysis (3D vs 2D)

### 4. ❌ Akses dari Luar Sekolah
**Perlindungan:**
- `location_required = 'true'` (default strict)
- Distance calculation (Haversine formula)
- Radius enforcement (e.g., max 50 meter)
- WiFi validation (harus connect ke WiFi sekolah)

### 5. ❌ Ganti Device
**Perlindungan:**
- Browser fingerprint matching
- Device change alerts
- Require re-enrollment untuk device baru

### 6. ❌ Manipulasi Client-Side Code
**Perlindungan:**
- **SEMUA validasi di server-side**
- Client hanya kirim data, server yang decide
- Supabase RLS policies
- JWT token validation

---

## 🎯 Recommended Production Settings

```sql
-- 🔒 STRICT MODE (Default untuk production)
INSERT INTO admin_settings (key, value) VALUES 
  ('location_required', 'true'),
  ('wifi_required', 'true');

-- Configure location config
UPDATE location_configs SET
  radius_meters = 50,              -- 50 meter dari sekolah
  bypass_gps_validation = false;   -- No bypass

-- Configure allowed WiFi
UPDATE location_configs SET
  allowed_wifi_ssids = '["SchoolWiFi-Main", "SchoolWiFi-Lab"]';
```

### Testing Mode (Temporary)
```sql
-- ⚠️ HANYA untuk testing/demo
-- JANGAN dipakai di production!
UPDATE admin_settings SET value = 'false' 
WHERE key IN ('location_required', 'wifi_required');

-- Monitor who's using bypass
SELECT * FROM security_events 
WHERE event_type IN ('location_bypass_used', 'wifi_bypass_used')
ORDER BY created_at DESC;
```

---

## 📊 Security Monitoring Dashboard

### Key Metrics to Monitor
1. **Bypass Usage**: Berapa sering bypass dipakai
2. **Anomaly Score Trends**: Rata-rata anomaly score per hari
3. **Failed Validations**: GPS/WiFi/Face yang gagal
4. **Device Changes**: Berapa user ganti device
5. **IP Changes**: Deteksi IP hopping

### Alerts
- 🚨 **HIGH**: Anomaly score > 70
- ⚠️ **MEDIUM**: Bypass dipakai di production mode
- ℹ️ **INFO**: Device change detected

---

## ✅ Checklist Deployment Production

- [ ] Set `location_required = 'true'`
- [ ] Set `wifi_required = 'true'`
- [ ] Configure WiFi SSIDs di `location_configs`
- [ ] Set `radius_meters` (recommended: 50m)
- [ ] Enable RLS policies untuk `admin_settings`
- [ ] Test face analysis dengan foto asli
- [ ] Test location validation dengan GPS sekolah
- [ ] Setup admin monitoring dashboard
- [ ] Configure email alerts untuk anomali
- [ ] Backup `security_events` logs regularly

---

## 🆘 Troubleshooting

### "Geolocation error: Only secure origins are allowed"
**Solusi:** Deploy ke HTTPS (Vercel automatic)

### Siswa complain tidak bisa attendance dari dalam sekolah
**Check:**
1. Apakah GPS accuracy tinggi? (enableHighAccuracy: true)
2. Apakah radius terlalu kecil? (naikkan dari 50m ke 100m)
3. Apakah WiFi SSID match? (case-sensitive)

### Bypass tidak bekerja di testing
**Check:**
```sql
-- Verify settings
SELECT * FROM admin_settings 
WHERE key IN ('location_required', 'wifi_required');

-- Should return:
-- location_required | false
-- wifi_required     | false
```

---

## 📞 Support

Jika ada pertanyaan tentang security architecture, hubungi developer atau buka issue di GitHub.

**Security First! 🔒**

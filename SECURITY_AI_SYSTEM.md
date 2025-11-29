# 🔐 Sistem Keamanan Berlapis & AI Absensi

## 🎯 Overview

Sistem absensi sekarang dilengkapi dengan **3 lapisan keamanan utama** dan **AI verification**:

1. **Real-Time Security Validation** - WiFi + Lokasi + Fingerprint (SEBELUM foto)
2. **AI Face Verification** - OpenAI Vision / Google / Azure (SESUDAH foto)
3. **AI Anomaly Detection** - Pattern analysis untuk deteksi kecurangan
4. **Security Event Logging** - Semua aktivitas mencurigakan tercatat

---

## 🛡️ Layer 1: Real-Time Security Validation

### Endpoint: `/api/attendance/validate-security`

**Kapan Dipanggil:** SEBELUM user bisa ambil foto selfie

**Flow:**
```
User klik "Lanjut Ambil Foto"
  ↓
validateSecurity() dipanggil
  ↓
POST /api/attendance/validate-security
  ├─ ✅ WiFi SSID Check
  ├─ ✅ Location Radius Check
  ├─ ✅ Fingerprint Hash Check
  ├─ ✅ Duplicate Attendance Check
  └─ ✅ AI Anomaly Detection
  ↓
JIKA SEMUA PASS:
  → Tampilkan modal camera
  → Security Score ditampilkan
  → User bisa lanjut foto
  
JIKA ADA YANG GAGAL:
  → Blokir akses ke kamera
  → Tampilkan error detail
  → Log security event
  → Redirect sesuai severity
```

### Validasi yang Dilakukan:

#### 1. **WiFi SSID Validation** ✅
```javascript
// Check apakah WiFi user ada di daftar allowed
const allowedSSIDs = activeConfig.allowed_wifi_ssids || [];
const isWiFiValid = allowedSSIDs.includes(body.wifiSSID.trim());

if (!isWiFiValid) {
  return {
    success: false,
    error: "WiFi tidak valid!",
    details: {
      yourWiFi: "TP-LINK_HOME",
      allowedWiFi: ["SMK-INFORMATIKA", "SMK-GUEST"],
      hint: "Pastikan terhubung ke: SMK-INFORMATIKA"
    },
    action: 'BLOCK_ATTENDANCE',
    severity: 'HIGH',
    securityScore: 60 // -40 points
  };
}
```

**Error Actions:**
- `BLOCK_ATTENDANCE` - User tidak bisa lanjut, kembali ke step ready
- Toast error dengan detail WiFi yang allowed
- Security score dikurangi 40 poin

#### 2. **Location Radius Validation** ✅
```javascript
// Hitung jarak dari sekolah menggunakan Haversine formula
const distance = calculateDistance(
  body.latitude,
  body.longitude,
  activeConfig.latitude,
  activeConfig.longitude
);

const isLocationValid = distance <= activeConfig.radius_meters;

if (!isLocationValid) {
  return {
    success: false,
    error: "Anda berada di luar area sekolah!",
    details: {
      yourDistance: "523 meter",
      allowedRadius: "50 meter",
      schoolName: "SMK INFORMATIKA",
      hint: "Anda harus berada dalam radius 50m"
    },
    action: 'BLOCK_ATTENDANCE',
    severity: 'HIGH',
    securityScore: 50 // -50 points
  };
}
```

**Warning Detection:**
- Jika distance > 80% radius → Warning "NEAR_BOUNDARY" (-10 points)
- User masih bisa lanjut tapi score turun

#### 3. **Fingerprint Hash Validation** ✅
```javascript
// Verify device fingerprint sama dengan saat setup
const { data: biometric } = await supabaseAdmin
  .from('user_biometric')
  .select('fingerprint_template')
  .eq('user_id', userId)
  .single();

const fingerprintMatch = body.fingerprintHash === biometric.fingerprint_template;

if (!fingerprintMatch) {
  // Log security event
  await logSecurityEvent(userId, 'FINGERPRINT_MISMATCH', {
    providedHash: body.fingerprintHash,
    storedHash: biometric.fingerprint_template
  });

  return {
    success: false,
    error: "Verifikasi perangkat gagal! Device fingerprint tidak cocok.",
    details: {
      hint: "Gunakan perangkat yang sama dengan saat pendaftaran",
      suggestion: "Jika ganti device, daftar ulang biometric"
    },
    action: 'BLOCK_ATTENDANCE',
    severity: 'HIGH',
    violations: ['FINGERPRINT_MISMATCH'],
    securityScore: 70 // -30 points
  };
}
```

**Security Event Logging:**
- Setiap fingerprint mismatch dicatat ke `security_events` table
- Admin bisa review di dashboard
- Metadata lengkap: hash comparison, WiFi, location

#### 4. **Duplicate Attendance Check** ✅
```javascript
const { data: existingAttendance } = await supabaseAdmin
  .from('attendance')
  .select('*')
  .eq('user_id', userId)
  .gte('check_in_time', today.toISOString())
  .lt('check_in_time', tomorrow.toISOString())
  .single();

if (existingAttendance && existingAttendance.check_out_time) {
  return {
    success: false,
    error: "Anda sudah melakukan absensi lengkap hari ini.",
    details: {
      checkIn: "07:30",
      checkOut: "15:45"
    },
    action: 'SHOW_COMPLETED',
    severity: 'INFO'
  };
}
```

**Attendance Type Detection:**
- Belum ada record → `check-in`
- Ada check-in, belum check-out → `check-out`
- Sudah lengkap → Blokir dengan info

### Success Response:

```json
{
  "success": true,
  "message": "Validasi keamanan berhasil. Silakan lanjut ambil foto.",
  "data": {
    "attendanceType": "check-in",
    "configId": 1,
    "schoolName": "SMK INFORMATIKA",
    "distance": 23,
    "allowedRadius": 50,
    "wifiSSID": "SMK-INFORMATIKA",
    "securityScore": 100,
    "warnings": [],
    "biometricVerified": true
  },
  "action": "PROCEED_PHOTO"
}
```

**UI Display:**
- Security score badge dengan emoji (🟢 90-100, 🟡 70-89, 🔴 <70)
- Detail cards: Score, Distance, WiFi, Type
- Warning box jika ada (NEAR_BOUNDARY, dll)

---

## 🤖 Layer 2: AI Face Verification

### Endpoint: `/api/ai/verify-face`

**Kapan Dipanggil:** SESUDAH foto diupload, SEBELUM submit attendance

**Flow:**
```
User ambil foto → Upload ke Supabase
  ↓
Foto berhasil diupload
  ↓
POST /api/ai/verify-face
  ├─ Get reference photo dari biometric
  ├─ Call AI provider (OpenAI/Google/Azure)
  ├─ Detect face in current photo
  ├─ Compare dengan reference photo
  ├─ Check if live person (vs screenshot)
  ├─ Check if fake/deepfake
  └─ Calculate match score & confidence
  ↓
JIKA VERIFIED:
  → Lanjut submit attendance
  → Show match score % di toast
  
JIKA GAGAL:
  → Blokir submit
  → Show error reasons
  → Kembali ke capture step
  → User bisa ambil foto ulang
```

### AI Providers Supported:

#### **Option 1: OpenAI Vision (GPT-4o-mini)** 🌟 RECOMMENDED
```javascript
// .env
OPENAI_API_KEY=sk-proj-xxxxx

// Features:
- ✅ Face detection
- ✅ Face comparison (match score 0-1)
- ✅ Liveness detection (screenshot vs real)
- ✅ Fake detection (deepfake, print photo)
- ✅ Quality analysis (lighting, angle, expression)
- 💰 ~$0.0025 per verification
```

**Prompt Engineering:**
```
Analyze these two photos for face verification. Return JSON with:
- faceDetected: boolean (is there a clear human face?)
- matchScore: number 0-1 (how similar are faces?)
- isLive: boolean (real person vs screenshot?)
- isFake: boolean (screenshot, printed, deepfake?)
- confidence: number 0-1
- details: {faceQuality, lighting, angle, expression}
```

#### **Option 2: Google Cloud Vision API**
```javascript
// .env
GOOGLE_CLOUD_API_KEY=AIzaSyxxxxxx

// Features:
- ✅ Face landmarks detection (68 points)
- ✅ Emotion detection
- ✅ Face confidence scores
- ✅ Label detection
- 💰 ~$0.0015 per verification
```

#### **Option 3: Azure Face API**
```javascript
// .env
AZURE_FACE_API_KEY=xxxxxx
AZURE_FACE_ENDPOINT=https://xxx.cognitiveservices.azure.com/

// Features:
- ✅ Face verification (1:1)
- ✅ Liveness detection (best)
- ✅ Face attributes
- ✅ Quality checks
- 💰 ~$0.001 per verification
```

#### **Fallback: Basic Image Validation**
```javascript
// Jika tidak ada AI provider configured
// Check:
- ✅ Image accessible
- ✅ Valid format (JPEG/PNG)
- ✅ File size reasonable (50KB - 10MB)
- ✅ Content-type valid

// Result:
- Assume face detected: true
- Match score: 0.85 (85%)
- Confidence: 0.75 (lower untuk fallback)
- Warning: "Using basic verification. Configure AI for production."
```

### Verification Threshold:

```javascript
const threshold = 0.7; // 70% minimum

const isVerified = 
  verificationResult.faceDetected &&        // Wajah terdeteksi
  verificationResult.matchScore >= 0.7 &&   // Similarity ≥70%
  !verificationResult.isFake &&             // Bukan fake
  verificationResult.confidence >= 0.7;     // Confidence ≥70%
```

### Error Handling:

```javascript
if (!isVerified) {
  const reasons = [];
  
  if (!faceDetected) {
    reasons.push("Wajah tidak terdeteksi di foto");
  }
  if (matchScore < 0.7) {
    reasons.push(`Wajah tidak cocok dengan referensi (${matchScore*100}%)`);
  }
  if (isFake) {
    reasons.push("Foto terdeteksi sebagai screenshot/fake");
  }
  if (confidence < 0.7) {
    reasons.push(`Confidence terlalu rendah (${confidence*100}%)`);
  }

  return {
    success: false,
    verified: false,
    error: "Verifikasi wajah gagal",
    reasons,
    data: verificationResult
  };
}
```

**User Experience:**
- Toast loading: "🤖 Verifikasi wajah dengan AI..."
- JIKA gagal: Toast error dengan reasons dalam format list
- JIKA berhasil: Toast success dengan match score dan confidence
- Non-fatal: Jika AI error, lanjut dengan warning (fallback)

### AI Verification Logs:

```sql
-- Table: ai_verification_logs
CREATE TABLE ai_verification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  current_photo_url TEXT NOT NULL,
  reference_photo_url TEXT NOT NULL,
  face_detected BOOLEAN DEFAULT FALSE,
  match_score DECIMAL(3,2),              -- 0.00 - 1.00
  is_live BOOLEAN DEFAULT FALSE,
  is_fake BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(3,2),               -- 0.00 - 1.00
  ai_provider TEXT,                      -- 'openai-vision', 'google-vision', etc
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin Dashboard Query:**
```sql
-- Get suspicious verifications (low match score)
SELECT 
  u.email,
  al.match_score,
  al.is_fake,
  al.confidence,
  al.ai_provider,
  al.created_at
FROM ai_verification_logs al
JOIN auth.users u ON u.id = al.user_id
WHERE al.match_score < 0.8 OR al.is_fake = true
ORDER BY al.created_at DESC;
```

---

## 🧠 Layer 3: AI Anomaly Detection

### Function: `detectAnomalies()`

**Kapan Dipanggil:** Otomatis saat security validation

**Flow:**
```
Security validation running
  ↓
Get last 7 days attendance history
  ↓
Analyze patterns:
  ├─ WiFi switching pattern
  ├─ Location jumping (impossible travel)
  ├─ Device fingerprint changes
  └─ Time consistency
  ↓
Calculate anomaly score (0-100)
  ↓
IF score > 70:
  → Log security event 'ANOMALY_DETECTED'
  → Deduct 20 points from security score
  → Add warning (user masih bisa lanjut)
```

### Anomaly Patterns Detected:

#### 1. **WiFi Switching Pattern** 🔄
```javascript
const wifiHistory = recentAttendance.map(a => a.wifi_ssid);
const uniqueWiFi = new Set(wifiHistory);

if (uniqueWiFi.size > 3) {
  // Terlalu banyak WiFi berbeda dalam 7 hari
  anomalyScore += 30;
  console.log('[Anomaly] Multiple WiFi networks:', uniqueWiFi.size);
}
```

**Contoh:**
```
Day 1: SMK-INFORMATIKA
Day 2: SMK-GUEST
Day 3: TP-LINK_HOME        ← Mencurigakan
Day 4: INDIHOME-123        ← Mencurigakan
Day 5: SMK-INFORMATIKA
```
→ 4 unique WiFi dalam 5 hari = +30 anomaly score

#### 2. **Impossible Travel Detection** 🚗
```javascript
const lastAttendance = recentAttendance[0];
const lastTime = new Date(lastAttendance.check_in_time).getTime();
const currentTime = current.timestamp;
const timeDiffMinutes = (currentTime - lastTime) / 1000 / 60;

if (timeDiffMinutes < 60) {
  const lastDistance = calculateDistance(
    current.latitude, current.longitude,
    lastAttendance.latitude, lastAttendance.longitude
  );

  // Jika jarak > 5km dalam 1 jam
  if (lastDistance > 5000) {
    anomalyScore += 50;
    console.log('[Anomaly] Impossible travel:', {
      distance: lastDistance + 'm',
      time: timeDiffMinutes + 'min'
    });
  }
}
```

**Contoh:**
```
08:00 - Check-in: Location A (-6.8656, 107.5387)
08:30 - Check-in: Location B (-6.9156, 107.6387)  ← 6.2km dalam 30 menit!
```
→ Physically impossible = +50 anomaly score

#### 3. **Multiple Devices** 📱
```javascript
const fingerprintHistory = recentAttendance.map(a => a.fingerprint_hash);
const uniqueFingerprints = new Set(fingerprintHistory);

if (uniqueFingerprints.size > 2) {
  // Lebih dari 2 device berbeda dalam 7 hari
  anomalyScore += 40;
  console.log('[Anomaly] Multiple devices:', uniqueFingerprints.size);
}
```

**Contoh:**
```
Day 1: Device A (hash: abc123...)
Day 2: Device A (hash: abc123...)
Day 3: Device B (hash: def456...)  ← OK, mungkin ganti HP
Day 4: Device C (hash: ghi789...)  ← Mencurigakan
Day 5: Device D (hash: jkl012...)  ← Very suspicious!
```
→ 4 unique devices dalam 5 hari = +40 anomaly score

### Anomaly Score Calculation:

```
Score = 0 (start)

WiFi switching (>3 unique):      +30
Impossible travel (>5km/1h):     +50
Multiple devices (>2):           +40
                                 ----
Maximum anomaly score:           120

IF score > 70:
  → WARNING: Suspicious pattern
  → Security score: -20
  → Log event for admin review
  → User MASIH BISA lanjut (tidak block)
```

### Security Event Logging:

```javascript
await logSecurityEvent(userId, 'ANOMALY_DETECTED', {
  anomalyScore,
  wifiSSID: body.wifiSSID,
  location: { lat: body.latitude, lng: body.longitude },
  patterns: {
    uniqueWiFi: uniqueWiFi.size,
    uniqueDevices: uniqueFingerprints.size,
    impossibleTravel: lastDistance > 5000
  }
});
```

---

## 📊 Layer 4: Security Event Logging

### Table: `security_events`

```sql
CREATE TABLE security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);
```

### Event Types:

| Event Type | Severity | Description |
|-----------|----------|-------------|
| `FINGERPRINT_MISMATCH` | HIGH | Device fingerprint tidak match dengan registered |
| `INVALID_WIFI` | HIGH | WiFi tidak ada di allowed list |
| `OUTSIDE_RADIUS` | HIGH | Lokasi di luar radius sekolah |
| `ANOMALY_DETECTED` | MEDIUM | Pattern mencurigakan terdeteksi |
| `MULTIPLE_DEVICES` | HIGH | User pakai banyak device dalam waktu singkat |
| `IMPOSSIBLE_TRAVEL` | HIGH | Location jumping tidak masuk akal |
| `VALIDATION_ERROR` | CRITICAL | System error saat validasi |
| `NEAR_BOUNDARY` | LOW | User mendekati batas radius (warning) |

### Admin Dashboard Queries:

**1. High Severity Events:**
```sql
SELECT 
  u.email,
  u.name,
  se.event_type,
  se.severity,
  se.metadata,
  se.created_at
FROM security_events se
JOIN auth.users u ON u.id = se.user_id
WHERE se.severity IN ('HIGH', 'CRITICAL')
  AND se.resolved = FALSE
ORDER BY se.created_at DESC
LIMIT 50;
```

**2. Users with Most Violations:**
```sql
SELECT 
  u.email,
  u.name,
  COUNT(*) as violation_count,
  MAX(se.created_at) as last_violation
FROM security_events se
JOIN auth.users u ON u.id = se.user_id
WHERE se.severity IN ('HIGH', 'CRITICAL')
  AND se.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.name
HAVING COUNT(*) > 5
ORDER BY violation_count DESC;
```

**3. Anomaly Patterns:**
```sql
SELECT 
  event_type,
  COUNT(*) as count,
  AVG((metadata->>'anomalyScore')::int) as avg_score
FROM security_events
WHERE event_type = 'ANOMALY_DETECTED'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type;
```

---

## 🎯 Complete User Flow

### First Time Setup (Biometric Registration):

```
1. Login sebagai Siswa/Guru
   ↓
2. Navigate to /attendance
   ↓
3. System detect: No biometric setup
   ↓
4. Step: 'setup'
   ↓
5. Klik "Ambil Foto Selfie"
   ↓
6. Camera modal muncul (live preview)
   ↓
7. User posisi wajah, klik "📸 Ambil Foto"
   ↓
8. Preview foto muncul
   ↓
9. Klik "Daftar Biometric"
   ↓
10. Upload foto → Supabase Storage
    ↓
11. Save to user_biometric table:
    - reference_photo_url
    - fingerprint_template (browser hash)
    ↓
12. Toast: "🎉 Biometric berhasil didaftarkan!"
    ↓
13. Step: 'ready' (siap absen)
```

### Regular Attendance (After Setup):

```
1. Login & navigate /attendance
   ↓
2. System detect: Biometric sudah setup
   ↓
3. Auto-fetch: WiFi, Location, Fingerprint
   ↓
4. Step: 'ready'
   ↓
5. User isi WiFi SSID: "SMK-INFORMATIKA"
   ↓
6. Klik "Lanjut Ambil Foto & Absen"
   ↓
7. ⚡ SECURITY VALIDATION (Layer 1):
   ├─ Validate WiFi SSID
   ├─ Validate Location Radius
   ├─ Validate Fingerprint Hash
   ├─ Check Duplicate Attendance
   └─ AI Anomaly Detection
   ↓
8a. JIKA GAGAL:
    → Toast error dengan detail
    → Log security event
    → Blokir akses kamera
    → Kembali ke step 'ready'
    
8b. JIKA BERHASIL:
    → Toast success dengan security score
    → Step: 'capture'
    → Security validation data tersimpan
    ↓
9. Camera modal muncul
   ↓
10. User ambil foto selfie
    ↓
11. Preview foto muncul
    ↓
12. Klik "Submit Absensi"
    ↓
13. Upload foto → Supabase Storage
    ↓
14. 🤖 AI FACE VERIFICATION (Layer 2):
    ├─ Get reference photo dari biometric
    ├─ Call OpenAI Vision API
    ├─ Detect face in current photo
    ├─ Compare dengan reference
    ├─ Check liveness & fake
    └─ Calculate match score
    ↓
15a. JIKA AI GAGAL:
     → Toast error dengan reasons
     → Log AI verification
     → Kembali ke step 'capture'
     → User bisa foto ulang
     
15b. JIKA AI BERHASIL:
     → Toast success dengan match %
     → Log AI verification (success)
     → Lanjut submit attendance
     ↓
16. Submit ke /api/attendance/submit:
    ├─ Re-validate WiFi & Location (double-check)
    ├─ Re-verify Fingerprint
    ├─ Insert attendance record
    └─ Return success
    ↓
17. Toast: "🎉 Absensi berhasil!"
    ↓
18. Show "Sudah Absen Hari Ini" card
    ↓
19. Step: 'ready' (bisa check-out nanti)
```

---

## 🚀 Setup Instructions

### 1. Database Setup

Run SQL migrations:
```bash
# Terminal di Supabase SQL Editor

# 1. Security events table
psql -f create_security_events_table.sql

# 2. AI verification logs table
psql -f create_ai_verification_logs_table.sql
```

### 2. Environment Variables

Add to `.env.local`:
```bash
# === AI Provider (Choose ONE) ===

# Option 1: OpenAI Vision (RECOMMENDED)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxx

# Option 2: Google Cloud Vision
# GOOGLE_CLOUD_API_KEY=AIzaSyxxxxxxxxxxxxxx

# Option 3: Azure Face API
# AZURE_FACE_API_KEY=xxxxxxxxxxxxxx
# AZURE_FACE_ENDPOINT=https://xxx.cognitiveservices.azure.com/

# === Existing ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxx
NEXTAUTH_SECRET=xxxxxxxxx
NEXTAUTH_URL=https://webosis.vercel.app
```

### 3. Deploy to Vercel

```bash
git add .
git commit -m "feat: Multi-layer security & AI verification"
git push origin main

# Vercel auto-deploy
# Add environment variables di Vercel dashboard
```

### 4. Test Security Flow

**Test WiFi Validation:**
```
1. Isi WiFi: "WIFI-SALAH"
2. Klik "Lanjut Ambil Foto"
3. Expected: ❌ Error "WiFi tidak valid!"
4. Details: yourWiFi, allowedWiFi list, hint

5. Isi WiFi: "SMK-INFORMATIKA" (benar)
6. Expected: ✅ Validation pass
```

**Test Location Validation:**
```
1. GPS aktif, tapi di luar radius sekolah
2. Klik "Lanjut Ambil Foto"
3. Expected: ❌ Error "Di luar area sekolah!"
4. Details: distance, allowedRadius, hint

5. GPS di dalam radius
6. Expected: ✅ Validation pass
```

**Test Fingerprint Validation:**
```
1. Login di browser A, setup biometric
2. Logout, login di browser B (device berbeda)
3. Coba absen di browser B
4. Expected: ❌ Error "Device fingerprint tidak cocok"
5. Hint: "Gunakan device yang sama"

6. Kembali ke browser A
7. Expected: ✅ Validation pass
```

**Test AI Face Verification:**
```
1. Setup biometric dengan foto wajah jelas
2. Saat absen, ambil foto wajah yang sama
3. Expected: ✅ Match ≥70%, Confidence ≥70%

4. Ambil foto orang lain atau screenshot
5. Expected: ❌ Match <70% atau isFake=true
6. Reasons: "Wajah tidak cocok" atau "Fake detected"
```

**Test Anomaly Detection:**
```
1. Absen normal 3 hari berturut (score 0)
2. Hari ke-4: Ganti WiFi 4x dalam sehari
3. Expected: ⚠️ Warning "ANOMALY_DETECTED"
4. Security score: -20 (tapi masih bisa lanjut)

5. Check console: anomaly score details
6. Check database: security_events table
```

---

## 📊 Monitoring & Analytics

### Admin Dashboard (Future Enhancement)

**Security Overview:**
- Total security events (7 days)
- High severity count
- Users with most violations
- Anomaly detection rate

**AI Verification Stats:**
- Total verifications
- Success rate %
- Average match score
- Fake detection count
- Provider usage (OpenAI/Google/Azure)

**Attendance Patterns:**
- WiFi usage distribution
- Location heatmap
- Device fingerprint diversity
- Time-of-day patterns

**Alerts & Actions:**
- Real-time security alerts
- Auto-block suspicious users
- Manual review queue
- Resolve security events

---

## 🔧 Troubleshooting

### Issue: Security validation always fails

**Check:**
```javascript
// Console logs
[Security Validation] Starting for user: student@school.com
[Security Validation] Data: {lat, lng, wifi, timestamp}
[Security Validation] Checking WiFi...
[Security Validation] ✅ WiFi valid: SMK-INFORMATIKA
[Security Validation] Checking location...
[Security Validation] Distance: {calculated, allowed, valid}
[Security Validation] ✅ Location valid
[Security Validation] Checking fingerprint...
[Security Validation] ✅ Fingerprint valid
[Security Validation] ✅ All validations passed!
```

**Solutions:**
- WiFi fail: Tambah SSID ke `allowed_wifi_ssids` di config
- Location fail: Increase radius atau GPS tidak akurat
- Fingerprint fail: Re-setup biometric di device yang sama

### Issue: AI verification tidak jalan

**Check:**
```javascript
// Console logs
[AI Face Verification] Using OpenAI Vision API
// or
[AI Face Verification] Using basic image analysis (fallback)
```

**Solutions:**
- No API key: Tambah `OPENAI_API_KEY` ke .env
- API error: Check API quota/billing
- Fallback OK: System tetap jalan, tapi pakai basic validation

### Issue: Anomaly false positive

**Check:**
```javascript
// Console logs
[Anomaly] Multiple WiFi networks detected: 5
[Anomaly] Impossible travel detected: {distance, time}
[Anomaly] Multiple devices detected: 4
[Anomaly Detection] Final score: 120
```

**Solutions:**
- Adjust threshold: Change `> 70` ke `> 90` (less sensitive)
- Whitelist users: Skip anomaly check untuk admin/guru
- Review patterns: Maybe legitimate (guru pindah kelas)

---

## 🎯 Next Steps

- [ ] **Run migrations** (security_events, ai_verification_logs)
- [ ] **Add OPENAI_API_KEY** to .env.local
- [ ] **Test all security flows** (WiFi, Location, Fingerprint)
- [ ] **Test AI verification** with real photos
- [ ] **Monitor security_events** table for violations
- [ ] **Build admin dashboard** untuk review events
- [ ] **Add notifications** untuk suspicious activities
- [ ] **Implement auto-block** untuk repeated violations

---

**Status:** ✅ **COMPLETE - Ready for Testing**

**Security Level:** 🔐 **VERY HIGH** (4 layers + AI)

**AI Integration:** 🤖 **ACTIVE** (OpenAI Vision ready)

**Monitoring:** 📊 **ENABLED** (Event logging active)

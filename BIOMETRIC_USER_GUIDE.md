# Biometric Authentication - Complete User Guide

## 🔐 Overview

Sistem biometric attendance menggunakan **multi-method authentication** yang mendukung:
- 🔐 Face ID (iOS/iPadOS)
- 👆 Touch ID (iOS/macOS)
- 🔒 Fingerprint (Android)
- 🤖 Face Unlock (Android)
- 🪟 Windows Hello (Face/Fingerprint/PIN)
- 🔑 Passkey (Universal)
- 🔢 PIN Code (Fallback)

---

## 📋 Setup Process (Step-by-Step)

### Step 1: Initial Permissions
```
1. Allow Camera Access
   → Browser akan minta akses kamera
   → Klik "Allow" atau "Izinkan"
   
2. Allow Location Access
   → Browser akan minta akses lokasi
   → Klik "Allow" untuk GPS & WiFi detection
```

### Step 2: Choose Biometric Method
```
✅ Sistem akan auto-detect metode yang tersedia
✅ Pilih metode yang Anda inginkan:

📱 Mobile:
  - Face ID (iPhone X+)
  - Touch ID (iPhone/iPad)
  - Fingerprint (Android)
  - Face Unlock (Android)

💻 Desktop:
  - Windows Hello Face
  - Windows Hello Fingerprint
  - Touch ID (MacBook)
  - Passkey

🔢 Fallback:
  - PIN Code (jika tidak ada biometric)
```

**⭐ RECOMMENDED** = Metode yang paling cocok untuk device Anda

### Step 3: Photo Verification
```
1. Take Selfie
   → Pastikan wajah terlihat jelas
   → Lighting cukup terang
   → Tidak pakai mask/kacamata hitam
   → Lihat langsung ke kamera

2. System Analysis
   → AI akan verify wajah Anda
   → Fingerprint browser di-generate
   → Data di-encrypt dan disimpan
```

### Step 4: Biometric Registration
```
1. Authenticate
   → Popup biometric akan muncul
   → Gunakan Face ID/Touch ID/Fingerprint
   → Tunggu hingga sukses

2. Verification
   → System verify credential
   → Setup complete!
```

---

## 🔄 Re-enroll Biometric

**Kapan perlu re-enroll?**
- Penampilan berubah (potong rambut, kumis, kacamata baru)
- Ganti device
- Ingin ganti metode biometric
- Error terus menerus

**Cara re-enroll:**
```
1. Buka Attendance Page
2. Scroll ke "Biometric Management"
3. Klik "Re-enroll Biometric" 🔄
4. Confirm action
5. Ikuti setup wizard lagi
6. Data lama akan ter-replace
```

---

## 🗑️ Reset Biometric Data

**Kapan perlu reset?**
- Data corrupt/error
- Ingin hapus semua data biometric
- Tidak bisa login sama sekali

**Cara request reset:**
```
1. Buka Attendance Page
2. Scroll ke "Biometric Management"
3. Klik "Request Data Reset" 🗑️
4. Confirm request
5. Tunggu admin approval
6. Setelah approved, data terhapus
7. Setup ulang dari awal
```

**⚠️ Catatan:**
- Request harus di-approve admin
- Proses bisa 1-24 jam
- Data tidak bisa di-restore
- Harus setup ulang setelah reset

---

## ❌ Troubleshooting - Common Errors

### 1. "Biometric Not Supported"
**Penyebab:**
- Browser outdated
- Device tidak punya sensor biometric
- WebAuthn disabled

**Solusi:**
✅ Update browser ke versi terbaru
✅ Gunakan Chrome/Firefox/Safari/Edge
✅ Check device settings → Biometric/Security
✅ Gunakan PIN code sebagai fallback

---

### 2. "Authentication Cancelled"
**Penyebab:**
- User cancel popup
- Timeout (terlalu lama)
- Biometric sensor error

**Solusi:**
✅ Try again, jangan cancel popup
✅ Respond dalam 60 detik
✅ Restart device biometric
✅ Coba metode lain

---

### 3. "Face Not Detected"
**Penyebab:**
- Wajah tidak terlihat jelas
- Lighting buruk
- Mask/obstruction
- Terlalu jauh/dekat dari kamera

**Solusi:**
✅ Pastikan wajah penuh terlihat
✅ Lepas mask/kacamata hitam
✅ Cari tempat dengan lighting bagus
✅ Jarak ideal: 30-50cm dari kamera
✅ Lihat langsung ke kamera

---

### 4. "Face Doesn't Match"
**Penyebab:**
- Bukan orang yang terdaftar
- Penampilan berubah drastis
- Photo quality buruk
- Lighting berbeda

**Solusi:**
✅ Pastikan benar-benar Anda (no photo of photo)
✅ Re-enroll jika penampilan berubah
✅ Improve lighting saat photo
✅ Contact support jika persisten

---

### 5. "Out of School Range"
**Penyebab:**
- GPS location di luar radius sekolah
- GPS accuracy buruk
- Device GPS disabled

**Solusi:**
✅ Pastikan fisik di sekolah
✅ Tunggu GPS lock (5-10 detik)
✅ Outdoor/dekat jendela (better signal)
✅ Check GPS enabled di device
✅ GPS accuracy harus <10m

---

### 6. "Wrong WiFi Network"
**Penyebab:**
- Connected ke WiFi bukan sekolah
- Menggunakan cellular data

**Solusi:**
✅ Disconnect dari WiFi current
✅ Connect ke WiFi sekolah
✅ Tanya admin nama WiFi yang allowed
✅ Matikan cellular data

---

### 7. "Location Permission Denied"
**Penyebab:**
- User block location access
- Browser settings deny location

**Solusi:**
✅ Click icon gembok di address bar
✅ Select "Always allow location"
✅ Refresh page
✅ iOS: Settings → Safari → Location → Allow
✅ Android: Settings → Apps → Browser → Permissions

---

### 8. "Camera Permission Denied"
**Penyebab:**
- User block camera access
- Browser settings deny camera

**Solusi:**
✅ Click icon gembok di address bar
✅ Select "Allow camera"
✅ Refresh page
✅ Check browser settings → Privacy → Camera

---

### 9. "Rate Limit Exceeded"
**Penyebab:**
- Terlalu banyak attempts
- Spam attendance button

**Solusi:**
✅ Tunggu cooldown period
✅ Jangan spam button
✅ Contact admin jika urgent
✅ Check retry time di error message

---

### 10. "Credential Already Registered"
**Penyebab:**
- Biometric sudah terdaftar
- Duplicate registration

**Solusi:**
✅ Go to Biometric Management
✅ Request data reset dari admin
✅ Re-enroll setelah reset
✅ Contact support

---

## 🎯 Best Practices

### For Students:
1. **Setup sekali, pakai selamanya**
   - Setup biometric di awal
   - Test berhasil
   - No need setup lagi kecuali error

2. **Keep data up-to-date**
   - Re-enroll jika penampilan berubah
   - Update jika ganti device
   - Request reset jika data corrupt

3. **Follow instructions**
   - Read error messages carefully
   - Follow solutions step-by-step
   - Contact support jika stuck

### For Teachers:
1. **Help students setup**
   - Guide first-time setup
   - Troubleshoot common errors
   - Escalate to admin jika needed

2. **Monitor attendance**
   - Check who successfully attended
   - Report issues to admin
   - Verify GPS/WiFi working

### For Admins:
1. **Configure properly**
   - Set correct GPS coordinates
   - Configure WiFi whitelist
   - Set appropriate radius (50-100m)

2. **Handle requests**
   - Review reset requests promptly
   - Approve/reject with clear reason
   - Monitor abuse patterns

3. **Monitor system**
   - Check error logs
   - Identify common issues
   - Update documentation

---

## 📊 Status Indicators

### Setup Status:
- ⚫ **Not Setup**: Biometric belum didaftarkan
- 🟡 **In Progress**: Setup sedang berjalan
- 🟢 **Active**: Biometric aktif dan ready
- 🔴 **Error**: Ada masalah, perlu troubleshoot

### Request Status:
- ⏳ **Pending**: Menunggu admin review
- ✅ **Approved**: Request di-approve, data akan dihapus
- ❌ **Rejected**: Request ditolak, check admin notes

---

## 🔐 Security Features

### Data Protection:
- ✅ **Encryption**: Semua data di-encrypt
- ✅ **Photo Storage**: Secure Supabase storage with signed URLs
- ✅ **Fingerprint**: Browser fingerprint (not actual fingerprint)
- ✅ **WebAuthn**: Industry-standard biometric protocol

### Privacy:
- ✅ **No sharing**: Data tidak dibagi ke pihak ketiga
- ✅ **User control**: User bisa request delete data
- ✅ **Admin approval**: Reset requires admin approval
- ✅ **Activity logs**: Semua aksi tercatat untuk audit

### Rate Limiting:
- ✅ **Setup**: Max 3x per day
- ✅ **Attendance**: Max 50x per day
- ✅ **Verification**: Max 100x per hour
- ✅ **Prevents**: Spam & abuse

---

## 📱 Supported Devices & Browsers

### Desktop:
| OS | Browser | Face | Fingerprint | Passkey |
|----|---------|------|-------------|---------|
| Windows 10/11 | Chrome 90+ | ✅ | ✅ | ✅ |
| Windows 10/11 | Edge 90+ | ✅ | ✅ | ✅ |
| Windows 10/11 | Firefox 88+ | ❌ | ✅ | ✅ |
| macOS | Chrome 90+ | ❌ | ✅ | ✅ |
| macOS | Safari 14+ | ❌ | ✅ | ✅ |
| Linux | Chrome 90+ | ❌ | ❌ | ✅ |

### Mobile:
| OS | Browser | Face | Fingerprint | Passkey |
|----|---------|------|-------------|---------|
| iOS 14+ | Safari | ✅ | ✅ | ✅ |
| iOS 14+ | Chrome | ✅ | ✅ | ✅ |
| Android 9+ | Chrome | ✅ | ✅ | ✅ |
| Android 9+ | Firefox | ✅ | ✅ | ✅ |

**✅ = Fully Supported | ❌ = Not Available**

---

## 🆘 Contact Support

**Jika masalah tidak terselesaikan:**

1. **Screenshot error message**
2. **Catat:**
   - Device & OS version
   - Browser & version
   - Steps yang sudah dicoba
   - Error code (jika ada)

3. **Contact:**
   - Teacher (untuk help dasar)
   - Admin (untuk reset request)
   - IT Support (untuk technical issues)

4. **Email:** support@webosis.com
5. **WhatsApp:** +62-xxx-xxx-xxxx

---

**Last Updated:** December 2, 2025  
**Version:** 2.0 (Multi-Method Support)

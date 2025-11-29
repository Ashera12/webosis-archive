# 📸 Perbaikan Foto Absensi - Live Camera Preview

## 🎯 Masalah yang Diperbaiki

**Masalah Sebelumnya:**
- ❌ Saat klik "Ambil Foto", kamera langsung capture tanpa preview
- ❌ User tidak bisa lihat dirinya sendiri sebelum foto diambil
- ❌ Tidak ada indikator jelas saat foto sedang diupload
- ❌ Foto tidak tersimpan karena API call salah (missing `userId` field)
- ❌ Tidak ada console logging untuk debugging

**Solusi yang Diterapkan:**
- ✅ **Live Camera Preview Modal** - User bisa lihat dirinya sendiri di layar penuh
- ✅ **Manual Capture Button** - User klik tombol "📸 Ambil Foto" saat siap
- ✅ **Visual Loading Indicators** - Toast notifications untuk setiap step
- ✅ **API Fix** - FormData sekarang mengirim `userId` yang required
- ✅ **Comprehensive Logging** - Console logs di setiap step untuk debugging
- ✅ **Better Error Handling** - Error messages yang jelas dan helpful

---

## 🔧 Perubahan Teknis

### 1. **captureWebcamPhoto() - Refactored** (lib/attendanceUtils.ts)

**Sebelum:**
```typescript
// Auto-capture tanpa preview
const stream = await navigator.mediaDevices.getUserMedia({video: {...}});
const video = document.createElement('video');
video.srcObject = stream;
// Langsung capture tanpa user interaction
ctx.drawImage(video, 0, 0);
```

**Sesudah:**
```typescript
// Live preview dengan modal
return new Promise(async (resolve, reject) => {
  // 1. Request camera access
  const stream = await navigator.mediaDevices.getUserMedia({video: {...}});
  
  // 2. Create full-screen modal overlay
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    ...
  `;
  
  // 3. Create live video preview
  const video = document.createElement('video');
  video.srcObject = stream;
  video.setAttribute('autoplay', 'true');
  
  // 4. Create capture button
  const captureBtn = document.createElement('button');
  captureBtn.innerHTML = '📸 Ambil Foto';
  
  // 5. User clicks button when ready
  captureBtn.onclick = async () => {
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => resolve(blob));
  };
  
  // 6. Show modal to user
  document.body.appendChild(modal);
});
```

**Fitur Modal:**
- ✨ Full-screen overlay dengan background hitam semi-transparent
- 🎥 Live video feed dengan border biru dan shadow
- 🔘 Tombol "📸 Ambil Foto" besar dengan gradient biru
- ❌ Tombol "✕ Batal" untuk cancel
- 📝 Instruksi "📷 Posisikan wajah Anda di depan kamera"
- 📱 Responsive: max-width 90%, max-height 70vh
- 🎨 Hover effects pada tombol (scale, shadow)

**Console Logs:**
```javascript
[Camera] Requesting camera access...
[Camera] Camera access granted
[Camera] Preview modal displayed
[Camera] Capturing photo...
[Camera] Photo captured, size: 1280 x 720
[Camera] Camera stopped
[Camera] Blob created, size: 145.32 KB
```

---

### 2. **uploadAttendancePhoto() - Fixed** (lib/attendanceUtils.ts)

**Sebelum:**
```typescript
const formData = new FormData();
formData.append('file', blob, fileName);
formData.append('bucket', 'attendance'); // ❌ Wrong fields
formData.append('folder', 'selfies');     // ❌ API doesn't expect these
```

**Sesudah:**
```typescript
const formData = new FormData();
formData.append('file', blob, fileName);
formData.append('userId', userId); // ✅ Required by API
```

**Console Logs:**
```javascript
[Upload] Starting upload for user: abc123-def456...
[Upload] Blob size: 145.32 KB
[Upload] FormData prepared, filename: abc123-1733000000000.jpg
[Upload] Response status: 200
[Upload] Response data: {success: true, url: "https://..."}
[Upload] ✅ Upload successful, URL: https://xxx.supabase.co/storage/v1/...
```

**Error Handling:**
```javascript
if (!response.ok) {
  console.error('[Upload] Upload failed:', error);
  throw new Error(error.error || 'Gagal upload foto');
}

if (!data.success || !data.url) {
  console.error('[Upload] Invalid response:', data);
  throw new Error('Upload failed - no URL returned');
}
```

---

### 3. **handleCapturePhoto() - Enhanced** (app/attendance/page.tsx)

**Toast Notifications:**
```typescript
// 1. Show loading
const loadingToast = toast.loading('📸 Membuka kamera...');

// 2. Capture success
toast.dismiss(loadingToast);
toast.success('✅ Foto berhasil diambil!', {
  duration: 3000,
  icon: '📸',
});

// 3. Or capture error
toast.error('Gagal mengambil foto. Pastikan kamera diizinkan.');
```

**Console Logs:**
```javascript
console.log('📸 Foto berhasil diambil, size:', (blob.size / 1024).toFixed(2), 'KB');
console.error('❌ Error capturing photo:', error);
```

---

### 4. **handleSetupBiometric() - Enhanced** (app/attendance/page.tsx)

**Multi-Step Progress:**
```typescript
// Step 1: Upload
const uploadToast = toast.loading('📤 Mengupload foto...');
const photoUrl = await uploadAttendancePhoto(photoBlob, session.user.id);
toast.dismiss(uploadToast);
toast.success('✅ Foto berhasil diupload!');

// Step 2: Register
const registerToast = toast.loading('💾 Mendaftarkan biometric...');
const response = await fetch('/api/attendance/biometric/setup', {...});
toast.dismiss(registerToast);

// Step 3: Success
toast.success('🎉 Biometric berhasil didaftarkan!', {
  duration: 4000,
});
```

**Console Logs:**
```javascript
console.log('🔄 Starting biometric setup upload...');
console.log('🔄 Registering biometric data...');
console.log('✅ Biometric setup successful:', data);
console.error('❌ Setup biometric error:', error);
```

---

### 5. **handleSubmitAttendance() - Enhanced** (app/attendance/page.tsx)

**Multi-Step Progress:**
```typescript
// Step 1: Upload photo
const uploadToast = toast.loading('📤 Mengupload foto...');
console.log('📤 Uploading photo, size:', (photoBlob.size / 1024).toFixed(2), 'KB');

const photoUrl = await uploadAttendancePhoto(photoBlob, session.user.id);

toast.dismiss(uploadToast);
toast.success('✅ Foto berhasil diupload!');
console.log('📤 Photo uploaded:', photoUrl);

// Step 2: Submit attendance
const submitToast = toast.loading('💾 Menyimpan data absensi...');
console.log('📤 Submitting attendance with payload:', {...});

const response = await fetch('/api/attendance/submit', {...});
const data = await response.json();

toast.dismiss(submitToast);
console.log('📥 Attendance response:', data);

// Step 3: Success
toast.success('🎉 Absensi berhasil!', {
  duration: 5000,
  icon: '✅',
});
console.log('✅ Attendance submitted successfully!');
```

**Error Handling:**
```typescript
if (!response.ok) {
  if (data.requireSetup) {
    setStep('setup');
    toast.error('Silakan setup biometric terlebih dahulu');
    return;
  }
  console.error('❌ Submit failed:', data.error);
  throw new Error(data.error || 'Submit gagal');
}
```

---

## 🧪 Testing Guide

### **Test 1: Live Camera Preview**

**Steps:**
1. Login sebagai Siswa atau Guru
2. Navigate ke `/attendance`
3. Jika belum setup biometric, klik "Ambil Foto Selfie"
4. Jika sudah setup, klik "Lanjut Ambil Foto & Absen"

**Expected:**
- ✅ Modal full-screen muncul dengan background hitam
- ✅ Live video feed dari kamera depan terlihat
- ✅ User bisa lihat dirinya sendiri di layar
- ✅ Tombol "📸 Ambil Foto" terlihat dengan gradient biru
- ✅ Tombol "✕ Batal" terlihat
- ✅ Instruksi "📷 Posisikan wajah Anda di depan kamera" terlihat
- ✅ Console log: `[Camera] Requesting camera access...`
- ✅ Console log: `[Camera] Camera access granted`
- ✅ Console log: `[Camera] Preview modal displayed`

**Test Actions:**
- 🖱️ **Hover tombol "Ambil Foto"** → Scale up + shadow lebih besar
- 🖱️ **Klik "Batal"** → Modal hilang, kamera stop, return null
- 🖱️ **Klik "Ambil Foto"** → Foto captured, modal hilang

---

### **Test 2: Capture Photo**

**Steps:**
1. Dengan modal camera terbuka
2. Posisikan wajah di depan kamera
3. Klik tombol "📸 Ambil Foto"

**Expected:**
- ✅ Console log: `[Camera] Capturing photo...`
- ✅ Console log: `[Camera] Photo captured, size: 1280 x 720`
- ✅ Console log: `[Camera] Camera stopped`
- ✅ Console log: `[Camera] Blob created, size: XX.XX KB`
- ✅ Console log: `📸 Foto berhasil diambil, size: XX.XX KB`
- ✅ Toast: "📸 Membuka kamera..." (loading)
- ✅ Toast: "✅ Foto berhasil diambil!" (success, 3s)
- ✅ Modal hilang
- ✅ Preview foto muncul di page
- ✅ Tombol "Ambil Ulang" dan "Daftar Biometric" / "Submit Absensi" muncul

---

### **Test 3: Upload Photo (Biometric Setup)**

**Steps:**
1. Setelah capture foto (first time setup)
2. Klik tombol "Daftar Biometric"

**Expected Console Logs:**
```javascript
🔄 Starting biometric setup upload...
[Upload] Starting upload for user: abc123-def456...
[Upload] Blob size: 145.32 KB
[Upload] FormData prepared, filename: abc123-1733000000000.jpg
[Upload] Response status: 200
[Upload] Response data: {success: true, url: "https://..."}
[Upload] ✅ Upload successful, URL: https://xxx.supabase.co/...
🔄 Registering biometric data...
✅ Biometric setup successful: {success: true, ...}
```

**Expected Toast Sequence:**
1. 📤 "Mengupload foto..." (loading)
2. ✅ "Foto berhasil diupload!" (success)
3. 💾 "Mendaftarkan biometric..." (loading)
4. 🎉 "Biometric berhasil didaftarkan!" (success, 4s)

**Verify in Supabase:**
1. Open Supabase Dashboard
2. Go to **Storage** → **attendance** bucket
3. Navigate to **selfies/** folder
4. Check file exists: `{userId}-{timestamp}.jpg`
5. Verify file can be opened (valid JPEG image)
6. Check **Database** → **user_biometric** table
7. Verify row exists with:
   - `user_id` = current user
   - `reference_photo_url` = Supabase Storage URL
   - `fingerprint_template` = hash string

---

### **Test 4: Upload Photo (Attendance Submit)**

**Steps:**
1. Sudah setup biometric
2. Isi WiFi SSID
3. Ambil foto selfie
4. Klik "Submit Absensi"

**Expected Console Logs:**
```javascript
🚀 Starting attendance submission...
📤 Uploading photo, size: 145.32 KB
[Upload] Starting upload for user: abc123-def456...
[Upload] Blob size: 145.32 KB
[Upload] FormData prepared, filename: abc123-1733000000000.jpg
[Upload] Response status: 200
[Upload] ✅ Upload successful, URL: https://xxx.supabase.co/...
📤 Photo uploaded: https://xxx.supabase.co/...
📤 Submitting attendance with payload: {latitude: -6.xxx, longitude: 107.xxx, ...}
📥 Attendance response: {success: true, type: "check-in", ...}
✅ Attendance submitted successfully!
```

**Expected Toast Sequence:**
1. 📤 "Mengupload foto..." (loading)
2. ✅ "Foto berhasil diupload!" (success)
3. 💾 "Menyimpan data absensi..." (loading)
4. ✅ "🎉 Absensi berhasil!" (success, 5s)

**Verify in Supabase:**
1. **Storage** → **attendance** → **selfies/**
2. New file exists: `{userId}-{timestamp}.jpg`
3. **Database** → **attendance** table
4. New row with:
   - `user_id` = current user
   - `photo_selfie_url` = Supabase Storage URL
   - `check_in_time` = current timestamp
   - `status` = 'present'
   - `wifi_ssid`, `latitude`, `longitude` filled

---

### **Test 5: Error Handling**

**Scenario 1: Camera Permission Denied**
```javascript
Steps:
1. Browser blocks camera access
2. User clicks "Block" on permission prompt

Expected:
- Console: [Camera] Error: NotAllowedError: Permission denied
- Toast: ❌ "Gagal mengambil foto. Pastikan kamera diizinkan."
```

**Scenario 2: Upload Failed (Network Error)**
```javascript
Steps:
1. Disconnect internet
2. Capture photo
3. Click "Daftar Biometric" or "Submit Absensi"

Expected:
- Console: [Upload] Response status: 0
- Console: [Upload] ❌ Upload error: Failed to fetch
- Toast: ❌ "Gagal upload foto"
```

**Scenario 3: API Error (Invalid User)**
```javascript
Steps:
1. Modify userId to invalid value
2. Try upload

Expected:
- Console: [Upload] Upload failed: {error: "Cannot upload for other users"}
- Toast: ❌ "Gagal upload foto"
```

**Scenario 4: Invalid Response (No URL)**
```javascript
Steps:
1. API returns {success: true} but no URL

Expected:
- Console: [Upload] Invalid response: {success: true}
- Console: [Upload] ❌ Upload error: Upload failed - no URL returned
- Toast: ❌ "Gagal upload foto"
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ FIRST TIME SETUP (Biometric Registration)                  │
└─────────────────────────────────────────────────────────────┘

1. User navigates to /attendance
   └─> Check if biometric setup exists
       └─> No setup found
           └─> setStep('setup')

2. User clicks "Ambil Foto Selfie"
   └─> handleCapturePhoto() called
       └─> toast.loading('📸 Membuka kamera...')
       └─> captureWebcamPhoto()
           ├─> [Camera] Requesting camera access...
           ├─> navigator.mediaDevices.getUserMedia()
           ├─> Create full-screen modal
           ├─> Show live video feed
           ├─> [Camera] Preview modal displayed
           └─> Wait for user to click "📸 Ambil Foto"
               ├─> ctx.drawImage(video, 0, 0)
               ├─> canvas.toBlob()
               ├─> [Camera] Blob created, size: XX KB
               └─> return blob

3. Photo preview shown
   └─> User clicks "Daftar Biometric"
       └─> handleSetupBiometric()
           ├─> toast.loading('📤 Mengupload foto...')
           ├─> uploadAttendancePhoto(blob, userId)
           │   ├─> formData.append('file', blob)
           │   ├─> formData.append('userId', userId)
           │   ├─> fetch('/api/attendance/upload-selfie')
           │   ├─> [Upload] ✅ Upload successful
           │   └─> return photoUrl
           ├─> toast.success('✅ Foto berhasil diupload!')
           ├─> toast.loading('💾 Mendaftarkan biometric...')
           ├─> fetch('/api/attendance/biometric/setup')
           ├─> toast.success('🎉 Biometric berhasil didaftarkan!')
           └─> setStep('ready')

┌─────────────────────────────────────────────────────────────┐
│ REGULAR ATTENDANCE (After Biometric Setup)                  │
└─────────────────────────────────────────────────────────────┘

1. User navigates to /attendance
   └─> Check if biometric setup exists
       └─> Setup found
           └─> setStep('ready')

2. User fills WiFi SSID
   └─> Input: "SMK-INFORMATIKA"

3. User clicks "Lanjut Ambil Foto & Absen"
   └─> setStep('capture')

4. User clicks "Ambil Foto Selfie"
   └─> Same camera flow as above
       └─> Photo captured and previewed

5. User clicks "Submit Absensi"
   └─> handleSubmitAttendance()
       ├─> setStep('submitting')
       ├─> toast.loading('📤 Mengupload foto...')
       ├─> uploadAttendancePhoto(blob, userId)
       │   └─> [Upload] ✅ Upload successful
       ├─> toast.success('✅ Foto berhasil diupload!')
       ├─> toast.loading('💾 Menyimpan data absensi...')
       ├─> fetch('/api/attendance/submit')
       │   ├─> Validate WiFi SSID
       │   ├─> Validate location radius
       │   ├─> Verify fingerprint hash
       │   ├─> Insert attendance record
       │   └─> return {success: true, type: 'check-in'}
       ├─> toast.success('🎉 Absensi berhasil!')
       └─> Show "Sudah Absen Hari Ini" card
```

---

## 🎨 UI/UX Improvements

### **Before:**
```
[ Ambil Foto Selfie ]
  ↓
(Auto-capture immediately, no preview)
  ↓
[ Photo Preview ]
```

### **After:**
```
[ Ambil Foto Selfie ]
  ↓
┌─────────────────────────────────────┐
│  Full-Screen Camera Modal           │
│                                     │
│  📷 Posisikan wajah Anda...        │
│                                     │
│  ┌──────────────────────────┐      │
│  │                          │      │
│  │   [Live Video Feed]      │      │
│  │                          │      │
│  └──────────────────────────┘      │
│                                     │
│    [ 📸 Ambil Foto ]               │
│    [ ✕ Batal ]                     │
└─────────────────────────────────────┘
  ↓
(User clicks when ready)
  ↓
[ Photo Preview ]
```

---

## 🔒 Security Verification

### **1. User ID Validation**
```typescript
// API validates user can only upload their own photo
if (session.user.id !== userId) {
  return NextResponse.json(
    { success: false, error: 'Cannot upload for other users' },
    { status: 403 }
  );
}
```

### **2. File Type Validation**
```typescript
// Only JPEG files allowed
canvas.toBlob(
  (blob) => resolve(blob),
  'image/jpeg',  // ✅ Only JPEG
  0.85           // 85% quality
);
```

### **3. Storage Path**
```typescript
// Files stored in user-specific folders
const fileName = `${userId}/${Date.now()}.jpg`;
// Result: attendance/selfies/{userId}/{timestamp}.jpg
```

### **4. Authentication Required**
```typescript
const session = await auth();
if (!session?.user?.email) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

---

## 📝 Files Modified

1. ✅ **lib/attendanceUtils.ts**
   - `captureWebcamPhoto()` - Full refactor with modal
   - `uploadAttendancePhoto()` - Fix FormData, add logging

2. ✅ **app/attendance/page.tsx**
   - `handleCapturePhoto()` - Add toast notifications
   - `handleSetupBiometric()` - Multi-step progress toasts
   - `handleSubmitAttendance()` - Enhanced logging and toasts

3. ✅ **FOTO_ABSENSI_FIX.md** (this file)
   - Complete documentation

---

## 🚀 Deployment Checklist

- [x] Code changes completed
- [x] No TypeScript errors
- [x] Console logging added
- [x] Error handling enhanced
- [x] Toast notifications improved
- [x] Documentation created
- [ ] Git commit & push
- [ ] Vercel deployment
- [ ] Manual testing
- [ ] Verify photos in Supabase Storage
- [ ] Verify attendance records in database

---

## 📞 Testing Instructions for User

### **Step 1: Wait for Deployment**
```bash
# After git push, wait 2-3 minutes
# Check Vercel dashboard for deployment status
```

### **Step 2: Clear Browser Cache**
```bash
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
# Or: F12 → Network → Disable cache
```

### **Step 3: Test Biometric Setup (First Time)**
1. Login sebagai **Siswa** atau **Guru**
2. Navigate ke `/attendance`
3. Klik **"Ambil Foto Selfie"**
4. **Lihat modal camera** muncul full-screen
5. **Lihat diri Anda** di live video feed
6. **Klik "📸 Ambil Foto"** saat siap
7. **Lihat preview** foto yang diambil
8. **Klik "Daftar Biometric"**
9. **Lihat toast notifications:**
   - "📤 Mengupload foto..."
   - "✅ Foto berhasil diupload!"
   - "💾 Mendaftarkan biometric..."
   - "🎉 Biometric berhasil didaftarkan!"
10. **Buka Console (F12)** dan lihat logs
11. **Verify di Supabase:**
    - Storage → attendance → selfies → ada file baru
    - Database → user_biometric → ada row baru

### **Step 4: Test Attendance Submit**
1. Isi **WiFi SSID**: "SMK-INFORMATIKA" (atau sesuai config)
2. Klik **"Lanjut Ambil Foto & Absen"**
3. Klik **"Ambil Foto Selfie"**
4. **Lihat modal camera**, ambil foto
5. **Klik "Submit Absensi"**
6. **Lihat toast notifications:**
   - "📤 Mengupload foto..."
   - "✅ Foto berhasil diupload!"
   - "💾 Menyimpan data absensi..."
   - "✅ 🎉 Absensi berhasil!"
7. **Lihat card "Sudah Absen Hari Ini"** muncul
8. **Verify di Supabase:**
   - Storage → ada foto baru
   - Database → attendance → ada row baru dengan photo_selfie_url

### **Step 5: Check Console Logs**
```javascript
// Expected logs for camera:
[Camera] Requesting camera access...
[Camera] Camera access granted
[Camera] Preview modal displayed
[Camera] Capturing photo...
[Camera] Photo captured, size: 1280 x 720
[Camera] Blob created, size: 145.32 KB

// Expected logs for upload:
[Upload] Starting upload for user: abc123...
[Upload] Blob size: 145.32 KB
[Upload] Response status: 200
[Upload] ✅ Upload successful, URL: https://...

// Expected logs for attendance:
🚀 Starting attendance submission...
📤 Uploading photo, size: 145.32 KB
📤 Photo uploaded: https://...
📤 Submitting attendance with payload: {...}
📥 Attendance response: {success: true, ...}
✅ Attendance submitted successfully!
```

---

## ✅ Success Criteria

- ✅ Modal camera muncul dengan live video feed
- ✅ User bisa lihat dirinya sendiri sebelum capture
- ✅ Tombol "Ambil Foto" bekerja
- ✅ Foto ter-capture dengan benar
- ✅ Toast notifications muncul di setiap step
- ✅ Console logs terlihat lengkap
- ✅ Upload berhasil ke Supabase Storage
- ✅ File foto ada di bucket "attendance/selfies/"
- ✅ URL foto valid dan bisa dibuka
- ✅ Biometric setup berhasil (first time)
- ✅ Attendance submit berhasil (regular)
- ✅ Data tersimpan di database dengan photo_selfie_url

---

## 🐛 Troubleshooting

### **Issue: Modal tidak muncul**
```javascript
Check console:
- [Camera] Error: NotAllowedError → Camera permission denied
  Solution: Allow camera access in browser settings

- [Camera] Error: NotFoundError → No camera detected
  Solution: Connect webcam or use device with camera
```

### **Issue: Upload gagal**
```javascript
Check console:
- [Upload] Response status: 403 → Unauthorized
  Solution: Check userId matches session.user.id

- [Upload] ❌ Upload error: Failed to fetch
  Solution: Check internet connection
  
- [Upload] Invalid response: {success: true}
  Solution: Check API returns URL in response
```

### **Issue: Foto tidak tersimpan**
```javascript
Check Supabase:
1. Storage → attendance bucket exists?
2. RLS policies allow upload?
3. Service role key correct in .env?

Check API logs:
- error: "Missing file or userId"
  → FormData tidak lengkap
  
- error: "Cannot upload for other users"
  → UserId tidak match dengan session
```

---

## 🎓 Learned from This Fix

1. **Always show preview** untuk user-generated content (foto, video)
2. **Multi-step progress indicators** penting untuk long operations
3. **Comprehensive logging** crucial untuk debugging production issues
4. **API contract validation** - pastikan client dan server sync
5. **Error handling** harus specific dan actionable
6. **User feedback** di setiap step (loading, success, error)

---

**Status:** ✅ **COMPLETE - Ready for Testing**

**Next Steps:**
1. Commit & push code
2. Wait for Vercel deployment
3. Manual testing dengan checklist di atas
4. Verify data di Supabase

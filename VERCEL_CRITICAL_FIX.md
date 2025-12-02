# 🚨 CRITICAL: VERCEL PRODUCTION DEPLOYMENT FIX

**Date**: December 2, 2024  
**Status**: ⚠️ **CRITICAL ISSUES FOUND - MUST FIX BEFORE DEPLOYMENT**

---

## ❌ MASALAH CRITICAL YANG DITEMUKAN

### 1. **SUPABASE_SERVICE_ROLE_KEY = PLACEHOLDER!**

```env
# ❌ CURRENT di .env.production:
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ✅ HARUS DIGANTI dengan actual key!
```

**Dampak Jika Tidak Diperbaiki**:
- ❌ **Biometric setup GAGAL TOTAL**
- ❌ **Admin panel save config ERROR 500**
- ❌ **Attendance submit BROKEN**
- ❌ **User registration TIDAK BERFUNGSI**
- ❌ **WebAuthn credential TIDAK BISA DISIMPAN**

**Cara Fix**:
1. Buka https://supabase.com/dashboard
2. Pilih project: `mhefqwregrldvxtqqxbb`
3. Klik **Settings** → **API**
4. Scroll ke **Project API keys**
5. Copy **`service_role`** key (secret) - **BUKAN anon key!**
6. Paste ke Vercel Environment Variables

---

### 2. **NEXTAUTH_SECRET = PLACEHOLDER!**

```env
# ❌ CURRENT di .env.production:
NEXTAUTH_SECRET=your_production_nextauth_secret_here

# ✅ HARUS GENERATE SECRET BARU!
```

**Dampak Jika Tidak Diperbaiki**:
- ❌ **Login GAGAL TOTAL**
- ❌ **Session TIDAK VALID**
- ❌ **JWT token ERROR**
- ❌ **Authentication COMPLETELY BROKEN**

**Cara Fix (PowerShell)**:
```powershell
# Generate random secret 32 bytes:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Output contoh (COPY INI):
# K9mX2vN8pQ4rZ7sT1wY6uB3dF5gH8jL0mNpQ2sR4tU6vW8xY0zA
```

---

### 3. **ADMIN_OPS_TOKEN = PLACEHOLDER!**

```env
# ❌ CURRENT di .env.production:
ADMIN_OPS_TOKEN=your_admin_ops_token_here

# ✅ HARUS GENERATE TOKEN BARU!
```

**Dampak Jika Tidak Diperbaiki**:
- ⚠️ **Admin operations TIDAK AMAN**
- ⚠️ **API routes bisa diakses tanpa proper auth**

**Cara Fix (PowerShell)**:
```powershell
# Generate random token:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Output contoh (COPY INI):
# X7yZ9aB2cD4eF6gH8iJ0kL1mN3oP5qR7sT9uV1wX3yZ5aB7cD
```

---

## 🎯 ACTION PLAN - STEP BY STEP

### **STEP 1: Dapatkan SUPABASE_SERVICE_ROLE_KEY**

1. **Buka Browser** → https://supabase.com/dashboard
2. **Login** dengan akun Supabase Anda
3. **Pilih Project**: `mhefqwregrldvxtqqxbb`
4. **Klik Menu**: Settings (⚙️ di sidebar kiri bawah)
5. **Klik Tab**: API
6. **Scroll ke section**: "Project API keys"
7. **Lihat 2 keys**:
   - ✅ `anon` `public` - Key ini **SUDAH BENAR** di .env.production
   - ✅ `service_role` `secret` - **KEY INI YANG KITA BUTUHKAN!**
8. **Copy** `service_role` key (klik icon copy)
9. **Simpan** di notepad untuk step selanjutnya

**Key terlihat seperti**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZWZxd3JlZ3JsZHZ4dHFxeGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE2MDgxNywiZXhwIjoyMDc4NzM2ODE3fQ.TDBb5or_vE9Lo6w8QXFKjPut7xxMl3Jjp5MMFg9OKqk
```

---

### **STEP 2: Generate NEXTAUTH_SECRET**

1. **Buka PowerShell** (Windows + X → Windows PowerShell)
2. **Copy & Paste command** ini:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
3. **Press Enter**
4. **Output** akan muncul (contoh):
   ```
   K9mX2vN8pQ4rZ7sT1wY6uB3dF5gH8jL0mNpQ2sR4tU6vW8xY0zA2bC4dE6fG8h
   ```
5. **Copy output** ini
6. **Simpan** di notepad

---

### **STEP 3: Generate ADMIN_OPS_TOKEN**

1. **Masih di PowerShell** yang sama
2. **Jalankan lagi command** yang sama:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
3. **Press Enter**
4. **Output** akan muncul (contoh BERBEDA dari sebelumnya):
   ```
   X7yZ9aB2cD4eF6gH8iJ0kL1mN3oP5qR7sT9uV1wX3yZ5aB7cD9eF1gH3iJ5kL7m
   ```
5. **Copy output** ini
6. **Simpan** di notepad

---

### **STEP 4: Set Environment Variables di Vercel**

1. **Buka Browser** → https://vercel.com/ashera12/webosis-archive
2. **Klik Tab**: Settings
3. **Klik Menu**: Environment Variables (di sidebar kiri)
4. **Add Variables** satu per satu:

#### **Variable 1: SUPABASE_SERVICE_ROLE_KEY**
```
Name:         SUPABASE_SERVICE_ROLE_KEY
Value:        [paste key dari STEP 1]
Environment:  ☑ Production ☑ Preview ☑ Development
```
**Klik**: Add

#### **Variable 2: NEXTAUTH_SECRET**
```
Name:         NEXTAUTH_SECRET
Value:        [paste secret dari STEP 2]
Environment:  ☑ Production ☑ Preview ☑ Development
```
**Klik**: Add

#### **Variable 3: ADMIN_OPS_TOKEN**
```
Name:         ADMIN_OPS_TOKEN
Value:        [paste token dari STEP 3]
Environment:  ☑ Production ☑ Preview ☑ Development
```
**Klik**: Add

#### **Variable 4: AUTH_TRUST_HOST** (CRITICAL untuk Vercel!)
```
Name:         AUTH_TRUST_HOST
Value:        true
Environment:  ☑ Production ☑ Preview ☑ Development
```
**Klik**: Add

---

### **STEP 5: Verify Semua Environment Variables**

Di Vercel → Settings → Environment Variables, pastikan ada:

✅ **WAJIB (CRITICAL!)**:
```
NEXT_PUBLIC_BASE_URL              https://osissmktest.biezz.my.id
NEXT_PUBLIC_SITE_URL              https://osissmktest.biezz.my.id
NEXTAUTH_URL                      https://osissmktest.biezz.my.id
NEXTAUTH_SECRET                   [generated secret dari STEP 2] ✅
AUTH_TRUST_HOST                   true ✅
NODE_ENV                          production
NEXT_PUBLIC_SUPABASE_URL          https://mhefqwregrldvxtqqxbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY         [key dari STEP 1] ✅
ADMIN_OPS_TOKEN                   [generated token dari STEP 3] ✅
ADMIN_NOTIFICATION_EMAILS         bilaniumn1@gmail.com
ALLOW_ADMIN_OPS                   true
```

⚠️ **RECOMMENDED (untuk email)**:
```
RESEND_API_KEY                    re_xxxxxxxxxxxx (jika pakai Resend)
EMAIL_FROM                        noreplay@osissmktest.biezz.my.id

# ATAU jika pakai Gmail:
SMTP_HOST                         smtp.gmail.com
SMTP_PORT                         587
SMTP_USER                         bilaniumn1@gmail.com
SMTP_PASS                         [App Password dari Google]
SMTP_SECURE                       false
```

🔵 **OPTIONAL (nice to have)**:
```
OPENAI_API_KEY                    sk-xxxx (untuk AI features)
GOOGLE_AI_API_KEY                 AIza-xxxx
NEXT_PUBLIC_REFRESH_INTERVAL      30
LOGO_URL                          https://pasteimg.com/images/2025/11/22/logo-2.md.png
```

---

### **STEP 6: Redeploy**

Ada 2 cara:

#### **Option A: Push ke GitHub (Auto-Deploy)**
```bash
# Di terminal:
git add .
git commit -m "fix: Add critical environment variables for production"
git push origin release/attendance-production-ready-v2

# Vercel akan auto-deploy
```

#### **Option B: Manual Redeploy di Vercel**
1. Vercel Dashboard → **Deployments** tab
2. Klik **...** (3 dots) di latest deployment
3. Klik **Redeploy**
4. ✅ **Use Existing Build Cache**: UNCHECK (force fresh build)
5. Klik **Redeploy**

---

### **STEP 7: Monitor Deployment**

1. **Vercel** → Deployments → Latest deployment
2. **Watch "Building"** status:
   ```
   Building...
   ├─ Installing dependencies...
   ├─ Building application...
   ├─ Creating optimized production build...
   ├─ Collecting page data...
   └─ Finalizing page optimization...
   ```

3. **Check for Errors**:
   - ✅ **Success**: "Build completed successfully" (hijau)
   - ❌ **Error**: Red message → Check Build Logs

4. **Deployment Status**:
   - ✅ **Ready**: Deployment is live
   - ⏳ **Building**: Wait...
   - ❌ **Error**: Check logs

---

## 🧪 TESTING SETELAH DEPLOYMENT

### **Test 1: Login**

1. Buka: https://osissmktest.biezz.my.id/login
2. Enter credentials:
   ```
   Email: bilaniumn1@gmail.com
   Password: [your password]
   ```
3. Klik **Login**
4. **✅ Expected**: Redirect ke `/dashboard`
5. **❌ Error**: 
   - "NextAuth configuration error" → Check `NEXTAUTH_SECRET`
   - Redirect loop → Check `AUTH_TRUST_HOST=true`

---

### **Test 2: Admin Panel**

1. Buka: https://osissmktest.biezz.my.id/admin/attendance/settings
2. Login as admin (super_admin role)
3. **Verify**: Settings load correctly
4. **Change** GPS coordinates atau WiFi SSID
5. Klik **"💾 Simpan Konfigurasi"**
6. **✅ Expected**: Toast "✅ Konfigurasi berhasil disimpan!"
7. **❌ Error**:
   - 401 Unauthorized → Check `SUPABASE_SERVICE_ROLE_KEY`
   - 500 Internal Error → Check Vercel Runtime Logs

**Check Console (F12)**:
```javascript
// ✅ Expected:
[POST config] Authenticated: osis@example.com
[POST config] Saving configuration...
[POST config] ✅ Configuration saved successfully

// ❌ Error:
[POST config] ❌ Unauthorized - No session
→ Check NEXTAUTH_SECRET

[POST config] ❌ Supabase error: Invalid API key
→ Check SUPABASE_SERVICE_ROLE_KEY
```

---

### **Test 3: Biometric Setup**

1. Buka: https://osissmktest.biezz.my.id/attendance
2. Login as student
3. Klik **"Daftar Biometric"**
4. Take selfie photo
5. Klik **"Daftar Biometric"** button
6. **✅ Expected**: Browser biometric prompt muncul
7. Authenticate (Face ID/Touch ID/Fingerprint)
8. **✅ Expected**: Toast "🎉 Biometric Berhasil Didaftarkan!"

**Check Console (F12)**:
```javascript
// ✅ Expected:
[Browser Check] ✅ WebAuthn supported
[Browser Check] ✅ Platform authenticator available
[Setup] 📸 Photo captured
[Setup] 📤 Starting photo upload...
[Setup] ✅ Photo uploaded
[Setup] 🔐 Method uses WebAuthn, registering...
[WebAuthn] 🔐 Starting registration...
[WebAuthn] 📲 Requesting credential creation...
// → Browser prompt appears here
[WebAuthn] ✅ Credential created!
[Setup] ✅ WebAuthn credential registered!

// ❌ Error:
[Setup] ❌ Photo upload failed: 500
→ Check SUPABASE_SERVICE_ROLE_KEY

[WebAuthn] ❌ Failed to fetch challenge
→ Check /api/attendance/biometric/webauthn/register-challenge
→ Verify SQL migrations run
```

---

### **Test 4: Attendance Submission**

1. **Setup** biometric dulu (Test 3)
2. Pastikan di area sekolah (GPS OK) atau disable GPS validation
3. Connect ke WiFi sekolah atau disable WiFi validation
4. Klik **"Absen Sekarang"**
5. **✅ Expected**: Browser biometric prompt muncul
6. Authenticate
7. **✅ Expected**: Toast "✅ Biometric Verified!"
8. Photo capture untuk AI verification
9. **✅ Expected**: Toast "🎉 Absensi Berhasil!"
10. **Verify**: Check database attendance record

**Check Database (Supabase SQL Editor)**:
```sql
SELECT * FROM attendance 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 1;

-- ✅ Expected: 1 row with today's timestamp
-- ✅ biometric_method_used = 'face-id' / 'touch-id' / 'fingerprint'
```

---

## 🔍 TROUBLESHOOTING GUIDE

### **Issue: Build Fails di Vercel**

**Error Message**:
```
Error: Missing required environment variable: NEXTAUTH_SECRET
```

**Fix**:
1. Go to Vercel → Settings → Environment Variables
2. Verify `NEXTAUTH_SECRET` exists for **Production**
3. If missing, add it (STEP 4)
4. Redeploy (STEP 6)

---

### **Issue: Login Stuck / Redirect Loop**

**Symptoms**:
```
/login → /dashboard → /login → /dashboard → ...
```

**Fix**:
1. **Check** `AUTH_TRUST_HOST=true` di Vercel
2. **Check** `NEXTAUTH_URL=https://osissmktest.biezz.my.id` (HTTPS!)
3. **Clear cookies**: Browser → Settings → Clear browsing data
4. **Retry** login

---

### **Issue: Admin Save Config Returns 401**

**Symptoms**:
```
POST /api/admin/attendance/config → 401 Unauthorized
```

**Fix**:
1. **Verify** `SUPABASE_SERVICE_ROLE_KEY` di Vercel
2. **Compare** dengan key di Supabase Dashboard → API settings
3. **Ensure** key **starts with** `eyJ...` (not placeholder)
4. **Redeploy** jika key baru saja di-update

**Test Key Validity**:
```bash
# Di terminal:
curl https://mhefqwregrldvxtqqxbb.supabase.co/rest/v1/school_location_config \
  -H "apikey: [your_service_role_key]" \
  -H "Authorization: Bearer [your_service_role_key]"

# ✅ Expected: JSON response
# ❌ Error: "Invalid API key" → Key salah
```

---

### **Issue: WebAuthn Prompt Tidak Muncul**

**Symptoms**:
```
Click "Daftar Biometric" → Loading → Error
Console: "Failed to fetch challenge"
```

**Possible Causes**:

1. **SQL Migration Belum Run**:
   ```sql
   -- Run di Supabase SQL Editor:
   -- Execute: add_biometric_type_column.sql
   
   ALTER TABLE biometric_data 
   ADD COLUMN IF NOT EXISTS biometric_type VARCHAR(50) DEFAULT 'fingerprint';
   
   ALTER TABLE biometric_data
   ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;
   ```

2. **WebAuthn Tables Missing**:
   ```sql
   -- Check if tables exist:
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('webauthn_credentials', 'webauthn_challenges');
   
   -- If missing: Run WEBAUTHN_MIGRATION.sql (dari WEBAUTHN_TESTING_GUIDE.md)
   ```

3. **Browser Tidak Support**:
   - Update browser ke versi terbaru
   - Test di Chrome 108+, Edge 108+, Safari 16+

4. **HTTPS Not Enabled**:
   - WebAuthn requires HTTPS
   - Vercel auto-provides HTTPS ✅
   - Verify URL: https:// (NOT http://)

---

### **Issue: 500 Internal Server Error**

**Symptoms**:
```
POST /api/attendance/biometric/setup → 500
Console: "Cannot read property 'from' of undefined"
```

**Fix**:
1. **Check Vercel Runtime Logs**:
   ```
   Vercel → Deployments → Latest → Runtime Logs
   → Filter: "Error"
   ```

2. **Common Causes**:
   - `SUPABASE_SERVICE_ROLE_KEY` tidak set atau salah
   - Supabase project paused (free tier auto-pauses)
   - Database connection timeout

3. **Verify Supabase**:
   - Open Supabase Dashboard
   - Check project status: **Active** (not paused)
   - Check API URL: `https://mhefqwregrldvxtqqxbb.supabase.co`

---

## ✅ SUCCESS CRITERIA

Setelah semua langkah di atas, system HARUS:

### **1. Build Success** ✅
```
Vercel → Deployments → Latest
Status: Ready (hijau)
Build Logs: "Build completed successfully"
No environment variable warnings
```

### **2. Login Works** ✅
```
https://osissmktest.biezz.my.id/login
→ Enter credentials
→ Redirect to /dashboard ✅
→ Session persists (refresh → still logged in) ✅
```

### **3. Admin Panel Works** ✅
```
https://osissmktest.biezz.my.id/admin/attendance/settings
→ Settings load correctly ✅
→ GPS/WiFi configs display ✅
→ Save changes → Success toast ✅
→ Database updated ✅
```

### **4. Biometric Setup Works** ✅
```
https://osissmktest.biezz.my.id/attendance
→ Click "Daftar Biometric" ✅
→ Browser prompt appears ✅
→ Authenticate → Success toast ✅
→ Database: webauthn_credentials created ✅
```

### **5. Attendance Works** ✅
```
→ Click "Absen Sekarang" ✅
→ Browser verification prompt ✅
→ Photo capture ✅
→ AI verification ✅
→ Success toast ✅
→ Database: attendance record created ✅
```

---

## 📊 DEPLOYMENT STATUS SUMMARY

| Component | Current Status | After Fix | Action Required |
|-----------|----------------|-----------|-----------------|
| `NEXTAUTH_SECRET` | ❌ PLACEHOLDER | ✅ VALID | Generate & set di Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ PLACEHOLDER | ✅ VALID | Get from Supabase & set di Vercel |
| `ADMIN_OPS_TOKEN` | ❌ PLACEHOLDER | ✅ VALID | Generate & set di Vercel |
| `AUTH_TRUST_HOST` | ⏳ NEED VERIFY | ✅ SET | Add to Vercel (value: `true`) |
| Login System | ❌ BROKEN | ✅ WORKING | After fixing NEXTAUTH_SECRET |
| Admin Panel | ❌ BROKEN | ✅ WORKING | After fixing SUPABASE_SERVICE_ROLE_KEY |
| Biometric | ❌ BROKEN | ✅ WORKING | After fixing SUPABASE_SERVICE_ROLE_KEY |
| WebAuthn | ⏳ UNTESTED | ✅ WORKING | After SQL migrations + env vars |

---

## 🎯 WAKTU YANG DIBUTUHKAN

- **STEP 1** (Get Supabase key): **2 menit**
- **STEP 2** (Generate NEXTAUTH_SECRET): **1 menit**
- **STEP 3** (Generate ADMIN_OPS_TOKEN): **1 menit**
- **STEP 4** (Set di Vercel): **5 menit**
- **STEP 5** (Verify): **2 menit**
- **STEP 6** (Redeploy): **5-10 menit** (waiting for build)
- **STEP 7** (Testing): **10 menit**

**TOTAL**: **~30 menit** untuk complete fix & verification

---

## 🚀 NEXT ACTIONS

1. ✅ **Baca dokumen ini** dengan teliti
2. ✅ **Execute STEP 1-6** secara berurutan
3. ✅ **Monitor deployment** (STEP 7)
4. ✅ **Test semua fitur** (Test 1-4)
5. ✅ **Verify database** records created
6. ✅ **Report hasil** (success/errors)

---

**CRITICAL**: Tanpa fix ini, system **TIDAK AKAN BERFUNGSI** di production!

**STATUS**: ⚠️ **ACTION REQUIRED IMMEDIATELY**  
**PRIORITY**: 🔴 **CRITICAL**  
**ESTIMATED FIX TIME**: **30 minutes**

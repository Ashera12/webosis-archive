# 🔧 Testing Approval & Logo Fix

## ✅ Perbaikan yang Sudah Dilakukan

### 1. Approval Logic Fixed
- ✅ Removed restrictive query (`approved=false` condition)
- ✅ Update works regardless of current state
- ✅ Added comprehensive logging

### 2. Logo Email Support
- ✅ Logo URL dari environment variable
- ✅ Fallback ke localhost untuk development
- ✅ Anti-spam headers ditambahkan

---

## 🚨 URGENT: Fix Logo URL

### ❌ Current URL SALAH!
```env
LOGO_URL=https://ibb.co.com/ym7Vx8W4  ← INI LINK HALAMAN, BUKAN GAMBAR!
```

### ✅ Cara Benar Upload Logo

**1. Buka ImgBB**
```
https://imgbb.com/
```

**2. Upload Logo**
- Klik "Start uploading"
- Pilih: `public\images\logo-2.png`
- Wait upload selesai

**3. Copy Direct Link**
```
❌ JANGAN copy dari address bar: https://ibb.co.com/xxxxx
✅ COPY dari "Direct link": https://i.ibb.co/xxxxx/logo-2.png
```

Screenshot lokasi Direct Link:
```
┌────────────────────────────────────┐
│ Share links:                       │
│                                    │
│ Direct link:                       │
│ ┌──────────────────────────────┐   │
│ │ https://i.ibb.co/xxxxx/...   │ ← COPY INI!
│ └──────────────────────────────┘   │
│ [Copy]                             │
└────────────────────────────────────┘
```

**4. Update .env.local**
```env
# Ganti dengan URL yang baru di-copy (harus ada i.ibb.co)
LOGO_URL=https://i.ibb.co/xxxxx/logo-2.png
```

**5. Restart Server**
```powershell
Ctrl+C
npm run dev
```

---

## 🧪 Testing Approval Flow

### Preparation
1. Start dev server dengan console visible
2. Buka 2 browser/tab:
   - Tab 1: Admin panel
   - Tab 2: Login page

### Test Steps

**1. Create Test User**
```
1. Register user baru
2. Verify email (klik link di inbox)
3. User status: email_verified=true, approved=false
```

**2. User Tries to Login (SHOULD FAIL)**
```
1. Tab 2: Login dengan user test
2. Expected error: "Akun sudah diverifikasi tetapi menunggu persetujuan admin"
3. Check console log:
   [attempt-login] User NOT approved: { user_id: xxx, approved: false }
```

**3. Admin Approves User**
```
1. Tab 1: Admin panel → Users/Members
2. Find test user
3. Click approve/toggle active
4. Check console log:
   [admin/users PUT approve] Updating user: { id: xxx, updateObj: { approved: true } }
   [admin/users PUT approve] SUCCESS: { approved: true }
```

**4. User Tries to Login Again (SHOULD SUCCESS)**
```
1. Tab 2: Login dengan user test LAGI
2. Should succeed and redirect to /admin
3. Check console log:
   [attempt-login] SUCCESS - User approved: { user_id: xxx, approved: true }
   [login_success] { email: xxx, approved: true }
```

### Expected Results

✅ **Before Approval:**
- Login fails with "menunggu persetujuan admin"
- Console: `approved: false`

✅ **After Approval:**
- Login succeeds immediately
- Console: `approved: true`
- No need to re-verify email
- No need to clear cache

---

## 🐛 Troubleshooting

### Issue 1: Logo Tidak Muncul di Email

**Check:**
```powershell
# 1. Verify LOGO_URL format
cat .env.local | Select-String "LOGO_URL"
# Should show: LOGO_URL=https://i.ibb.co/xxxxx/...

# 2. Test logo URL di browser
# Copy paste LOGO_URL ke browser → harus langsung tampil gambar PNG
```

**Fix:**
- ❌ URL harus bukan `https://ibb.co.com/...` (halaman)
- ✅ URL harus `https://i.ibb.co/...` (direct image)
- Upload ulang ke ImgBB dan copy Direct Link

### Issue 2: Approval Tidak Sinkron

**Check Console Logs:**

When admin approves:
```
[admin/users PUT approve] Updating user: { id: "xxx", updateObj: { approved: true } }
[admin/users PUT approve] SUCCESS: { id: "xxx", approved: true }
```

When user logs in:
```
[attempt-login] SUCCESS - User approved: { user_id: "xxx", approved: true }
```

**If logs show `approved: false` after admin approved:**

1. Check database directly di Supabase:
   ```sql
   SELECT id, email, approved, rejected FROM users WHERE email = 'test@example.com';
   ```

2. If DB shows `approved: true` but login fails:
   - Clear browser cache/cookies
   - Try incognito mode
   - Check for multiple user records (duplicate emails)

3. If DB shows `approved: false` after admin clicked approve:
   - Bug di admin panel
   - Screenshot console logs saat approve
   - Check RLS policies (might block update)

### Issue 3: User Still Can't Login After Approval

**Common Causes:**

1. **Email not verified**
   ```
   Error: "Email belum diverifikasi"
   → User harus klik link verifikasi di email dulu
   ```

2. **Rejected flag set**
   ```sql
   -- Check if user was previously rejected
   SELECT rejected, rejection_reason FROM users WHERE email = 'xxx';
   
   -- Fix: Clear rejection
   UPDATE users SET rejected = false, rejection_reason = null WHERE email = 'xxx';
   ```

3. **Role issues**
   ```sql
   -- Check role
   SELECT role, requested_role FROM users WHERE email = 'xxx';
   
   -- If role is 'pending', admin needs to set proper role when approving
   ```

---

## 📊 Monitoring Logs

### Development Console
Watch for these logs:

**On Approval:**
```
[admin/users PUT approve] Updating user: { id: "...", updateObj: {...} }
[admin/users PUT approve] SUCCESS: { approved: true, role: "..." }
```

**On Login Attempt:**
```
[attempt-login] SUCCESS - User approved: { user_id: "...", approved: true }
[login_success] { email: "...", role: "...", approved: true }
```

### Supabase Dashboard
Check realtime data:
```
Dashboard → Table Editor → users
→ Find user by email
→ Check columns: email_verified, approved, rejected, role
```

---

## ✅ Success Checklist

After testing, verify:

- [ ] Logo URL updated to `https://i.ibb.co/...` format
- [ ] Logo muncul di email (test forgot password)
- [ ] Email tidak masuk spam
- [ ] Sender name: "OSIS SMK Informatika FI"
- [ ] User can't login before approval
- [ ] Admin can approve user
- [ ] User can login immediately after approval
- [ ] No errors in console
- [ ] Approval state syncs correctly

---

## 🆘 Masih Bermasalah?

Share screenshot:
1. `.env.local` LOGO_URL (sensor API keys)
2. Console logs saat admin approve
3. Console logs saat user login
4. Database screenshot (users table untuk test user)
5. Error message yang muncul

Format:
```
LOGO_URL=https://i.ibb.co/xxxxx/logo-2.png  ← screenshot ini

Console saat approve:
[admin/users PUT approve] ...  ← screenshot ini

Console saat login:
[attempt-login] ...  ← screenshot ini

Database:
email: test@test.com
approved: true/false  ← screenshot ini
```

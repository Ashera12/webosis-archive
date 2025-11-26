# 🔍 Role Change Debug Steps - Panduan Lengkap Testing

## ⚠️ CRITICAL INFORMATION

**PENTING:** Perubahan role di database **TIDAK LANGSUNG** terlihat di badge dan permissions. Ini bukan bug, ini adalah **by design** dari sistem JWT NextAuth.

### Mengapa Role Tidak Langsung Berubah?

```
┌─────────────────────────────────────────────────────┐
│  JWT Token Architecture (NextAuth)                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Login → JWT token dibuat (berisi role)          │
│  2. Token di-sign oleh server → IMMUTABLE           │
│  3. Middleware baca role dari JWT → BUKAN database  │
│  4. Admin ubah role di database                     │
│  5. JWT token TETAP sama (masih punya role lama)    │
│  6. Middleware masih baca role lama dari JWT        │
│                                                      │
│  ✅ SOLUSI: Logout → Login → JWT baru dibuat        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 📋 Testing Checklist

### Persiapan
- [ ] Buka browser dengan Developer Tools (F12)
- [ ] Buka tab Console
- [ ] Buka tab Network
- [ ] Clear console dan network logs
- [ ] Screenshot setiap step untuk dokumentasi

---

## 🧪 Test Case 1: Role Change Flow (Complete)

### Step 1: Admin Login
1. Buka `/admin/login`
2. Login sebagai super_admin
3. ✅ **Verify**: Berhasil masuk ke admin panel

### Step 2: Check User Current Role
1. Buka `/admin/users`
2. Cari user yang akan diubah rolenya (misal: user123)
3. Lihat current role (misal: "osis")
4. **Screenshot**: User list dengan role saat ini
5. ✅ **Expected**: User terlihat dengan role "osis"

### Step 3: Open User Profile in Admin
1. Klik "Edit" pada user tersebut
2. Lihat form edit user
3. **Screenshot**: Form edit dengan role selector
4. ✅ **Expected**: 
   - Role dropdown menunjukkan "osis"
   - Semua field user terisi

### Step 4: Change Role
1. Ubah role dari "osis" ke "super_admin"
2. **CONSOLE CHECK**: Perhatikan console logs
3. Klik "Save Changes"
4. **NETWORK CHECK**: 
   - Lihat tab Network
   - Cari request `PUT /api/admin/users/[id]`
   - Check Request Payload:
     ```json
     {
       "role": "super_admin",
       "name": "...",
       "email": "..."
     }
     ```
   - Check Response:
     ```json
     {
       "success": true,
       "message": "User updated successfully"
     }
     ```
5. **CONSOLE CHECK**: Cari log:
   ```
   [admin/users/[id] PUT] Role will be updated to: super_admin
   ```
6. ✅ **Expected**: 
   - Success message muncul
   - Console menunjukkan role akan diupdate
   - Network response status 200

### Step 5: Verify Database Update
1. Refresh page `/admin/users`
2. Cari user yang sama
3. **Screenshot**: User list setelah update
4. ✅ **Expected**: Role sekarang "super_admin" di admin panel
5. **ADDITIONAL CHECK** (Optional - Supabase):
   ```sql
   SELECT id, email, role FROM users WHERE email = 'user123@example.com';
   ```
   - Role di database sudah "super_admin" ✅

---

### Step 6: User Checks Dashboard (BEFORE LOGOUT)

**CRITICAL STEP** - Ini akan menunjukkan masalah!

1. **User** buka browser baru (atau incognito)
2. Login sebagai user yang rolenya baru diubah (user123)
3. Buka `/dashboard`
4. **CONSOLE CHECK**: Lihat logs:
   ```
   [Dashboard] Current session role: osis
   [Dashboard] Fetched data role: super_admin
   [Dashboard] Comparing roles - Session: osis DB: super_admin
   [Dashboard] Role changed detected! { old: 'osis', new: 'super_admin' }
   ```
5. **Screenshot**: Dashboard dengan badge

**⚠️ EXPECTED BEHAVIOR:**
- Badge masih "OSIS" (KUNING) ❌ Belum berubah
- Profile di bawah menunjukkan "super_admin" ✅ Sudah berubah
- Dialog muncul: "Role Anda telah diubah... perlu login ulang" ✅
- Console menunjukkan role mismatch ✅

**WHY?**
- Badge menggunakan `profile?.role` yang ambil dari API `/api/profile`
- API sudah baca database → role sudah "super_admin"
- TAPI JWT token masih punya role "osis"
- Middleware masih baca "osis" dari JWT
- Permission checks masih pakai "osis"

### Step 7: Try Access Super Admin Route (BEFORE LOGOUT)

**CRITICAL TEST** - Membuktikan permission belum aktif!

1. Masih di dashboard user123
2. Coba akses `/admin/settings`
3. **EXPECTED**: 
   - Middleware redirect ke `/admin/login` atau `/404` ❌
   - Permission denied karena JWT masih "osis"
4. **CONSOLE CHECK**: Middleware logs (jika ada)
5. **Screenshot**: Access denied page

**WHY BLOCKED?**
- Middleware checks permission dari JWT token
- JWT token masih "osis"
- Route `/admin/settings` requires `canManageSettings`
- Role "osis" tidak punya permission itu
- BLOCKED ❌

---

### Step 8: User Logout & Login (THE FIX)

**CRITICAL STEP** - Ini yang membuat role aktif!

1. User klik OK pada dialog "Role telah diubah"
2. **EXPECTED**: 
   - `signOut()` dipanggil
   - Redirect ke `/admin/login`
   - Session cleared
3. **Screenshot**: Login page setelah logout
4. User login kembali dengan credentials yang sama
5. **DURING LOGIN - CONSOLE CHECK**:
   ```
   [auth] authorize() called
   [auth] jwt() callback - adding role to token: super_admin
   [auth] session() callback - copying role to session: super_admin
   ```
6. **Screenshot**: Redirect setelah login

**WHAT HAPPENS?**
```
Login Flow:
1. authorize() - verify credentials
2. jwt() callback - CREATE NEW TOKEN with role from DB
3. Token signed → JWT now has "super_admin"
4. session() callback - copy role to session object
5. Cookie updated with new JWT
6. Middleware now reads "super_admin" from JWT ✅
```

---

### Step 9: Verify Badge After Login

1. User di `/dashboard` setelah login
2. **Screenshot**: Dashboard dengan badge baru
3. ✅ **EXPECTED**:
   - Badge shows "SUPER ADMIN" (RED-YELLOW gradient) ✅
   - Profile shows "super_admin" ✅
   - Console logs:
     ```
     [Dashboard] Current session role: super_admin
     [Dashboard] Fetched data role: super_admin
     [Dashboard] Comparing roles - Session: super_admin DB: super_admin
     ```
   - NO dialog muncul (role sudah match) ✅

**WHY WORKS NOW?**
- JWT token baru dibuat dengan role "super_admin"
- Session.user.role = "super_admin"
- profile.role = "super_admin" (dari database)
- Badge renders berdasarkan profile.role ✅
- All in sync ✅

---

### Step 10: Verify Permissions After Login

**FINAL TEST** - Membuktikan permission sudah aktif!

1. User coba akses `/admin/settings`
2. ✅ **EXPECTED**:
   - Middleware allows access ✅
   - Page loads successfully ✅
   - Can edit settings ✅
3. **Screenshot**: Settings page accessible

4. User coba akses `/admin/terminal`
5. ✅ **EXPECTED**:
   - Middleware allows access ✅
   - Terminal page loads ✅

6. **CONSOLE CHECK**: Middleware logs (if any)

**WHY WORKS?**
- JWT token has "super_admin"
- Middleware reads "super_admin" from JWT
- Check: `hasPermission('super_admin', 'canManageSettings')` → TRUE ✅
- Check: `hasPermission('super_admin', 'canAccessTerminal')` → TRUE ✅
- Access granted ✅

---

## 📊 Expected Console Logs (Complete Flow)

### Admin Changes Role:
```
[admin/users/[id] PUT] Incoming request body: { role: "super_admin", ... }
[admin/users/[id] PUT] Role will be updated to: super_admin
[admin/users/[id] PUT] Update object: { role: "super_admin", ... }
[admin/users/[id] PUT] Supabase update successful
```

### User Refreshes Dashboard (Before Logout):
```
[Dashboard] loadProfile response: { success: true, data: { role: "super_admin", ... } }
[Dashboard] Current session role: osis
[Dashboard] Fetched data role: super_admin
[Dashboard] Profile set to: { role: "super_admin", ... }
[Dashboard] Comparing roles - Session: osis DB: super_admin
[Dashboard] Role changed detected! { old: "osis", new: "super_admin" }
```

### Profile API Response:
```
[profile GET] User ID: abc123
[profile GET] Role from database: super_admin
[profile GET] Role from session: osis
[profile GET] Full result: { role: "super_admin", ... }
```

### User Logs In (After Logout):
```
[auth] authorize() called for: user123@example.com
[auth] User found: { id: "abc123", role: "super_admin" }
[auth] jwt() callback - token.role: super_admin
[auth] session() callback - session.user.role: super_admin
```

### User Checks Dashboard (After Login):
```
[Dashboard] loadProfile response: { success: true, data: { role: "super_admin", ... } }
[Dashboard] Current session role: super_admin
[Dashboard] Fetched data role: super_admin
[Dashboard] Profile set to: { role: "super_admin", ... }
[Dashboard] Comparing roles - Session: super_admin DB: super_admin
(No role change detected - roles match)
```

---

## 🐛 Troubleshooting

### Issue 1: Role tidak tersimpan di database

**Symptoms:**
- Admin panel masih menunjukkan role lama
- Network response menunjukkan error

**Debug:**
```
Console: [admin/users/[id] PUT] Error: Invalid role: xyz
Network: Status 400 Bad Request
```

**Solution:**
- Pastikan role yang dipilih adalah salah satu dari: `viewer`, `siswa`, `osis`, `super_admin`, `guru`, `other`
- Check ALLOWED_ROLES in API route

---

### Issue 2: Dialog logout tidak muncul

**Symptoms:**
- Role berubah di database
- Badge tidak berubah
- Tidak ada prompt untuk logout

**Debug:**
```javascript
// Check di browser console:
sessionStorage.getItem('role_change_prompted')
```

**Possible Causes:**
1. JavaScript error sebelum dialog
2. Role comparison tidak detect perubahan
3. Auto-refresh tidak jalan

**Solution:**
1. Check console untuk errors
2. Manual refresh dengan button "Refresh Data"
3. Check network tab - apakah `/api/profile` dipanggil?

---

### Issue 3: Setelah login badge masih lama

**Symptoms:**
- Sudah logout dan login
- Badge masih menunjukkan role lama
- Permission masih pakai role lama

**Debug:**
```
Console: Check apakah ada log [auth] jwt() callback
Network: Check cookie NextAuthjs.session-token - apakah updated?
```

**Possible Causes:**
1. JWT callback tidak jalan
2. Database role tidak tersimpan
3. Cache browser

**Solution:**
1. Clear browser cache dan cookies
2. Verify database dengan SQL:
   ```sql
   SELECT email, role FROM users WHERE email = 'user@example.com';
   ```
3. Check `lib/auth.ts` - pastikan jwt() callback ada dan benar

---

## ✅ Success Criteria

Role change dianggap **BERHASIL** jika:

1. ✅ Admin dapat mengubah role di `/admin/users`
2. ✅ Database updated (verify di admin panel atau Supabase)
3. ✅ User refresh dashboard → dialog logout muncul
4. ✅ Console logs menunjukkan role mismatch
5. ✅ Profile di dashboard menunjukkan role baru
6. ✅ Badge masih menunjukkan role lama (before logout)
7. ✅ User logout dan login kembali
8. ✅ Badge menunjukkan role baru (after login)
9. ✅ User dapat akses routes sesuai permission baru
10. ✅ Console logs menunjukkan JWT token updated

---

## 🔧 Technical Notes

### JWT Token Lifecycle

```
┌──────────────────────────────────────────────┐
│  1. User Login                                │
│     ↓                                         │
│  2. authorize() verifies credentials          │
│     ↓                                         │
│  3. jwt() callback creates token              │
│     token = { sub: userId, role: "osis" }     │
│     ↓                                         │
│  4. Token signed with secret → IMMUTABLE      │
│     ↓                                         │
│  5. Stored in cookie (NextAuthjs.session)     │
│     ↓                                         │
│  6. Middleware reads token on every request   │
│     ↓                                         │
│  7. Admin changes role in database            │
│     ↓                                         │
│  8. Token UNCHANGED (still "osis")            │
│     ↓                                         │
│  9. User MUST logout to invalidate token      │
│     ↓                                         │
│  10. New login → new token created            │
│      token = { sub: userId, role: "super" }   │
│     ↓                                         │
│  11. New token signed and stored              │
│     ↓                                         │
│  12. Middleware reads new role ✅             │
└──────────────────────────────────────────────┘
```

### Why updateSession() Doesn't Work

```javascript
// ❌ DOESN'T WORK - Only updates React state
await updateSession({ user: { role: 'super_admin' } });
// - Updates session object in client component
// - Does NOT update JWT token cookie
// - Middleware still reads old JWT
// - Permissions still based on old role

// ✅ WORKS - Forces new token creation
await signOut({ callbackUrl: '/admin/login' });
// - Clears session cookie
// - Redirects to login
// - User logs in again
// - authorize() → jwt() → NEW token created
// - New token has updated role from database
```

### RoleBadge Component Logic

```typescript
// components/RoleBadge.tsx
export function RoleBadge({ role }) {
  // role prop comes from parent component
  // In dashboard: <RoleBadge role={userRole} />
  // userRole = profile?.role || session?.user?.role
  
  // This means badge shows:
  // 1. profile.role if available (from /api/profile - reads DB)
  // 2. Falls back to session.user.role (from JWT)
  
  // So badge CAN show updated role from DB
  // But permissions still use JWT role
}
```

---

## 📝 Testing Checklist Summary

```
[ ] 1. Admin login berhasil
[ ] 2. User current role terlihat di admin panel
[ ] 3. Admin ubah role user
[ ] 4. Console log menunjukkan role akan diupdate
[ ] 5. Network response 200 OK
[ ] 6. Admin panel menunjukkan role baru
[ ] 7. Database verify role updated (optional)
[ ] 8. User refresh dashboard
[ ] 9. Dialog logout muncul
[ ] 10. Console menunjukkan role mismatch
[ ] 11. Profile menunjukkan role baru
[ ] 12. Badge masih menunjukkan role lama
[ ] 13. Permission test - akses ditolak ke super admin routes
[ ] 14. User klik OK untuk logout
[ ] 15. Redirect ke login page
[ ] 16. User login kembali
[ ] 17. Console menunjukkan JWT callback dengan role baru
[ ] 18. Dashboard loaded dengan badge baru
[ ] 19. Permission test - akses berhasil ke super admin routes
[ ] 20. Console menunjukkan role match (no dialog)
```

---

## 🚨 Critical Understanding

**INI BUKAN BUG!** Ini adalah cara kerja standard JWT authentication:

1. **JWT tokens are immutable** - tidak bisa diubah setelah di-sign
2. **Middleware reads JWT** - bukan database
3. **Only way to update JWT** - create new token via re-login
4. **updateSession() is client-side only** - tidak affect server/middleware

**Alternative (Not Recommended):**
- Gunakan database session strategy instead of JWT
- Cons: Slower (database query every request), more complex
- Pros: Session can be updated without re-login

**Current Implementation is Correct:**
- JWT is faster (no database query)
- Forced logout is acceptable UX for rare role changes
- Clear security boundary (explicit re-authentication)

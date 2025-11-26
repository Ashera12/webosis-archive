# Testing Guide: Role Change & Sync

## Quick Test Steps

### Step 1: Admin Change User Role

1. **Login sebagai admin/super_admin**
   - URL: `http://localhost:3000/admin/login`
   - Login dengan akun super_admin

2. **Buka User Management**
   - URL: `http://localhost:3000/admin/users`
   - Lihat daftar users

3. **Edit User Role**
   - Klik tombol "Edit" pada user yang ingin diubah
   - Pada form modal, ubah "Role" dari dropdown
   - Contoh: Ubah dari "siswa" → "super_admin"
   - Klik "Simpan Perubahan"
   - ✅ Check: Alert "User berhasil disimpan!" muncul
   - ✅ Check: Table user langsung ter-update dengan role baru

### Step 2: Verify Database Update

1. **Check Supabase Database**
   - Buka Supabase Dashboard → Table Editor
   - Pilih table `users`
   - Cari user yang baru diubah (by email)
   - ✅ Check: Column `role` berisi "super_admin" (bukan "siswa")

2. **Alternative: Check via API**
   ```bash
   # Replace USER_ID with actual ID
   curl http://localhost:3000/api/admin/users/USER_ID
   ```
   - ✅ Check: Response JSON menunjukkan `"role": "super_admin"`

### Step 3: User Experience - Role Update

**Scenario A: User sedang login**

1. **User buka dashboard di browser lain/incognito**
   - Login sebagai user yang baru diubah rolenya
   - URL: `http://localhost:3000/dashboard`

2. **Tunggu auto-refresh (max 30 detik) ATAU klik "Refresh Data"**
   - ✅ Check: Notifikasi hijau muncul di kanan atas:
     ```
     "Role Berhasil Diperbarui!"
     "Role Anda sekarang: super_admin"
     ```
   - ✅ Check: Badge berubah dari Siswa (ungu 🟣) → Super Admin (merah-kuning 🔴)
   - ✅ Check: Browser console log: `[Dashboard] Role changed detected! { old: 'siswa', new: 'super_admin' }`

3. **Test Access**
   - Coba akses `/admin/users`
   - ✅ Check: Bisa akses (tidak redirect ke /404)
   - Coba akses `/admin/settings`
   - ✅ Check: Super admin bisa akses, role lain tidak bisa

**Scenario B: User belum login**

1. **User logout (jika masih login)**
2. **Login lagi dengan akun yang sudah diubah**
   - ✅ Check: Langsung login dengan role baru
   - ✅ Check: Badge sudah menunjukkan "Super Admin"
   - ✅ Check: Akses admin routes langsung bisa

### Step 4: Verify Permissions

Test matrix berdasarkan role:

**Super Admin:**
```
✅ /admin/users - Bisa akses, edit, delete users
✅ /admin/settings - Bisa akses
✅ /admin/terminal - Bisa akses
✅ /admin/posts - Bisa create, edit, delete
✅ /admin/events - Bisa create, edit, delete
```

**Admin:**
```
✅ /admin/users - Bisa akses, edit, delete users
❌ /admin/terminal - Tidak bisa akses (redirect 404)
❌ User role assignment - Tidak bisa ubah role user lain
✅ /admin/posts - Bisa create, edit, delete
```

**Moderator:**
```
👁️ /admin/users - Read only (tidak ada tombol edit/delete)
❌ /admin/settings - Tidak bisa akses
✅ /admin/posts - Bisa create, edit, delete
```

**Siswa:**
```
❌ /admin/* - Semua admin routes redirect ke /404
✅ /admin/profile - Bisa edit profile sendiri (exception)
✅ /dashboard - Bisa akses
```

## Common Issues & Solutions

### Issue 1: Badge Tidak Berubah

**Symptom:**
- Admin sudah ubah role di `/admin/users`
- User refresh dashboard tapi badge masih role lama

**Debug Steps:**
1. **Check database:**
   ```sql
   SELECT id, email, role FROM users WHERE email = 'user@test.com';
   ```
   - Jika role masih lama → Problem di API save

2. **Check API logs:**
   - Buka Network tab di browser
   - Filter: `users/[id]`
   - Check request payload: `{"role": "super_admin", ...}`
   - Check response: `{"success": true, "data": {"role": "super_admin"}}`

3. **Check browser console:**
   ```
   [admin/users/[id] PUT] Role will be updated to: super_admin
   [admin/users/[id] PUT] SUCCESS - Role: super_admin
   ```

**Solutions:**
- ✅ Klik "Refresh Data" di dashboard
- ✅ Tunggu 30 detik (auto-refresh)
- ✅ Logout dan login lagi
- ✅ Hard refresh browser (Ctrl+Shift+R)

### Issue 2: Role Tersimpan tapi Akses Masih Ditolak

**Symptom:**
- Role di database sudah "super_admin"
- Badge di dashboard sudah berubah
- Tapi akses `/admin/settings` masih redirect 404

**Cause:**
- Session belum refresh
- Middleware masih pakai role lama dari JWT token

**Solutions:**
1. **Force refresh session:**
   - Logout
   - Login lagi
   - Session JWT akan dibuat ulang dengan role baru

2. **Check session:**
   - Buka `/api/debug-session`
   - Lihat `session.user.role`
   - Harus sama dengan role di database

### Issue 3: Admin Ubah Role tapi Tidak Ada Perubahan

**Symptom:**
- Admin klik "Simpan Perubahan"
- Alert muncul "User berhasil disimpan!"
- Tapi role tetap sama

**Debug:**
```javascript
// Check console logs
[Admin Users] Submitting form: { editingId: '...', is_active: true }
[admin/users/[id] PUT] Role will be updated to: super_admin
[admin/users/[id] PUT] SUCCESS - Role: super_admin
```

**Possible Causes:**
1. **Invalid role name:**
   - Allowed roles: `super_admin`, `admin`, `moderator`, `osis`, `siswa`, `guru`, `other`
   - Check: Case-sensitive!
   
2. **RLS Policy blocking:**
   - Check Supabase RLS policies on `users` table
   - Admin harus punya permission untuk UPDATE

3. **API permission error:**
   - Check: `requirePermission('users:edit')` di API
   - Check: User yang login punya role admin/super_admin

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test update
UPDATE users SET role = 'super_admin' WHERE email = 'user@test.com';

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Issue 4: Notifikasi "Role Berhasil Diperbarui" Tidak Muncul

**Symptom:**
- Role berubah di database
- Badge berubah
- Tapi tidak ada notifikasi hijau

**Cause:**
- Auto-refresh interval belum detect change
- Session.user.role sama dengan data.data.role

**Check:**
```javascript
// Browser console should show:
[Dashboard] Role changed detected! { old: 'siswa', new: 'super_admin' }
```

**Solution:**
- Klik "Refresh Data" secara manual
- Check: `roleChanged` state di dashboard component

## Debugging Tools

### 1. Browser Console Logs

**Admin side (saat save):**
```
[Admin Users] Submitting form: { editingId: 'xxx', is_active: true }
[admin/users/[id] PUT] Role will be updated to: super_admin
[admin/users/[id] PUT] Updating user: { id: 'xxx', update: { role: 'super_admin', ... } }
[admin/users/[id] PUT] SUCCESS - Role: super_admin
```

**User side (saat refresh):**
```
[Dashboard] Role changed detected! { old: 'siswa', new: 'super_admin' }
```

### 2. Network Tab

**PUT /api/admin/users/[id]:**
```json
Request:
{
  "name": "John Doe",
  "role": "super_admin",
  "is_active": true,
  ...
}

Response:
{
  "success": true,
  "data": {
    "id": "xxx",
    "role": "super_admin",
    "name": "John Doe",
    ...
  }
}
```

### 3. Supabase Logs

1. Buka Supabase Dashboard
2. Pilih project → Logs
3. Filter: `users` table
4. Check UPDATE query

### 4. API Debug Endpoint

```bash
# Check current session
curl http://localhost:3000/api/debug-session

# Expected:
{
  "user": {
    "id": "xxx",
    "email": "user@test.com",
    "role": "super_admin"
  }
}
```

## Expected Behavior Summary

### ✅ Correct Flow

```
1. Admin ubah role di /admin/users
   ↓
2. API /admin/users/[id] PUT dipanggil
   ↓
3. Database users.role di-update
   ↓
4. API return success dengan role baru
   ↓
5. Table di admin panel langsung update
   ↓
6. User buka dashboard (atau auto-refresh 30s)
   ↓
7. API /profile return role baru
   ↓
8. Dashboard detect role changed
   ↓
9. Session di-update dengan updateSession()
   ↓
10. Notifikasi hijau muncul
   ↓
11. Badge berubah ke role baru
   ↓
12. User bisa akses routes sesuai permission role baru
```

### ⏱️ Timing

- **Database update:** Instant (< 1s)
- **Admin panel table update:** Instant (after API success)
- **User dashboard auto-refresh:** Max 30 seconds
- **Manual refresh:** Instant (click "Refresh Data")
- **Session update:** Automatic (via updateSession)
- **Badge update:** Instant (after session update)
- **Notification display:** 10 seconds (auto-hide)

## Test Checklist

Use this checklist when testing role changes:

**Admin Panel:**
- [ ] Login sebagai admin/super_admin
- [ ] Buka `/admin/users`
- [ ] Edit user role
- [ ] Select role baru dari dropdown
- [ ] Klik "Simpan Perubahan"
- [ ] Alert "User berhasil disimpan!" muncul
- [ ] Table langsung update dengan role baru
- [ ] Badge di table berubah sesuai role

**Database:**
- [ ] Check Supabase table `users`
- [ ] Column `role` berisi role baru
- [ ] Check via API: `/api/admin/users/[id]`
- [ ] Response JSON `"role"` field correct

**User Dashboard:**
- [ ] Login/refresh sebagai user yang diubah
- [ ] Buka `/dashboard`
- [ ] Klik "Refresh Data" atau tunggu 30s
- [ ] Notifikasi hijau muncul di kanan atas
- [ ] Badge berubah sesuai role baru
- [ ] Console log menunjukkan role change detected

**Permissions:**
- [ ] Test akses admin routes sesuai role
- [ ] Super admin: Full access
- [ ] Admin: No terminal/settings
- [ ] Moderator: Content only
- [ ] Siswa: No admin access (except /admin/profile)

**Session:**
- [ ] Check `/api/debug-session`
- [ ] `session.user.role` sama dengan database
- [ ] Logout dan login lagi tetap role baru

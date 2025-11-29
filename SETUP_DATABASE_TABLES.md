# 🗄️ Setup Database Tables - REQUIRED

## ⚠️ IMPORTANT: Run This First!

Jika Anda mengalami masalah:
- ❌ "Belum Ada Aktivitas" di halaman `/activity`
- ❌ Error "relation activity_logs does not exist"
- ❌ Error "relation error_logs does not exist"

**Anda harus menjalankan SQL migrations ini di Supabase!**

---

## 📋 Step-by-Step Instructions

### 1. Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: **webosis-archive** (atau nama project Anda)
3. Klik menu **SQL Editor** (icon database di sidebar kiri)

---

### 2. Create Activity Logs Table

**File:** `create_activity_logs_table.sql`

**Langkah:**
1. Buka file `create_activity_logs_table.sql` di VS Code
2. **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)
3. Di Supabase SQL Editor:
   - Klik **"New Query"**
   - Paste SQL code
   - Klik **"Run"** (atau Ctrl+Enter)

**Expected Result:**
```
Success. No rows returned
```

**Verify Table Created:**
```sql
SELECT COUNT(*) FROM activity_logs;
```
Should return: `0` (table kosong, siap diisi)

---

### 3. Create Error Logs Table

**File:** `create_error_logs_enhanced_table.sql`

**Langkah:**
1. Buka file `create_error_logs_enhanced_table.sql` di VS Code
2. **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)
3. Di Supabase SQL Editor:
   - Klik **"New Query"** (buat query baru)
   - Paste SQL code
   - Klik **"Run"**

**Expected Result:**
```
Success. No rows returned
```

**Verify Table Created:**
```sql
SELECT COUNT(*) FROM error_logs;
```
Should return: `0` (table kosong, siap diisi)

---

## 🔍 Verify All Tables

Run this query to check both tables exist:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('activity_logs', 'error_logs')
ORDER BY table_name;
```

**Expected Result:**
```
table_name      | column_count
----------------|-------------
activity_logs   | 18
error_logs      | 35
```

---

## 🧪 Test Activity Logging

Setelah tables dibuat, test dengan login:

1. **Logout** dari aplikasi (jika sedang login)
2. **Login** kembali dengan email & password
3. **Buka halaman** `/activity`
4. **Should see:** Riwayat login dengan detail:
   - ✅ Icon login (hijau)
   - ✅ Waktu login ("Baru saja" atau "X menit lalu")
   - ✅ IP address (🌐)
   - ✅ Status: success

**Jika TIDAK muncul:**
- Check Supabase logs: Dashboard → Logs → API Logs
- Check browser console: F12 → Console tab
- Verify table: `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;`

---

## 📊 Check Activity Stats

Query untuk melihat aktivitas per user:

```sql
-- Total aktivitas per user
SELECT 
  user_email,
  COUNT(*) as total_activities,
  COUNT(DISTINCT activity_type) as unique_types,
  MAX(created_at) as last_activity
FROM activity_logs
GROUP BY user_email
ORDER BY total_activities DESC
LIMIT 10;
```

```sql
-- Aktivitas per tipe
SELECT 
  activity_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM activity_logs
GROUP BY activity_type
ORDER BY count DESC;
```

---

## 🐛 Check Error Logs

Query untuk melihat errors:

```sql
-- Recent errors
SELECT 
  error_type,
  severity,
  message,
  occurrence_count,
  created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 10;
```

```sql
-- Critical errors
SELECT 
  error_type,
  message,
  occurrence_count,
  user_email,
  page_url,
  created_at
FROM error_logs
WHERE severity = 'critical'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔧 Troubleshooting

### Problem: "relation activity_logs does not exist"

**Solution:**
1. Table belum dibuat → Run `create_activity_logs_table.sql`
2. Verify: `\dt activity_logs` (should show table info)
3. If still error: Drop and recreate:
   ```sql
   DROP TABLE IF EXISTS activity_logs CASCADE;
   -- Then run create_activity_logs_table.sql again
   ```

---

### Problem: "column status does not exist in error_logs"

**Solution:**
1. Table dibuat dengan versi lama → Run update:
   ```sql
   DROP TABLE IF EXISTS error_logs CASCADE;
   -- Then run create_error_logs_enhanced_table.sql
   ```

---

### Problem: "Users can view their own activity logs" policy error

**Solution:**
RLS policy conflict. Drop old policies:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can update activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can delete activity logs" ON activity_logs;

-- Then run create_activity_logs_table.sql again
```

---

### Problem: No activities showing after login

**Possible Causes:**

1. **Table not created** → Run SQL migrations
2. **RLS blocking** → Check policies with:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'activity_logs';
   ```
3. **Logging failed silently** → Check Supabase logs
4. **User session issue** → Logout, clear cache, login again

**Debug Query:**
```sql
-- Check if any activities exist
SELECT COUNT(*) FROM activity_logs;

-- Check recent activities (as admin)
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;

-- Check for specific user
SELECT * FROM activity_logs WHERE user_email = 'your-email@example.com';
```

---

## ✅ Success Checklist

After running migrations, verify:

- [ ] `activity_logs` table exists with 18 columns
- [ ] `error_logs` table exists with 35 columns
- [ ] Both tables have RLS enabled
- [ ] Policies created (5 for activity_logs, 4 for error_logs)
- [ ] Indexes created (8 for activity_logs, 8 for error_logs)
- [ ] Login creates activity record
- [ ] Activity page shows login history
- [ ] Admin can view all activities at `/admin/activity`
- [ ] Errors logged to `/admin/errors`

---

## 📚 Related Files

- `create_activity_logs_table.sql` - Activity tracking table
- `create_error_logs_enhanced_table.sql` - Error logging table
- `lib/activity-logger.ts` - Activity logging utility
- `lib/ai-monitor.ts` - AI monitoring system
- `app/activity/page.tsx` - User activity page
- `app/admin/activity/page.tsx` - Admin activity monitor
- `app/admin/errors/page.tsx` - Admin error dashboard

---

## 🚀 After Setup

Once tables are created:

1. **Test as User:**
   - Login → Should create activity
   - Go to `/activity` → Should show login
   - Absen → Should show attendance
   - Like post → Should show interaction

2. **Test as Admin:**
   - Go to `/admin` → See error monitoring widget
   - Click "🤖 AI Activity" → See all user activities
   - Click "🐛 AI Errors" → See all errors
   - Test AI analysis on activities

3. **Monitor Background:**
   - Open browser console (F12)
   - Should see: "🤖 AI Monitoring System Active"
   - Errors auto-reported to `/admin/errors`
   - Performance issues logged

---

**Need Help?**
- Check Supabase logs: Dashboard → Logs
- Check browser console: F12 → Console
- Verify tables: `\dt` in SQL Editor
- Check policies: `SELECT * FROM pg_policies;`

**Ready to test? Run the migrations and refresh your app! 🎉**

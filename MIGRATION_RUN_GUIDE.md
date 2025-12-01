# 🚀 Migration Run Guide - Supabase

## Masalah yang Terjadi

**Error:**
```
ERROR: 42703: column "description" of relation "admin_settings" does not exist
```

**Penyebab:**
- Table `admin_settings` belum dibuat di Supabase
- Migration belum pernah dirun

---

## ✅ Solusi: Run Migrations di Supabase SQL Editor

### STEP 1: Run Production Migration (WAJIB DULUAN!)

1. **Login Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Pilih project Webosis

2. **Buka SQL Editor**
   - Sidebar kiri → SQL Editor
   - Klik "New Query"

3. **Copy-Paste Migration File**
   - Buka file: `migrations/PRODUCTION_READY_MIGRATION.sql`
   - Copy SEMUA isi file (418 lines)
   - Paste ke SQL Editor
   - Klik **"RUN"** button

4. **Verify Success**
   ```sql
   -- Check tables created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'admin_settings', 
     'biometric_data', 
     'webauthn_credentials',
     'school_location_config',
     'ip_whitelist',
     'attendance_records',
     'security_events'
   );
   ```
   
   **Expected Output:** 7 tables

---

### STEP 2: Run Mikrotik Settings Migration

1. **New Query di SQL Editor**

2. **Copy-Paste Migration File**
   - Buka file: `migrations/add_mikrotik_settings.sql`
   - Copy SEMUA isi file
   - Paste ke SQL Editor
   - Klik **"RUN"**

3. **Verify Success**
   ```sql
   SELECT key, value, category, is_secret 
   FROM admin_settings 
   WHERE key LIKE 'mikrotik%' OR key LIKE 'location%' OR key = 'ip_validation_mode';
   ```
   
   **Expected Output:** 13 rows

---

### STEP 3: Run IP Ranges Fix (CGNAT Support)

1. **New Query di SQL Editor**

2. **Copy-Paste Migration File**
   - Buka file: `migrations/fix_ip_ranges_cgnat.sql`
   - Copy SEMUA isi file
   - Paste ke SQL Editor
   - Klik **"RUN"**

3. **Verify Success**
   ```sql
   SELECT location_name, allowed_ip_ranges 
   FROM school_location_config;
   ```
   
   **Expected Output:** IP ranges should include `100.64.0.0/10`

---

## 🔍 Troubleshooting

### Issue: Table already exists

**Solution:** Migrations are IDEMPOTENT (safe to run multiple times)
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `ON CONFLICT DO UPDATE`
- Won't duplicate data

### Issue: RLS policies conflict

**Solution:** Drop policies first
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for non-secret settings" ON admin_settings;
DROP POLICY IF EXISTS "Service role full access" ON admin_settings;

-- Then rerun migration
```

### Issue: Permission denied

**Solution:** Use service_role key
1. Supabase Dashboard → Settings → API
2. Copy **service_role** key (secret!)
3. Use this key for admin API calls

---

## 📊 Verification Queries

### Check All Tables
```sql
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Admin Settings
```sql
SELECT 
  key,
  value,
  category,
  is_secret,
  created_at
FROM admin_settings
ORDER BY category, key;
```

### Check School Location Config
```sql
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  is_active
FROM school_location_config;
```

### Check Security Events (should be empty initially)
```sql
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(created_at) as last_event
FROM security_events
GROUP BY event_type
ORDER BY count DESC;
```

---

## 🎯 Post-Migration Setup

### 1. Configure School Location

```sql
-- Insert/Update your school location
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  is_active
) VALUES (
  'SMK Webosis',
  -6.200000,  -- Replace with actual school latitude
  106.816666, -- Replace with actual school longitude
  100,        -- 100 meter radius
  ARRAY[
    '192.168.0.0/16',   -- Local network
    '10.0.0.0/8',       -- Private network
    '172.16.0.0/12',    -- Private network
    '100.64.0.0/10'     -- CGNAT (fixes IP blocking)
  ],
  true
)
ON CONFLICT (location_name) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  radius_meters = EXCLUDED.radius_meters,
  allowed_ip_ranges = EXCLUDED.allowed_ip_ranges,
  is_active = EXCLUDED.is_active,
  updated_at = now();
```

### 2. Get Admin User ID

```sql
-- Find admin user
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

### 3. Test Admin Settings API

**URL:** `https://your-domain.com/api/admin/settings/mikrotik`

**Headers:**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
Content-Type: application/json
```

**GET Request:** Fetch settings
```bash
curl https://your-domain.com/api/admin/settings/mikrotik \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "settings": {
    "mikrotik_enabled": "false",
    "mikrotik_host": "",
    "mikrotik_port": "8728",
    ...
  }
}
```

---

## 🔐 Security Checklist

- [ ] **RLS Enabled** on all tables
- [ ] **Service role key** kept secret (never commit to git)
- [ ] **HTTPS only** for production
- [ ] **IP ranges** configured for school network
- [ ] **Location coordinates** accurate (use Google Maps)
- [ ] **Mikrotik credentials** encrypted (is_secret=true)
- [ ] **Admin panel** restricted to admin users only
- [ ] **Location permission** requested from all users

---

## 📝 Migration Order (IMPORTANT!)

**MUST run in this order:**

1. ✅ `PRODUCTION_READY_MIGRATION.sql` - Creates all base tables
2. ✅ `add_mikrotik_settings.sql` - Adds Mikrotik settings
3. ✅ `fix_ip_ranges_cgnat.sql` - Fixes IP blocking issue

**DO NOT skip steps!** Each migration depends on previous ones.

---

## 🆘 Need Help?

**Check Supabase Logs:**
- Dashboard → Logs → Database
- Look for SQL errors
- Check execution time

**Check Application Logs:**
- Browser Console (F12)
- Network tab → API calls
- Look for 500/400 errors

**Verify Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

**Last Updated:** December 1, 2025  
**Migration Version:** 2.0.0  
**Status:** ✅ Ready to Run

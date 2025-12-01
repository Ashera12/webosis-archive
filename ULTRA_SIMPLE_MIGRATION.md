# ⚡ SUPER SIMPLE MIGRATION - 3 Steps Only!

## 🎯 Fix Error: "column category does not exist"

**Problem:** Database table `admin_settings` structure berbeda atau belum ada.

**Solution:** Run 3 migrations berurutan (WAJIB URUT!)

---

## 📋 STEP 1: Create Table

**Copy-paste ini ke Supabase SQL Editor:**

```sql
-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read
CREATE POLICY IF NOT EXISTS "Allow authenticated read access"
  ON admin_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role full access"
  ON admin_settings FOR ALL
  USING (auth.role() = 'service_role');
```

**Klik:** RUN ▶️

**Expected:** `✅ admin_settings table created`

---

## 📋 STEP 2: Insert Mikrotik Settings

**Copy-paste ini ke SQL Editor baru:**

```sql
-- Insert 13 Mikrotik settings
INSERT INTO admin_settings (key, value)
VALUES 
  ('mikrotik_enabled', 'false'),
  ('mikrotik_host', ''),
  ('mikrotik_port', '8728'),
  ('mikrotik_username', 'admin'),
  ('mikrotik_password', ''),
  ('mikrotik_api_type', 'rest'),
  ('mikrotik_use_dhcp', 'true'),
  ('mikrotik_use_arp', 'false'),
  ('mikrotik_cache_duration', '300'),
  ('ip_validation_mode', 'hybrid'),
  ('location_strict_mode', 'true'),
  ('location_max_radius', '100'),
  ('location_gps_accuracy_required', '50')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
```

**Klik:** RUN ▶️

**Expected:** `INSERT 0 13` (13 settings inserted)

---

## 📋 STEP 3: Fix IP Ranges (CGNAT Support)

**Copy-paste ini ke SQL Editor baru:**

```sql
-- Ensure school_location_config exists
CREATE TABLE IF NOT EXISTS school_location_config (
  id SERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters DECIMAL(10, 2) DEFAULT 100,
  allowed_ip_ranges TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update IP ranges with CGNAT support
UPDATE school_location_config
SET allowed_ip_ranges = ARRAY[
  '192.168.0.0/16',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '100.64.0.0/10'
]
WHERE location_name IS NOT NULL;

-- Insert default if no rows exist
INSERT INTO school_location_config (
  location_name, latitude, longitude, radius_meters, allowed_ip_ranges, is_active
)
SELECT 
  'SMK Webosis',
  -6.200000,
  106.816666,
  100,
  ARRAY['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', '100.64.0.0/10'],
  true
WHERE NOT EXISTS (SELECT 1 FROM school_location_config LIMIT 1);
```

**Klik:** RUN ▶️

**Expected:** `UPDATE 1` or `INSERT 0 1`

---

## ✅ Verify Success

**Run query ini:**

```sql
-- Check settings count (should be 13)
SELECT COUNT(*) as settings_count FROM admin_settings;

-- Check IP ranges
SELECT location_name, allowed_ip_ranges FROM school_location_config;

-- List all settings
SELECT key, value FROM admin_settings ORDER BY key;
```

**Expected Output:**
```
settings_count: 13
allowed_ip_ranges: {192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10}
```

---

## 🎯 What This Fixes

1. ✅ **Error "column category does not exist"** → Table created with correct schema
2. ✅ **Error "column description does not exist"** → Simplified schema (only key+value)
3. ✅ **IP blocking 114.122.103.106** → CGNAT range added
4. ✅ **Mikrotik settings missing** → All 13 settings inserted

---

## 🚨 Important Notes

**Run migrations IN ORDER:**
1. ⚠️ STEP 1 first (create table)
2. ⚠️ STEP 2 second (insert settings)
3. ⚠️ STEP 3 third (IP ranges)

**Safe to run multiple times:**
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `ON CONFLICT DO UPDATE`
- Won't duplicate data

**Where to run:**
- Supabase Dashboard → SQL Editor
- NOT in local terminal (no local DB access)

---

## 🆘 Troubleshooting

### Error: "relation admin_settings already exists"
✅ **OK!** Table already exists, skip to STEP 2

### Error: "duplicate key value violates unique constraint"
✅ **OK!** Settings already inserted, migration successful

### Error: "permission denied"
❌ **FIX:** Use **service_role** key in Supabase (Settings → API)

### Error: "syntax error at or near"
❌ **FIX:** Copy FULL query (don't cut/paste partial)

---

## 📊 After Migration

**Test Admin Panel:**
- Login admin
- Navigate to `/admin/attendance/mikrotik`
- Should load without errors
- Settings should be editable

**Test Attendance:**
- IP 114.122.103.106 should work (not blocked)
- Location validation active
- All security features enabled

---

**Status:** ✅ **READY TO RUN**  
**Time:** ~1 minute  
**Last Updated:** December 1, 2025

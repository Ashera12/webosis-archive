# ⚡ Quick Setup - IP Whitelisting

## 🎯 Masalah: User terblokir dengan IP `182.10.97.87`

### ✅ Solusi: Tambahkan IP range ke database

## 1️⃣ Run SQL di Supabase

```sql
-- Update config yang aktif dengan IP range
UPDATE school_location_config 
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.0.0/16',      -- WiFi lokal
    '182.10.0.0/16',       -- IP Public ISP (termasuk 182.10.97.87) ✅
    '100.64.0.0/10'        -- CGNAT data seluler
  ],
  require_wifi = false,
  network_security_level = 'high',
  updated_at = NOW()
WHERE is_active = true;

-- Verify
SELECT 
  id, 
  location_name,
  allowed_ip_ranges,
  network_security_level
FROM school_location_config
WHERE is_active = true;
```

## 2️⃣ Test Langsung

Setelah run SQL:
- Refresh halaman absensi
- IP `182.10.97.87` sekarang **dalam range** `182.10.0.0/16` ✅
- User bisa absensi dari **cellular** atau **WiFi**

## 3️⃣ Configure via Admin Panel (Recommended untuk selanjutnya)

1. Login sebagai Admin
2. Buka: `/admin/attendance/settings`
3. Scroll ke section **"🔐 Enterprise IP Whitelisting"**
4. Tambahkan IP ranges:
   ```
   192.168.0.0/16
   182.10.0.0/16
   100.64.0.0/10
   ```
5. Set Security Level = **HIGH**
6. Klik **"Simpan Konfigurasi"**

---

## 📊 Cara Cek IP User

```sql
-- Lihat IP yang terblock
SELECT 
  created_at,
  metadata->>'client_ip' as blocked_ip,
  metadata->>'role' as user_role,
  description
FROM security_events
WHERE event_type = 'ip_whitelist_failed'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Checklist

- [x] Run migration `MIGRATION_ADD_IP_WHITELISTING.sql`
- [ ] Run SQL setup IP ranges (contoh di atas)
- [ ] Test absensi dari cellular (should work!)
- [ ] Configure via admin panel untuk update selanjutnya

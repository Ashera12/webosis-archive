# 🚨 GPS SYNC FIX - Using Admin Panel

## Problem Identified
- **Database GPS**: `-6.200000, 106.816666` (Jakarta - WRONG!)
- **Your Current GPS**: `-6.864813, 107.522026` (Bandung - 99m accuracy)
- **Distance**: 107,409m (107km) ← This is Jakarta to Bandung distance!

## Root Cause
The previous console script failed because you're logged in as **student (siswa)**, not admin.
The `/api/admin/attendance/config` endpoint requires **admin/super_admin** role.

---

## ✅ SOLUTION: Update via Admin Panel

### Option 1: Login as Admin (RECOMMENDED)

1. **Logout** from student account:
   ```
   Click profile → Logout
   ```

2. **Login as Admin**:
   ```
   URL: https://osissmktest.biezz.my.id/admin/login
   Credentials: (ask your school admin for super_admin account)
   ```

3. **Go to Attendance Settings**:
   ```
   Dashboard → Absensi → Konfigurasi (top right)
   OR direct: https://osissmktest.biezz.my.id/admin/attendance/settings
   ```

4. **Update School GPS**:
   
   **IF YOU ARE AT SCHOOL RIGHT NOW** (99m accuracy is acceptable):
   - Click **"Gunakan Lokasi Saat Ini"** button
   - GPS will auto-fill: `-6.864813, 107.522026`
   - Set Radius: `5000` meters (5km - temporary wide coverage)
   - Click **"Simpan Konfigurasi"**
   
   **IF YOU ARE NOT AT SCHOOL**:
   - Open Google Maps
   - Search: "SMK Fithrah Insani Bandung"
   - Right-click on school building → Click coordinates
   - Copy coordinates (e.g., `-6.xxxxx, 107.xxxxx`)
   - Manually enter in:
     - Latitude: `-6.xxxxx`
     - Longitude: `107.xxxxx`
   - Radius: `300` meters
   - Click **"Simpan Konfigurasi"**

5. **Add IP Whitelist** (Important!):
   Scroll down to "IP Whitelisting" section:
   - Add: `125.160.0.0/16` (your ISP range)
   - Add: `100.64.0.0/10` (CGNAT)
   - Add: `192.168.0.0/16` (Local WiFi)
   - Add: `10.0.0.0/8` (Private network)
   - Click **"Simpan Konfigurasi"**

6. **Logout & Re-login as Student**:
   ```
   Logout → Login as: any.hand2@gmail.com
   ```

7. **Test Attendance Page**:
   ```
   Go to: /attendance
   Distance should now show: ~0m (if you used your current GPS)
   OR correct distance (if you used Google Maps GPS)
   ```

---

### Option 2: Direct Database Update (Requires Supabase Access)

If you have access to Supabase SQL Editor:

1. **Login to Supabase**:
   ```
   https://supabase.com/dashboard
   → Select your project
   → SQL Editor
   ```

2. **Run this SQL**:
   ```sql
   -- Update school coordinates
   UPDATE school_location_config
   SET 
     location_name = 'SMK Fithrah Insani - Bandung',
     latitude = -6.864813,  -- YOUR CURRENT GPS (if at school)
     longitude = 107.522026,
     radius_meters = 5000,  -- 5km radius (temporary)
     allowed_ip_ranges = ARRAY[
       '125.160.0.0/16',
       '100.64.0.0/10',
       '192.168.0.0/16',
       '10.0.0.0/8'
     ],
     updated_at = NOW()
   WHERE is_active = true;
   
   -- Verify
   SELECT latitude, longitude, radius_meters 
   FROM school_location_config 
   WHERE is_active = true;
   ```

3. **Hard Refresh Browser**:
   ```
   Press: Ctrl + Shift + R
   OR: Ctrl + F5
   ```

4. **Test**:
   ```
   Go to /attendance
   Check distance
   ```

---

### Option 3: Ask Admin to Fix

Send this message to your school admin:

```
Hi Admin,

GPS koordinat sekolah di sistem masih salah (Jakarta instead of Bandung).
Tolong update di Admin Panel:

1. Login ke: https://osissmktest.biezz.my.id/admin/login
2. Go to: Admin → Attendance Settings
3. Click "Gunakan Lokasi Saat Ini" (when at school)
4. OR manual input GPS from Google Maps
5. Set Radius: 300 meters
6. Add IP: 125.160.0.0/16
7. Save

Current issue:
- Database GPS: -6.200000, 106.816666 (Jakarta ❌)
- Should be: -6.8xxxxx, 107.5xxxxx (Bandung ✅)
- Distance shows 107km instead of 0km

Thanks!
```

---

## ⚠️ IMPORTANT NOTES

### About Your Current GPS (-6.864813, 107.522026):
- **Accuracy**: 99m (acceptable, not perfect)
- **Location**: Bandung area
- **Accuracy**: "Cukup" (Sufficient) - outdoor accuracy needed

### GPS Accuracy Requirements:
- **For Setting School Location**: 20-100m is OK (one-time setup)
- **For Daily Attendance**: <20m required (need better GPS lock)

### To Improve GPS Accuracy:
1. Go **outdoor** (halaman/lapangan)
2. Open **Google Maps** first
3. Wait 30-60 seconds for GPS lock
4. Wait until blue dot is stable and small
5. Then open attendance page

### Distance Calculation:
If you're NOT at school right now:
- Current GPS: `-6.864813, 107.522026`
- School GPS (example): `-6.900969, 107.542391`
- Distance: ~4.2km

So if you set your CURRENT GPS as school GPS while you're at HOME:
- Tomorrow when you go to school, distance will be ~4km (FAIL!)

**SOLUTION**: Either:
1. Go to school NOW → Get GPS there → Update config
2. Use Google Maps to get exact school coordinates
3. Ask admin to update when they're at school

---

## 🎯 Quick Checklist

- [ ] Are you physically AT school right now? (Yes/No)
- [ ] Do you have admin account credentials? (Yes/No)
- [ ] Do you have Supabase database access? (Yes/No)
- [ ] Can you ask school admin to update? (Yes/No)

**Based on your answers, choose the right option above!**

---

## 📞 Next Steps

Reply with:
1. Are you at school right now?
2. Do you have admin login?
3. I'll guide you through the exact steps!

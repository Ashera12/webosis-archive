# 🔐 NETWORK MONITORING - Testing Guide

**Status:** ✅ COMPLETE - Data Pipeline Fixed  
**Commit:** 85f085c - Save handler includes all 14 network fields  
**Build:** ✅ Successful (0 errors)  
**Next:** Run migration → Test Vercel → Verify sync

---

## 🚨 CRITICAL STEPS (DO IN ORDER!)

### Step 1: Run Database Migration (REQUIRED FIRST)
```sql
-- Go to Supabase SQL Editor
-- Copy entire ENHANCE_NETWORK_MONITORING.sql
-- Run migration

-- Verify columns added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'school_location_config'
AND (column_name LIKE '%ip%' OR column_name LIKE '%network%')
ORDER BY column_name;

-- Expected output: 14 new columns
-- ✅ allowed_connection_types - text[]
-- ✅ allowed_ip_ranges - text[]
-- ✅ allowed_mac_addresses - text[]
-- ✅ block_proxy - boolean
-- ✅ block_vpn - boolean
-- ✅ enable_ip_validation - boolean
-- ✅ enable_mac_address_validation - boolean
-- ✅ enable_network_quality_check - boolean
-- ✅ enable_private_ip_check - boolean
-- ✅ enable_subnet_matching - boolean
-- ✅ enable_webrtc_detection - boolean
-- ✅ min_network_quality - text
-- ✅ network_security_level - text
-- ✅ required_subnet - text
```

### Step 2: Wait for Vercel Deployment
```
1. Check: https://vercel.com/dashboard
2. Status should be: ✅ Ready
3. Time: ~2-3 minutes
4. Look for commit: 85f085c
```

### Step 3: Test Admin Configuration
```
URL: https://your-app.vercel.app/admin/attendance/settings

Test Network Monitoring UI:

1. Scroll to: "🔐 Network Monitoring & IP Validation"
   ✅ Section visible
   ✅ All fields present

2. Security Level Dropdown:
   ✅ 4 options: Low, Medium, High, Strict
   ✅ Color-coded (green/yellow/orange/red)
   ✅ Description updates on change

3. IP Validation Section:
   Toggle ON all 4 options:
   - ✅ Enable IP Validation
   - ✅ WebRTC IP Detection
   - ✅ Private IP Validation
   - ✅ Subnet Matching
   
   Fill inputs:
   - Required Subnet: 192.168.1
   - Allowed IP Ranges: 192.168.1.0/24, 10.0.0.0/24
   
   ✅ Inputs accept values
   ✅ No validation errors

4. Connection Type:
   - Check: 📡 WiFi
   - Uncheck: Ethernet, Cellular
   - Select: ⭐⭐⭐ Good (min quality)
   - Toggle: ✅ Enable Network Quality Check
   
   ✅ Checkboxes work
   ✅ Dropdown works

5. Advanced Security:
   - Toggle: ✅ MAC Address Validation
   - Input MAC: AA:BB:CC:DD:EE:FF
   - Toggle: ✅ Block VPN
   - Toggle: ✅ Block Proxy
   
   ✅ Red border section visible
   ✅ All toggles work

6. Save Configuration:
   - Click: "Simpan Konfigurasi"
   - ✅ Toast: "Konfigurasi berhasil diperbarui!"
   - ✅ No console errors
   
7. Reload Page:
   - Press F5
   - ✅ All settings persisted
   - ✅ Values match what you entered
```

### Step 4: Verify Database
```sql
-- Check saved data
SELECT 
  location_name,
  network_security_level,
  enable_ip_validation,
  enable_webrtc_detection,
  enable_private_ip_check,
  enable_subnet_matching,
  required_subnet,
  allowed_ip_ranges,
  allowed_connection_types,
  min_network_quality,
  enable_mac_address_validation,
  allowed_mac_addresses,
  block_vpn,
  block_proxy,
  enable_network_quality_check,
  updated_at
FROM school_location_config 
WHERE is_active = true;

-- ✅ Expected Results:
-- network_security_level = 'medium' (or whatever you selected)
-- enable_ip_validation = true
-- enable_webrtc_detection = true
-- enable_private_ip_check = true
-- enable_subnet_matching = true
-- required_subnet = '192.168.1'
-- allowed_ip_ranges = ['192.168.1.0/24', '10.0.0.0/24']
-- allowed_connection_types = ['wifi']
-- min_network_quality = 'good'
-- enable_mac_address_validation = true
-- allowed_mac_addresses = ['AA:BB:CC:DD:EE:FF']
-- block_vpn = true
-- block_proxy = true
-- enable_network_quality_check = true
-- updated_at = recent timestamp
```

### Step 5: Test SQL Helper Functions
```sql
-- Test 1: CIDR Range Validation
SELECT is_ip_in_cidr_range('192.168.1.50', '192.168.1.0/24') AS test1_should_be_true;
-- ✅ Expected: true

SELECT is_ip_in_cidr_range('192.168.2.50', '192.168.1.0/24') AS test2_should_be_false;
-- ✅ Expected: false

SELECT is_ip_in_cidr_range('10.0.0.100', '10.0.0.0/24') AS test3_should_be_true;
-- ✅ Expected: true

-- Test 2: Private IP Check
SELECT is_private_ip('192.168.1.1') AS test1_should_be_true;
-- ✅ Expected: true

SELECT is_private_ip('8.8.8.8') AS test2_should_be_false;
-- ✅ Expected: false

SELECT is_private_ip('10.0.0.1') AS test3_should_be_true;
-- ✅ Expected: true

SELECT is_private_ip('172.16.0.1') AS test4_should_be_true;
-- ✅ Expected: true

-- Test 3: Subnet Matching
SELECT matches_subnet('192.168.1.50', '192.168.1') AS test1_should_be_true;
-- ✅ Expected: true

SELECT matches_subnet('192.168.2.50', '192.168.1') AS test2_should_be_false;
-- ✅ Expected: false

SELECT matches_subnet('10.0.0.100', '10.0.0') AS test3_should_be_true;
-- ✅ Expected: true
```

---

## 🎯 Security Level Testing

### Test 1: LOW Security (WiFi Only)
```
Configuration:
- Security Level: Low
- Enable IP Validation: OFF
- Enable Subnet Matching: OFF

Expected Behavior:
✅ Only checks WiFi SSID
✅ No IP validation
✅ Cellular allowed
✅ Any IP address allowed
✅ Any subnet allowed
✅ Fast validation

Test:
1. Submit attendance from School WiFi → ✅ Success
2. Submit from home WiFi (if SSID matches) → ✅ Success
3. Submit from cellular → ✅ Success (if allowed in connection types)
```

### Test 2: MEDIUM Security (WiFi + IP)
```
Configuration:
- Security Level: Medium
- Enable IP Validation: ON
- Enable Private IP Check: ON
- Enable Subnet Matching: OFF

Expected Behavior:
✅ Checks WiFi SSID
✅ Checks IP is private (192.168.x.x, 10.x.x.x, etc)
✅ WebRTC detects local IP
❌ Public IP rejected
❌ Cellular blocked (if not in allowed types)

Test:
1. Submit from School WiFi (192.168.1.50) → ✅ Success
2. Submit from home WiFi (192.168.0.10) → ✅ Success (private IP)
3. Submit from cellular (public IP) → ❌ Rejected
4. Submit via VPN (public IP) → ❌ Rejected
```

### Test 3: HIGH Security (WiFi + IP + Subnet)
```
Configuration:
- Security Level: High
- Enable IP Validation: ON
- Enable Private IP Check: ON
- Enable Subnet Matching: ON
- Required Subnet: 192.168.1

Expected Behavior:
✅ Checks WiFi SSID
✅ Checks IP is private
✅ Checks IP matches subnet 192.168.1.x
✅ Checks IP in allowed CIDR ranges
❌ Wrong subnet rejected (192.168.2.x)
❌ Public IP rejected

Test:
1. Submit from School WiFi (192.168.1.50) → ✅ Success
2. Submit from School WiFi (192.168.2.50) → ❌ Rejected (wrong subnet)
3. Submit from home WiFi (192.168.0.10) → ❌ Rejected (wrong subnet)
4. Submit from cellular → ❌ Rejected
```

### Test 4: STRICT Security (Maximum Security)
```
Configuration:
- Security Level: Strict
- Enable IP Validation: ON
- Enable Private IP Check: ON
- Enable Subnet Matching: ON
- Required Subnet: 192.168.1
- Enable MAC Address Validation: ON
- Allowed MACs: [School WiFi MAC]
- Block VPN: ON
- Block Proxy: ON
- Min Network Quality: Good

Expected Behavior:
✅ Checks WiFi SSID
✅ Checks WiFi MAC address (BSSID)
✅ Checks IP is private
✅ Checks IP in subnet
✅ Checks IP in CIDR range
✅ Blocks VPN connections
✅ Blocks proxy connections
✅ Checks network quality
❌ Any violation = rejected

Test:
1. Submit from School WiFi (all correct) → ✅ Success
2. Submit from different WiFi (wrong MAC) → ❌ Rejected
3. Submit via VPN → ❌ Rejected (VPN detected)
4. Submit via proxy → ❌ Rejected (Proxy detected)
5. Submit with weak signal → ❌ Rejected (below min quality)
```

---

## 🐛 Bug Testing

### Test Invalid Inputs
```
1. Empty Required Subnet:
   - Leave blank
   - ✅ Should allow (optional field)
   
2. Invalid IP Range Format:
   - Enter: "192.168.1.0" (no /mask)
   - ✅ Should save (validation on use)
   
3. Invalid MAC Format:
   - Enter: "AABBCCDDEE" (no colons)
   - ✅ Should save (validation on match)
   
4. Conflicting Settings:
   - Security Level: Low
   - Enable Subnet Matching: ON
   - ✅ Should work (individual toggles override)
```

### Test Edge Cases
```
1. User switches WiFi during attendance:
   - Start on School WiFi
   - Switch to cellular
   - Submit
   - ✅ Should detect current WiFi

2. User disables location:
   - Turn off GPS
   - Submit
   - ❌ Should show error

3. WebRTC detection fails:
   - Block WebRTC in browser
   - Submit
   - ✅ Should fallback gracefully

4. Multiple IP addresses:
   - User has 2 NICs
   - WebRTC returns multiple IPs
   - ✅ Should check all against rules
```

### Test Console Errors
```
Open browser console (F12):

1. Go to /admin/attendance/settings
   ✅ No errors in console
   ✅ No warnings
   
2. Configure network monitoring
   ✅ No errors when typing
   ✅ No errors when toggling
   
3. Click Save
   ✅ No errors in Network tab
   ✅ Response 200 OK
   ✅ Toast message shows
   
4. Reload page
   ✅ No errors on load
   ✅ Data appears correctly
```

---

## 📊 Data Flow Verification

### Complete Data Pipeline Test
```
STEP 1: Frontend (UI Input)
  Location: /admin/attendance/settings
  Action: Configure network monitoring
  State: config object with 14 fields
  ✅ Verify: console.log(config) shows all fields

STEP 2: Frontend (Save Handler)
  Location: page.tsx handleSaveConfig()
  Action: Prepare payload
  Payload: 14 network fields + basic fields
  ✅ Verify: console.log(payload) before fetch

STEP 3: API (Request)
  Location: /api/admin/attendance/config
  Method: POST
  Body: payload from frontend
  ✅ Verify: Network tab shows all fields in request

STEP 4: API (Destructuring)
  Location: route.ts
  Action: Extract fields from body
  Variables: 14 network fields destructured
  ✅ Verify: console.log in API shows values

STEP 5: API (Database Payload)
  Location: route.ts configData
  Action: Prepare database object
  Object: 14 network fields with defaults
  ✅ Verify: console.log(configData) before update

STEP 6: Database (Save)
  Location: Supabase school_location_config
  Action: UPDATE or INSERT
  Result: Row with all 14 fields
  ✅ Verify: SQL SELECT shows values

STEP 7: API (Response)
  Location: route.ts return
  Action: Send success response
  Body: { success: true, data: config }
  ✅ Verify: Response includes network fields

STEP 8: Frontend (Success)
  Location: page.tsx handleSaveConfig()
  Action: Show toast
  Message: "Konfigurasi berhasil diperbarui!"
  ✅ Verify: Toast appears, no errors

STEP 9: Reload (Persistence)
  Location: /admin/attendance/settings
  Action: Reload page (F5)
  Effect: Fetch config from database
  ✅ Verify: All fields loaded correctly
```

---

## ✅ Final Success Checklist

### Database ✅
- [ ] Migration run successfully
- [ ] 14 columns exist in school_location_config
- [ ] 3 SQL functions created
- [ ] Functions return correct results
- [ ] No errors in Supabase logs

### Frontend ✅
- [ ] UI shows all network monitoring fields
- [ ] Toggles work correctly
- [ ] Inputs accept values
- [ ] Conditional inputs show/hide properly
- [ ] Save button works
- [ ] Toast message shows
- [ ] No console errors
- [ ] Dark mode works

### API ✅
- [ ] Endpoint accepts network fields
- [ ] Destructuring includes all 14 fields
- [ ] configData includes all 14 fields
- [ ] Database update successful
- [ ] Response includes network data
- [ ] No API errors

### Data Persistence ✅
- [ ] Save config → Reload page
- [ ] All values match what was entered
- [ ] Database query shows correct data
- [ ] No data loss
- [ ] Defaults applied correctly

### Vercel Deployment ✅
- [ ] Build successful on Vercel
- [ ] No TypeScript errors
- [ ] All routes compiled
- [ ] Production URL works
- [ ] Admin panel accessible
- [ ] Config save works in production

---

## 🎉 SUCCESS CRITERIA

**ALL OF THESE MUST BE TRUE:**

1. ✅ Database has 14 new network monitoring columns
2. ✅ SQL functions work correctly (test queries pass)
3. ✅ UI shows all network monitoring options
4. ✅ Save button includes all 14 fields in payload
5. ✅ API endpoint receives all 14 fields
6. ✅ Database saves all 14 fields
7. ✅ Reload shows persisted values
8. ✅ Build successful (0 errors)
9. ✅ Vercel deployment successful
10. ✅ Production testing passes

**IF ALL ✅ = FEATURE COMPLETE!** 🚀

---

## 🚨 Quick Troubleshooting

### Problem: Save fails
```
Check:
1. Console errors → Fix syntax
2. Network tab → Check API response
3. Supabase logs → Check database errors
4. Migration run? → Run ENHANCE_NETWORK_MONITORING.sql
```

### Problem: Fields not persisted
```
Check:
1. Save handler includes fields? → Verify payload
2. API destructures fields? → Verify route.ts
3. configData includes fields? → Verify database payload
4. Migration run? → Verify columns exist
```

### Problem: UI not showing
```
Check:
1. Scroll down? → Network section is below WiFi
2. Dark mode? → Test in light mode
3. Browser cache? → Hard refresh (Ctrl+Shift+R)
4. Vercel deployed? → Check deployment status
```

### Problem: SQL functions fail
```
Check:
1. Functions created? → SELECT * FROM pg_proc WHERE proname LIKE '%ip%'
2. Syntax errors? → Check function definitions
3. Permissions? → Check RLS policies
4. Test queries? → Run individual function tests
```

---

**Last Updated:** Commit 85f085c  
**Status:** Ready for Production Testing  
**Next:** Run migration → Test → Deploy → Celebrate! 🎉

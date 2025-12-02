# 🚨 EMERGENCY - VERCEL TIDAK DEPLOY KODE BARU

## BUKTI DARI LOG

```javascript
[Attendance] ✅ Location synced: {
  schoolLatitude: -6.2,        // ❌ KODE LAMA!
  schoolLongitude: 106.816666  // ❌ KODE LAMA!
}
```

**LOG YANG SEHARUSNYA MUNCUL (TIDAK ADA!):**
```javascript
[Background Analyzer] 🔄 Cache DISABLED - forcing fresh analysis
[Location Config] ✅ Loaded from DB: {latitude: -6.864733...}
```

## ROOT CAUSE

Vercel **TIDAK DEPLOY** dari commit `b87c7cb` atau commits sebelumnya.

Production masih running **OLD CODE** dari minggu lalu!

## SOLUSI WAJIB - MANUAL REDEPLOY

### STEP 1: Login Vercel
https://vercel.com/login

### STEP 2: Pilih Project
Cari project: **webosis-archive**

### STEP 3: Check Deployments Tab
1. Klik tab **"Deployments"**
2. Lihat deployment terakhir
3. Check commit hash - apakah `b87c7cb` atau `3a45747`?
4. **Jika TIDAK** = Auto-deploy RUSAK!

### STEP 4: MANUAL REDEPLOY (WAJIB!)

**Option A: Redeploy Latest**
1. Click deployment terakhir yang **SUCCESS** (status hijau)
2. Click tombol **"..."** (3 titik di kanan atas)
3. Click **"Redeploy"**
4. **PENTING**: **UNCHECK** "Use existing Build Cache"
5. Click **"Redeploy"**
6. Tunggu 3-5 menit sampai status = **"Ready"**

**Option B: Deploy from Git**
1. Tab "Settings" → "Git"
2. Pastikan branch: `release/attendance-production-ready-v2`
3. Kembali ke "Deployments"
4. Click **"Create Deployment"**
5. Pilih branch: `release/attendance-production-ready-v2`
6. Tunggu build selesai

### STEP 5: Verify Deployment

Setelah status = "Ready", **TUNGGU 2-3 MENIT** untuk CDN propagation.

Lalu di browser:
1. **Hard refresh**: `Ctrl + Shift + R`
2. **Clear cache**: Paste script `CLEAR_ALL_CACHE.js` di console
3. **Check logs** - WAJIB muncul:
   ```
   [Background Analyzer] 🔄 Cache DISABLED - forcing fresh analysis
   [Location Config] ✅ Loaded from DB: {latitude: -6.864733, longitude: 107.522064}
   ```

### STEP 6: If Still Wrong

**Test API endpoint langsung:**
```javascript
fetch('/api/school/wifi-config?_test=' + Date.now(), {cache: 'no-store'})
  .then(r => r.json())
  .then(d => console.log('API GPS:', d.config.latitude, d.config.longitude));
```

**Expected:** `-6.864733, 107.522064`

**If still `-6.2, 106.816666`:**
→ Database was changed back OR Vercel deployed wrong branch

## TROUBLESHOOTING

### Issue: Auto-Deploy Not Working

**Check GitHub Webhook:**
1. GitHub.com → Repository Settings
2. Webhooks
3. Find Vercel webhook
4. Click "Recent Deliveries"
5. Check last 5 push events - any errors?

**Fix: Re-link Vercel:**
1. Vercel Project Settings
2. Git tab → "Disconnect"
3. Reconnect → Select repo: `webosis-archive`
4. Branch: `release/attendance-production-ready-v2`

### Issue: Wrong Branch Deployed

**Check Production Branch:**
1. Vercel Project Settings
2. Git tab
3. "Production Branch" should be: `release/attendance-production-ready-v2`
4. If wrong → change to correct branch
5. Redeploy

### Issue: Build Cache Problem

**Force Clean Build:**
1. Deployment → "..."
2. "Redeploy"
3. **UNCHECK** "Use existing Build Cache" ← IMPORTANT!
4. Deploy

## EXPECTED RESULT

After successful redeploy:

**Console Logs:**
```
✅ [Background Analyzer] 🔄 Cache DISABLED - forcing fresh analysis
✅ [Location Config] ✅ Loaded from DB: {
     name: "SMK Fithrah Insani - Bandung",
     latitude: -6.864733,
     longitude: 107.522064,
     radius: 50
   }
✅ [Attendance] ✅ Location synced: {
     schoolLatitude: -6.864733,
     schoolLongitude: 107.522064,
     allowedRadius: 50
   }
```

**UI Display:**
```
🎯 Lokasi sekolah: -6.864733, 107.522064
📏 Jarak dari sekolah: ~30m (Max: 50m)
```

## CONTACT

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Support: https://vercel.com/support
- GitHub Webhooks: https://github.com/Ashera12/webosis-archive/settings/hooks

---

**URGENT:** Lakukan manual redeploy SEKARANG! Auto-deploy tidak berfungsi.

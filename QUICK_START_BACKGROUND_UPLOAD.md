# 🚀 QUICK START - Setup & Testing Background Upload

## ⚡ 2 SQL Scripts yang WAJIB Dijalankan

### 1️⃣ Fix Upload (Storage RLS)
**File:** `FIX-STORAGE-RLS.sql`
**Untuk:** Upload foto background, gallery, content images

### 2️⃣ Fix Save Settings (Admin Settings RLS)  
**File:** `FINAL-FIX-ADMIN-SETTINGS.sql`
**Untuk:** Simpan perubahan settings ke database

---

## 📝 Langkah-Langkah (5 Menit)

### STEP 1: Jalankan SQL Script (WAJIB!)

```bash
1. Buka https://app.supabase.com
2. Login → Pilih project webosis
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New Query"
```

#### A. Fix Upload (Jalankan Pertama)
```sql
-- Copy SELURUH isi file FIX-STORAGE-RLS.sql
-- Paste di SQL Editor
-- Klik RUN atau Ctrl+Enter

Expected output:
✅ STORAGE POLICIES CREATED FOR GALLERY BUCKET
✅ Authenticated users can now upload images
```

#### B. Fix Save Settings (Jalankan Kedua)
```sql
-- Klik "New Query" lagi
-- Copy SELURUH isi file FINAL-FIX-ADMIN-SETTINGS.sql
-- Paste di SQL Editor
-- Klik RUN atau Ctrl+Enter

Expected output:
✅ Backup created
✅ Data restored (if any existed)
✅ RLS DISABLED - PERFECT!
✅✅✅ INSERT TEST PASSED - RLS IS FIXED! ✅✅✅
```

---

### STEP 2: Test Upload Background

```bash
1. Buka http://localhost:3000/admin/settings
2. Login sebagai admin (jika belum)
3. Scroll ke "Background Customization"
4. Set mode = "Background Image"
5. Klik "Upload Background Image"
6. Pilih foto dari komputer (JPG/PNG)
7. Tunggu upload...
```

**Expected Result:**
```
✅ Berhasil upload!
✅ URL muncul di input field
✅ Preview menampilkan gambar
```

**If Error:**
```
❌ "new row violates row-level security policy"
→ Cek apakah FIX-STORAGE-RLS.sql sudah dijalankan

❌ "Unauthorized"
→ Login ulang di /admin/login

❌ "File too large"
→ Compress image < 10MB
```

---

### STEP 3: Test Color Presets

#### Solid Color Mode
```bash
1. Set mode = "Solid Color"
2. Klik preset "Sky Blue" (atau warna lain)
3. Lihat preview → background berubah biru
4. Klik preset "Dark Gray" 
5. Lihat preview → background berubah abu-abu
```

**Expected:**
- ✅ Warna langsung apply ke preview
- ✅ Input field otomatis terisi hex code (#0ea5e9)

#### Gradient Mode
```bash
1. Set mode = "Gradient"
2. Klik template "Ocean Breeze"
3. Lihat preview → gradient biru ke ungu
4. Klik template "Fire Red"
5. Lihat preview → gradient merah ke orange
```

**Expected:**
- ✅ Gradient langsung apply ke preview
- ✅ Textarea CSS otomatis terisi gradient code

#### Image + Overlay Mode
```bash
1. Set mode = "Background Image"
2. Upload image (dari STEP 2)
3. Klik overlay preset "Black"
4. Adjust opacity slider ke 0.4
5. Lihat preview → image dengan overlay hitam transparan
6. Klik preset "None" 
7. Lihat preview → overlay hilang
```

**Expected:**
- ✅ Overlay warna langsung apply
- ✅ Slider opacity smooth (0-1)
- ✅ Preview update real-time

---

### STEP 4: Save Settings (KONFIRMASI DIALOG)

```bash
1. Setelah pilih background + warna/gradient/image
2. Klik tombol "Simpan Settings"
```

**Dialog Konfirmasi Muncul:**
```
Simpan X perubahan ke database?

  • Background Mode: image
  • Background Image URL: https://...
  • Image Overlay Color: #000000
  • Image Overlay Opacity: 0.4

Perubahan akan langsung aktif tanpa redeploy.

[OK] [Cancel]
```

**Klik OK:**
```
3. Tunggu "Menyimpan..."
4. Expected result:
   ✅ Settings tersimpan! 4 key diupdate: GLOBAL_BG_MODE, GLOBAL_BG_IMAGE, ...
```

**If Error:**
```
❌ "new row violates row-level security policy"
→ Cek apakah FINAL-FIX-ADMIN-SETTINGS.sql sudah dijalankan

❌ "Tidak ada perubahan untuk disimpan"
→ Edit/ubah minimal 1 setting dulu

❌ "Gagal menyimpan"
→ Check console (F12) untuk detail error
```

---

### STEP 5: Verify di Homepage

```bash
1. Buka http://localhost:3000/ (homepage)
2. Hard refresh: Ctrl+Shift+R (Chrome) atau Ctrl+F5
3. Lihat background website
```

**Expected Result:**

**Jika mode "color":**
- ✅ Background solid warna yang dipilih
- ✅ Text readable

**Jika mode "gradient":**
- ✅ Background gradient smooth
- ✅ Text readable dengan contrast baik

**Jika mode "image":**
- ✅ Background image full-screen
- ✅ Overlay warna sesuai opacity
- ✅ Text readable di atas overlay
- ✅ Image tidak stretch/distorted

**If Not Working:**
```
❌ Background tetap default
→ Hard refresh sekali lagi (clear cache)
→ Cek apakah settings tersimpan (buka /admin/settings lagi)

❌ Text tidak terbaca
→ Adjust overlay opacity lebih tinggi (0.5-0.7)
→ Atau ganti overlay color ke Black/Gray
```

---

## 🎨 Preset Reference

### Color Presets (16 warna)
```
Row 1: White, Light Gray, Dark Gray, Black
Row 2: Sky Blue, Royal Blue, Emerald, Green
Row 3: Yellow, Orange, Red, Pink
Row 4: Purple, Indigo, Teal, Slate
```

**Recommended for dark text:** White, Light Gray, Yellow
**Recommended for light text:** Dark Gray, Black, Royal Blue, Purple

### Gradient Templates (12 templates)
```
Row 1: Gold Luxury, Blue Ocean
Row 2: Sunset Glow, Purple Dream
Row 3: Green Forest, Fire Red
Row 4: Midnight Blue, Peach Pink
Row 5: Ocean Breeze, Warm Flame
Row 6: Night Sky, Rose Garden
```

**Professional:** Gold Luxury, Midnight Blue, Night Sky
**Playful:** Sunset Glow, Peach Pink, Rose Garden
**Nature:** Green Forest, Ocean Breeze, Blue Ocean

### Overlay Presets (6 options)
```
Black - Paling sering dipakai, good for light backgrounds
Gray - Soft overlay, medium readability
White - For dark images
Blue - Cool tone overlay
Purple - Creative/artistic tone
None - No overlay (transparent)
```

**Recommended opacity:**
- Light images: 0.5-0.7 (darker overlay)
- Dark images: 0.2-0.4 (lighter overlay)
- Busy images: 0.6-0.8 (strong overlay for readability)

---

## 🔍 Troubleshooting

### Upload Error: "new row violates row-level security policy"
```bash
Cause: Storage RLS policies belum di-set
Fix:
  1. Pastikan FIX-STORAGE-RLS.sql sudah dijalankan
  2. Check output ada "✅ STORAGE POLICIES CREATED"
  3. Re-run script jika perlu
  4. Refresh /admin/settings page
  5. Try upload lagi
```

### Save Error: "new row violates row-level security policy"
```bash
Cause: Admin settings table RLS masih enabled
Fix:
  1. Pastikan FINAL-FIX-ADMIN-SETTINGS.sql sudah dijalankan
  2. Check output ada "✅ RLS DISABLED - PERFECT!"
  3. Check output ada "✅✅✅ INSERT TEST PASSED"
  4. If not, re-run script
  5. Try save lagi
```

### Preview Tidak Update
```bash
Cause: Showpreview toggle off atau JavaScript error
Fix:
  1. Klik "Tampilkan Preview" button
  2. Check browser console (F12) for errors
  3. Hard refresh page (Ctrl+Shift+R)
  4. Try change value lagi
```

### Konfirmasi Dialog Tidak Muncul
```bash
Cause: Browser block popups atau no changes
Fix:
  1. Check browser popup blocker settings
  2. Pastikan ada perubahan (ubah minimal 1 field)
  3. Try different browser
```

### Background Tidak Apply di Homepage
```bash
Cause: Cache atau settings belum ter-save
Fix:
  1. Hard refresh: Ctrl+Shift+R
  2. Clear browser cache
  3. Check settings saved (go back to /admin/settings)
  4. Re-save settings
  5. Try incognito mode
```

---

## ✅ Success Checklist

### SQL Scripts
- [ ] FIX-STORAGE-RLS.sql dijalankan
- [ ] Output: "✅ STORAGE POLICIES CREATED"
- [ ] FINAL-FIX-ADMIN-SETTINGS.sql dijalankan  
- [ ] Output: "✅ RLS DISABLED - PERFECT!"
- [ ] Output: "✅✅✅ INSERT TEST PASSED"

### Upload Test
- [ ] Upload background image berhasil
- [ ] Progress bar muncul
- [ ] Message: "✅ Berhasil upload!"
- [ ] URL terisi di input field
- [ ] Preview menampilkan gambar

### Presets Test
- [ ] Klik color preset → langsung apply
- [ ] Klik gradient template → langsung apply
- [ ] Klik overlay preset → langsung apply
- [ ] Preview update real-time
- [ ] Slider opacity smooth

### Save Test
- [ ] Klik "Simpan Settings"
- [ ] Dialog konfirmasi muncul
- [ ] Klik OK
- [ ] Message: "✅ Settings tersimpan!"
- [ ] No RLS error

### Homepage Verify
- [ ] Hard refresh homepage
- [ ] Background updated
- [ ] Overlay visible (if image mode)
- [ ] Text readable
- [ ] No visual bugs

---

## 📊 Expected Timeline

```
SQL Scripts: 2 minutes
  ├─ FIX-STORAGE-RLS.sql: 30 seconds
  └─ FINAL-FIX-ADMIN-SETTINGS.sql: 1.5 minutes

Upload Test: 1 minute
  ├─ Navigate to page: 10 seconds
  ├─ Select & upload file: 30 seconds
  └─ Verify success: 20 seconds

Presets Test: 1 minute
  ├─ Test color presets: 20 seconds
  ├─ Test gradient templates: 20 seconds
  └─ Test overlay presets: 20 seconds

Save Test: 30 seconds
  ├─ Click save: 5 seconds
  ├─ Confirm dialog: 5 seconds
  └─ Wait for success: 20 seconds

Homepage Verify: 30 seconds
  ├─ Navigate & refresh: 10 seconds
  ├─ Verify background: 10 seconds
  └─ Test responsiveness: 10 seconds

Total: ~5 minutes
```

---

## 🎯 Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Open Supabase Dashboard
# https://app.supabase.com

# Admin settings page
http://localhost:3000/admin/settings

# Homepage (verify background)
http://localhost:3000/
```

---

## 📞 Need Help?

**Common Issues:**
1. RLS error → Re-run SQL scripts
2. Upload fails → Check file size < 10MB
3. Save fails → Check SQL script output
4. No preview → Click "Tampilkan Preview"
5. No changes → Hard refresh (Ctrl+Shift+R)

**Debug Mode:**
```bash
# Open browser console
F12 → Console tab

# Look for errors:
[ImageUploader] Upload error: ...
[Upload API] Error: ...
Failed to run sql query: ...
```

**Still Stuck?**
1. Screenshot error message
2. Screenshot SQL output
3. Share in group/chat
4. Include browser console errors

---

**Status:** ✅ Ready to test!
**Time:** 5 minutes
**Difficulty:** Easy (follow steps)

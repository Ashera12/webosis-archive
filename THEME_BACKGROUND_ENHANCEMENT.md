# Theme & Background Enhancement Guide

## 🎨 Fitur Baru Admin Settings

Fitur-fitur baru yang telah ditambahkan ke halaman Admin Settings (`/admin/settings`):

### 1. **Generate Admin OPS Token** 🔑

#### Fungsi:
- Generate secure token untuk CI/CD operations
- Token disimpan otomatis ke database
- `ALLOW_ADMIN_OPS` otomatis diaktifkan

#### Cara Pakai:
1. Buka `/admin/settings`
2. Expand section **"Admin & Security"**
3. Klik tombol **"Generate Token"**
4. Token akan muncul - **COPY SEGERA!**
5. Token hanya ditampilkan sekali

#### API Endpoint:
```bash
POST /api/admin/ops/generate-token
Authorization: Admin session required

Response:
{
  "success": true,
  "token": "64-character-hex-string",
  "message": "Token berhasil digenerate dan disimpan...",
  "warning": "Simpan token ini dengan aman!"
}
```

---

### 2. **Theme Templates** 🌈

#### Fungsi:
- 8 template tema siap pakai
- Apply sekaligus untuk dark & light mode
- Otomatis set warna + background

#### Template Tersedia:
1. **🟣 Modern Purple** - Professional dengan aksen ungu
2. **🌊 Ocean Blue** - Calm & trustworthy biru
3. **🌲 Forest Green** - Natural eco-friendly
4. **🌅 Sunset Orange** - Warm & energetic
5. **🌌 Cosmic Dark** - Deep space inspired
6. **⚪ Minimal Light** - Clean minimal design
7. **🌈 Vibrant Rainbow** - Colorful multi-color
8. **💼 Professional Navy** - Corporate navy blue

#### Cara Pakai:
1. Buka `/admin/settings`
2. Expand section **"Theme & Background"**
3. Scroll ke **"Theme Templates"**
4. Klik template yang diinginkan
5. Konfirmasi apply
6. Halaman auto-reload

#### API Endpoint:
```bash
# List templates
GET /api/admin/theme/apply-template

Response:
{
  "templates": [
    {
      "id": "modern-purple",
      "name": "🟣 Modern Purple",
      "description": "Clean and professional with purple accents"
    },
    ...
  ],
  "count": 8
}

# Apply template
POST /api/admin/theme/apply-template
Content-Type: application/json

{
  "templateId": "modern-purple",
  "applyToBoth": true
}

Response:
{
  "success": true,
  "template": {
    "id": "modern-purple",
    "name": "🟣 Modern Purple",
    "description": "..."
  },
  "appliedSettings": 18,
  "message": "Template \"🟣 Modern Purple\" berhasil diterapkan!"
}
```

---

### 3. **Simple Theme Editor** 🎨

#### Fungsi:
- Edit warna tema manual (dark/light mode)
- Visual color picker + hex input
- 8 warna per mode (16 total)

#### Warna yang Bisa Diedit:
- **Primary** - Warna utama
- **Secondary** - Warna sekunder
- **Accent** - Warna aksen/highlight
- **Background** - Warna latar belakang
- **Surface** - Warna permukaan (cards, panels)
- **Text** - Warna text utama
- **Text 2nd** - Warna text sekunder
- **Border** - Warna border

#### Cara Pakai:
1. Buka `/admin/settings`
2. Expand section **"Theme & Background"**
3. Scroll ke **"Simple Theme Editor"**
4. Klik **"Show"** untuk membuka
5. Pilih **Light Mode** atau **Dark Mode**
6. Adjust warna dengan color picker atau hex input
7. Klik **"Simpan Perubahan"** di pojok kanan atas

#### Settings Keys:
```
Light Mode:
- THEME_LIGHT_PRIMARY
- THEME_LIGHT_SECONDARY
- THEME_LIGHT_ACCENT
- THEME_LIGHT_BG
- THEME_LIGHT_SURFACE
- THEME_LIGHT_TEXT
- THEME_LIGHT_TEXT_SECONDARY
- THEME_LIGHT_BORDER

Dark Mode:
- THEME_DARK_PRIMARY
- THEME_DARK_SECONDARY
- THEME_DARK_ACCENT
- THEME_DARK_BG
- THEME_DARK_SURFACE
- THEME_DARK_TEXT
- THEME_DARK_TEXT_SECONDARY
- THEME_DARK_BORDER
```

---

### 4. **Enhanced Background Settings** 🖼️

#### Improvements:
- ✅ Template otomatis set background
- ✅ Live preview background
- ✅ Upload progress indicators
- ✅ Auto-reload setelah save

#### Background Modes:
- **None** - Tanpa background khusus
- **Color** - Solid color background
- **Gradient** - Gradient background
- **Image** - Image background dengan overlay

#### Page Scope Options:
- **🌐 Semua Halaman** - Apply ke semua halaman publik
- **🏠 Home** - Homepage only
- **ℹ️ About** - About page
- **📰 Posts** - Posts/blog page
- **🖼️ Gallery** - Gallery page
- **📅 Events** - Events page
- **👥 Sekbid** - Sekbid page
- **📢 Info** - Info page

---

## 📋 Workflow Lengkap

### Quick Start dengan Template:
```bash
1. Login as admin
2. Goto /admin/settings
3. Expand "Theme & Background"
4. Click "Ocean Blue" template
5. Confirm
6. ✅ Done! Tema & background applied
```

### Custom Theme Editor:
```bash
1. Login as admin
2. Goto /admin/settings
3. Expand "Theme & Background"
4. Open "Simple Theme Editor"
5. Toggle Light/Dark mode
6. Adjust colors dengan picker
7. Click "Simpan Perubahan"
8. ✅ Tema custom applied
```

### Generate OPS Token:
```bash
1. Login as admin
2. Goto /admin/settings
3. Expand "Admin & Security"
4. Click "Generate Token"
5. Copy token immediately
6. Save to secure location (env, secrets)
7. ✅ Use token for CI/CD
```

---

## 🔧 API Reference

### File Structure:
```
app/
├── api/
│   └── admin/
│       ├── ops/
│       │   └── generate-token/
│       │       └── route.ts          # Generate OPS token
│       └── theme/
│           └── apply-template/
│               └── route.ts          # Apply theme template
lib/
├── adminSettings.ts                 # Server-side settings utils
│   ├── getAdminSettings()
│   ├── setAdminSetting()
│   └── setAdminSettings()
└── themeTemplates.ts                 # Theme template definitions
    ├── THEME_TEMPLATES (8 templates)
    └── templateToSettings()
```

### Database Schema:
```sql
-- admin_settings table
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New keys added:
-- ADMIN_OPS_TOKEN (secret)
-- THEME_LIGHT_* (8 keys)
-- THEME_DARK_* (8 keys)
```

---

## 🎯 Testing Checklist

### ✅ Generate Token:
- [ ] Token generates successfully
- [ ] Token is 64 characters hex
- [ ] Token saves to database
- [ ] ALLOW_ADMIN_OPS auto-enabled
- [ ] Copy to clipboard works
- [ ] Token shows once only

### ✅ Theme Templates:
- [ ] All 8 templates load
- [ ] Template preview shows
- [ ] Apply template works
- [ ] Settings saved to DB
- [ ] Page auto-reloads
- [ ] Theme visible on pages

### ✅ Theme Editor:
- [ ] Light/Dark toggle works
- [ ] Color pickers work
- [ ] Hex input accepts values
- [ ] Default values shown
- [ ] Save updates DB
- [ ] Changes reflected on site

### ✅ Background Settings:
- [ ] All modes work (none, color, gradient, image)
- [ ] Upload image works
- [ ] Progress indicators show
- [ ] Page scope selection works
- [ ] Live preview accurate
- [ ] Background applies correctly

---

## 🚨 Troubleshooting

### Token tidak generate:
```bash
# Check admin role
SELECT role FROM users WHERE email = 'your-email@example.com';
# Should be 'admin'

# Check database connection
SELECT * FROM admin_settings WHERE key = 'ADMIN_OPS_TOKEN';
```

### Template tidak apply:
```bash
# Check API response
POST /api/admin/theme/apply-template
# Should return success: true

# Check database
SELECT key, value FROM admin_settings 
WHERE key LIKE 'THEME_%' 
ORDER BY key;
```

### Theme editor tidak save:
```bash
# Check form values
console.log(values);

# Check API call
# Network tab should show POST to /api/admin/settings

# Verify database
SELECT * FROM admin_settings WHERE key LIKE 'THEME_%';
```

---

## 📚 Documentation Links

- [Admin Settings API](./API_DOCUMENTATION.md)
- [Background Setup Guide](./BACKGROUND_FIX_GUIDE.md)
- [Theme System](./lib/themeTemplates.ts)
- [Admin Settings Utils](./lib/adminSettings.ts)

---

## 🎉 Summary

**Fitur baru yang ditambahkan:**

1. ✅ **Generate Admin OPS Token** - Secure token untuk CI/CD
2. ✅ **8 Theme Templates** - Quick apply tema siap pakai
3. ✅ **Simple Theme Editor** - Edit 16 warna (light + dark)
4. ✅ **Enhanced Background** - Templates auto-set background

**File yang dibuat:**
- `app/api/admin/ops/generate-token/route.ts`
- `app/api/admin/theme/apply-template/route.ts`
- `lib/themeTemplates.ts`
- Enhanced `lib/adminSettings.ts` with setAdminSetting/setAdminSettings
- Enhanced `app/admin/settings/page.tsx` with new UI components

**Ready to use!** 🚀

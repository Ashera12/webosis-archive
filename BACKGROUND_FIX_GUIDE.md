# Background Settings - Complete Testing & Fix Guide

## 🐛 Problem: Background tidak muncul atau tidak perfect

### Root Causes:
1. **Settings belum tersimpan** - admin_settings table kosong
2. **Settings tidak ter-load** - API error atau parse failure
3. **Background tidak ter-apply** - Scope/selected pages tidak cocok
4. **Default background tidak ada** - Fallback gradient tidak muncul

## ✅ Solution Steps

### Step 1: Initialize Default Background Settings

**Via API (Recommended):**
```bash
# POST untuk create default settings
curl -X POST http://localhost:3000/api/admin/settings/init-background \
  -H "Cookie: [your-session-cookie]"

# Expected response:
{
  "success": true,
  "message": "Initialized 5 background settings",
  "inserted": 5,
  "settings": {
    "GLOBAL_BG_MODE": "gradient",
    "GLOBAL_BG_SCOPE": "all-pages",
    "GLOBAL_BG_GRADIENT": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    ...
  }
}
```

**Via Browser:**
1. Login ke admin
2. Buka: `http://localhost:3000/api/admin/settings/init-background` (POST via Postman/Thunder Client)
3. Check response JSON

**Via Supabase SQL:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO admin_settings (key, value) VALUES
    ('GLOBAL_BG_MODE', 'gradient'),
    ('GLOBAL_BG_SCOPE', 'all-pages'),
    ('GLOBAL_BG_GRADIENT', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
    ('GLOBAL_BG_SELECTED_PAGES', '["home","about","posts"]'),
    ('GLOBAL_BG_IMAGE_OVERLAY_OPACITY', '0.3')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Step 2: Verify Settings in Database

```sql
-- Check current settings
SELECT key, value 
FROM admin_settings 
WHERE key LIKE 'GLOBAL_BG_%' 
ORDER BY key;
```

**Expected Results (at minimum):**
- `GLOBAL_BG_MODE`: `gradient` (or `color`, `image`, `none`)
- `GLOBAL_BG_SCOPE`: `all-pages` (or `homepage-only`, `selected-pages`)
- `GLOBAL_BG_GRADIENT`: CSS gradient string

### Step 3: Check Browser Console Logs

**Open browser DevTools → Console**, look for:

```
[Layout] Background settings: {
  mode: "gradient",
  scope: "all-pages",
  selectedPages: undefined,
  hasColor: false,
  hasGradient: true,
  hasImage: false,
  pathname: "/"
}

[DynamicHero] Background config: {
  mode: "gradient",
  scope: "all-pages",
  shouldRenderHeroBg: false,  // false = body has bg, hero transparent
  hasGradient: true
}

[fetchGlobalBackground] Fetched settings: {
  GLOBAL_BG_MODE: "gradient",
  GLOBAL_BG_GRADIENT: "linear-gradient(...)"
}
```

### Step 4: Test Different Background Modes

**In `/admin/settings` → Theme & Background:**

#### Test Gradient:
1. Select **Gradient** mode
2. Choose preset (e.g., "Sunset")
3. Select scope: **All Pages**
4. Click **Simpan Perubahan**
5. **Expected**: Page reloads, gradient appears on all pages

#### Test Color:
1. Select **Color** mode
2. Pick color (e.g., `#4f46e5` - indigo)
3. Select scope: **All Pages**
4. Click **Simpan Perubahan**
5. **Expected**: Solid color background

#### Test Image:
1. Select **Image** mode
2. Upload image (will auto-create `backgrounds` bucket)
3. Adjust opacity slider (0-100%)
4. Select pages: home, about, posts
5. Click **Simpan Perubahan**
6. **Expected**: Upload indicator → Success → Page reload → Image background on selected pages

## 🔍 Troubleshooting

### Background tidak muncul sama sekali

**Check:**
1. Console logs: Any errors?
2. Network tab: `/api/admin/settings` returns 200?
3. Response JSON has `settings` object?
4. Database: Query returns rows?

**Fix:**
```bash
# Re-initialize settings
POST /api/admin/settings/init-background
```

### Background hanya muncul di home, tidak di pages lain

**Check:**
- `GLOBAL_BG_SCOPE` value in database
- Should be `all-pages` NOT `homepage-only`

**Fix:**
```sql
UPDATE admin_settings 
SET value = 'all-pages' 
WHERE key = 'GLOBAL_BG_SCOPE';
```

### Gradient tidak smooth / Colors tidak match

**Check:**
- `GLOBAL_BG_GRADIENT` value format
- Must be valid CSS: `linear-gradient(135deg, #color1 0%, #color2 100%)`

**Fix via Settings UI:**
1. Pilih preset gradient
2. Save
3. Hard refresh browser (Ctrl+Shift+R)

### Image upload gagal "Bucket not found"

**Auto-fix:** Upload will create bucket automatically

**Manual fix:**
```bash
POST /api/admin/storage/setup
```

Or via SQL (see `setup_storage_buckets.sql`)

### Background tidak apply di specific page

**Check:**
1. Scope: `selected-pages`?
2. `GLOBAL_BG_SELECTED_PAGES`: Does it include page name?

**Example:**
```json
["home", "about", "posts", "gallery"]
```

Page name mapping:
- `/` → `home` or `/`
- `/about` → `about`
- `/posts` → `posts`
- `/gallery` → `gallery`

**Fix:**
Update selected pages array in database or via Settings UI.

## 📊 Expected Behavior Matrix

| Mode     | Scope         | Homepage | About | Posts | Gallery |
|----------|---------------|----------|-------|-------|---------|
| gradient | all-pages     | ✅       | ✅    | ✅    | ✅      |
| gradient | homepage-only | ✅       | ❌    | ❌    | ❌      |
| gradient | selected      | depends on array                |
| color    | all-pages     | ✅       | ✅    | ✅    | ✅      |
| image    | selected      | ✅ if 'home' in array          |
| none     | *             | default gradient (hero only)   |

## 🎯 Quick Fixes

### Default gradient not showing
```sql
-- Force gradient background
UPDATE admin_settings SET value = 'gradient' WHERE key = 'GLOBAL_BG_MODE';
UPDATE admin_settings SET value = 'all-pages' WHERE key = 'GLOBAL_BG_SCOPE';
INSERT INTO admin_settings (key, value) VALUES 
  ('GLOBAL_BG_GRADIENT', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Reset to default
```sql
DELETE FROM admin_settings WHERE key LIKE 'GLOBAL_BG_%';
```
Then POST to `/api/admin/settings/init-background`

### Emergency fallback
If all else fails, layout.tsx has fallback:
```tsx
className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
```

## ✅ Success Indicators

- [ ] Console shows `[Layout] Background settings` with correct mode
- [ ] Console shows `[DynamicHero] Background config`
- [ ] Database query returns GLOBAL_BG_* rows
- [ ] Page has visible background (gradient/color/image)
- [ ] Background changes after Save in admin settings
- [ ] Background consistent across pages (if all-pages scope)
- [ ] No console errors related to background fetch
- [ ] Upload shows progress indicators (📤 → ✅)
- [ ] Settings save shows success message
- [ ] Page auto-reloads after save (1.5s delay)

## 🚀 Testing Workflow

1. **Init**: POST `/api/admin/settings/init-background`
2. **Verify**: Query database for GLOBAL_BG_* settings
3. **Test UI**: Open `/admin/settings`, change mode/gradient
4. **Save**: Click button, watch console logs
5. **Reload**: Page should auto-reload with new background
6. **Check**: All pages have background (if all-pages scope)
7. **Upload**: Test image upload with progress indicators
8. **Inspect**: Browser DevTools → Elements → `<body>` style attribute

Done! Background system should now work perfectly. 🎨

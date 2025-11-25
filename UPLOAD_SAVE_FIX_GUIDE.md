# Upload & Save - Comprehensive Fix Guide

## ✅ Perbaikan yang Sudah Dilakukan

### 1. Auto-Create Buckets
- `/api/upload` & `/api/admin/upload` sekarang **otomatis membuat bucket** jika belum ada
- Tidak perlu SQL manual lagi!
- Buckets dibuat dengan settings:
  - `backgrounds`: 5MB limit, public
  - `gallery`: 10MB limit, public

### 2. Better Error Handling
- **Upload errors**: Detailed error messages dengan file type validation
- **Save errors**: Console logging untuk debug, specific error messages
- **Network errors**: Proper try-catch dengan stack trace di development

### 3. Enhanced Logging
- Semua API endpoints log ke console
- Upload: file name, size, type, bucket, path
- Save: keys being saved, insert vs update count
- Errors: full error object dengan details

### 4. Upload Progress Indicators
- 📤 **Mengupload gambar...** saat upload
- ✅ **Gambar berhasil diupload!** saat sukses
- ❌ **Upload gagal: [error]** saat error
- Auto-reload page setelah save berhasil (1.5s delay)

## 🧪 Testing Checklist

### Test Upload - Background Images
1. Buka `/admin/settings`
2. Expand **Theme & Background**
3. Pilih mode **Image**
4. Upload gambar (JPG/PNG/WEBP/GIF, max 5MB)
5. **Expected**: Progress indicator muncul, lalu success message
6. **Check console**: Lihat `[/api/upload]` logs

### Test Upload - Gallery Images
1. Buka `/admin/gallery`
2. Upload gambar (JPG/PNG/WEBP/GIF, max 10MB)
3. **Expected**: Upload success, preview muncul
4. **Check console**: Lihat `[/api/upload]` logs

### Test Save - Theme Settings
1. Di `/admin/settings` → **Theme & Background**
2. Ubah background color, gradient, atau mode
3. Pilih halaman yang ingin di-apply
4. Klik **Simpan Perubahan**
5. **Expected**: Success message, page auto-reload setelah 1.5s
6. **Check console**: Lihat `[/api/admin/settings]` logs dengan inserted/updated count

### Test Save - AI Settings
1. Di `/admin/settings` → **AI & Automation**
2. Ubah API key atau model
3. Klik **Simpan Perubahan**
4. **Expected**: Confirmation dialog, success message
5. **Check DB**: Query `admin_settings` table untuk verify

### Test Save - Admin Settings
1. Di `/admin/settings` → **Admin & Security**
2. Ubah admin ops token atau flags
3. Klik **Simpan Perubahan**
4. **Expected**: Success dengan count of updated keys

## 🔧 Troubleshooting

### Error: "Bucket not found"
**Fix**: Upload akan auto-create bucket. Jika masih error:
```bash
# Call setup endpoint manually
curl -X POST http://localhost:3000/api/admin/storage/setup \
  -H "Cookie: [your-session-cookie]"
```

### Error: "Invalid file type"
**Allowed types**: image/jpeg, image/jpg, image/png, image/webp, image/gif
**Fix**: Convert image atau gunakan format yang supported

### Error: "Upload failed" (SSL/fetch error)
**Fixed**: `/api/upload` tidak lagi forward ke `/api/admin/upload` via HTTP
**Reason**: Ngrok HTTPS conflict dengan internal localhost fetch

### Save tidak update database
**Check**:
1. Console logs: `[/api/admin/settings]` shows inserted/updated count?
2. Network tab: Response status 200?
3. Supabase logs: Any RLS policy errors?
4. Database: Run `SELECT * FROM admin_settings WHERE key LIKE 'GLOBAL_BG_%'`

### Upload berhasil tapi background tidak muncul
**Check**:
1. Save settings setelah upload? (image URL harus di-save)
2. Scope setting: `GLOBAL_BG_SCOPE` = `all-pages` atau `selected-pages`?
3. Selected pages: `GLOBAL_BG_SELECTED_PAGES` contains current page name?
4. Browser cache: Hard refresh (Ctrl+Shift+R)

## 🚀 Auto-Setup Storage (Optional)

Jika ingin manual setup semua buckets sekaligus:

### Via API (Recommended)
```bash
# POST ke endpoint setup (otomatis create buckets)
POST /api/admin/storage/setup

# GET untuk list existing buckets
GET /api/admin/storage/setup
```

### Via Supabase UI (Alternative)
1. Dashboard → Storage
2. New Bucket → `backgrounds` (5MB, public)
3. New Bucket → `gallery` (10MB, public)

## 📊 Monitoring

### Check Logs in Terminal
Look for these patterns:
- `[/api/upload] Upload params:` - Upload started
- `[/api/upload] Uploading to:` - File being uploaded
- `[/api/upload] Upload success:` - Upload complete
- `[/api/admin/settings] POST - Saving settings:` - Save started
- `[/api/admin/settings] Save complete:` - Save finished

### Check Network Tab
- Upload: Should see `POST /api/upload` with 200 status
- Save: Should see `POST /api/admin/settings` with 200 status
- Response body should have `{ success: true, ... }`

### Check Database
```sql
-- Verify buckets created
SELECT * FROM storage.buckets WHERE id IN ('backgrounds', 'gallery');

-- Verify files uploaded
SELECT * FROM storage.objects WHERE bucket_id IN ('backgrounds', 'gallery') ORDER BY created_at DESC LIMIT 10;

-- Verify settings saved
SELECT * FROM admin_settings WHERE key LIKE 'GLOBAL_BG_%' ORDER BY key;
```

## 🎯 Expected Behavior

### Successful Upload Flow
1. User selects file
2. Client validates file type/size
3. FormData sent to `/api/upload`
4. Server checks bucket exists (auto-create if not)
5. Server validates file type again
6. Server uploads to Supabase Storage
7. Server returns public URL
8. Client shows success indicator
9. Client adds URL to settings object
10. User clicks Save
11. Settings saved to DB
12. Page auto-reloads
13. Background appears on selected pages

### All Features Working
- ✅ Upload backgrounds (any format, max 5MB)
- ✅ Upload gallery (any format, max 10MB)
- ✅ Save AI settings (keys, models)
- ✅ Save admin settings (tokens, flags)
- ✅ Save theme settings (colors, gradients, images)
- ✅ Progress indicators during upload
- ✅ Error messages when upload/save fails
- ✅ Auto-reload after successful save
- ✅ Background applies to selected pages
- ✅ Auto-create buckets if missing

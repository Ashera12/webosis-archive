# URGENT FIX: Video Upload Support

## Problem
Error: **"mime type video/mp4 is not supported"**

Supabase bucket `gallery` hanya mengizinkan image files. Perlu update bucket settings.

## Solution

### Option 1: Via Supabase Dashboard (RECOMMENDED - FASTEST)

1. **Login ke Supabase Dashboard**: https://supabase.com/dashboard
2. **Pilih project**: webosis-archive
3. **Navigate**: Storage → Buckets → `gallery`
4. **Click**: Settings (gear icon) atau "Edit bucket"
5. **Update settings**:
   - **File size limit**: `52428800` (50MB) atau lebih
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     image/gif
     image/svg+xml
     image/bmp
     video/mp4
     video/webm
     video/ogg
     video/quicktime
     video/x-msvideo
     video/x-matroska
     ```
6. **Save changes**
7. **Repeat** untuk buckets: `posts`, `events` (jika ada)

### Option 2: Via SQL Editor

1. Open **SQL Editor** di Supabase Dashboard
2. Paste & run script: `UPDATE_BUCKET_VIDEO_SUPPORT.sql`
3. Verify results dengan query terakhir

### Option 3: Via API (Auto-update - Already Implemented)

Code sudah updated untuk auto-update bucket settings saat upload pertama kali:
- File: `app/api/upload/route.ts`
- Function: `ensureBucket()` - sekarang call `updateBucket()` untuk existing buckets

**Cara test**:
1. Coba upload video lagi
2. Check server logs - harusnya muncul: `✅ Bucket gallery settings updated`
3. Jika masih error, gunakan Option 1 (manual via dashboard)

## Updated Code

### `/app/api/upload/route.ts`
- ✅ Expanded `allowedMimeTypes` list (13 formats)
- ✅ Increased file size limit: 50MB (dari 10MB)
- ✅ Added `updateBucket()` call untuk existing buckets
- ✅ Enhanced error logging

### Supported Formats

**Images**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- SVG (.svg)
- BMP (.bmp)

**Videos**:
- MP4 (.mp4) ✅
- WebM (.webm) ✅
- Ogg (.ogg) ✅
- QuickTime (.mov)
- AVI (.avi)
- Matroska (.mkv)

## Testing

1. **Manual bucket update** via dashboard (Option 1)
2. **Try upload** video file
3. **Check logs** untuk konfirmasi:
   ```
   [/api/upload] Bucket gallery exists, attempting to update settings
   [/api/upload] ✅ Bucket gallery settings updated
   [/api/upload] Uploading to: { bucket: 'gallery', filePath: '...', contentType: 'video/mp4' }
   [/api/upload] ✅ Upload success
   ```

## Troubleshooting

### If still getting "mime type not supported":

1. **Verify bucket settings** di Supabase Dashboard:
   ```sql
   SELECT name, allowed_mime_types, file_size_limit 
   FROM storage.buckets 
   WHERE name = 'gallery';
   ```

2. **Check RLS policies** - pastikan tidak ada policy yang block video:
   ```sql
   SELECT * FROM storage.objects WHERE bucket_id = 'gallery' ORDER BY created_at DESC LIMIT 5;
   ```

3. **Create new bucket** kalau update gagal:
   - Name: `gallery-v2` atau `media`
   - Update code untuk gunakan bucket baru
   - Migrate existing files (optional)

4. **File too large**:
   - Current limit: 50MB
   - Increase jika perlu: `file_size_limit = 104857600` (100MB)

## Next Steps

Setelah bucket updated:
- ✅ Video upload harusnya work
- ✅ Gallery admin: upload video berfungsi
- ✅ Posts admin: upload video berfungsi  
- ✅ Public pages: video playback dengan MediaRenderer

**IMPORTANT**: Bucket settings persist - hanya perlu update 1x via dashboard.

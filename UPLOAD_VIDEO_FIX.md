# Upload & Video Playback Fixes

## Issues Fixed

### 1. Upload API Error (500 Internal Server Error)
**Problem:** Upload gagal dengan error 500 tanpa detail yang jelas

**Solution:**
- Added comprehensive error logging to `/api/upload/route.ts`
- Added validation for:
  - FormData parsing
  - File MIME type detection
  - ArrayBuffer conversion
  - Supabase credentials
- Enhanced console logging untuk debugging:
  ```
  [/api/upload] ===== Upload request started =====
  [/api/upload] Upload params: { fileName, fileType, bucket, folder, fileSize }
  [/api/upload] ✅ Upload success
  [/api/upload] ✅ Public URL generated
  ```
- Error messages now include error type dan stack trace (development mode)

**How to Debug:**
1. Open browser console saat upload
2. Cek terminal/server logs untuk detailed error
3. Look for specific failure point dalam upload flow

### 2. React Key Errors - "Encountered two children with the same key, `null`"
**Problem:** Gallery filter buttons dan options tidak punya unique keys

**Solution:**
- **Gallery Page (`app/gallery/page.tsx`):**
  - Added unique key prefix untuk filter buttons: `gallery-filter-sekbid-${id}`
  - Extended filter range dari 6 → 8 sekbids
  - Gallery items already have fallback IDs: `gal-${i}-${base}`

- **Admin Gallery (`app/admin/gallery/page.tsx`):**
  - Event options: `key={event.id || \`evt-\${idx}-\${event.title}\`}`
  - Sekbid options: `key={safeId}` with fallback generation
  - Gallery items: `key={item.id}` (already has fallback from fetchData)

### 3. Video Playback in Posts
**Problem:** Videos tidak bisa diputar di halaman post detail - hanya image static

**Solution:**
- **Post Detail Page (`app/posts/[slug]/page.tsx`):**
  - Replaced `<Image>` component with `<MediaRenderer>`
  - Added `controlsForVideo={true}` untuk enable playback controls
  - Videos sekarang bisa diplay, pause, seek, volume control

- **Posts List Page (`app/posts/page.tsx`):**
  - Already using `<MediaRenderer>` with autoplay/loop/muted untuk thumbnails
  - No controls pada list (preview only)
  - Click article untuk lihat full video di detail page

### 4. Video Playback in Gallery
**Problem:** Perlu verify video clickable dan playable

**Solution:**
- **Gallery Grid (`app/gallery/page.tsx`):**
  - Thumbnails: `controlsForVideo={false}`, `autoPlay`, `loop`, `muted`
  - Lightbox: `controlsForVideo={true}` ✅ Full playback controls
  - Keyboard navigation: Arrow keys, Escape

- **Admin Gallery (`app/admin/gallery/page.tsx`):**
  - Already using `<MediaRenderer>` dalam grid display
  - Supports both image dan video upload

### 5. Image Import Error in Info Page
**Problem:** `Image` component conflict - tidak diimport dari next/image

**Solution:**
- Replaced manual video/image conditional dengan `<MediaRenderer>`
- Removed native `<Image>` usage yang menyebabkan compile error
- Consistent media rendering across semua pages

## Video Upload Flow

```
User selects file
    ↓
ImageUploadField.tsx detects video → creates object URL for preview
    ↓
Parent component (gallery/posts) calls handleImageChange
    ↓
Creates FormData with:
  - file: original File object
  - filename: video.mp4 (preserved extension)
  - bucket: 'gallery' or 'posts'
  - folder: 'general' or specific
    ↓
uploadWithProgress() → /api/upload
    ↓
Server validates:
  ✓ Session authenticated
  ✓ MIME type (video/mp4, webm, ogg)
  ✓ File size limits
  ✓ Bucket exists
    ↓
Upload to Supabase Storage
    ↓
Generate public URL
    ↓
Return { success: true, url: publicUrl }
    ↓
Update formData.image_url with publicUrl
    ↓
Save to database (gallery/posts table)
```

## MediaRenderer Component

Universal component untuk render images DAN videos:

```tsx
<MediaRenderer
  src={url}
  alt="Description"
  className="w-full h-full object-cover"
  controlsForVideo={true}  // false for thumbnails
  autoPlay={false}         // true for preview loops
  loop={false}             // true for preview loops
  muted={false}            // true untuk autoplay (browser requirement)
/>
```

**Detection Logic:**
- Regex: `/\.(mp4|webm|ogg)(\?.*)?$/i`
- Checks file extension dari URL
- Renders `<video>` or `<img>` accordingly

## Pages Updated

1. ✅ `/app/api/upload/route.ts` - Enhanced error handling
2. ✅ `/app/admin/gallery/page.tsx` - Already has MediaRenderer
3. ✅ `/app/gallery/page.tsx` - Fixed filter keys, extended to 8 sekbids
4. ✅ `/app/posts/page.tsx` - Already has MediaRenderer thumbnails
5. ✅ `/app/posts/[slug]/page.tsx` - **NEW**: MediaRenderer with controls
6. ✅ `/app/info/page.tsx` - Fixed Image import error, added MediaRenderer
7. ✅ `/components/ImageUploadField.tsx` - Preserves video filename
8. ✅ `/lib/aiContext.ts` - Improved AI response formatting (previous fix)

## Testing Checklist

- [ ] Upload image di admin gallery → berhasil
- [ ] Upload video (.mp4) di admin gallery → berhasil
- [ ] Upload video (.webm) di admin posts → berhasil
- [ ] Gallery public page: video thumbnail autoplay
- [ ] Gallery lightbox: video controls visible, bisa play/pause
- [ ] Posts list: video thumbnail autoplay
- [ ] Post detail: video dengan full controls
- [ ] Info page: upcoming events dengan video
- [ ] No React key warnings di console
- [ ] No compile errors

## Known Limitations

1. **Autoplay Requirements:**
   - Videos must be `muted` untuk autoplay (browser policy)
   - Thumbnails: `autoPlay + loop + muted`
   - Full view: `controls` (user controls playback)

2. **File Size:**
   - Gallery bucket: 10MB limit
   - Backgrounds: 5MB limit
   - Configured di `/api/upload/route.ts` line 18

3. **Supported Formats:**
   - Video: mp4, webm, ogg
   - Image: jpeg, jpg, png, webp, gif

## Next Steps

Jika upload masih error:
1. Check browser console untuk error messages
2. Check server terminal untuk detailed logs
3. Verify Supabase bucket exists dan RLS policies correct
4. Test dengan file kecil (<1MB) untuk isolate size issues

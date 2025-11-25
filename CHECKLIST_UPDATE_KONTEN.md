# 📋 Checklist Update Konten Social Media

## 🎯 INSTAGRAM (@osissmkinformatika_fi)

### [ ] Langkah 1: Buka Instagram
- [ ] Buka https://www.instagram.com/osissmkinformatika_fi
- [ ] Login jika perlu
- [ ] Lihat grid posts

### [ ] Langkah 2: Pilih 6 Post
Prioritas:
- [ ] Post penting/event besar (MPLS, lomba, dll) → Set isPinned: true
- [ ] Post dengan likes terbanyak
- [ ] Post terbaru

### [ ] Langkah 3: Download & Catat Data

**Post 1:**
- [ ] Download gambar → Simpan sebagai: `_____________________.jpg`
- [ ] Caption: `_________________________________________________`
- [ ] Likes: `______`
- [ ] Comments: `______`
- [ ] Tanggal: `____-____-____` (YYYY-MM-DD)
- [ ] Pinned: ☐ Yes  ☐ No

**Post 2:**
- [ ] Download gambar → Simpan sebagai: `_____________________.jpg`
- [ ] Caption: `_________________________________________________`
- [ ] Likes: `______`
- [ ] Comments: `______`
- [ ] Tanggal: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

**Post 3:**
- [ ] Download gambar → Simpan sebagai: `_____________________.jpg`
- [ ] Caption: `_________________________________________________`
- [ ] Likes: `______`
- [ ] Comments: `______`
- [ ] Tanggal: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

**Post 4:**
- [ ] Download gambar → Simpan sebagai: `_____________________.jpg`
- [ ] Caption: `_________________________________________________`
- [ ] Likes: `______`
- [ ] Comments: `______`
- [ ] Tanggal: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

**Post 5:**
- [ ] Download gambar → Simpan sebagai: `_____________________.jpg`
- [ ] Caption: `_________________________________________________`
- [ ] Likes: `______`
- [ ] Comments: `______`
- [ ] Tanggal: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

**Post 6:**
- [ ] Download gambar → Simpan sebagai: `_____________________.jpg`
- [ ] Caption: `_________________________________________________`
- [ ] Likes: `______`
- [ ] Comments: `______`
- [ ] Tanggal: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

### [ ] Langkah 4: Upload Files
- [ ] Pindahkan semua gambar ke: `public/images/social-media/instagram/`
- [ ] Pastikan nama file sesuai yang dicatat

### [ ] Langkah 5: Update Code
- [ ] Buka file: `lib/socialMediaData.ts`
- [ ] Update array `instagramPosts`
- [ ] Save file

---

## 🎥 YOUTUBE (@osissmkinformatikafithrahi6947)

### [ ] Langkah 1: Buka YouTube
- [ ] Buka https://youtube.com/@osissmkinformatikafithrahi6947
- [ ] Klik tab "Videos"

### [ ] Langkah 2: Pilih 4-6 Video
Prioritas:
- [ ] Video event penting → Set isPinned: true
- [ ] Video dengan views terbanyak
- [ ] Video terbaru

### [ ] Langkah 3: Download Thumbnails & Catat Data

**Video 1:**
- [ ] Video ID: `_______________` (dari URL)
- [ ] Download thumbnail → Simpan sebagai: `_____________________.jpg`
- [ ] Judul: `_________________________________________________`
- [ ] Views: `______`
- [ ] Durasi: `__:__` (MM:SS)
- [ ] Upload Date: `____-____-____` (YYYY-MM-DD)
- [ ] Pinned: ☐ Yes  ☐ No

**Video 2:**
- [ ] Video ID: `_______________`
- [ ] Download thumbnail → Simpan sebagai: `_____________________.jpg`
- [ ] Judul: `_________________________________________________`
- [ ] Views: `______`
- [ ] Durasi: `__:__`
- [ ] Upload Date: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

**Video 3:**
- [ ] Video ID: `_______________`
- [ ] Download thumbnail → Simpan sebagai: `_____________________.jpg`
- [ ] Judul: `_________________________________________________`
- [ ] Views: `______`
- [ ] Durasi: `__:__`
- [ ] Upload Date: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

**Video 4:**
- [ ] Video ID: `_______________`
- [ ] Download thumbnail → Simpan sebagai: `_____________________.jpg`
- [ ] Judul: `_________________________________________________`
- [ ] Views: `______`
- [ ] Durasi: `__:__`
- [ ] Upload Date: `____-____-____`
- [ ] Pinned: ☐ Yes  ☐ No

### [ ] Langkah 4: Download Thumbnails (Pilih salah satu)

**Opsi A - Otomatis (Recommended):**
- [ ] Buka file: `scripts/downloadYoutubeThumbnails.js`
- [ ] Update VIDEO IDs di array YOUTUBE_VIDEOS
- [ ] Run: `node scripts/downloadYoutubeThumbnails.js`
- [ ] Check hasil di: `public/images/social-media/youtube/`

**Opsi B - Manual:**
- [ ] Untuk setiap video, buka: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
- [ ] Klik kanan → Save image as...
- [ ] Simpan ke: `public/images/social-media/youtube/`

### [ ] Langkah 5: Update Code
- [ ] Buka file: `lib/socialMediaData.ts`
- [ ] Update array `youtubeVideos`
- [ ] Save file

---

## 📊 ANALYTICS UPDATE

### [ ] Langkah 1: Update Follower Counts
- [ ] Instagram followers saat ini: `______`
- [ ] YouTube subscribers saat ini: `______`
- [ ] Buka: `lib/socialMediaConfig.ts`
- [ ] Update angka followers/subscribers
- [ ] Save file

### [ ] Langkah 2: Hitung Engagement

**Instagram:**
- [ ] Total Engagement = Sum of (Likes + Comments) semua post
- [ ] Calculation: `______ + ______ + ______ + ______ + ______ + ______ = ______`
- [ ] Engagement Rate = (Total Engagement / Followers) × 100
- [ ] Calculation: (`______` / `______`) × 100 = `______`%

**YouTube:**
- [ ] Total Views = Sum of views semua video
- [ ] Calculation: `______ + ______ + ______ + ______ = ______`

### [ ] Langkah 3: Tentukan Top Content

**Instagram:**
- [ ] Post dengan engagement tertinggi (Likes + Comments)
- [ ] Post title: `_________________________________________________`
- [ ] Total engagement: `______`

**YouTube:**
- [ ] Video dengan views tertinggi
- [ ] Video title: `_________________________________________________`
- [ ] Total views: `______`

### [ ] Langkah 4: Hitung Growth

**Instagram:**
- [ ] Followers bulan lalu: `______`
- [ ] Followers sekarang: `______`
- [ ] Growth = ((Sekarang - Bulan lalu) / Bulan lalu) × 100
- [ ] Calculation: ((`______` - `______`) / `______`) × 100 = `______`%
- [ ] Growth type: ☐ Up  ☐ Down

**YouTube:**
- [ ] Subscribers bulan lalu: `______`
- [ ] Subscribers sekarang: `______`
- [ ] Growth calculation: `______`%
- [ ] Growth type: ☐ Up  ☐ Down

### [ ] Langkah 5: Update Analytics Code
- [ ] Buka file: `lib/analyticsData.ts`
- [ ] Update Instagram data
- [ ] Update YouTube data
- [ ] Save file

---

## ✅ FINAL CHECKS

### [ ] Test Website
- [ ] Run: `npm run dev`
- [ ] Buka: http://localhost:3001/our-social-media
- [ ] Check semua gambar muncul
- [ ] Check semua angka benar
- [ ] Check analytics dashboard
- [ ] Test responsive (mobile/tablet/desktop)

### [ ] Optimize Images (Jika Perlu)
- [ ] Check ukuran file (target: < 200KB)
- [ ] Jika terlalu besar, compress di: https://tinypng.com
- [ ] Re-upload yang sudah di-compress

### [ ] Commit & Deploy
- [ ] Git add semua perubahan
- [ ] Git commit dengan message deskriptif
- [ ] Push ke repository
- [ ] Deploy jika diperlukan

---

## 📅 SCHEDULE UPDATE

**Weekly (Setiap Minggu):**
- [ ] Update likes/comments Instagram
- [ ] Update views YouTube
- [ ] Update follower counts

**Monthly (Setiap Bulan):**
- [ ] Tambah konten baru (post/video baru)
- [ ] Hitung ulang analytics
- [ ] Update top content
- [ ] Archive konten lama jika perlu

**Setiap Ada Post/Video Baru:**
- [ ] Segera tambahkan ke preview
- [ ] Update analytics
- [ ] Set pinned jika penting

---

**Last Updated**: ___/___/______
**Updated By**: ________________

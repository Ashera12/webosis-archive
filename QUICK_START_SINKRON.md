# 🚀 QUICK START: Sinkronkan Konten dengan Akun Real

Panduan singkat untuk update konten social media website agar sinkron dengan akun asli.

## 📸 Instagram (5 Menit)

1. **Buka Instagram** https://www.instagram.com/osissmkinformatika_fi
2. **Pilih 6 post terbaik** (terbaru/terpopuler)
3. **Download setiap foto**:
   - Klik kanan → Save image
   - Simpan ke: `public/images/social-media/instagram/`
   - Nama file: `mpls-2024.jpg`, `workshop.jpg`, dll
4. **Catat data**:
   - Caption, likes, comments, tanggal
5. **Update code** di `lib/socialMediaData.ts`:
   ```typescript
   export const instagramPosts = [
     {
       imageUrl: '/images/social-media/instagram/mpls-2024.jpg',
       caption: 'Caption asli dari Instagram',
       likes: 245,
       comments: 32,
       date: '2024-07-15',
       isPinned: true,
     },
     // ... 5 post lainnya
   ];
   ```

## 🎥 YouTube (5 Menit)

### Cara Cepat - Otomatis:

1. **Ambil Video IDs** dari URL YouTube:
   - URL: `https://youtube.com/watch?v=ABC123`
   - ID: `ABC123` (setelah `v=`)

2. **Edit file** `scripts/downloadYoutubeThumbnails.js`:
   ```javascript
   const YOUTUBE_VIDEOS = [
     { id: 'ABC123', filename: 'mpls-2024.jpg', title: 'MPLS 2024' },
     { id: 'DEF456', filename: 'workshop.jpg', title: 'Workshop' },
     // ... video lainnya
   ];
   ```

3. **Run script**:
   ```bash
   node scripts/downloadYoutubeThumbnails.js
   ```
   Thumbnails otomatis download ke `public/images/social-media/youtube/`

4. **Update code** di `lib/socialMediaData.ts`:
   ```typescript
   export const youtubeVideos = [
     {
       thumbnail: '/images/social-media/youtube/mpls-2024.jpg',
       title: 'Dokumentasi MPLS 2024',
       views: 1543,
       duration: '8:45',
       uploadDate: '2024-07-16',
       isPinned: true,
     },
     // ... 3-5 video lainnya
   ];
   ```

### Cara Manual:

1. Download thumbnail: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
2. Save ke `public/images/social-media/youtube/`
3. Update code seperti di atas

## 📊 Analytics (2 Menit)

1. **Update follower counts** di `lib/socialMediaConfig.ts`:
   ```typescript
   instagram: { followers: 500 }, // Cek di Instagram
   youtube: { subscribers: 0 },   // Cek di YouTube
   ```

2. **Hitung engagement** di `lib/analyticsData.ts`:
   ```typescript
   {
     platform: 'Instagram',
     currentFollowers: 500,
     totalEngagement: 3421, // Sum of (likes + comments) semua post
     avgEngagementRate: 6.8, // (3421 / 500) * 100
     topContent: {
       title: 'Post dengan likes tertinggi',
       engagement: 357, // likes + comments post itu
     },
   }
   ```

## ✅ Test (1 Menit)

```bash
npm run dev
```

Buka: http://localhost:3001/our-social-media

Check:
- ✅ Semua gambar muncul
- ✅ Data akurat (likes, views, dll)
- ✅ Analytics benar

## 📁 File Structure

```
public/images/social-media/
├── instagram/
│   ├── mpls-2024.jpg
│   ├── workshop.jpg
│   └── ...
├── youtube/
│   ├── mpls-2024.jpg
│   ├── tutorial.jpg
│   └── ...
```

## 🔧 Tools

- **TinyPNG**: https://tinypng.com (compress images)
- **BIRME**: https://www.birme.net (resize images)

## 📋 Files to Edit

1. `lib/socialMediaData.ts` - Konten (posts, videos)
2. `lib/socialMediaConfig.ts` - Follower counts
3. `lib/analyticsData.ts` - Analytics metrics

## 📞 Help

- **Full Guide**: Baca `CARA_SINKRON_KONTEN.md`
- **Checklist**: Baca `CHECKLIST_UPDATE_KONTEN.md`
- **Template**: Lihat `lib/contentManager.ts`

---

**Update Schedule:**
- Weekly: Update likes/views/followers
- Monthly: Add new content, recalculate analytics

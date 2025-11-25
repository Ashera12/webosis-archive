# 📱 Social Media Content Sync System

Sistem lengkap untuk menyinkronkan konten preview social media di website dengan akun real Instagram dan YouTube.

## 🎯 Overview

Website sekarang memiliki section preview untuk menampilkan:
- **Instagram Posts** (6 foto terbaru/terpopuler)
- **YouTube Videos** (4-6 video dengan thumbnails)
- **Analytics Dashboard** (followers, engagement, growth metrics)
- **Spotify & TikTok** (ready untuk diaktifkan)

## 📚 Dokumentasi

Pilih sesuai kebutuhan:

### 🚀 **QUICK_START_SINKRON.md** ← Mulai di sini!
Panduan singkat 15 menit untuk update konten.
- Instagram: 5 menit
- YouTube: 5 menit (otomatis)
- Analytics: 2 menit
- Test: 1 menit

### 📖 **CARA_SINKRON_KONTEN.md**
Panduan lengkap detail dengan:
- Step-by-step untuk setiap platform
- Tools & resources
- Image optimization tips
- Troubleshooting

### ✅ **CHECKLIST_UPDATE_KONTEN.md**
Checklist printable untuk tracking update.
Form isian untuk catat data saat update.

### 💻 **lib/contentManager.ts**
Template code dengan calculator untuk:
- Instagram posts template
- YouTube videos template
- Analytics auto-calculator
- Helper functions

## 🛠️ Tools Tersedia

### 1. YouTube Thumbnail Downloader
**File**: `scripts/downloadYoutubeThumbnails.js`

**Cara Pakai**:
```bash
# 1. Edit file, tambahkan Video IDs
# 2. Run script
node scripts/downloadYoutubeThumbnails.js

# Thumbnails otomatis download ke:
# public/images/social-media/youtube/
```

### 2. Content Manager Template
**File**: `lib/contentManager.ts`

Template siap pakai untuk:
- Format data Instagram posts
- Format data YouTube videos
- Analytics calculator
- Quick copy-paste ke file asli

## 📁 Struktur Files

```
webosis-archive/
├── lib/
│   ├── socialMediaData.ts      # ← Update konten di sini
│   ├── socialMediaConfig.ts    # ← Update followers di sini
│   ├── analyticsData.ts        # ← Update analytics di sini
│   └── contentManager.ts       # Template helper
├── scripts/
│   └── downloadYoutubeThumbnails.js  # Auto download thumbnails
├── public/images/social-media/
│   ├── instagram/             # Upload foto Instagram di sini
│   ├── youtube/               # Upload/auto-download thumbnails di sini
│   ├── spotify/               # (Future)
│   └── tiktok/                # (Future)
├── components/
│   ├── InstagramPreview.tsx   # Preview component
│   ├── YouTubePreview.tsx     # Preview component
│   ├── SpotifyPreview.tsx     # Preview component
│   ├── TikTokPreview.tsx      # Preview component
│   └── SocialMediaAnalytics.tsx  # Analytics dashboard
└── docs/
    ├── QUICK_START_SINKRON.md
    ├── CARA_SINKRON_KONTEN.md
    └── CHECKLIST_UPDATE_KONTEN.md
```

## 🔄 Workflow Sederhana

### First Time Setup (Sinkron Pertama Kali):

1. **Baca**: `QUICK_START_SINKRON.md`
2. **Download**: Foto Instagram + Thumbnails YouTube
3. **Upload**: Ke folder `public/images/social-media/`
4. **Update**: Files di `lib/`
5. **Test**: `npm run dev`

### Update Rutin:

**Weekly** (10 menit):
- Update likes/comments/views
- Update follower counts
- Save & deploy

**Monthly** (30 menit):
- Tambah konten baru
- Recalculate analytics
- Update top content
- Archive konten lama

## 🎯 Files yang Perlu Di-Update

### 1. Konten (lib/socialMediaData.ts)
```typescript
export const instagramPosts = [ ... ];  // 6 posts
export const youtubeVideos = [ ... ];   // 4-6 videos
```

### 2. Follower Counts (lib/socialMediaConfig.ts)
```typescript
instagram: { followers: 500 },
youtube: { subscribers: 0 },
```

### 3. Analytics (lib/analyticsData.ts)
```typescript
export const analyticsData = [
  { platform: 'Instagram', ... },
  { platform: 'YouTube', ... },
];
```

## 📊 Components Created

### Preview Components:
- `InstagramPreview.tsx` - Grid layout, hover effects, engagement stats
- `YouTubePreview.tsx` - Video thumbnails, play overlay, view counts
- `SpotifyPreview.tsx` - Podcast/playlist cards (ready)
- `TikTokPreview.tsx` - Vertical video grid (ready)

### Analytics:
- `SocialMediaAnalytics.tsx` - Dashboard with metrics, growth indicators, top content

## 🎨 Features

✅ **Modern Design**:
- Platform-specific brand colors
- Smooth animations
- Responsive (mobile/tablet/desktop)
- Dark mode support

✅ **Smart Layout**:
- Instagram: 3-column grid
- YouTube: 2-column grid with 16:9 thumbnails
- TikTok: 5-column compact grid (9:16 vertical)
- Spotify: 3-column with cover art

✅ **Interactive**:
- Hover effects
- Pinned badges
- Engagement metrics overlay
- Click to view full content

## 🚀 Quick Commands

```bash
# Start dev server
npm run dev

# Download YouTube thumbnails
node scripts/downloadYoutubeThumbnails.js

# Check for errors
npm run build
```

## 📞 Support

**Pertanyaan?**
1. Check `CARA_SINKRON_KONTEN.md` untuk detail
2. Lihat `CHECKLIST_UPDATE_KONTEN.md` untuk checklist
3. Gunakan `lib/contentManager.ts` sebagai template

**Issues?**
- Gambar tidak muncul → Check path & nama file
- Data tidak update → Restart dev server
- Image terlalu besar → Compress di TinyPNG

## 📈 Example Data

Semua file sudah include sample data untuk referensi:
- 6 Instagram posts dengan placeholder images
- 4 YouTube videos dengan placeholder thumbnails
- Analytics data untuk Instagram & YouTube
- Ready untuk Spotify & TikTok (tinggal aktivasi)

## 🎯 Next Steps

1. ✅ **Read**: `QUICK_START_SINKRON.md`
2. ✅ **Collect**: Data dari Instagram & YouTube
3. ✅ **Download**: Gambar & thumbnails
4. ✅ **Update**: Code dengan data real
5. ✅ **Test**: Preview di browser
6. ✅ **Deploy**: Push to production

---

Made with ❤️ for OSIS SMK Informatika Fithrah Insani

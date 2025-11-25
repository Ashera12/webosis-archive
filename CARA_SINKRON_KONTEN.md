# 📱 Panduan Update Konten Social Media - Sinkron dengan Akun Real

Panduan lengkap untuk mengupdate konten preview social media agar sinkron dengan post/video asli di akun.

## 🎯 Instagram - @osissmkinformatika_fi

### Langkah 1: Buka Akun Instagram
1. Buka https://www.instagram.com/osissmkinformatika_fi
2. Login jika diperlukan
3. Scroll ke grid post (foto-foto)

### Langkah 2: Pilih 6 Post Terbaru/Terpopuler
Pilih post berdasarkan:
- **Post terbaru** (untuk update terkini), atau
- **Post dengan likes terbanyak** (untuk konten populer)
- **Post penting yang di-pin** (misalnya: MPLS, event besar)

### Langkah 3: Untuk Setiap Post, Catat:

**Post 1:**
- **Link Post**: Klik post → Copy URL dari browser
  - Contoh: `https://www.instagram.com/p/ABC123/`
- **Caption**: Copy caption dari post
- **Jumlah Likes**: Lihat angka likes di bawah foto
- **Jumlah Comments**: Lihat angka comments
- **Tanggal**: Lihat tanggal post

**Download Gambar:**
1. Buka post di Instagram
2. Klik kanan pada foto → "Save image as..."
3. Simpan dengan nama deskriptif: `mpls-2024.jpg`, `workshop-coding.jpg`, dll.
4. Pindahkan ke folder: `public/images/social-media/instagram/`

### Langkah 4: Update Data di Code

Buka file: `lib/socialMediaData.ts`

```typescript
export const instagramPosts: InstagramPost[] = [
  {
    id: '1',
    imageUrl: '/images/social-media/instagram/mpls-2024.jpg', // ← Ganti dengan nama file yang diupload
    caption: 'Caption asli dari Instagram di sini', // ← Copy paste caption asli
    likes: 245, // ← Angka likes asli
    comments: 32, // ← Angka comments asli
    date: '2024-07-15', // ← Tanggal asli (format YYYY-MM-DD)
    isPinned: true, // ← true jika post penting
  },
  // Ulangi untuk post 2-6
];
```

---

## 🎥 YouTube - @osissmkinformatikafithrahi6947

### Langkah 1: Buka Channel YouTube
1. Buka https://youtube.com/@osissmkinformatikafithrahi6947
2. Klik tab **"Videos"**
3. Lihat semua video yang sudah diupload

### Langkah 2: Pilih 4-6 Video Terbaru/Terpopuler

### Langkah 3: Untuk Setiap Video, Catat:

**Video 1:**
- **Link Video**: Copy URL video
  - Contoh: `https://youtube.com/watch?v=ABC123`
- **Judul**: Copy judul video
- **Views**: Lihat jumlah views
- **Durasi**: Lihat durasi video (MM:SS)
- **Upload Date**: Lihat tanggal upload

**Download Thumbnail:**

**Cara Otomatis (Mudah):**
1. Copy ID video dari URL
   - Dari `https://youtube.com/watch?v=dQw4w9WgXcQ`
   - ID-nya: `dQw4w9WgXcQ`
2. Buka URL ini di browser:
   ```
   https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
   ```
   Ganti `VIDEO_ID` dengan ID video kamu
3. Klik kanan → Save image as...
4. Simpan ke: `public/images/social-media/youtube/`

**Cara Manual:**
1. Buka video di YouTube
2. Screenshot thumbnail video
3. Crop dan resize ke 1280x720px
4. Simpan ke: `public/images/social-media/youtube/`

### Langkah 4: Update Data di Code

Buka file: `lib/socialMediaData.ts`

```typescript
export const youtubeVideos: YouTubeVideo[] = [
  {
    id: '1',
    thumbnail: '/images/social-media/youtube/mpls-2024.jpg', // ← Nama file thumbnail
    title: 'Dokumentasi MPLS 2024 - SMK Informatika', // ← Judul asli dari YouTube
    views: 1543, // ← Jumlah views asli
    duration: '8:45', // ← Durasi asli (MM:SS)
    uploadDate: '2024-07-16', // ← Tanggal upload (YYYY-MM-DD)
    isPinned: true, // ← true untuk video penting
  },
  // Ulangi untuk video 2-4
];
```

---

## 🎵 Spotify (Jika Sudah Aktif)

### Langkah 1: Buka Spotify for Podcasters
1. Login ke Spotify for Podcasters
2. Lihat podcast/playlist yang sudah dibuat

### Langkah 2: Download Cover Art
1. Klik podcast/playlist
2. Download cover art
3. Simpan ke: `public/images/social-media/spotify/`

### Langkah 3: Update Data
```typescript
export const spotifyContent: SpotifyContent[] = [
  {
    id: '1',
    title: 'OSIS Talk: Tips Sukses di Sekolah', // ← Judul asli
    type: 'podcast', // ← 'podcast' atau 'playlist'
    coverUrl: '/images/social-media/spotify/osis-talk.jpg',
    description: 'Deskripsi asli dari Spotify',
    episodesOrTracks: 5, // ← Jumlah episode/lagu
    totalDuration: '2h 30m',
    isPinned: true,
  },
];
```

---

## 📱 TikTok (Jika Sudah Aktif)

### Langkah 1: Buka Profil TikTok
1. Buka profil TikTok OSIS
2. Scroll video-video yang sudah diupload

### Langkah 2: Download Video Thumbnails
**Cara 1 - Screenshot:**
1. Buka video di TikTok
2. Screenshot frame pertama/terbaik
3. Crop ke format vertical (9:16)
4. Simpan ke: `public/images/social-media/tiktok/`

**Cara 2 - TikTok Downloader:**
1. Copy link video TikTok
2. Paste di https://snaptik.app atau https://tikmate.app
3. Download thumbnail/video
4. Extract thumbnail dari video
5. Simpan ke folder

### Langkah 3: Update Data
```typescript
export const tiktokVideos: TikTokVideo[] = [
  {
    id: '1',
    thumbnail: '/images/social-media/tiktok/day-in-life.jpg',
    title: 'Day in the life OSIS SMK Informatika! ✨', // ← Caption asli
    likes: 5420, // ← Likes asli
    comments: 234, // ← Comments asli
    shares: 156, // ← Shares asli
    views: 15300, // ← Views asli
    isPinned: true,
  },
];
```

---

## 📊 Update Analytics Data

Setelah update konten, update juga analytics di `lib/analyticsData.ts`:

### Hitung Total Engagement
```
Total Engagement Instagram = Sum of (likes + comments) dari semua post
Total Engagement YouTube = Sum of views dari semua video
```

### Hitung Engagement Rate
```
Engagement Rate = (Total Engagement / Total Followers) × 100
```

### Update Top Content
Pilih konten dengan engagement tertinggi sebagai "Top Content"

```typescript
export const analyticsData: PlatformAnalytics[] = [
  {
    platform: 'Instagram',
    currentFollowers: 500, // ← Update dari Instagram
    growth: 15.3, // ← Hitung: ((Current - Previous) / Previous) × 100
    totalEngagement: 3421, // ← Sum of all likes + comments
    avgEngagementRate: 6.8, // ← (Total Engagement / Followers) × 100
    topContent: {
      title: 'Lomba 17 Agustus...', // ← Post dengan engagement tertinggi
      engagement: 357, // ← Likes + comments post tersebut
    },
  },
];
```

---

## 🔄 Template Excel untuk Tracking

Buat spreadsheet untuk track data:

**Instagram Posts:**
| No | Image File | Caption | Likes | Comments | Date | Pinned |
|----|-----------|---------|-------|----------|------|--------|
| 1  | mpls.jpg  | MPLS... | 245   | 32       | 2024-07-15 | Yes |
| 2  | workshop.jpg | Workshop... | 189 | 24    | 2024-07-10 | No |

**YouTube Videos:**
| No | Thumbnail File | Title | Views | Duration | Date | Pinned |
|----|---------------|-------|-------|----------|------|--------|
| 1  | mpls.jpg     | MPLS Doc | 1543 | 8:45   | 2024-07-16 | Yes |

---

## 🎯 Checklist Update Rutin

### Weekly Update:
- [ ] Check Instagram: Update likes/comments post terbaru
- [ ] Check YouTube: Update views video terbaru
- [ ] Update follower count di `socialMediaConfig.ts`

### Monthly Update:
- [ ] Tambah post/video baru ke preview
- [ ] Hapus post/video lama (keep max 6-12)
- [ ] Hitung ulang analytics
- [ ] Update top content

### Setiap Post Baru:
- [ ] Download gambar/thumbnail
- [ ] Upload ke folder yang sesuai
- [ ] Tambahkan entry baru di `socialMediaData.ts`
- [ ] Set `isPinned: true` jika penting
- [ ] Test di browser

---

## 🛠️ Tools yang Membantu

### Download Instagram Photos:
- **InstaSave** (Browser extension)
- **DownloadGram** (Website)
- Manual: Inspect element → Find image URL → Download

### Download YouTube Thumbnails:
- URL Pattern: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
- **YouTube Thumbnail Downloader** (Website)

### Image Optimization:
- **TinyPNG** - https://tinypng.com
- **Squoosh** - https://squoosh.app
- Target: < 200KB per image

### Image Resize:
- **BIRME** - https://www.birme.net
- **ILoveIMG** - https://www.iloveimg.com/resize-image
- Sizes:
  - Instagram: 1080x1080px
  - YouTube: 1280x720px
  - Spotify: 640x640px
  - TikTok: 1080x1920px

---

## ❗ Troubleshooting

### Gambar Tidak Muncul?
1. ✅ Check file ada di folder `public/images/social-media/`
2. ✅ Check nama file match dengan yang di code (case-sensitive!)
3. ✅ Check format file: `.jpg`, `.png`, `.svg`
4. ✅ Clear browser cache (Ctrl + Shift + R)

### Data Tidak Update?
1. ✅ Pastikan sudah save file `socialMediaData.ts`
2. ✅ Restart dev server (`npm run dev`)
3. ✅ Check typo di code

### Image Terlalu Besar?
1. ✅ Compress dengan TinyPNG
2. ✅ Resize ke ukuran yang sesuai
3. ✅ Convert ke WebP jika perlu

---

## 📝 Format Tanggal

Gunakan format **YYYY-MM-DD** untuk konsistensi:
- ✅ Benar: `2024-07-15`
- ❌ Salah: `15-07-2024`, `15/07/2024`, `July 15, 2024`

---

## 🎨 Tips Konten

### Instagram:
- Pilih foto dengan kualitas bagus
- Mix antara event, daily activity, achievement
- Pin post penting (MPLS, lomba, achievement)

### YouTube:
- Pastikan thumbnail menarik
- Prioritaskan video dengan views tinggi
- Pin video dokumentasi event penting

---

**Last Updated**: November 10, 2025
**Maintained By**: Tim Web OSIS SMK Informatika

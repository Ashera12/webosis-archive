# Social Media Content Update Guide

Panduan lengkap untuk mengupdate konten preview social media dan analytics di website OSIS.

## 📋 Daftar Isi
1. [Update Instagram Posts](#update-instagram-posts)
2. [Update YouTube Videos](#update-youtube-videos)
3. [Update Spotify Content](#update-spotify-content)
4. [Update TikTok Videos](#update-tiktok-videos)
5. [Update Analytics Data](#update-analytics-data)
6. [Aktivasi Platform Baru](#aktivasi-platform-baru)

---

## 📸 Update Instagram Posts

### Lokasi File
`lib/socialMediaData.ts` - Bagian `instagramPosts`

### Cara Update

1. Buka file `lib/socialMediaData.ts`
2. Cari array `instagramPosts`
3. Update atau tambah postingan baru:

```typescript
export const instagramPosts: InstagramPost[] = [
  {
    id: '1', // ID unik untuk setiap post
    imageUrl: '/images/social-media/instagram/post1.jpg', // Path ke gambar
    caption: 'Caption post Instagram kamu di sini', // Caption post
    likes: 245, // Jumlah likes
    comments: 32, // Jumlah comments
    date: '2024-07-15', // Tanggal post (YYYY-MM-DD)
    isPinned: true, // Set true untuk post yang di-pin (opsional)
  },
  // Tambahkan post lainnya...
];
```

### Tips
- **Foto**: Simpan foto di folder `public/images/social-media/instagram/`
- **Pinned Post**: Maksimal 1-2 post yang di-pin
- **Urutan**: Post paling baru di atas
- **Jumlah**: Ideal 6-12 post untuk tampilan yang bagus

---

## 🎥 Update YouTube Videos

### Lokasi File
`lib/socialMediaData.ts` - Bagian `youtubeVideos`

### Cara Update

```typescript
export const youtubeVideos: YouTubeVideo[] = [
  {
    id: '1', // ID unik
    thumbnail: '/images/social-media/youtube/thumb1.jpg', // Thumbnail video
    title: 'Judul Video YouTube', // Judul video
    views: 1543, // Jumlah views
    duration: '8:45', // Durasi video (MM:SS)
    uploadDate: '2024-07-16', // Tanggal upload (YYYY-MM-DD)
    isPinned: true, // Video yang di-pin (opsional)
  },
  // Tambahkan video lainnya...
];
```

### Tips
- **Thumbnail**: Simpan di `public/images/social-media/youtube/`
- **Durasi**: Format MM:SS (contoh: "12:30")
- **Views**: Masukkan angka asli dari YouTube
- **Jumlah**: Ideal 4-8 video

### Cara Mendapatkan Data dari YouTube

1. **Views & Upload Date**:
   - Buka video di YouTube
   - Lihat di bawah video untuk jumlah views
   - Tanggal upload ada di deskripsi

2. **Thumbnail**:
   - Klik kanan pada video thumbnail
   - "Save image as..."
   - Atau gunakan URL: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`

---

## 🎵 Update Spotify Content

### Lokasi File
`lib/socialMediaData.ts` - Bagian `spotifyContent`

### Cara Update

```typescript
export const spotifyContent: SpotifyContent[] = [
  {
    id: '1',
    title: 'Judul Podcast/Playlist',
    type: 'podcast', // 'podcast' atau 'playlist'
    coverUrl: '/images/social-media/spotify/cover1.jpg', // Cover art
    description: 'Deskripsi singkat konten',
    episodesOrTracks: 5, // Jumlah episode (podcast) atau lagu (playlist)
    totalDuration: '2h 30m', // Total durasi (opsional)
    isPinned: true, // Konten yang di-pin (opsional)
  },
  // Tambahkan konten lainnya...
];
```

### Tips
- **Cover Art**: Simpan di `public/images/social-media/spotify/`
- **Type**: Gunakan 'podcast' untuk podcast, 'playlist' untuk playlist
- **Duration**: Format "Xh Xm" (contoh: "2h 30m")
- **Jumlah**: Ideal 3-6 konten

---

## 📱 Update TikTok Videos

### Lokasi File
`lib/socialMediaData.ts` - Bagian `tiktokVideos`

### Cara Update

```typescript
export const tiktokVideos: TikTokVideo[] = [
  {
    id: '1',
    thumbnail: '/images/social-media/tiktok/video1.jpg', // Thumbnail video
    title: 'Judul video TikTok singkat', // Caption singkat
    likes: 5420, // Jumlah likes
    comments: 234, // Jumlah comments
    shares: 156, // Jumlah shares
    views: 15300, // Jumlah views
    isPinned: true, // Video yang di-pin (opsional)
  },
  // Tambahkan video lainnya...
];
```

### Tips
- **Thumbnail**: Simpan di `public/images/social-media/tiktok/`
- **Jumlah**: TikTok bisa banyak, ideal 8-15 video
- **Engagement**: Update likes, comments, shares, views secara berkala
- **Format**: Thumbnail sebaiknya vertical (9:16 ratio)

---

## 📊 Update Analytics Data

### Lokasi File
`lib/analyticsData.ts` - Array `analyticsData`

### Cara Update

```typescript
export const analyticsData: PlatformAnalytics[] = [
  {
    platform: 'Instagram', // Nama platform
    icon: 'fab fa-instagram', // Icon FontAwesome
    currentFollowers: 500, // Jumlah followers saat ini
    growth: 15.3, // Persentase pertumbuhan (%)
    growthType: 'up', // 'up' untuk naik, 'down' untuk turun
    totalEngagement: 3421, // Total likes + comments + shares
    avgEngagementRate: 6.8, // Rata-rata engagement rate (%)
    topContent: {
      title: 'Judul konten paling populer', // Konten dengan engagement tertinggi
      engagement: 357, // Total engagement konten tersebut
    },
    color: 'text-pink-500', // Warna Tailwind
    gradient: 'from-pink-500 to-purple-600', // Gradient Tailwind
  },
  // Platform lainnya...
];
```

### Cara Menghitung Metrics

#### 1. **Follower Growth**
```
Growth % = ((Current Followers - Previous Followers) / Previous Followers) × 100
```
Contoh: (500 - 435) / 435 × 100 = 14.9%

#### 2. **Total Engagement**
```
Total Engagement = Total Likes + Total Comments + Total Shares
```
Hitung dari semua post dalam periode tertentu (misal 1 bulan terakhir)

#### 3. **Average Engagement Rate**
```
Avg Engagement Rate = (Total Engagement / Total Followers) × 100
```
Contoh: (3421 / 500) × 100 = 6.8%

### Update Schedule
- **Daily**: Tidak perlu
- **Weekly**: Update jumlah followers
- **Monthly**: Update semua metrics (growth, engagement, top content)

---

## 🚀 Aktivasi Platform Baru

### Mengaktifkan TikTok atau Spotify

#### 1. Update Config (`lib/socialMediaConfig.ts`)

```typescript
export const SOCIAL_MEDIA_CONFIG = {
  // ...
  tiktok: {
    url: 'https://www.tiktok.com/@username_kamu', // Ganti dengan URL asli
    followers: 0, // Update dengan jumlah followers
    targetFollowers: 1000,
    isActive: true, // Ubah dari false ke true
  },
  // ...
};
```

#### 2. Uncomment Analytics Data (`lib/analyticsData.ts`)

Cari bagian yang di-comment (//):

```typescript
// Uncomment when TikTok becomes active
{
  platform: 'TikTok',
  icon: 'fab fa-tiktok',
  currentFollowers: 0, // Update dengan data asli
  growth: 0,
  // ... dst
}
```

Hapus comment marks (//) di depan setiap baris.

#### 3. Tambahkan Content Data (`lib/socialMediaData.ts`)

Sudah ada sample data, tinggal update dengan konten asli.

---

## 📁 Struktur Folder Images

Untuk organisasi yang rapi, buat folder structure seperti ini:

```
public/
└── images/
    └── social-media/
        ├── instagram/
        │   ├── post1.jpg
        │   ├── post2.jpg
        │   └── ...
        ├── youtube/
        │   ├── thumb1.jpg
        │   ├── thumb2.jpg
        │   └── ...
        ├── spotify/
        │   ├── cover1.jpg
        │   └── ...
        └── tiktok/
            ├── video1.jpg
            └── ...
```

---

## 🔄 Workflow Update Rutin

### Setiap Minggu
1. Check Instagram: Update jumlah likes/comments post terbaru
2. Check YouTube: Update views video terbaru
3. Update follower counts di `socialMediaConfig.ts`

### Setiap Bulan
1. Hitung analytics metrics (growth, engagement rate)
2. Update `analyticsData.ts`
3. Tentukan top content bulan ini
4. Archive post lama jika sudah terlalu banyak (keep max 12 per platform)

### Setiap Post Baru
1. Tambahkan ke array yang sesuai di `socialMediaData.ts`
2. Upload image ke folder yang sesuai
3. Set `isPinned: true` jika post penting

---

## 🎨 Tips Design

### Image Optimization
- **Instagram Posts**: 1080x1080px (square), format JPG/PNG
- **YouTube Thumbnails**: 1280x720px (16:9), format JPG
- **Spotify Covers**: 640x640px (square), format JPG/PNG
- **TikTok Thumbnails**: 1080x1920px (9:16), format JPG

### Compress Images
Gunakan tools online seperti:
- TinyPNG (https://tinypng.com)
- Squoosh (https://squoosh.app)

Target size: < 200KB per image

---

## ❓ Troubleshooting

### Preview Tidak Muncul?
- Pastikan platform `isActive: true` di `socialMediaConfig.ts`
- Check apakah ada data di array yang sesuai
- Lihat console browser untuk error

### Image Tidak Load?
- Check path image apakah benar
- Pastikan file exists di folder `public/`
- File name case-sensitive (post1.jpg ≠ Post1.jpg)

### Data Tidak Update?
- Clear browser cache (Ctrl+Shift+R)
- Restart development server
- Check apakah perubahan sudah di-save

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check file ini dulu
2. Check SOCIAL_MEDIA_UPDATE_GUIDE.md untuk update follower counts
3. Tanya ke developer team

---

**Last Updated**: December 2024
**Version**: 1.0

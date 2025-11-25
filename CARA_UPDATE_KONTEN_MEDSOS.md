# 📱 Cara Update Konten Media Sosial OSIS

## 🎯 File yang Perlu Diubah

Buka file: `lib/socialMediaData.ts`

---

## 📸 Instagram Posts

### Cara Ambil Data dari Instagram:

1. **Buka Instagram OSIS**: https://www.instagram.com/osissmkinformatika_fi
2. **Pilih post yang mau ditampilkan** (maksimal 6 post)
3. **Untuk setiap post:**

   - **URL Post**: Klik post → Copy URL dari browser
   - **Gambar**: Klik kanan foto → "Copy image address" ATAU download foto lalu upload ke `public/images/social-media/instagram/`
   - **Caption**: Copy caption dari post
   - **Likes & Comments**: Lihat jumlahnya

### Edit di File:

```typescript
export const instagramPosts: InstagramPost[] = [
  {
    id: '1',
    imageUrl: 'URL_GAMBAR_ATAU_PATH', // Contoh: '/images/social-media/instagram/post1.jpg'
    caption: 'TULIS_CAPTION_DISINI',
    likes: 245, // Ganti dengan jumlah likes asli
    comments: 32, // Ganti dengan jumlah comments asli
    date: '2024-07-15', // Format: YYYY-MM-DD
    isPinned: true, // true = ada badge "PINNED"
    url: 'https://www.instagram.com/p/KODE_POST/', // URL post Instagram
  },
  // ... tambah post lainnya
];
```

---

## 🎥 YouTube Videos

### Cara Ambil Data dari YouTube:

1. **Buka Channel YouTube OSIS** (jika ada)
2. **Pilih video yang mau ditampilkan** (maksimal 4-6 video)
3. **Untuk setiap video:**

   - **URL Video**: Copy dari address bar (contoh: `https://www.youtube.com/watch?v=ABC123`)
   - **Thumbnail**: Otomatis dari YouTube ATAU upload ke `public/images/social-media/youtube/`
   - **Title**: Copy judul video
   - **Views, Likes, Comments**: Lihat di video

### Edit di File:

```typescript
export const youtubeVideos: YouTubeVideo[] = [
  {
    id: '1',
    thumbnail: 'https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg', // Auto dari YouTube
    // ATAU: '/images/social-media/youtube/thumb1.jpg' (jika upload manual)
    title: 'JUDUL_VIDEO',
    views: 1542,
    duration: '10:24', // Durasi video
    uploadDate: '2024-07-16',
    isPinned: true,
    url: 'https://www.youtube.com/watch?v=VIDEO_ID', // URL lengkap
    likes: 89,
    comments: 12,
    description: 'Deskripsi video...',
  },
  // ... tambah video lainnya
];
```

**Tips YouTube Thumbnail:**
- Untuk auto-thumbnail dari YouTube, format URL: `https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg`
- Ganti `VIDEO_ID` dengan ID dari URL video (bagian setelah `watch?v=`)

---

## 🎵 Spotify Podcast/Playlist

### Cara Ambil Data dari Spotify:

1. **Buka Spotify** (jika punya podcast/playlist OSIS)
2. **Pilih episode/playlist**
3. **Klik kanan → Share → Copy link**

### Edit di File:

```typescript
export const spotifyContent: SpotifyContent[] = [
  {
    id: '1',
    title: 'NAMA_PODCAST_ATAU_PLAYLIST',
    type: 'podcast', // atau 'playlist'
    coverUrl: 'URL_COVER_ART', // Upload ke public/images/social-media/spotify/
    description: 'Deskripsi singkat...',
    episodesOrTracks: 5, // Jumlah episode/lagu
    totalDuration: '2h 30m',
    isPinned: true,
    url: 'https://open.spotify.com/episode/SPOTIFY_ID', // URL dari Spotify
  },
];
```

---

## 📱 TikTok Videos

### Edit di File:

```typescript
export const tiktokVideos: TikTokVideo[] = [
  {
    id: '1',
    thumbnail: 'URL_THUMBNAIL', // Upload ke public/images/social-media/tiktok/
    title: 'JUDUL_TIKTOK',
    likes: 5420,
    comments: 234,
    shares: 156,
    views: 15300,
    isPinned: true,
    url: 'https://www.tiktok.com/@username/video/VIDEO_ID', // (opsional)
  },
];
```

---

## 🖼️ Cara Upload Gambar/Thumbnail

### Opsi 1: Upload File Lokal (Recommended)

1. **Simpan gambar** ke folder:
   - Instagram: `public/images/social-media/instagram/`
   - YouTube: `public/images/social-media/youtube/`
   - Spotify: `public/images/social-media/spotify/`
   - TikTok: `public/images/social-media/tiktok/`

2. **Nama file**: Beri nama yang jelas, contoh:
   - `mpls-2024.jpg`
   - `workshop-coding.jpg`
   - `lomba-17an.jpg`

3. **Di kode, tulis path**:
   ```typescript
   imageUrl: '/images/social-media/instagram/mpls-2024.jpg'
   ```

### Opsi 2: Pakai URL Eksternal

Langsung copy URL gambar dari internet:
```typescript
imageUrl: 'https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg'
```

---

## ⚡ Quick Steps

### Update Instagram Posts (5 menit):

1. Buka Instagram OSIS
2. Screenshot/download 6 foto terbaru
3. Upload ke `public/images/social-media/instagram/`
4. Copy caption, likes, comments
5. Update `lib/socialMediaData.ts`
6. Refresh website

### Update YouTube Videos (5 menit):

1. Buka YouTube Channel (jika ada)
2. Copy 4-6 URL video terbaru
3. Ganti VIDEO_ID di thumbnail URL
4. Copy title, views, likes
5. Update `lib/socialMediaData.ts`
6. Refresh website

---

## 📝 Contoh Lengkap Real Data

```typescript
// CONTOH: Data dari Instagram OSIS yang sebenarnya
{
  id: '1',
  imageUrl: '/images/social-media/instagram/mpls-2024.jpg', // Upload foto ke folder ini
  caption: 'Kegiatan MPLS 2024 - Sambutan hangat untuk siswa baru SMK Informatika! 🎉 #MPLS2024 #SMKInformatika',
  likes: 156, // Lihat di Instagram
  comments: 23, // Lihat di Instagram
  date: '2024-07-15', // Tanggal post
  isPinned: true,
  url: 'https://www.instagram.com/p/C9XXXXX/', // Copy dari browser saat buka post
}
```

---

## 🔄 Setelah Update

1. **Simpan file** `lib/socialMediaData.ts`
2. **Refresh browser** (Ctrl + F5)
3. **Cek hasilnya** di halaman Media Sosial
4. **Video harus bisa diputar** (untuk YouTube/Spotify)

---

## ❓ Troubleshooting

### Video YouTube tidak muncul?
- Pastikan URL format: `https://www.youtube.com/watch?v=VIDEO_ID`
- Cek video bisa di-embed (bukan video private/restricted)

### Gambar tidak muncul?
- Cek path benar: `/images/social-media/platform/namafile.jpg`
- Pastikan file ada di folder `public/images/social-media/`
- Nama file tidak boleh ada spasi (gunakan `-` atau `_`)

### Spotify tidak play?
- Pastikan URL dari Spotify valid
- Format: `https://open.spotify.com/episode/ID` atau `/playlist/ID`

---

## 📞 Need Help?

Jika ada masalah, cek:
1. File path benar
2. URL valid (bisa dibuka di browser)
3. Format data sesuai contoh
4. Tidak ada typo di kode

**Happy updating! 🚀**

# Social Media Preview Modal - User Guide

## 📌 Overview
Sistem preview modal interaktif yang memungkinkan pengunjung website untuk:
- Melihat preview konten sosial media dalam ukuran besar
- Memutar video YouTube langsung di website
- Mendengarkan musik/podcast Spotify embedded
- Quick link ke platform sosial media asli
- Navigasi mudah dengan keyboard (ESC untuk menutup)

## 🎯 Fitur Utama

### 1. **Instagram Preview Modal**
- **Klik preview** → Tampil gambar besar
- **Statistik lengkap**: Likes, Comments
- **Caption penuh** dengan format yang rapi
- **Quick Link**: Tombol "Open in Instagram" ke post asli

### 2. **YouTube Preview Modal**
- **Klik preview** → Video player embedded
- **Auto-play ready**: Video langsung bisa diputar
- **Statistik**: Views, Likes, Comments
- **Deskripsi video** lengkap dengan tanggal upload
- **Quick Link**: Tombol "Open in YouTube"

### 3. **Spotify Preview Modal**
- **Klik preview** → Spotify player embedded
- **Auto-play**: Musik/Podcast bisa langsung didengar
- **Info lengkap**: Jumlah episode/track, total durasi
- **Quick Link**: Tombol "Open in Spotify"

### 4. **TikTok Preview Modal**
- **Klik preview** → Thumbnail besar dengan stats
- **Statistik**: Likes, Comments, Shares, Views
- **Quick Link**: Tombol "Open in TikTok"

## 🚀 Cara Penggunaan

### Untuk Pengunjung Website:
1. **Buka halaman** `/our-social-media`
2. **Klik pada preview** konten sosial media yang ingin dilihat
3. **Modal akan muncul** dengan animasi smooth
4. **Interaksi**:
   - Klik `X` atau tombol close untuk menutup
   - Tekan `ESC` pada keyboard untuk menutup
   - Klik area gelap di luar modal untuk menutup
5. **Quick Link**: Klik tombol "Open in [Platform]" untuk buka di platform asli

### Untuk Admin/Developer:

#### Menambahkan URL ke Konten

Edit file `lib/socialMediaData.ts`:

**Instagram:**
```typescript
{
  id: '1',
  imageUrl: '/images/social-media/instagram/post-1.jpg',
  caption: 'Caption post Instagram...',
  likes: 245,
  comments: 32,
  date: '2024-07-15',
  url: 'https://www.instagram.com/p/ABC123xyz/', // ← Tambahkan URL post asli
}
```

**YouTube:**
```typescript
{
  id: '1',
  thumbnail: '/images/social-media/youtube/video-1.jpg',
  title: 'Judul Video',
  views: 1542,
  duration: '10:24',
  uploadDate: '2024-07-16',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // ← URL YouTube
  likes: 89,
  comments: 12,
  description: 'Deskripsi video lengkap...',
}
```

**Spotify:**
```typescript
{
  id: '1',
  title: 'Nama Podcast/Playlist',
  type: 'podcast', // atau 'playlist'
  coverUrl: '/images/social-media/spotify/cover-1.jpg',
  description: 'Deskripsi...',
  episodesOrTracks: 5,
  url: 'https://open.spotify.com/episode/ABC123', // ← URL Spotify
}
```

**TikTok:**
```typescript
{
  id: '1',
  thumbnail: '/images/social-media/tiktok/video-1.jpg',
  title: 'Judul TikTok',
  likes: 1250,
  comments: 45,
  shares: 23,
  views: 5420,
  url: 'https://www.tiktok.com/@username/video/1234567890', // ← URL TikTok
}
```

## 🎨 Fitur Desain

### Animasi
- **Modal muncul**: Fade in + Scale in dengan efek smooth
- **Background blur**: Backdrop blur untuk fokus pada konten
- **Hover effects**: Tombol close dan quick link responsif

### Responsive
- **Mobile**: Modal menyesuaikan dengan layar kecil
- **Tablet**: Layout optimal untuk layar medium
- **Desktop**: Preview besar dengan detail lengkap

### Dark Mode
- **Auto-adjust**: Warna modal menyesuaikan tema (light/dark)
- **Contrast optimal**: Text tetap mudah dibaca di semua tema

## 🔧 Konfigurasi Platform

### Aktivasi/Deaktivasi Quick Link

Edit file `lib/socialMediaConfig.ts`:

```typescript
export const socialMediaConfig = {
  instagram: {
    isActive: true,
    url: 'https://www.instagram.com/osissmkinformatika_fi',
  },
  youtube: {
    isActive: true,
    url: 'https://www.youtube.com/@OSISSMKFithrahInsani',
  },
  // ...
}
```

**Jika `url` kosong atau `#`:**
- Quick link button **tidak akan muncul** di modal
- Modal tetap bisa dibuka, tapi tanpa tombol external link

## 📝 Tips & Best Practices

### 1. **URL YouTube untuk Embedded Player**
- Gunakan format: `https://www.youtube.com/watch?v=VIDEO_ID`
- Modal akan otomatis extract Video ID
- Video langsung bisa diputar di dalam website

### 2. **URL Spotify untuk Embedded Player**
- Format episode: `https://open.spotify.com/episode/EPISODE_ID`
- Format playlist: `https://open.spotify.com/playlist/PLAYLIST_ID`
- Player akan otomatis embedded dengan controls lengkap

### 3. **Optimasi Gambar**
- Instagram: Minimal 1080x1080px (square)
- YouTube Thumbnail: 1280x720px (16:9)
- Spotify Cover: 640x640px (square)
- TikTok: 1080x1920px (9:16)

### 4. **Performa**
- Modal hanya load ketika diklik (lazy loading)
- YouTube/Spotify player hanya load di modal
- Tidak memperlambat loading awal halaman

## 🐛 Troubleshooting

### Modal tidak muncul?
✅ Pastikan tidak ada error di console browser
✅ Check komponen `SocialMediaModal.tsx` ter-import dengan benar

### YouTube video tidak play?
✅ Pastikan URL valid dengan format `youtube.com/watch?v=...`
✅ Video harus bisa di-embed (tidak di-disable oleh uploader)

### Spotify tidak muncul?
✅ URL harus format `open.spotify.com/episode/...` atau `open.spotify.com/playlist/...`
✅ Content harus public (tidak private playlist)

### Quick link tidak muncul?
✅ Pastikan field `url` tidak kosong atau `#`
✅ URL harus valid (http/https)

## 🎯 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close modal |
| `Tab` | Navigate buttons |
| `Enter` | Click focused button |

## 📱 Browser Support

✅ Chrome/Edge (Latest)
✅ Firefox (Latest)  
✅ Safari (Latest)
✅ Mobile browsers (iOS/Android)

## 🔄 Future Updates

Rencana pengembangan:
- [ ] Swipe gestures di mobile
- [ ] Prev/Next navigation antar konten
- [ ] Share button untuk share konten
- [ ] Download button untuk gambar
- [ ] Zoom in/out untuk gambar Instagram
- [ ] Fullscreen mode untuk video
- [ ] Auto-rotate slideshow

## 💡 Contoh Implementasi Lengkap

Lihat file:
- `components/SocialMediaModal.tsx` - Modal component
- `components/InstagramPreview.tsx` - Instagram integration
- `components/YouTubePreview.tsx` - YouTube integration  
- `components/SpotifyPreview.tsx` - Spotify integration
- `components/TikTokPreview.tsx` - TikTok integration

---

**Dibuat:** November 2024  
**Last Update:** November 2024
**Version:** 1.0.0

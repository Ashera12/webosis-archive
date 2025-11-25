# 📱 Panduan Update Data Sosial Media

File ini berisi instruksi untuk mengupdate data followers/subscribers sosial media OSIS.

## 📍 Lokasi File Konfigurasi

**File utama:** `lib/socialMediaConfig.ts`

File ini berisi semua data sosial media yang ditampilkan di:
- Footer website
- Halaman "Our Social Media" (`/our-social-media`)
- Statistik media sosial

## 🔄 Cara Update Data

### 1. Instagram (@osissmkinformatika_fi)

```typescript
instagram: {
  username: '@osissmkinformatika_fi',
  url: 'https://www.instagram.com/osissmkinformatika_fi',
  followers: 500,        // ⬅️ UPDATE INI dengan jumlah followers real
  targetFollowers: 1000, // Target yang ingin dicapai
  isActive: true,        // true = akun aktif
}
```

**Cara cek followers Instagram:**
1. Buka https://www.instagram.com/osissmkinformatika_fi
2. Lihat jumlah followers
3. Update angka di `followers:`

---

### 2. YouTube (@osissmkinformatikafithrahi6947)

```typescript
youtube: {
  channelName: '@osissmkinformatikafithrahi6947',
  url: 'https://youtube.com/@osissmkinformatikafithrahi6947?si=07AlSn1yx3rA-_zr',
  subscribers: 0,           // ⬅️ UPDATE INI dengan jumlah subscribers real
  targetSubscribers: 500,   // Target yang ingin dicapai
  isActive: true,           // ⬅️ Set true jika sudah upload video
}
```

**Cara cek subscribers YouTube:**
1. Buka channel YouTube di link di atas
2. Lihat jumlah subscribers
3. Update angka di `subscribers:`
4. Set `isActive: true` jika channel sudah mulai posting video

---

### 3. TikTok (Belum Aktif)

```typescript
tiktok: {
  username: '',          // ⬅️ Tambahkan @username saat akun dibuat
  url: '#',              // ⬅️ Ganti dengan URL TikTok real
  followers: 0,          // Update followers saat akun aktif
  targetFollowers: 1000,
  isActive: false,       // ⬅️ Ganti true saat akun sudah ada
}
```

**Langkah aktivasi TikTok:**
1. Buat akun TikTok untuk OSIS
2. Update `username` dengan @username TikTok
3. Update `url` dengan link profil TikTok
4. Set `isActive: true`
5. Update `followers` dengan jumlah followers

---

### 4. Spotify (Belum Aktif)

```typescript
spotify: {
  username: '',          // ⬅️ Tambahkan username saat akun dibuat
  url: '#',              // ⬅️ Ganti dengan URL Spotify real
  followers: 0,          // Update followers saat akun aktif
  targetFollowers: 500,
  isActive: false,       // ⬅️ Ganti true saat akun sudah ada
}
```

**Langkah aktivasi Spotify:**
1. Buat akun Spotify for Podcasters
2. Update `username` dengan username Spotify
3. Update `url` dengan link profil/podcast
4. Set `isActive: true`
5. Update `followers` dengan jumlah followers

---

## 📊 Dampak Update

Setelah mengupdate file `socialMediaConfig.ts`, perubahan akan otomatis muncul di:

1. **Footer** - Icon sosial media di bagian bawah semua halaman
2. **Social Media Page** - Kartu dan statistik di halaman `/our-social-media`
3. **Availability Status** - Platform yang `isActive: false` akan menampilkan notifikasi "Link Not Active"

---

## ⚡ Contoh Update Lengkap

Misalnya Instagram sudah punya 750 followers dan YouTube 50 subscribers:

```typescript
export const SOCIAL_MEDIA_CONFIG = {
  instagram: {
    username: '@osissmkinformatika_fi',
    url: 'https://www.instagram.com/osissmkinformatika_fi',
    followers: 750,        // ⬅️ UPDATED dari 500
    targetFollowers: 1000,
    isActive: true,
  },
  
  youtube: {
    channelName: '@osissmkinformatikafithrahi6947',
    url: 'https://youtube.com/@osissmkinformatikafithrahi6947?si=07AlSn1yx3rA-_zr',
    subscribers: 50,       // ⬅️ UPDATED dari 0
    targetSubscribers: 500,
    isActive: true,        // ⬅️ UPDATED dari false (karena sudah upload video)
  },
  // ... TikTok dan Spotify tetap sama
};
```

---

## 🔍 Cara Test Perubahan

Setelah update:

1. Save file `socialMediaConfig.ts`
2. Refresh website
3. Cek halaman `/our-social-media`
4. Verifikasi angka followers/subscribers sudah berubah
5. Cek Footer - pastikan link sosmed yang aktif bisa diklik

---

## 📅 Rekomendasi Update

- **Mingguan**: Update followers Instagram & YouTube
- **Bulanan**: Update target followers/subscribers
- **Saat Launch**: Update TikTok/Spotify begitu akun dibuat

---

## ❓ Troubleshooting

**Q: Angka followers tidak berubah setelah update?**
- Clear cache browser (Ctrl + Shift + R)
- Pastikan file sudah di-save
- Restart development server jika sedang development

**Q: Link sosmed mengarah ke about:blank?**
- Pastikan `url` tidak kosong atau `#`
- Pastikan `isActive: true` untuk platform yang sudah aktif

**Q: Muncul notifikasi "Link Not Active" padahal link valid?**
- Set `isActive: true` di config
- Pastikan URL valid (bukan `#` atau kosong)

---

**Last Updated:** November 10, 2025
**Maintained by:** OSIS Web Team

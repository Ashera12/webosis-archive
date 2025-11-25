/**
 * Social Media Configuration
 * Update jumlah followers/subscribers di sini agar sinkron dengan data real
 * 
 * Last Updated: November 10, 2025
 */

export const SOCIAL_MEDIA_CONFIG = {
  instagram: {
    username: '@osissmkinformatika_fi',
    url: 'https://www.instagram.com/osissmkinformatika_fi',
    followers: 500, // TODO: Update dengan jumlah followers real
    targetFollowers: 1000,
    isActive: true,
  },
  
  youtube: {
    channelName: '@osissmkinformatikafithrahi6947',
    url: 'https://youtube.com/@osissmkinformatikafithrahi6947?si=07AlSn1yx3rA-_zr',
    subscribers: 0, // TODO: Update dengan jumlah subscribers real
    targetSubscribers: 500,
    isActive: true, // Set true jika channel sudah aktif posting konten
  },
  
  tiktok: {
    username: '', // TODO: Tambahkan username TikTok jika sudah ada
    url: '#',
    followers: 0,
    targetFollowers: 1000,
    isActive: false,
  },
  
  spotify: {
    username: 'OSIS SMK Informatika', // TODO: Tambahkan username Spotify jika sudah ada
    url: '#', // TODO: Update dengan URL Spotify asli
    followers: 0,
    targetFollowers: 500,
    isActive: true, // Activated for preview
  },
};

/**
 * Update Instructions:
 * 
 * 1. Instagram:
 *    - Cek followers di https://www.instagram.com/osissmkinformatika_fi
 *    - Update nilai `followers` di atas
 * 
 * 2. YouTube:
 *    - Cek subscribers di channel YouTube
 *    - Update nilai `subscribers` di atas
 *    - Set `isActive: true` jika sudah mulai upload video
 * 
 * 3. TikTok & Spotify:
 *    - Tambahkan username dan URL saat akun sudah dibuat
 *    - Update followers/subscribers
 *    - Set `isActive: true` saat sudah aktif
 */

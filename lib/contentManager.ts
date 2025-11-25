/**
 * Social Media Content Manager
 * Helper script untuk manage konten social media
 * 
 * Usage:
 * 1. Update data di bawah sesuai konten asli dari akun
 * 2. Copy data ini ke lib/socialMediaData.ts
 */

// ============================================
// INSTAGRAM POSTS
// ============================================
// Cara update:
// 1. Buka https://www.instagram.com/osissmkinformatika_fi
// 2. Pilih 6 post terbaru/terpopuler
// 3. Download gambar ke public/images/social-media/instagram/
// 4. Update data di bawah

export const INSTAGRAM_POSTS_TEMPLATE = [
  {
    id: '1',
    imageUrl: '/images/social-media/instagram/post-1.jpg', // Ganti dengan nama file asli
    caption: '[COPY CAPTION ASLI DARI INSTAGRAM]',
    likes: 0, // Update dengan likes asli
    comments: 0, // Update dengan comments asli
    date: '2024-11-10', // Format: YYYY-MM-DD
    isPinned: true, // Set true untuk post penting
  },
  {
    id: '2',
    imageUrl: '/images/social-media/instagram/post-2.jpg',
    caption: '[COPY CAPTION ASLI DARI INSTAGRAM]',
    likes: 0,
    comments: 0,
    date: '2024-11-09',
    isPinned: false,
  },
  {
    id: '3',
    imageUrl: '/images/social-media/instagram/post-3.jpg',
    caption: '[COPY CAPTION ASLI DARI INSTAGRAM]',
    likes: 0,
    comments: 0,
    date: '2024-11-08',
    isPinned: false,
  },
  {
    id: '4',
    imageUrl: '/images/social-media/instagram/post-4.jpg',
    caption: '[COPY CAPTION ASLI DARI INSTAGRAM]',
    likes: 0,
    comments: 0,
    date: '2024-11-07',
    isPinned: false,
  },
  {
    id: '5',
    imageUrl: '/images/social-media/instagram/post-5.jpg',
    caption: '[COPY CAPTION ASLI DARI INSTAGRAM]',
    likes: 0,
    comments: 0,
    date: '2024-11-06',
    isPinned: false,
  },
  {
    id: '6',
    imageUrl: '/images/social-media/instagram/post-6.jpg',
    caption: '[COPY CAPTION ASLI DARI INSTAGRAM]',
    likes: 0,
    comments: 0,
    date: '2024-11-05',
    isPinned: false,
  },
];

// ============================================
// YOUTUBE VIDEOS
// ============================================
// Cara update:
// 1. Buka https://youtube.com/@osissmkinformatikafithrahi6947
// 2. Pilih 4-6 video terbaru/terpopuler
// 3. Download thumbnails:
//    URL: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
//    Simpan ke: public/images/social-media/youtube/
// 4. Update data di bawah

export const YOUTUBE_VIDEOS_TEMPLATE = [
  {
    id: '1',
    thumbnail: '/images/social-media/youtube/video-1.jpg', // Ganti dengan nama file asli
    title: '[COPY JUDUL ASLI DARI YOUTUBE]',
    views: 0, // Update dengan views asli
    duration: '0:00', // Format: MM:SS atau H:MM:SS
    uploadDate: '2024-11-10', // Format: YYYY-MM-DD
    isPinned: true, // Set true untuk video penting
  },
  {
    id: '2',
    thumbnail: '/images/social-media/youtube/video-2.jpg',
    title: '[COPY JUDUL ASLI DARI YOUTUBE]',
    views: 0,
    duration: '0:00',
    uploadDate: '2024-11-09',
    isPinned: false,
  },
  {
    id: '3',
    thumbnail: '/images/social-media/youtube/video-3.jpg',
    title: '[COPY JUDUL ASLI DARI YOUTUBE]',
    views: 0,
    duration: '0:00',
    uploadDate: '2024-11-08',
    isPinned: false,
  },
  {
    id: '4',
    thumbnail: '/images/social-media/youtube/video-4.jpg',
    title: '[COPY JUDUL ASLI DARI YOUTUBE]',
    views: 0,
    duration: '0:00',
    uploadDate: '2024-11-07',
    isPinned: false,
  },
];

// ============================================
// SPOTIFY CONTENT (Optional - jika sudah aktif)
// ============================================
export const SPOTIFY_CONTENT_TEMPLATE = [
  {
    id: '1',
    title: '[JUDUL PODCAST/PLAYLIST]',
    type: 'podcast', // 'podcast' atau 'playlist'
    coverUrl: '/images/social-media/spotify/cover-1.jpg',
    description: '[DESKRIPSI SINGKAT]',
    episodesOrTracks: 0, // Jumlah episode (podcast) atau lagu (playlist)
    totalDuration: '0h 0m', // Format: Xh Xm
    isPinned: true,
  },
];

// ============================================
// TIKTOK VIDEOS (Optional - jika sudah aktif)
// ============================================
export const TIKTOK_VIDEOS_TEMPLATE = [
  {
    id: '1',
    thumbnail: '/images/social-media/tiktok/video-1.jpg',
    title: '[COPY CAPTION DARI TIKTOK]',
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0,
    isPinned: true,
  },
];

// ============================================
// ANALYTICS DATA
// ============================================
// Update setelah update konten di atas

export const ANALYTICS_CALCULATOR = {
  // Instagram
  instagram: {
    currentFollowers: 500, // Update dari Instagram
    previousFollowers: 435, // Followers bulan lalu (untuk hitung growth)
    
    // Auto calculate dari posts
    calculateTotalEngagement: (posts: typeof INSTAGRAM_POSTS_TEMPLATE) => {
      return posts.reduce((total, post) => total + post.likes + post.comments, 0);
    },
    
    calculateGrowth: (current: number, previous: number) => {
      return Number((((current - previous) / previous) * 100).toFixed(1));
    },
    
    calculateEngagementRate: (totalEngagement: number, followers: number) => {
      return Number(((totalEngagement / followers) * 100).toFixed(1));
    },
    
    findTopContent: (posts: typeof INSTAGRAM_POSTS_TEMPLATE) => {
      const sorted = [...posts].sort((a, b) => 
        (b.likes + b.comments) - (a.likes + a.comments)
      );
      const top = sorted[0];
      return {
        title: top.caption.substring(0, 50) + '...',
        engagement: top.likes + top.comments,
      };
    },
  },
  
  // YouTube
  youtube: {
    currentSubscribers: 0, // Update dari YouTube
    previousSubscribers: 0, // Subscribers bulan lalu
    
    calculateTotalEngagement: (videos: typeof YOUTUBE_VIDEOS_TEMPLATE) => {
      return videos.reduce((total, video) => total + video.views, 0);
    },
    
    // Engagement rate untuk YouTube biasanya (views / subscribers) * 100
    // Tapi karena subscribers masih 0, kita hitung dari average views
    calculateEngagementRate: (videos: typeof YOUTUBE_VIDEOS_TEMPLATE) => {
      const avgViews = videos.reduce((sum, v) => sum + v.views, 0) / videos.length;
      // Estimate engagement rate based on views
      return Number((avgViews / 100).toFixed(1)); // Rough estimate
    },
    
    findTopContent: (videos: typeof YOUTUBE_VIDEOS_TEMPLATE) => {
      const sorted = [...videos].sort((a, b) => b.views - a.views);
      const top = sorted[0];
      return {
        title: top.title,
        engagement: top.views,
      };
    },
  },
};

// ============================================
// CARA PAKAI
// ============================================
/*

1. UPDATE KONTEN:
   - Edit array di atas dengan data asli dari akun
   - Download dan upload gambar/thumbnails
   - Update semua angka (likes, views, dll)

2. HITUNG ANALYTICS:
   const instagramEngagement = ANALYTICS_CALCULATOR.instagram.calculateTotalEngagement(INSTAGRAM_POSTS_TEMPLATE);
   const instagramGrowth = ANALYTICS_CALCULATOR.instagram.calculateGrowth(500, 435);
   const instagramRate = ANALYTICS_CALCULATOR.instagram.calculateEngagementRate(instagramEngagement, 500);
   const instagramTop = ANALYTICS_CALCULATOR.instagram.findTopContent(INSTAGRAM_POSTS_TEMPLATE);

3. COPY KE FILE ASLI:
   - Copy INSTAGRAM_POSTS_TEMPLATE → lib/socialMediaData.ts (instagramPosts)
   - Copy YOUTUBE_VIDEOS_TEMPLATE → lib/socialMediaData.ts (youtubeVideos)
   - Copy hasil analytics → lib/analyticsData.ts

4. TEST:
   - Run: npm run dev
   - Buka: http://localhost:3001/our-social-media
   - Check semua gambar muncul dan data benar

*/

// ============================================
// QUICK COMMANDS
// ============================================
console.log('Social Media Content Manager Ready!');
console.log('');
console.log('Quick Reference:');
console.log('1. Instagram: https://www.instagram.com/osissmkinformatika_fi');
console.log('2. YouTube: https://youtube.com/@osissmkinformatikafithrahi6947');
console.log('');
console.log('Update template di atas, lalu copy ke:');
console.log('- lib/socialMediaData.ts (konten)');
console.log('- lib/analyticsData.ts (analytics)');

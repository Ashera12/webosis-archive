// Sample data for social media content previews
// Update these with real data from your actual social media accounts

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  isPinned?: boolean;
  url?: string;
}

export interface YouTubeVideo {
  id: string;
  thumbnail: string;
  title: string;
  views: number;
  duration: string;
  uploadDate: string;
  isPinned?: boolean;
  url?: string;
  likes?: number;
  comments?: number;
  description?: string;
}

export interface SpotifyContent {
  id: string;
  title: string;
  type: 'podcast' | 'playlist';
  coverUrl: string;
  description: string;
  episodesOrTracks: number;
  totalDuration?: string;
  isPinned?: boolean;
  url?: string;
}

export interface TikTokVideo {
  id: string;
  thumbnail: string;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isPinned?: boolean;
  url?: string;
}

// Instagram Sample Posts - Replace with real data
export const instagramPosts: InstagramPost[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    caption: 'Kegiatan MPLS 2024 - Sambutan hangat untuk siswa baru SMK Informatika! 🎉',
    likes: 245,
    comments: 32,
    date: '2024-07-15',
    isPinned: true,
    url: 'https://www.instagram.com/p/example/',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
    caption: 'Workshop Coding bareng OSIS! Belajar bikin website keren 💻✨',
    likes: 189,
    comments: 24,
    date: '2024-07-10',
    url: 'https://www.instagram.com/p/example2/',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    caption: 'Lomba 17 Agustus - Seru banget! Merdeka! 🇮🇩🔥',
    likes: 312,
    comments: 45,
    date: '2024-08-17',
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
    caption: 'Jumat Bersih - Kerja bakti bikin sekolah makin nyaman! 🌿',
    likes: 156,
    comments: 18,
    date: '2024-07-05',
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
    caption: 'Market Day! Kunjungi stand OSIS yuk 🛍️',
    likes: 198,
    comments: 29,
    date: '2024-06-28',
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    caption: 'Rapat koordinasi pengurus OSIS - Planning kegiatan seru! 📝',
    likes: 134,
    comments: 15,
    date: '2024-06-20',
  },
];

// YouTube Sample Videos - Replace with real data
export const youtubeVideos: YouTubeVideo[] = [
  {
    id: '1',
    thumbnail: 'https://i.ytimg.com/vi/ScMzIvxBSi4/maxresdefault.jpg',
    title: 'Highlight MPLS 2024 - SMK Informatika Fithrah Insani',
    views: 1542,
    duration: '10:24',
    uploadDate: '2024-07-16',
    isPinned: true,
    url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', // Video embeddable
    likes: 89,
    comments: 12,
    description: 'Video highlight kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS) 2024 di SMK Informatika Fithrah Insani.',
  },
  {
    id: '2',
    thumbnail: 'https://i.ytimg.com/vi/UB1O30fR-EE/maxresdefault.jpg',
    title: 'Tutorial: Cara Membuat Website Sederhana dengan HTML & CSS',
    views: 892,
    duration: '15:30',
    uploadDate: '2024-07-08',
    url: 'https://www.youtube.com/watch?v=UB1O30fR-EE', // HTML/CSS Tutorial
    likes: 45,
    comments: 8,
    description: 'Tutorial lengkap membuat website sederhana menggunakan HTML dan CSS untuk pemula.',
  },
  {
    id: '3',
    thumbnail: 'https://i.ytimg.com/vi/qz0aGYrrlhU/maxresdefault.jpg',
    title: 'Liputan Lomba 17 Agustus - Peringatan HUT RI ke-79',
    views: 2104,
    duration: '12:20',
    uploadDate: '2024-08-18',
    url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
  },
  {
    id: '4',
    thumbnail: 'https://i.ytimg.com/vi/pQN-pnXPaVg/maxresdefault.jpg',
    title: 'Behind The Scenes: Persiapan Market Day OSIS',
    views: 675,
    duration: '6:15',
    uploadDate: '2024-06-25',
    url: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
  },
];

// Spotify Sample Content - Replace with real data (if available)
export const spotifyContent: SpotifyContent[] = [
  {
    id: '1',
    title: 'OSIS Talk: Tips Sukses di Sekolah',
    type: 'podcast',
    coverUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80',
    description: 'Podcast inspiratif dari pengurus OSIS tentang tips dan trik sukses di sekolah',
    episodesOrTracks: 5,
    totalDuration: '2h 30m',
    isPinned: true,
    url: 'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5', // Sample Spotify episode URL
  },
  {
    id: '2',
    title: 'Playlist Semangat Belajar',
    type: 'playlist',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
    description: 'Kumpulan musik untuk menemani waktu belajar kamu',
    episodesOrTracks: 25,
    totalDuration: '1h 45m',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0',
  },
  {
    id: '3',
    title: 'OSIS Stories: Pengalaman Pengurus',
    type: 'podcast',
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
    description: 'Cerita seru dari para pengurus OSIS tentang kegiatan dan pengalaman mereka',
    episodesOrTracks: 8,
    totalDuration: '3h 15m',
    url: 'https://open.spotify.com/episode/0Q86acNRm6V9GYx55SXKwf',
  },
];

// TikTok Sample Videos - Replace with real data (if available)
export const tiktokVideos: TikTokVideo[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80',
    title: 'Day in the life OSIS SMK Informatika! ✨',
    likes: 5420,
    comments: 234,
    shares: 156,
    views: 15300,
    isPinned: true,
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
    title: 'Tutorial singkat bikin website! 💻',
    likes: 3210,
    comments: 178,
    shares: 89,
    views: 9800,
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80',
    title: 'Behind the scenes Market Day 🎬',
    likes: 2890,
    comments: 145,
    shares: 67,
    views: 8500,
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80',
    title: 'Lomba 17an seru abis! 🇮🇩🔥',
    likes: 6780,
    comments: 312,
    shares: 234,
    views: 21400,
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
    title: 'Tips jadi pengurus OSIS! 📝',
    likes: 4120,
    comments: 189,
    shares: 123,
    views: 12600,
  },
  {
    id: '6',
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80',
    title: 'Jumat bersih challenge! 🌿',
    likes: 1980,
    comments: 98,
    shares: 45,
    views: 6300,
  },
  {
    id: '7',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
    title: 'Workshop coding bareng! 💻✨',
    likes: 3450,
    comments: 156,
    shares: 78,
    views: 10200,
  },
  {
    id: '8',
    thumbnail: '/images/social-media/tiktok/placeholder.svg',
    title: 'Kenalan sama pengurus OSIS! 👋',
    likes: 2340,
    comments: 134,
    shares: 56,
    views: 7800,
  },
];

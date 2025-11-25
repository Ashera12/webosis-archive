# 🎨 Social Media Preview System

Sistem preview konten social media yang modern dan elegant untuk website OSIS SMK Informatika Fithrah Insani.

## ✨ Features

### 1. **Platform-Specific Previews**
- **Instagram**: Grid layout dengan hover overlay untuk engagement metrics
- **YouTube**: Video thumbnails dengan play button dan view counts
- **Spotify**: Podcast & playlist cards dengan cover art
- **TikTok**: Vertical video grid dengan viral metrics

### 2. **Analytics Dashboard**
- Real-time follower counts
- Engagement metrics (likes, comments, shares)
- Growth percentage tracking
- Top performing content highlights
- Platform comparison

### 3. **Smart UI Features**
- Pinned content badges
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Smooth animations dan transitions
- Platform-specific branding colors

## 🏗️ Architecture

### Components Created

```
components/
├── InstagramPreview.tsx       # Instagram posts grid
├── YouTubePreview.tsx        # YouTube videos grid
├── SpotifyPreview.tsx        # Spotify podcasts/playlists
├── TikTokPreview.tsx         # TikTok videos grid
└── SocialMediaAnalytics.tsx  # Analytics dashboard
```

### Data Management

```
lib/
├── socialMediaData.ts    # Content data (posts, videos, etc)
├── analyticsData.ts      # Analytics metrics
└── socialMediaConfig.ts  # Platform configuration
```

## 📊 Data Structure

### Instagram Posts
```typescript
interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  isPinned?: boolean;
}
```

### YouTube Videos
```typescript
interface YouTubeVideo {
  id: string;
  thumbnail: string;
  title: string;
  views: number;
  duration: string;
  uploadDate: string;
  isPinned?: boolean;
}
```

### Analytics Data
```typescript
interface PlatformAnalytics {
  platform: string;
  currentFollowers: number;
  growth: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topContent: { title: string; engagement: number };
}
```

## 🎯 Usage

### 1. Update Content Data

Edit `lib/socialMediaData.ts`:

```typescript
export const instagramPosts: InstagramPost[] = [
  {
    id: '1',
    imageUrl: '/images/social-media/instagram/post1.jpg',
    caption: 'Your caption here',
    likes: 245,
    comments: 32,
    date: '2024-07-15',
    isPinned: true,
  },
  // Add more posts...
];
```

### 2. Update Analytics

Edit `lib/analyticsData.ts`:

```typescript
export const analyticsData: PlatformAnalytics[] = [
  {
    platform: 'Instagram',
    currentFollowers: 500,
    growth: 15.3,
    totalEngagement: 3421,
    avgEngagementRate: 6.8,
    // ... more metrics
  },
];
```

### 3. Activate New Platform

Edit `lib/socialMediaConfig.ts`:

```typescript
export const SOCIAL_MEDIA_CONFIG = {
  tiktok: {
    url: 'https://www.tiktok.com/@your_username',
    followers: 1000,
    isActive: true, // Change from false to true
  },
};
```

## 🎨 Design System

### Platform Colors

- **Instagram**: Pink to Purple gradient (`from-pink-500 to-purple-600`)
- **YouTube**: Red (`from-red-500 to-red-700`)
- **TikTok**: Cyan to Pink gradient (`from-cyan-500 to-pink-500`)
- **Spotify**: Green gradient (`from-green-500 to-emerald-600`)

### Animations

- **Fade In Up**: Content cards entrance
- **Scale on Hover**: Interactive elements
- **Float**: Decorative elements
- **Slide In**: Toast notifications

### Responsive Breakpoints

```css
/* Mobile: 1 column */
sm: 640px

/* Tablet: 2 columns */
md: 768px

/* Desktop: 3-4 columns */
lg: 1024px
xl: 1280px
```

## 📱 Components API

### InstagramPreview

```tsx
<InstagramPreview 
  posts={instagramPosts} 
/>
```

**Props:**
- `posts`: Array of InstagramPost objects

**Features:**
- 3-column responsive grid
- Hover overlay showing caption
- Engagement stats (likes, comments)
- Pinned badges for featured posts

### YouTubePreview

```tsx
<YouTubePreview 
  videos={youtubeVideos} 
/>
```

**Props:**
- `videos`: Array of YouTubeVideo objects

**Features:**
- 2-column responsive grid
- 16:9 aspect ratio thumbnails
- Play button overlay
- Duration badges
- View count display

### SpotifyPreview

```tsx
<SpotifyPreview 
  content={spotifyContent} 
/>
```

**Props:**
- `content`: Array of SpotifyContent objects

**Features:**
- 3-column grid
- Square cover art
- Type badges (Podcast/Playlist)
- Episode/track counts
- Play overlay on hover

### TikTokPreview

```tsx
<TikTokPreview 
  videos={tiktokVideos} 
/>
```

**Props:**
- `videos`: Array of TikTokVideo objects

**Features:**
- Compact 5-column grid
- 9:16 vertical aspect ratio
- Engagement metrics (likes, comments, shares, views)
- View count badges

### SocialMediaAnalytics

```tsx
<SocialMediaAnalytics 
  data={analyticsData} 
/>
```

**Props:**
- `data`: Array of PlatformAnalytics objects

**Features:**
- Platform comparison cards
- Growth indicators (up/down arrows)
- Follower counts
- Engagement metrics
- Top content highlights
- Platform-specific gradients

## 🔄 Update Workflow

### Daily
- No updates needed (static content)

### Weekly
1. Update follower counts in `socialMediaConfig.ts`
2. Add new posts/videos to `socialMediaData.ts`
3. Update engagement metrics (likes, comments, views)

### Monthly
1. Calculate analytics metrics:
   - Growth percentage
   - Average engagement rate
   - Total engagement
2. Update `analyticsData.ts`
3. Identify and pin top performing content
4. Archive old content if needed (keep max 12 per platform)

## 📐 Image Specifications

### Instagram
- **Size**: 1080x1080px (1:1 square)
- **Format**: JPG or PNG
- **Max Size**: 200KB (compressed)

### YouTube
- **Size**: 1280x720px (16:9)
- **Format**: JPG
- **Max Size**: 200KB

### Spotify
- **Size**: 640x640px (1:1 square)
- **Format**: JPG or PNG
- **Max Size**: 150KB

### TikTok
- **Size**: 1080x1920px (9:16 vertical)
- **Format**: JPG
- **Max Size**: 200KB

## 🚀 Performance

### Optimization Techniques

1. **Image Lazy Loading**: Images load as user scrolls
2. **Responsive Images**: Different sizes for different screens
3. **Code Splitting**: Preview components load on demand
4. **CSS Animations**: Hardware-accelerated transforms
5. **Conditional Rendering**: Only active platforms show previews

### Lighthouse Scores (Target)

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

## 🌐 Multilingual Support

All UI text uses translation keys from `lib/translations.ts`:

```typescript
// Examples
t('socialMediaPage.popularPosts')      // "Postingan Populer" / "Popular Posts"
t('socialMediaPage.latestVideos')      // "Video Terbaru" / "Latest Videos"
t('socialMediaPage.viewAll')           // "Lihat Semua" / "View All"
```

## 🐛 Troubleshooting

### Previews Not Showing?

1. Check platform is active:
   ```typescript
   SOCIAL_MEDIA_CONFIG.instagram.isActive === true
   ```

2. Verify data exists:
   ```typescript
   instagramPosts.length > 0
   ```

3. Check console for errors

### Images Not Loading?

1. Verify file path is correct
2. Check file exists in `public/` folder
3. File names are case-sensitive
4. Clear browser cache

### Analytics Not Updating?

1. Check `analyticsData.ts` has been saved
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+R)

## 📚 Documentation

- [Content Update Guide](./SOCIAL_MEDIA_CONTENT_GUIDE.md) - How to update posts, videos, and content
- [Config Update Guide](./SOCIAL_MEDIA_UPDATE_GUIDE.md) - How to update follower counts and activate platforms

## 🎯 Future Enhancements

- [ ] Live data integration via APIs
- [ ] Auto-update from actual social media
- [ ] Content scheduling system
- [ ] Advanced analytics charts
- [ ] Story highlights preview
- [ ] Comments section preview
- [ ] Real-time engagement tracking

## 👥 Credits

Created for OSIS SMK Informatika Fithrah Insani

**Version**: 1.0  
**Last Updated**: December 2024  
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS

---

Made with ❤️ for education

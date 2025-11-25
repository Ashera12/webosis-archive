// lib/api/youtube.ts
// YouTube Data API v3 Integration

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: { url: string };
      maxres?: { url: string };
    };
    publishedAt: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
  };
}

export interface YouTubeApiResponse {
  items: YouTubeVideo[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

/**
 * Fetch YouTube videos menggunakan YouTube Data API v3
 * 
 * Setup:
 * 1. Buat project di https://console.cloud.google.com/
 * 2. Enable YouTube Data API v3
 * 3. Create API Key
 * 4. Dapatkan Channel ID dari channel URL
 * 5. Simpan di .env.local
 */
export async function fetchYouTubeVideos(maxResults: number = 12): Promise<YouTubeVideo[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    console.warn('YouTube API credentials not configured');
    return [];
  }

  try {
    // Step 1: Get video IDs from channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=${maxResults}&type=video`;

    const searchResponse = await fetch(searchUrl, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = (searchData.items || [])
      .map((item: unknown) => (item as { id?: { videoId?: string } })?.id?.videoId)
      .filter(Boolean)
      .join(',');

    if (!videoIds) return [];

    // Step 2: Get video details (statistics, duration, etc.)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=snippet,statistics,contentDetails`;

    const videosResponse = await fetch(videosUrl, {
      next: { revalidate: 1800 }
    });

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.status}`);
    }

    const videosData: YouTubeApiResponse = await videosResponse.json();
    return videosData.items || [];
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

/**
 * Convert YouTube API response to app format
 */
export function formatYouTubeVideo(video: YouTubeVideo, index: number) {
  // Convert ISO 8601 duration to readable format (PT10M24S -> 10:24)
  const duration = parseDuration(video.contentDetails.duration);
  const thumbnail = video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high.url;

  return {
    id: String(index + 1),
    thumbnail,
    title: video.snippet.title,
    views: parseInt(video.statistics.viewCount) || 0,
    duration,
    uploadDate: new Date(video.snippet.publishedAt).toISOString().split('T')[0],
    isPinned: index === 0,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    likes: parseInt(video.statistics.likeCount) || 0,
    comments: parseInt(video.statistics.commentCount) || 0,
    description: video.snippet.description
  };
}

/**
 * Parse ISO 8601 duration to MM:SS or HH:MM:SS
 */
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get YouTube channel stats
 */
export async function fetchYouTubeStats() {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return {
      subscribers: 0,
      views: 0,
      videos: 0
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=statistics`;

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const stats = data.items?.[0]?.statistics || {};

    return {
      subscribers: parseInt(stats.subscriberCount) || 0,
      views: parseInt(stats.viewCount) || 0,
      videos: parseInt(stats.videoCount) || 0
    };
  } catch (error) {
    console.error('Error fetching YouTube stats:', error);
    return {
      subscribers: 0,
      views: 0,
      videos: 0
    };
  }
}

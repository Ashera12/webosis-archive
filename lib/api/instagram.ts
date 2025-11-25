// lib/api/instagram.ts
// Instagram Graph API Integration

export interface InstagramPost {
  id: string;
  media_url: string;
  caption: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
  permalink: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

export interface InstagramApiResponse {
  data: InstagramPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Fetch Instagram posts menggunakan Instagram Graph API
 * 
 * Setup:
 * 1. Buat Facebook App di https://developers.facebook.com/apps/
 * 2. Tambahkan Instagram Graph API
 * 3. Generate Access Token
 * 4. Dapatkan Instagram User ID
 * 5. Simpan di .env.local
 */
export async function fetchInstagramPosts(limit: number = 12): Promise<InstagramPost[]> {
  const accessToken = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    console.warn('Instagram API credentials not configured');
    return [];
  }

  try {
    const fields = 'id,media_url,caption,like_count,comments_count,timestamp,permalink,media_type';
    const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    const response = await fetch(url, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data: InstagramApiResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return [];
  }
}

/**
 * Convert Instagram API response to app format
 */
export function formatInstagramPost(post: InstagramPost, index: number) {
  return {
    id: String(index + 1),
    imageUrl: post.media_url,
    caption: post.caption || '',
    likes: post.like_count || 0,
    comments: post.comments_count || 0,
    date: new Date(post.timestamp).toISOString().split('T')[0],
    isPinned: index === 0, // First post is pinned
    url: post.permalink
  };
}

/**
 * Get Instagram profile stats
 */
export async function fetchInstagramStats() {
  const accessToken = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    return {
      followers: 0,
      following: 0,
      posts: 0
    };
  }

  try {
    const fields = 'followers_count,follows_count,media_count';
    const url = `https://graph.instagram.com/${userId}?fields=${fields}&access_token=${accessToken}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      followers: data.followers_count || 0,
      following: data.follows_count || 0,
      posts: data.media_count || 0
    };
  } catch (error) {
    console.error('Error fetching Instagram stats:', error);
    return {
      followers: 0,
      following: 0,
      posts: 0
    };
  }
}

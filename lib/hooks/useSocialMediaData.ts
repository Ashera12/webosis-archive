// lib/hooks/useSocialMediaData.ts
'use client';

import { useState, useEffect } from 'react';
import { fetchInstagramPosts, formatInstagramPost } from '../api/instagram';
import { fetchYouTubeVideos, formatYouTubeVideo } from '../api/youtube';

// Import fallback data
import { 
  instagramPosts as fallbackInstagramPosts,
  youtubeVideos as fallbackYoutubeVideos,
  spotifyContent as fallbackSpotifyContent,
  tiktokVideos as fallbackTiktokVideos
} from '../socialMediaData';

export function useSocialMediaData() {
  const [instagramPosts, setInstagramPosts] = useState(fallbackInstagramPosts);
  const [youtubeVideos, setYoutubeVideos] = useState(fallbackYoutubeVideos);
  const [spotifyContent] = useState(fallbackSpotifyContent); // Spotify requires specific IDs
  const [tiktokVideos] = useState(fallbackTiktokVideos); // TikTok API more complex
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine whether any API keys are configured (public env vars)
  const apisConfigured = Boolean(
    (process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN && process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN !== 'your_instagram_access_token_here') ||
    (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY && process.env.NEXT_PUBLIC_YOUTUBE_API_KEY !== 'your_youtube_api_key_here') ||
    (process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID && process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID !== 'your_spotify_client_id_here')
  );

  // Build a helpful list of missing or placeholder keys to show to the user
  const missingKeys: string[] = [];
  if (!(process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN && process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN !== 'your_instagram_access_token_here')) {
    missingKeys.push('NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN');
  }
  if (!(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY && process.env.NEXT_PUBLIC_YOUTUBE_API_KEY !== 'your_youtube_api_key_here')) {
    missingKeys.push('NEXT_PUBLIC_YOUTUBE_API_KEY');
  }
  // For spotify we require both client id and secret (server side ideally), but suggest adding client id/secret
  if (!(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID && process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID !== 'your_spotify_client_id_here') ||
      !(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET && process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET !== 'your_spotify_client_secret_here')) {
    missingKeys.push('NEXT_PUBLIC_SPOTIFY_CLIENT_ID and NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET');
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch Instagram posts
        const instagramAccessToken = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN;
        if (instagramAccessToken && instagramAccessToken !== 'your_instagram_access_token_here') {
          try {
            const igPosts = await fetchInstagramPosts(12);
            if (igPosts.length > 0) {
              const formatted = igPosts.map((post, index) => formatInstagramPost(post, index));
              setInstagramPosts(formatted);
            }
          } catch (err) {
            console.error('Instagram fetch error:', err);
          }
        }

        // Fetch YouTube videos
        const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
        if (youtubeApiKey && youtubeApiKey !== 'your_youtube_api_key_here') {
          try {
            const ytVideos = await fetchYouTubeVideos(12);
            if (ytVideos.length > 0) {
              const formatted = ytVideos.map((video, index) => formatYouTubeVideo(video, index));
              setYoutubeVideos(formatted);
            }
          } catch (err) {
            console.error('YouTube fetch error:', err);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch social media data');
        console.error('Error fetching social media data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Auto-refresh every 30 minutes (or based on env variable)
    const refreshInterval = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '30') * 60 * 1000;
    const intervalId = setInterval(fetchData, refreshInterval);

    return () => clearInterval(intervalId);
  }, []);

  return {
    instagramPosts,
    youtubeVideos,
    spotifyContent,
    tiktokVideos,
    loading,
    error,
    apisConfigured,
    missingKeys
  };
}

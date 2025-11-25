// lib/api/spotify.ts
// Spotify Web API Integration

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  total_episodes: number;
  publisher: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: {
    total: number;
  };
}

/**
 * Get Spotify access token menggunakan Client Credentials Flow
 */
async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Spotify API credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials',
      next: { revalidate: 3000 } // Cache for 50 minutes (token expires in 60)
    });

    if (!response.ok) {
      throw new Error(`Spotify auth error: ${response.status}`);
    }

    const data: SpotifyAuthResponse = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    return null;
  }
}

/**
 * Fetch Spotify podcast/show
 * 
 * Setup:
 * 1. Buat app di https://developer.spotify.com/dashboard/applications
 * 2. Dapatkan Client ID dan Client Secret
 * 3. Simpan di .env.local
 */
export async function fetchSpotifyShow(showId: string): Promise<SpotifyShow | null> {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const url = `https://api.spotify.com/v1/shows/${showId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify show:', error);
    return null;
  }
}

/**
 * Fetch Spotify playlist
 */
export async function fetchSpotifyPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify playlist:', error);
    return null;
  }
}

/**
 * Format Spotify show to app format
 */
export function formatSpotifyShow(show: SpotifyShow, index: number) {
  return {
    id: String(index + 1),
    title: show.name,
    type: 'podcast' as const,
    coverUrl: show.images[0]?.url || '',
    description: show.description,
    episodesOrTracks: show.total_episodes,
    totalDuration: 'Multiple episodes',
    isPinned: index === 0,
    url: `https://open.spotify.com/show/${show.id}`
  };
}

/**
 * Format Spotify playlist to app format
 */
export function formatSpotifyPlaylist(playlist: SpotifyPlaylist, index: number) {
  return {
    id: String(index + 1),
    title: playlist.name,
    type: 'playlist' as const,
    coverUrl: playlist.images[0]?.url || '',
    description: playlist.description,
    episodesOrTracks: playlist.tracks.total,
    totalDuration: `${playlist.tracks.total} tracks`,
    isPinned: index === 0,
    url: `https://open.spotify.com/playlist/${playlist.id}`
  };
}

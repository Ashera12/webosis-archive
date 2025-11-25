// Analytics data for social media platforms
// Update these metrics based on real data from your accounts

export interface PlatformAnalytics {
  platform: string;
  icon: string;
  currentFollowers: number;
  growth: number; // percentage growth
  growthType: 'up' | 'down';
  totalEngagement: number; // total likes, comments, shares
  avgEngagementRate: number; // percentage
  topContent: {
    title: string;
    engagement: number;
  };
  color: string; // Tailwind color class
  gradient: string; // Tailwind gradient classes
}

// Sample analytics data - Update with real metrics
export const analyticsData: PlatformAnalytics[] = [
  {
    platform: 'Instagram',
    icon: 'fab fa-instagram',
    currentFollowers: 500,
    growth: 15.3,
    growthType: 'up',
    totalEngagement: 3421,
    avgEngagementRate: 6.8,
    topContent: {
      title: 'Lomba 17 Agustus - Seru banget! Merdeka! 🇮🇩🔥',
      engagement: 357,
    },
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-purple-600',
  },
  {
    platform: 'YouTube',
    icon: 'fab fa-youtube',
    currentFollowers: 0, // Update when channel has subscribers
    growth: 0,
    growthType: 'up',
    totalEngagement: 5214,
    avgEngagementRate: 12.4,
    topContent: {
      title: 'Liputan Lomba 17 Agustus - Peringatan HUT RI ke-79',
      engagement: 2104,
    },
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-700',
  },
  // Uncomment when TikTok becomes active
  // {
  //   platform: 'TikTok',
  //   icon: 'fab fa-tiktok',
  //   currentFollowers: 0,
  //   growth: 0,
  //   growthType: 'up',
  //   totalEngagement: 45678,
  //   avgEngagementRate: 18.9,
  //   topContent: {
  //     title: 'Lomba 17an seru abis! 🇮🇩🔥',
  //     engagement: 7482,
  //   },
  //   color: 'text-black dark:text-white',
  //   gradient: 'from-cyan-500 to-pink-500',
  // },
  // Uncomment when Spotify becomes active
  // {
  //   platform: 'Spotify',
  //   icon: 'fab fa-spotify',
  //   currentFollowers: 0,
  //   growth: 0,
  //   growthType: 'up',
  //   totalEngagement: 1234,
  //   avgEngagementRate: 8.2,
  //   topContent: {
  //     title: 'OSIS Talk: Tips Sukses di Sekolah - Episode 1',
  //     engagement: 456,
  //   },
  //   color: 'text-green-500',
  //   gradient: 'from-green-500 to-emerald-600',
  // },
];

// Helper function to format large numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Calculate total reach across all platforms
export function getTotalReach(): number {
  return analyticsData.reduce((total, platform) => total + platform.currentFollowers, 0);
}

// Calculate total engagement across all platforms
export function getTotalEngagement(): number {
  return analyticsData.reduce((total, platform) => total + platform.totalEngagement, 0);
}

// Get platform with highest engagement rate
export function getTopPerformingPlatform(): PlatformAnalytics | null {
  if (analyticsData.length === 0) return null;
  return analyticsData.reduce((top, current) => 
    current.avgEngagementRate > top.avgEngagementRate ? current : top
  );
}

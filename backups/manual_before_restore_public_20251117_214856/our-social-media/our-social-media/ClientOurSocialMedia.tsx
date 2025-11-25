'use client';

import React from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import PageEnterAnimation from '@/components/PageEnterAnimation';
import SocialMediaCard from '@/components/SocialMediaCard';
import SocialStats from '@/components/SocialStats';
import SocialPerformanceChart from '@/components/SocialPerformanceChart';
import TrendingNow from '@/components/TrendingNow';
import TrendingModal from '@/components/TrendingModal';
import InstagramPreview from '@/components/InstagramPreview';
import YouTubePreview from '@/components/YouTubePreview';
import SpotifyPreview from '@/components/SpotifyPreview';
import TikTokPreview from '@/components/TikTokPreview';
import SocialMediaAnalytics from '@/components/SocialMediaAnalytics';
import { useTranslation } from '@/hooks/useTranslation';
import { SOCIAL_MEDIA_CONFIG } from '@/lib/socialMediaConfig';
import { useSocialMediaData } from '@/lib/hooks/useSocialMediaData';
import { analyticsData } from '@/lib/analyticsData';

const ClientOurSocialMediaPage: React.FC = () => {
  const { t } = useTranslation();
  const [showTrendingModal, setShowTrendingModal] = React.useState(false);

  // Use hook to fetch data from API or fallback to static data
  const { instagramPosts, youtubeVideos, spotifyContent, tiktokVideos, loading, error, apisConfigured, missingKeys } = useSocialMediaData();

  const socialPlatforms = [
    {
      name: 'Instagram',
      icon: 'fab fa-instagram',
      description: t('socialMediaPage.instagramDesc'),
      url: SOCIAL_MEDIA_CONFIG.instagram.url,
      gradient: 'from-purple-600 via-pink-600 to-red-500',
      buttonColor: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      followers: SOCIAL_MEDIA_CONFIG.instagram.followers,
      available: SOCIAL_MEDIA_CONFIG.instagram.isActive
    },
    {
      name: 'YouTube',
      icon: 'fab fa-youtube',
      description: t('socialMediaPage.youtubeDesc'),
      url: SOCIAL_MEDIA_CONFIG.youtube.url,
      gradient: 'from-red-600 to-red-500',
      buttonColor: 'bg-red-500 hover:bg-red-600',
      followers: SOCIAL_MEDIA_CONFIG.youtube.subscribers,
      available: SOCIAL_MEDIA_CONFIG.youtube.isActive
    },
    {
      name: 'TikTok',
      icon: 'fab fa-tiktok',
      description: t('socialMediaPage.tiktokDesc'),
      url: SOCIAL_MEDIA_CONFIG.tiktok.url,
      gradient: 'from-blue-900 to-pink-500',
      buttonColor: 'bg-gradient-to-r from-gray-800 to-pink-500 hover:from-gray-900 hover:to-pink-600',
      followers: SOCIAL_MEDIA_CONFIG.tiktok.followers,
      available: SOCIAL_MEDIA_CONFIG.tiktok.isActive
    },
    {
      name: 'Spotify',
      icon: 'fab fa-spotify',
      description: t('socialMediaPage.spotifyDesc'),
      url: SOCIAL_MEDIA_CONFIG.spotify.url,
      gradient: 'from-green-600 to-green-500',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      followers: SOCIAL_MEDIA_CONFIG.spotify.followers,
      available: SOCIAL_MEDIA_CONFIG.spotify.isActive
    }
  ];

  const statsData = [
    {
      platform: 'Instagram',
      count: SOCIAL_MEDIA_CONFIG.instagram.followers,
      label: t('socialMediaPage.followers'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'fab fa-instagram',
      target: SOCIAL_MEDIA_CONFIG.instagram.targetFollowers,
      growth: 15
    },
    {
      platform: 'YouTube',
      count: SOCIAL_MEDIA_CONFIG.youtube.subscribers,
      label: SOCIAL_MEDIA_CONFIG.youtube.isActive ? t('socialMediaPage.subscribers') : t('socialMediaPage.notAvailable'),
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: 'fab fa-youtube',
      target: SOCIAL_MEDIA_CONFIG.youtube.targetSubscribers,
      growth: 7
    },
    {
      platform: 'TikTok',
      count: SOCIAL_MEDIA_CONFIG.tiktok.followers,
      label: SOCIAL_MEDIA_CONFIG.tiktok.isActive ? t('socialMediaPage.followers') : t('socialMediaPage.notAvailable'),
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-gradient-to-r from-gray-100 to-pink-100 dark:from-gray-700 dark:to-pink-900/30',
      icon: 'fab fa-tiktok',
      target: SOCIAL_MEDIA_CONFIG.tiktok.targetFollowers,
      growth: 24
    },
    {
      platform: 'Spotify',
      count: SOCIAL_MEDIA_CONFIG.spotify.followers,
      label: SOCIAL_MEDIA_CONFIG.spotify.isActive ? t('socialMediaPage.followers') : t('socialMediaPage.notAvailable'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: 'fab fa-spotify',
      target: SOCIAL_MEDIA_CONFIG.spotify.targetFollowers,
      growth: 19
    }
  ];

  type TrendingItem = {
    id: string;
    platform: string;
    title: string;
    thumbnail?: string;
    metricLabel: string;
    metricValue: number;
    url?: string;
  };

  type UnknownRecord = Record<string, unknown>;
  const asString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
  const asNumber = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const trendingItems = React.useMemo(() => {
    const items: TrendingItem[] = [];

    (instagramPosts || []).forEach((p: unknown) => {
      const r = p as UnknownRecord;
      const likes = asNumber(r.likes ?? r.like_count ?? r.likes_count ?? 0);
      const comments = asNumber(r.comments ?? r.comments_count ?? 0);
      items.push({
        id: asString(r.id ?? r.pk ?? r.shortcode ?? r.url) || Math.random().toString(36).slice(2),
        platform: 'Instagram',
        title: (asString(r.caption ?? r.title) || 'Instagram post').slice(0, 80),
        thumbnail: asString(r.image ?? r.thumbnail ?? r.media_url ?? r.thumbnail_url ?? r.url) || undefined,
        metricLabel: 'Engagement',
        metricValue: likes + comments,
        url: asString(r.url ?? r.permalink ?? r.link) || undefined,
      });
    });

    (youtubeVideos || []).forEach((v: unknown) => {
      const r = v as UnknownRecord;
      const stats = r.statistics as UnknownRecord | undefined;
      const views = asNumber(r.views ?? r.viewCount ?? stats?.viewCount ?? 0);
      const title = asString(r.title ?? r.titleText) || 'YouTube video';
      const thumbnailsVal = r.thumbnails as unknown;
      let thumbnailsUrl: unknown = undefined;
      if (Array.isArray(thumbnailsVal) && thumbnailsVal.length > 0) {
        const first = thumbnailsVal[0] as UnknownRecord;
        thumbnailsUrl = first.url;
      }
      const thumbnail = asString(r.thumbnail ?? thumbnailsUrl ?? (r as UnknownRecord).thumb) || undefined;
      items.push({
        id: asString(r.id ?? r.videoId ?? r.ytId ?? r.url) || Math.random().toString(36).slice(2),
        platform: 'YouTube',
        title: title.slice(0, 80),
        thumbnail,
        metricLabel: 'Views',
        metricValue: views,
        url: asString(r.url ?? r.watchUrl) || (asString(r.id) ? `https://www.youtube.com/watch?v=${asString(r.id)}` : undefined),
      });
    });

    (tiktokVideos || []).forEach((t: unknown) => {
      const r = t as UnknownRecord;
      const plays = asNumber(r.playCount ?? (r.stats as UnknownRecord | undefined)?.playCount ?? r.views ?? r.views_count ?? 0);
      items.push({
        id: asString(r.id ?? r.videoId ?? r.url) || Math.random().toString(36).slice(2),
        platform: 'TikTok',
        title: (asString(r.caption ?? r.title) || 'TikTok video').slice(0, 80),
        thumbnail: asString(r.thumbnail ?? r.cover ?? r.image) || undefined,
        metricLabel: 'Views',
        metricValue: plays,
        url: asString(r.url ?? r.shareUrl) || undefined,
      });
    });

    (Array.isArray(spotifyContent) ? spotifyContent : spotifyContent ? [spotifyContent] : []).forEach((s: unknown) => {
      const r = s as UnknownRecord;
      const plays = asNumber(r.plays ?? r.play_count ?? r.followers ?? 0);
      items.push({
        id: asString(r.id ?? r.uri) || Math.random().toString(36).slice(2),
        platform: 'Spotify',
        title: (asString(r.title ?? r.name) || 'Spotify item').slice(0, 80),
        thumbnail: asString(r.image ?? r.cover) || undefined,
        metricLabel: 'Plays/Followers',
        metricValue: plays,
        url: asString(r.url ?? (r.external_urls as UnknownRecord | undefined)?.spotify) || undefined,
      });
    });

    const filtered = items.filter((i) => Number(i.metricValue) > 0);
    const dedupMap = new Map<string, TrendingItem>();
    for (const it of filtered) {
      const key = `${it.platform}:${it.id || (it.title || '').slice(0, 80)}`;
      const existing = dedupMap.get(key);
      if (!existing || Number(it.metricValue) > Number(existing.metricValue)) {
        dedupMap.set(key, it);
      }
    }

    return Array.from(dedupMap.values()).sort((a, b) => b.metricValue - a.metricValue);
  }, [instagramPosts, youtubeVideos, tiktokVideos, spotifyContent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero / Overview Section (simplified to fix parse error) */}
      <PageEnterAnimation animation="fade">
        <section className="relative bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('socialMediaPage.title') ?? 'Our Social Media'}</h1>
              <p className="text-yellow-100/90 mb-6">{t('socialMediaPage.subtitle') ?? 'Overview and recent performance across channels'}</p>
            </div>
          </div>
        </section>
      </PageEnterAnimation>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <section className="mb-8">
          <SocialStats stats={statsData} />
        </section>

        {/* Analytics */}
        <section className="mb-8">
          <SocialMediaAnalytics data={analyticsData} />
        </section>

        {/* Trending */}
        <section className="mb-8">
          <TrendingNow items={trendingItems} onOpenTrendingAction={() => setShowTrendingModal(true)} />
          {showTrendingModal && (
            <TrendingModal items={trendingItems} onCloseAction={() => setShowTrendingModal(false)} />
          )}
        </section>
      </main>
    </div>
  );
};

export default ClientOurSocialMediaPage;
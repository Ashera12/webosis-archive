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
      {/* Hero Section with Quick Links */}
      <PageEnterAnimation animation="fade">
        <section className="relative bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {t('socialMediaPage.title') ?? 'Our Social Media'}
              </h1>
              <p className="text-lg md:text-xl text-yellow-100/90 mb-8">
                {t('socialMediaPage.subtitle') ?? 'Connect with us across all platforms'}
              </p>
              
              {/* Quick Links Bar */}
              <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-8">
                <a
                  href={SOCIAL_MEDIA_CONFIG.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  <i className="fab fa-instagram text-xl md:text-2xl" />
                  <span className="font-semibold text-sm md:text-base">Instagram</span>
                  <span className="hidden sm:inline text-xs bg-white/20 px-2 py-1 rounded-full">
                    {SOCIAL_MEDIA_CONFIG.instagram.followers}
                  </span>
                </a>
                
                <a
                  href={SOCIAL_MEDIA_CONFIG.youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  <i className="fab fa-youtube text-xl md:text-2xl" />
                  <span className="font-semibold text-sm md:text-base">YouTube</span>
                  <span className="hidden sm:inline text-xs bg-white/20 px-2 py-1 rounded-full">
                    {SOCIAL_MEDIA_CONFIG.youtube.subscribers}
                  </span>
                </a>
                
                <a
                  href={SOCIAL_MEDIA_CONFIG.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  <i className="fab fa-tiktok text-xl md:text-2xl" />
                  <span className="font-semibold text-sm md:text-base">TikTok</span>
                  <span className="hidden sm:inline text-xs bg-white/20 px-2 py-1 rounded-full">
                    {SOCIAL_MEDIA_CONFIG.tiktok.followers}
                  </span>
                </a>
                
                <a
                  href={SOCIAL_MEDIA_CONFIG.spotify.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  <i className="fab fa-spotify text-xl md:text-2xl" />
                  <span className="font-semibold text-sm md:text-base">Spotify</span>
                  <span className="hidden sm:inline text-xs bg-white/20 px-2 py-1 rounded-full">
                    {SOCIAL_MEDIA_CONFIG.spotify.followers}
                  </span>
                </a>
              </div>

              {/* API Status Indicator */}
              {!loading && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm" aria-label="Social media data status">
                    <div className={`w-2 h-2 rounded-full ${apisConfigured ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                    <span>
                      {apisConfigured ? 'Live data synced' : 'Fallback sample data'}
                    </span>
                  </div>
              )}
            </div>
          </div>
        </section>
      </PageEnterAnimation>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Data Sync Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">Showing fallback data. Please check API configuration.</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <AnimatedSection animation="slide-up">
          <section className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Platform Statistics
            </h2>
            <SocialStats stats={statsData} />
          </section>
        </AnimatedSection>

        {/* Social Media Cards Grid */}
        <AnimatedSection animation="slide-up" delay={100}>
          <section className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Our Channels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {socialPlatforms.map((platform, idx) => (
                <div key={platform.name} className="transform transition-all hover:scale-105">
                  <SocialMediaCard {...platform} />
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* Analytics */}
        <AnimatedSection animation="slide-up" delay={200}>
          <section className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Performance Analytics
            </h2>
            <SocialMediaAnalytics data={analyticsData} />
          </section>
        </AnimatedSection>

        {/* Trending */}
        <AnimatedSection animation="slide-up" delay={300}>
          <section className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Trending Content
            </h2>
            <TrendingNow items={trendingItems} onOpenTrendingAction={() => setShowTrendingModal(true)} />
            {showTrendingModal && (
              <TrendingModal items={trendingItems} onCloseAction={() => setShowTrendingModal(false)} />
            )}
          </section>
        </AnimatedSection>

        {/* Platform Previews */}
        <AnimatedSection animation="slide-up" delay={400}>
          <section className="space-y-8 md:space-y-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Latest Posts
            </h2>
            
            {/* Instagram */}
            {instagramPosts && instagramPosts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fab fa-instagram text-3xl text-purple-600" />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Instagram</h3>
                </div>
                <InstagramPreview posts={instagramPosts.slice(0, 6)} />
              </div>
            )}

            {/* YouTube */}
            {youtubeVideos && youtubeVideos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fab fa-youtube text-3xl text-red-600" />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">YouTube</h3>
                </div>
                <YouTubePreview videos={youtubeVideos.slice(0, 6)} />
              </div>
            )}

            {/* TikTok */}
            {tiktokVideos && tiktokVideos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fab fa-tiktok text-3xl text-pink-600" />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">TikTok</h3>
                </div>
                <TikTokPreview videos={tiktokVideos.slice(0, 6)} />
              </div>
            )}

            {/* Spotify */}
            {spotifyContent && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fab fa-spotify text-3xl text-green-600" />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Spotify</h3>
                </div>
                <SpotifyPreview content={Array.isArray(spotifyContent) ? spotifyContent.slice(0, 6) : [spotifyContent]} />
              </div>
            )}
          </section>
        </AnimatedSection>

        {/* Footer CTA */}
        <AnimatedSection animation="fade" delay={500}>
          <section className="mt-12 md:mt-16 text-center">
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl p-8 md:p-12 text-white shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Connected!</h2>
              <p className="text-yellow-100 mb-6 text-sm md:text-base">
                Follow us on your favorite platform for daily updates, behind-the-scenes content, and exclusive announcements.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {socialPlatforms.map(platform => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 md:px-6 py-2 md:py-3 bg-white text-yellow-600 rounded-full font-semibold hover:bg-yellow-50 transition-colors text-sm md:text-base"
                  >
                    <i className={`${platform.icon} mr-2`} />
                    {platform.name}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>
    </div>
  );
};

export default ClientOurSocialMediaPage;
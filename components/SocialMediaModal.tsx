'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaExternalLinkAlt, FaInstagram, FaYoutube, FaSpotify, FaTiktok, FaHeart, FaComment, FaShare, FaPlay, FaHeadphones, FaMusic } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'instagram' | 'youtube' | 'spotify' | 'tiktok';
  data: any;
}

export default function SocialMediaModal({ isOpen, onClose, type, data }: SocialMediaModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close on Escape key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const getIcon = () => {
    switch (type) {
      case 'instagram': return <FaInstagram className="text-pink-500" />;
      case 'youtube': return <FaYoutube className="text-red-500" />;
      case 'spotify': return <FaSpotify className="text-green-500" />;
      case 'tiktok': return <FaTiktok className="text-cyan-500" />;
    }
  };

  const getPlatformName = () => {
    switch (type) {
      case 'instagram': return 'Instagram';
      case 'youtube': return 'YouTube';
      case 'spotify': return 'Spotify';
      case 'tiktok': return 'TikTok';
    }
  };

  const getQuickLink = () => {
    if (!data.url || data.url === '#') return null;
    return data.url;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 animate-fadeIn"
      style={{ 
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        pointerEvents: 'auto'
      }}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="text-lg sm:text-xl flex-shrink-0">{getIcon()}</div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-white truncate">
              {getPlatformName()}
            </h2>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {getQuickLink() && (
              <a
                href={getQuickLink()!}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1 hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
                <span className="hidden sm:inline">Open</span>
              </a>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
          }}
        >
          {type === 'instagram' && <InstagramContent data={data} />}
          {type === 'youtube' && <YouTubeContent data={data} />}
          {type === 'spotify' && <SpotifyContent data={data} />}
          {type === 'tiktok' && <TikTokContent data={data} />}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Instagram Content
function InstagramContent({ data }: { data: any }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Image */}
      <div className="relative aspect-square max-w-lg mx-auto rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
        <img
          src={data.imageUrl}
          alt={data.caption}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-around p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg sm:rounded-xl">
        <div className="text-center">
          <div className="flex items-center justify-center text-xl sm:text-2xl text-red-500 mb-1">
            <FaHeart />
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            {data.likes > 1000 ? `${(data.likes / 1000).toFixed(1)}K` : data.likes}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Likes</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-xl sm:text-2xl text-blue-500 mb-1">
            <FaComment />
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            {data.comments > 1000 ? `${(data.comments / 1000).toFixed(1)}K` : data.comments}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Comments</div>
        </div>
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">Caption</h3>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {data.caption}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {data.uploadDate}
        </p>
      </div>
    </div>
  );
}

// YouTube Content
function YouTubeContent({ data }: { data: any }) {
  const { t } = useTranslation();
  
  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    if (!url || url === '#') return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(data.url);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Video Player or Thumbnail */}
      {videoId ? (
        <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-black shadow-xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&controls=1`}
            title={data.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            frameBorder="0"
            className="w-full h-full"
            style={{ 
              border: 'none',
              pointerEvents: 'auto',
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      ) : (
        <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20">
          <img
            src={data.thumbnail}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center">
              <FaPlay className="text-white ml-1" size={28} />
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg sm:rounded-xl">
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
            {data.views > 1000 ? `${(data.views / 1000).toFixed(1)}K` : data.views}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
            {data.likes > 1000 ? `${(data.likes / 1000).toFixed(1)}K` : data.likes || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Likes</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
            {data.comments || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Comments</div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-white line-clamp-2">{data.title}</h3>
        {data.description && (
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {data.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>{data.uploadDate}</span>
          {data.duration && <span>{data.duration}</span>}
        </div>
      </div>
    </div>
  );
}

// Spotify Content
function SpotifyContent({ data }: { data: any }) {
  const { t } = useTranslation();
  
  // Extract Spotify ID from URL
  const getSpotifyId = (url: string) => {
    if (!url || url === '#') return null;
    const match = url.match(/(?:spotify\.com\/(?:intl-\w+\/)?(?:track|episode|playlist|show)\/|spotify:(?:track|episode|playlist|show):)([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const spotifyId = getSpotifyId(data.url);
  const embedType = data.type === 'podcast' ? 'episode' : 'playlist';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Spotify Player or Cover */}
      {spotifyId ? (
        <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-xl" style={{ minHeight: '352px' }}>
          <iframe
            src={`https://open.spotify.com/embed/${embedType}/${spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
            style={{ 
              border: 'none',
              pointerEvents: 'auto',
              width: '100%',
              height: '352px'
            }}
          />
        </div>
      ) : (
        <div className="relative aspect-square max-w-sm mx-auto rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          <img
            src={data.coverUrl}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center">
              {data.type === 'podcast' ? (
                <FaHeadphones className="text-white" size={28} />
              ) : (
                <FaMusic className="text-white" size={24} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="space-y-3 sm:space-y-4">
        <div className="text-center">
          <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs sm:text-sm font-semibold mb-2">
            {data.type === 'podcast' ? (
              <span className="flex items-center">
                <FaHeadphones className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Podcast
              </span>
            ) : (
              <span className="flex items-center">
                <FaMusic className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Playlist
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
            {data.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {data.episodesOrTracks} {data.type === 'podcast' ? t('socialMediaPage.episodes') : t('socialMediaPage.tracks')}
          </p>
        </div>

        {data.description && (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg sm:rounded-xl">
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
              {data.description}
            </p>
          </div>
        )}

        {data.totalDuration && (
          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Total Duration: {data.totalDuration}
          </div>
        )}
      </div>
    </div>
  );
}

// TikTok Content
function TikTokContent({ data }: { data: any }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Video Thumbnail */}
        <div className="lg:w-1/2">
          <div className="relative aspect-[9/16] max-w-xs sm:max-w-sm mx-auto rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-cyan-100 to-pink-100 dark:from-cyan-900/20 dark:to-pink-900/20">
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <FaPlay className="text-white ml-1" size={24} />
              </div>
            </div>
            
            {/* Views Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold">
              {data.views > 1000 ? `${(data.views / 1000).toFixed(1)}K` : data.views} views
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="lg:w-1/2 space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4 line-clamp-2">
              {data.title}
            </h3>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-cyan-50 to-pink-50 dark:from-cyan-900/20 dark:to-pink-900/20 rounded-lg sm:rounded-xl">
            <div className="text-center">
              <div className="flex items-center justify-center text-lg sm:text-2xl text-red-500 mb-1 sm:mb-2">
                <FaHeart />
              </div>
              <div className="text-base sm:text-xl font-bold text-gray-800 dark:text-white">
                {data.likes > 1000 ? `${(data.likes / 1000).toFixed(1)}K` : data.likes}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Likes</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-lg sm:text-2xl text-blue-500 mb-1 sm:mb-2">
                <FaComment />
              </div>
              <div className="text-base sm:text-xl font-bold text-gray-800 dark:text-white">
                {data.comments > 1000 ? `${(data.comments / 1000).toFixed(1)}K` : data.comments}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Comments</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-lg sm:text-2xl text-green-500 mb-1 sm:mb-2">
                <FaShare />
              </div>
              <div className="text-base sm:text-xl font-bold text-gray-800 dark:text-white">
                {data.shares > 1000 ? `${(data.shares / 1000).toFixed(1)}K` : data.shares}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Shares</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

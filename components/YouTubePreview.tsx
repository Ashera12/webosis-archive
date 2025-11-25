'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FaPlay, FaEye, FaClock } from 'react-icons/fa';
import SocialMediaModal from './SocialMediaModal';

interface YouTubeVideo {
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

interface YouTubePreviewProps {
  videos: YouTubeVideo[];
}

export default function YouTubePreview({ videos }: YouTubePreviewProps) {
  const { t } = useTranslation();
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (videoId: string) => {
    setImageErrors(prev => new Set(prev).add(videoId));
  };

  const getThumbnailSrc = (video: YouTubeVideo) => {
    if (imageErrors.has(video.id)) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iI0ZGMDAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMzIiIGZvbnQtZmFtaWx5PSJBcmlhbCI+WW91VHViZTwvdGV4dD48L3N2Zz4=';
    }
    return video.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          onClick={() => setSelectedVideo(video)}
          className="group relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          onMouseEnter={() => setHoveredVideo(video.id)}
          onMouseLeave={() => setHoveredVideo(null)}
        >
          {/* Pinned Badge */}
          {video.isPinned && (
            <div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
              <i className="fas fa-star text-[8px]"></i>
            </div>
          )}

          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 overflow-hidden">
            <img
              src={getThumbnailSrc(video)}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => handleImageError(video.id)}
              loading="lazy"
            />
            
            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 bg-black/90 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
              {video.duration}
            </div>

            {/* Play Button Overlay */}
            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${
              hoveredVideo === video.id ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-600 rounded-full flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 shadow-xl">
                <FaPlay className="text-white ml-0.5" size={16} />
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-2.5 md:p-3">
            <h4 className="text-xs md:text-sm font-bold text-gray-800 dark:text-white mb-1.5 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
              {video.title}
            </h4>
            
            <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <FaEye size={10} />
                <span>{video.views > 1000 ? (video.views / 1000).toFixed(1) + 'K' : video.views}</span>
              </span>
              <span className="text-[9px] md:text-[10px]">{video.uploadDate}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Modal */}
    {selectedVideo && (
      <SocialMediaModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        type="youtube"
        data={selectedVideo}
      />
    )}
    </>
  );
}

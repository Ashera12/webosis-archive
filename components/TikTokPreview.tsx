'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FaHeart, FaComment, FaShare, FaPlay } from 'react-icons/fa';
import SocialMediaModal from './SocialMediaModal';

interface TikTokVideo {
  id: string;
  thumbnail: string;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isPinned?: boolean;
  url?: string;
}

interface TikTokPreviewProps {
  videos: TikTokVideo[];
}

export default function TikTokPreview({ videos }: TikTokPreviewProps) {
  const { t } = useTranslation();
  const [selectedVideo, setSelectedVideo] = useState<TikTokVideo | null>(null);

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <i className="fab fa-tiktok mr-3"></i>
          {t('socialMediaPage.trendingVideos')}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer"
          >
            {/* Pinned Badge */}
            {video.isPinned && (
              <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                <i className="fas fa-thumbtack mr-1"></i>
              </div>
            )}

            {/* Video Thumbnail */}
            <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* TikTok Style Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <FaPlay className="text-white ml-1" size={18} />
                  </div>
                </div>

                {/* Stats */}
                <div className="absolute bottom-3 left-3 right-3 space-y-2">
                  <p className="text-white text-xs font-semibold line-clamp-2">{video.title}</p>
                  
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="flex items-center">
                      <FaHeart className="mr-1 text-red-500" size={12} />
                      {video.likes > 1000 ? `${(video.likes / 1000).toFixed(1)}K` : video.likes}
                    </span>
                    <span className="flex items-center">
                      <FaComment className="mr-1" size={12} />
                      {video.comments}
                    </span>
                    <span className="flex items-center">
                      <FaShare className="mr-1" size={12} />
                      {video.shares}
                    </span>
                  </div>
                </div>
              </div>

              {/* Views Badge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold">
                {video.views > 1000 ? `${(video.views / 1000).toFixed(1)}K` : video.views} views
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Modal */}
    {selectedVideo && (
      <SocialMediaModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        type="tiktok"
        data={selectedVideo}
      />
    )}
    </>
  );
}

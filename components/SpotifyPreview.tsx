'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FaPlay, FaMusic, FaHeadphones } from 'react-icons/fa';
import SocialMediaModal from './SocialMediaModal';

interface SpotifyContent {
  id: string;
  title: string;
  type: 'podcast' | 'playlist';
  coverUrl: string;
  description: string;
  episodesOrTracks: number;
  totalDuration?: string;
  isPinned?: boolean;
  url?: string;
}

interface SpotifyPreviewProps {
  content: SpotifyContent[];
}

export default function SpotifyPreview({ content }: SpotifyPreviewProps) {
  const { t } = useTranslation();
  const [selectedContent, setSelectedContent] = useState<SpotifyContent | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
      {content.map((item) => (
        <div
          key={item.id}
          onClick={() => setSelectedContent(item)}
          className="group relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
        >
          {/* Pinned Badge */}
          {item.isPinned && (
            <div className="absolute top-1.5 right-1.5 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
              <i className="fas fa-star text-[8px]"></i>
            </div>
          )}

          {/* Cover Art */}
          <div className="relative aspect-square bg-gradient-to-br from-green-200 to-emerald-300 dark:from-green-800 dark:to-emerald-900 overflow-hidden">
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl">
                <FaPlay className="text-white ml-0.5" size={14} />
              </div>
            </div>

            {/* Type Badge */}
            <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-semibold flex items-center">
              {item.type === 'podcast' ? (
                <>
                  <FaHeadphones size={8} className="mr-0.5" />
                  <span className="hidden md:inline">Podcast</span>
                </>
              ) : (
                <>
                  <FaMusic size={8} className="mr-0.5" />
                  <span className="hidden md:inline">Playlist</span>
                </>
              )}
            </div>
          </div>

          {/* Content Info */}
          <div className="p-2 md:p-2.5">
            <h4 className="text-xs md:text-sm font-bold text-gray-800 dark:text-white mb-1 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight">
              {item.title}
            </h4>
            
            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
              <span>
                {item.episodesOrTracks} {item.type === 'podcast' ? t('socialMediaPage.episodes') : t('socialMediaPage.tracks')}
              </span>
            </div>
          </div>

          {/* Green Accent Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </div>
      ))}
    </div>

    {/* Modal */}
    {selectedContent && (
      <SocialMediaModal
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        type="spotify"
        data={selectedContent}
      />
    )}
    </>
  );
}


"use client";

import React from 'react';
import Image from 'next/image';

type TrendItem = {
  id: string;
  platform: 'Instagram' | 'YouTube' | 'TikTok' | 'Spotify' | string;
  title: string;
  thumbnail?: string;
  metricLabel: string;
  metricValue: number;
  url?: string;
};

type Props = {
  items: TrendItem[];
  max?: number;
};

const platformIcon = (p: string) => {
  switch (p) {
    case 'Instagram': return 'fab fa-instagram text-pink-500';
    case 'YouTube': return 'fab fa-youtube text-red-600';
    case 'TikTok': return 'fab fa-tiktok text-black';
    case 'Spotify': return 'fab fa-spotify text-green-500';
    default: return 'fas fa-share-alt text-gray-600';
  }
};

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return String(n);
};

type PropsExtended = Props & {
  onOpenTrendingAction?: () => void;
};

const TrendingNow: React.FC<PropsExtended> = ({ items, max = 4, onOpenTrendingAction }) => {
  const top = (items || []).slice(0, max);

  if (!top || top.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-gray-200 dark:border-slate-700 p-4 text-center text-sm text-gray-500">Tidak ada data trending saat ini</div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Trending Now</h5>
        {onOpenTrendingAction ? (
          <button onClick={onOpenTrendingAction} className="text-xs text-blue-600 hover:underline">Lihat semua</button>
        ) : null}
      </div>
      <div className="space-y-3">
        {top.map((it, idx) => (
          <a key={it.id || idx} href={it.url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <div className="relative w-14 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {it.thumbnail ? (
                <Image 
                  src={it.thumbnail} 
                  alt={it.title} 
                  fill
                  sizes="56px"
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">—</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{it.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">{it.metricLabel}</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                  <i className={`${platformIcon(it.platform)} w-4`} />
                  <span>{it.platform}</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatNumber(it.metricValue)}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TrendingNow;

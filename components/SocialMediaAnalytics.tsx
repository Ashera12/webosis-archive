'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FaArrowUp, FaArrowDown, FaChartLine, FaUsers, FaHeart, FaEye } from 'react-icons/fa';

interface AnalyticsData {
  platform: string;
  icon: string;
  currentFollowers: number;
  growth: number; // percentage
  growthType: 'up' | 'down';
  totalEngagement: number;
  avgEngagementRate: number;
  topContent: {
    title: string;
    engagement: number;
  };
  color: string;
  gradient: string;
}

interface SocialMediaAnalyticsProps {
  data: AnalyticsData[];
}

export default function SocialMediaAnalytics({ data }: SocialMediaAnalyticsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center">
          <FaChartLine className="mr-4 text-yellow-500" />
          {t('socialMediaPage.analyticsOverview')}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {t('socialMediaPage.analyticsDesc')}
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((platform, index) => (
          <div
            key={platform.platform}
            className={`group relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden animate-fade-in-up`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
            
            <div className="relative z-10 p-8">
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${platform.gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${platform.icon} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {platform.platform}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('socialMediaPage.analytics')}
                    </p>
                  </div>
                </div>

                {/* Growth Badge */}
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  platform.growthType === 'up' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {platform.growthType === 'up' ? (
                    <FaArrowUp className="text-sm" />
                  ) : (
                    <FaArrowDown className="text-sm" />
                  )}
                  <span className="font-bold text-lg">{Math.abs(platform.growth)}%</span>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Followers */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-5 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <FaUsers className={`text-2xl ${platform.color}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      {t('socialMediaPage.followers')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {platform.currentFollowers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('socialMediaPage.totalFollowers')}
                  </p>
                </div>

                {/* Engagement */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-5 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <FaHeart className={`text-2xl ${platform.color}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      {t('socialMediaPage.engagement')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">
                    {platform.totalEngagement.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {platform.avgEngagementRate}% {t('socialMediaPage.avgRate')}
                  </p>
                </div>
              </div>

              {/* Top Content */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-5 border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                    <i className="fas fa-star text-yellow-500 mr-2"></i>
                    {t('socialMediaPage.topContent')}
                  </span>
                  <FaEye className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 font-medium">
                  {platform.topContent.title}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{platform.topContent.engagement.toLocaleString()} {t('socialMediaPage.interactions')}</span>
                  <span className="bg-yellow-500 text-white px-2 py-1 rounded-full font-semibold">
                    {t('socialMediaPage.trending')}
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative Corner */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${platform.gradient} opacity-10 rounded-bl-full transform group-hover:scale-150 transition-transform duration-700`} />
          </div>
        ))}
      </div>
    </div>
  );
}

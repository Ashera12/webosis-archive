'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface StatItem {
  platform: string;
  count: number;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  target: number;
  growth?: number; // Growth percentage
}

interface SocialStatsProps {
  stats: StatItem[];
}

const SocialStats: React.FC<SocialStatsProps> = ({ stats }) => {
  const [animatedStats, setAnimatedStats] = useState<Record<string, number>>({});
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Helper to format numbers with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          startCountAnimation();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const startCountAnimation = () => {
    stats.forEach((stat) => {
      let current = 0;
      const increment = stat.target / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.target) {
          current = stat.target;
          clearInterval(timer);
        }
        setAnimatedStats(prev => ({ 
          ...prev, 
          [stat.platform]: Math.floor(current) 
        }));
      }, 20);
    });
  };

  return (
    <div ref={statsRef} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12">
      <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
        {t('socialMediaPage.socialMediaReach')}
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.platform}
            className={`text-center p-6 rounded-2xl ${stat.bgColor} transform hover:scale-105 transition-all duration-500 group cursor-pointer`}
            style={{ 
              animationDelay: `${index * 100}ms`,
              animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
            }}
          >
            {/* Icon with Pulse Effect */}
            <div className="relative inline-block mb-4">
              <i className={`${stat.icon} text-4xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}></i>
              
              {/* Pulse Ring */}
              <div className={`absolute inset-0 rounded-full ${stat.color.replace('text-', 'border-')} border-2 opacity-0 group-hover:opacity-100 animate-ping`} />
            </div>

            {/* Animated Counter */}
            <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2 transition-all duration-300`}>
              {formatNumber(animatedStats[stat.platform] || 0)}
            </div>

            {/* Label */}
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {stat.platform} {stat.label}
            </p>

            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 ${stat.color.replace('text-', 'bg-')} rounded-full transition-all duration-1000 ease-out`}
                style={{ 
                  width: isVisible ? `${Math.min((animatedStats[stat.platform] || 0) / stat.target * 100, 100)}%` : '0%' 
                }}
              />
            </div>

            {/* Growth Indicator - Fixed values to avoid hydration error */}
            <div className="mt-2 flex items-center justify-center text-sm text-green-600 dark:text-green-400">
              <i className="fas fa-arrow-up mr-1"></i>
              <span>+{stat.growth || 15}% this month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total Reach */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl p-8 text-white">
          <h4 className="text-2xl font-bold mb-4">{t('socialMedia.totalReach')}</h4>
          <div className="text-5xl font-bold mb-2">
            {formatNumber(Object.values(animatedStats).reduce((sum, count) => sum + count, 0))}
          </div>
          <p className="text-white/90">{t('socialMedia.totalFollowers')}</p>
        </div>
      </div>
    </div>
  );
};

export default SocialStats;
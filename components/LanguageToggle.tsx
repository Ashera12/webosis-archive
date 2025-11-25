'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleLanguage}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-gradient-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 hover:border-gray-400/60 dark:hover:border-gray-500/60 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-lg hover:shadow-2xl transform hover:scale-105"
        aria-label={`Switch to ${language === 'id' ? 'English' : 'Indonesian'}`}
        title={`Switch to ${language === 'id' ? 'English' : 'Indonesian'}`}
      >
        {/* Animated Background Glow */}
        <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-700 ${
          language === 'id' 
            ? 'bg-gradient-to-br from-red-500/30 via-white/20 to-red-600/30' 
            : 'bg-gradient-to-br from-blue-500/30 via-white/20 to-indigo-600/30'
        } ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`} />
        
        {/* ID Flag Button */}
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
          language === 'id' 
            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50 scale-100' 
            : 'bg-gray-300/50 dark:bg-gray-700/50 scale-90 opacity-60'
        }`}>
          <span className={`text-xl transition-all duration-500 ${
            language === 'id' ? 'scale-100 drop-shadow-lg' : 'scale-75'
          }`}>🇮🇩</span>
          
          {/* Active indicator ring */}
          {language === 'id' && (
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-pulse" />
          )}
        </div>

        {/* EN Flag Button */}
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
          language === 'en' 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50 scale-100' 
            : 'bg-gray-300/50 dark:bg-gray-700/50 scale-90 opacity-60'
        }`}>
          <span className={`text-xl transition-all duration-500 ${
            language === 'en' ? 'scale-100 drop-shadow-lg' : 'scale-75'
          }`}>🇬🇧</span>
          
          {/* Active indicator ring */}
          {language === 'en' && (
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-pulse" />
          )}
        </div>

        {/* Sliding Active Indicator Background */}
        <div className={`absolute top-1.5 w-10 h-10 rounded-full transition-all duration-500 ease-out ${
          language === 'id'
            ? 'left-1.5 bg-gradient-to-br from-red-400/20 to-red-600/20'
            : 'left-[calc(100%-2.5rem-0.375rem)] bg-gradient-to-br from-blue-400/20 to-indigo-600/20'
        } blur-md -z-10`} />
      </button>

      {/* Enhanced Tooltip */}
      <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none ${
        isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}>
        <div className="relative px-4 py-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-white text-xs font-medium rounded-xl shadow-2xl border border-gray-700/50 dark:border-gray-600/50 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className={`transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
              {language === 'id' ? '🇬🇧' : '🇮🇩'}
            </span>
            <span className="whitespace-nowrap">
              {language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            </span>
          </div>
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 rotate-45 border-l border-t border-gray-700/50 dark:border-gray-600/50" />
        </div>
      </div>
    </div>
  );
};

export default LanguageToggle;

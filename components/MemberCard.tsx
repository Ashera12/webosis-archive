'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';

interface Member {
  id: number;
  name: string;
  position: string;
  description: string;
  image: string;
  department?: string;
}

interface MemberCardProps {
  member: Member;
  isLeader?: boolean;
  delay?: number;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isLeader = false, delay = 0 }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const handleImageError = () => {
    setImageError(true);
  };

  // Use language-specific placeholder if image is the default placeholder
  const getImageSrc = () => {
    if (member.image === '/images/placeholder.svg') {
      return language === 'en' ? '/images/placeholder-en.svg' : '/images/placeholder.svg';
    }
    return member.image;
  };

  const isPlaceholder = member.image === '/images/placeholder.svg';

  const handleImageClick = () => {
    if (isPlaceholder) {
      showToast(t('toast.photoNotAvailable'), 'info');
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group hover:scale-105 relative ${
        isLeader ? 'border-2 sm:border-4 border-yellow-400 shadow-yellow-400/20' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image Container */}
      <div 
        className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 aspect-square"
        onClick={handleImageClick}
        style={{ cursor: isPlaceholder ? 'pointer' : 'default' }}
      >
        {!imageError ? (
          <img
            src={getImageSrc()}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
            <div className="text-center px-4">
              <i className="fas fa-user-circle text-4xl sm:text-5xl lg:text-6xl text-gray-400 dark:text-gray-500 mb-2 sm:mb-4"></i>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{t('galleryPage.photoNotAvailable')}</p>
            </div>
          </div>
        )}
        
        {/* Animated Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Leader Badge */}
        {isLeader && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse shadow-lg">
            <i className="fas fa-crown mr-1"></i>
            Leader
          </div>
        )}

        {/* Position Badge: always visible on small screens, hover-visible on md+ */}
        <div className={`absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm transition-opacity duration-200 ${
          isLeader 
            ? 'bg-yellow-400/90 text-slate-900' 
            : 'bg-blue-500/90 text-white'
        } md:opacity-0 md:group-hover:opacity-100 opacity-100`}>
          {member.position}
        </div>


      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 lg:p-6 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-transparent via-gray-200 to-transparent dark:via-gray-600" />
        </div>

        <div className="relative z-10">
          <h3 className={`font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300 ${
            isLeader ? 'text-lg sm:text-xl lg:text-2xl' : 'text-base sm:text-lg lg:text-xl'
          } ${isHovered ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {member.name}
          </h3>
          
          <p className={`font-semibold mb-3 transition-colors duration-300 ${
            isLeader 
              ? 'text-yellow-600 dark:text-yellow-400 text-lg' 
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {member.position}
          </p>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
            {member.description}
          </p>

          {/* Stats or Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="flex items-center">
              <i className="fas fa-calendar mr-1"></i>
              2024-2025
            </span>
            <span className="flex items-center">
              <i className="fas fa-star mr-1"></i>
              Active
            </span>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isLeader ? 'bg-yellow-400' : 'bg-blue-400'
                } ${isHovered ? 'scale-125' : 'opacity-60'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Hover Glow Effect */}
        {isHovered && (
          <div className={`absolute inset-0 rounded-2xl ${
            isLeader 
              ? 'bg-gradient-to-r from-yellow-400/10 to-amber-500/10' 
              : 'bg-gradient-to-r from-blue-400/10 to-indigo-500/10'
          } transition-opacity duration-300`} />
        )}
      </div>

      {/* Interactive Border */}
      <div className={`absolute inset-0 border-2 border-transparent rounded-2xl transition-all duration-300 pointer-events-none ${
        isHovered 
          ? isLeader 
            ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' 
            : 'border-blue-400 shadow-lg shadow-blue-400/20'
          : ''
      }`} />

      {/* Corner Accent */}
      <div className={`absolute top-0 right-0 w-16 h-16 ${
        isLeader 
          ? 'bg-gradient-to-bl from-yellow-400/20 to-transparent' 
          : 'bg-gradient-to-bl from-blue-400/20 to-transparent'
      } rounded-bl-2xl transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
};

export default MemberCard;
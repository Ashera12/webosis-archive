'use client';

import React from 'react';

interface MissionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const MissionCard: React.FC<MissionCardProps> = ({ icon, title, description }) => {
  return (
    <div className="group relative h-full">
      {/* Enhanced background decoration */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-50 transition-all duration-500 group-hover:blur-xl" />
      
      <div className="relative card-gradient dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-lg sm:rounded-xl shadow-2xl p-6 sm:p-8 text-center card-hover h-full flex flex-col border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
        
        {/* Floating background elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-500 delay-200" />
        
        {/* Icon container with enhanced effects */}
        <div className="relative mb-6 sm:mb-8 z-10">
          <div className="relative">
            <div className="mission-icon rounded-2xl sm:rounded-3xl inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
              <div className="text-white text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
            </div>
            
            {/* Multiple glow layers */}
            <div className="absolute inset-0 mission-icon rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition-all duration-500" />
            <div className="absolute inset-0 mission-icon rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-700 scale-150" />
            
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-3xl border-2 border-yellow-400/30 group-hover:scale-125 group-hover:border-yellow-400/50 transition-all duration-500" />
          </div>
        </div>

        {/* Enhanced content */}
        <div className="flex-grow z-10">
          <h3 className="heading-secondary text-lg sm:text-xl lg:text-2xl text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-all duration-300 group-hover:scale-105">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
            {description}
          </p>
        </div>

        {/* Enhanced bottom decoration */}
        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 z-10">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-yellow-400 rounded-full group-hover:scale-125 transition-transform duration-300" />
            <div className="w-2 h-2 bg-amber-500 rounded-full group-hover:scale-125 transition-transform duration-300 delay-100" />
            <div className="w-2 h-2 bg-yellow-600 rounded-full group-hover:scale-125 transition-transform duration-300 delay-200" />
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full mx-auto opacity-60 group-hover:opacity-100 group-hover:w-20 transition-all duration-500" />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      </div>
    </div>
  );
};

export default MissionCard;
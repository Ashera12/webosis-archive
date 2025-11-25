'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${
          theme === 'light' 
            ? 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20' 
            : 'bg-gradient-to-br from-blue-400/20 to-indigo-500/20'
        } ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="relative w-7 h-7 overflow-hidden">
          {/* Sun Icon */}
          <div className={`absolute inset-0 transform transition-all duration-700 ease-in-out ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-180 scale-0 opacity-0'
          }`}>
            <svg
              className="w-7 h-7 text-yellow-500 group-hover:text-yellow-600 transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
          </div>

          {/* Moon Icon */}
          <div className={`absolute inset-0 transform transition-all duration-700 ease-in-out ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-180 scale-0 opacity-0'
          }`}>
            <svg
              className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Sparkle effects */}
          <div className={`absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full transition-all duration-500 ${
            theme === 'light' && isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`} />
          <div className={`absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-300 rounded-full transition-all duration-700 ${
            theme === 'dark' && isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`} />
        </div>

        {/* Ripple effect */}
        <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
          isHovered 
            ? theme === 'light'
              ? 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
              : 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
            : ''
        }`} />
      </button>

      {/* Tooltip */}
      <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap transition-all duration-300 ${
        isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}>
        {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
      </div>
    </div>
  );
};

export default ThemeToggle;
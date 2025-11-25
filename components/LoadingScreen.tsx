'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isVisible, 
  progress = 0, 
  message = "Memuat halaman..." 
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" suppressHydrationWarning>
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
            {[...Array(64)].map((_, i) => (
              <div 
                key={i} 
                className="border border-yellow-400/20 animate-pulse"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
            <div className="relative inline-block">
            <img
              src="/images/logo-2.png"
              alt="OSIS Logo"
              className="w-24 h-24 rounded-full shadow-2xl animate-pulse-glow mx-auto"
            />
            
            {/* Rotating Rings */}
            <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-spin" 
                 style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-4 border border-blue-400/20 rounded-full animate-spin" 
                 style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
            OSIS SMK INFORMATIKA FITHRAH INSANI
          </h2>
          <p className="text-yellow-400 font-medium text-lg">Dirgantara 2025</p>
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-8 bg-gradient-to-t from-yellow-400 to-amber-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          
          {/* Loading Text */}
          <p className="text-gray-300 text-lg">
            {message}{dots}
          </p>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-80 mx-auto">
            <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 h-2 rounded-full transition-all duration-300 relative"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute -top-8 -left-8 w-4 h-4 bg-yellow-400/60 rounded-full animate-bounce" 
             style={{ animationDelay: '0.5s' }} />
        <div className="absolute -top-4 -right-12 w-3 h-3 bg-blue-400/60 rounded-full animate-bounce" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-6 -left-10 w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" 
             style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-8 -right-8 w-3 h-3 bg-green-400/60 rounded-full animate-bounce" 
             style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

export default LoadingScreen;
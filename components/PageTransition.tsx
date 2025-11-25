'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering for random progress
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    setIsLoading(true);
    setProgress(0);
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 50);

    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        clearInterval(progressInterval);
      }, 200);
    }, 600);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [pathname, children, mounted]);

  return (
    <div className="relative min-h-screen" suppressHydrationWarning>
      <LoadingScreen 
        isVisible={isLoading} 
        progress={progress}
        message="Memuat halaman"
      />

      {/* Page Content */}
      <div
        className={`transition-all duration-700 ease-in-out ${
          isLoading 
            ? 'opacity-0 transform translate-y-8 scale-95' 
            : 'opacity-100 transform translate-y-0 scale-100'
        }`}
        suppressHydrationWarning
      >
        {displayChildren}
      </div>
    </div>
  );
};

export default PageTransition;
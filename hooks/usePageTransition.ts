'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface UsePageTransitionReturn {
  isTransitioning: boolean;
  navigateWithTransition: (href: string) => void;
  transitionProgress: number;
}

export const usePageTransition = (): UsePageTransitionReturn => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const navigateWithTransition = (href: string) => {
    if (href === pathname) return;

    setIsTransitioning(true);
    setTransitionProgress(0);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setTransitionProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 30;
      });
    }, 50);

    // Navigate after transition animation
    setTimeout(() => {
      router.push(href);
      clearInterval(progressInterval);
      setTransitionProgress(100);
      
      // Complete transition
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionProgress(0);
      }, 200);
    }, 300);
  };

  useEffect(() => {
    // Reset transition state on route change
    setIsTransitioning(false);
    setTransitionProgress(0);
  }, [pathname]);

  return {
    isTransitioning,
    navigateWithTransition,
    transitionProgress
  };
};

export default usePageTransition;
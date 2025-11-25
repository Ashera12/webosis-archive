'use client';

import React, { useEffect, useState } from 'react';

interface PageEnterAnimationProps {
  children: React.ReactNode;
  delay?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
}

const PageEnterAnimation: React.FC<PageEnterAnimationProps> = ({ 
  children, 
  delay = 0,
  animation = 'fade'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animationClasses = {
    fade: isVisible 
      ? 'opacity-100 transform translate-y-0' 
      : 'opacity-0 transform translate-y-4',
    slide: isVisible 
      ? 'opacity-100 transform translate-x-0' 
      : 'opacity-0 transform translate-x-8',
    scale: isVisible 
      ? 'opacity-100 transform scale-100' 
      : 'opacity-0 transform scale-95',
    bounce: isVisible 
      ? 'opacity-100 transform translate-y-0' 
      : 'opacity-0 transform translate-y-8'
  };

  return (
    <div 
      className={`transition-all duration-700 ease-out ${animationClasses[animation]}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default PageEnterAnimation;
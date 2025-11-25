'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationTransitionProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavigationTransition: React.FC<NavigationTransitionProps> = ({ 
  href, 
  children, 
  className = '',
  onClick 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (href === pathname) return;
    
    if (onClick) onClick();
    
    setIsTransitioning(true);
    
    // Add page exit animation
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      router.push(href);
    }, 300);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      setIsTransitioning(false);
      document.body.style.overflow = 'auto';
    };

    // Reset transition state when route changes
    handleRouteChange();
  }, [pathname]);

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className={`${className} transition-all duration-300 hover:scale-105 active:scale-95`}
      >
        {children}
      </a>
      
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Sliding Curtain Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 transform translate-x-full animate-slide-in" />
          
          {/* Ripple Effect */}
          <div className="absolute inset-0 bg-yellow-400/10 animate-ripple" />
          
          {/* Loading Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationTransition;
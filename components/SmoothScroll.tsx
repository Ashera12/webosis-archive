'use client';

import React, { useEffect } from 'react';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  useEffect(() => {
    // Enhanced smooth scrolling
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      
      if (target.tagName === 'A' && target.hash) {
        e.preventDefault();
        
        const targetElement = document.querySelector(target.hash);
        if (targetElement) {
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          // Add loading animation to target
          targetElement.classList.add('animate-pulse');
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Remove animation after scroll
          setTimeout(() => {
            targetElement.classList.remove('animate-pulse');
            targetElement.classList.add('animate-fade-in-up');
            
            setTimeout(() => {
              targetElement.classList.remove('animate-fade-in-up');
            }, 800);
          }, 500);
        }
      }
    };

    // Add scroll reveal animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-reveal class
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => {
      el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700');
      observer.observe(el);
    });

    document.addEventListener('click', handleSmoothScroll);

    return () => {
      document.removeEventListener('click', handleSmoothScroll);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
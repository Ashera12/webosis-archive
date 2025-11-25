'use client';

import { useEffect, useState } from 'react';
import { fetchGlobalBackground } from '@/lib/adminSettings.client';

/**
 * Sync CSS variables with admin background settings
 * Only applies inline styles if admin has set custom background
 */
export default function BackgroundSync() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const syncBackground = async () => {
      try {
        const bg = await fetchGlobalBackground();
        const root = document.documentElement;
        const body = document.body;
        const isDarkMode = root.classList.contains('dark');
        
        console.log('[BackgroundSync] Syncing...', {
          mode: bg.mode,
          isDarkMode,
          hasColor: !!bg.color,
          hasGradient: !!bg.gradient,
        });
        
        // Apply custom background from admin OR use CSS defaults
        if (bg.mode === 'color' && bg.color) {
          // Custom solid color
          body.style.background = bg.color;
          root.style.removeProperty('--gradient-bg');
          console.log('[BackgroundSync] ✅ Applied custom color:', bg.color);
        } else if (bg.mode === 'gradient' && bg.gradient) {
          // Custom gradient
          body.style.background = bg.gradient;
          root.style.removeProperty('--gradient-bg');
          console.log('[BackgroundSync] ✅ Applied custom gradient');
        } else if (bg.mode === 'image' && bg.imageUrl) {
          // Image mode - remove body background, let components handle it
          body.style.removeProperty('background');
          root.style.removeProperty('--gradient-bg');
          console.log('[BackgroundSync] ✅ Image mode - components handle background');
        } else {
          // Use CSS defaults (mode is 'none') - remove all inline styles
          body.style.removeProperty('background');
          root.style.removeProperty('--gradient-bg');
          // Force repaint to ensure CSS media query/class selector takes effect
          void root.offsetHeight;
          console.log('[BackgroundSync] ✅ Using CSS defaults (dark:', isDarkMode, ')');
        }
      } catch (error) {
        console.error('[BackgroundSync] ❌ Error:', error);
      }
    };

    // Sync on mount
    syncBackground();

    // Sync when theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = document.documentElement.classList.contains('dark');
          console.log('[BackgroundSync] Theme toggled, dark:', isDarkNow);
          syncBackground();
        }
      });
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    // Listen for storage events (theme changed in another tab)
    const handleStorageChange = () => {
      console.log('[BackgroundSync] Storage changed in another tab');
      syncBackground();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  return null;
}

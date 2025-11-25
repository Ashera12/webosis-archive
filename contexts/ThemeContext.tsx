'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/safeFetch';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Check for saved theme preference or default to 'light'
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const initialTheme = savedTheme || systemTheme;
      
      // Apply theme immediately to prevent flash
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialTheme);
      
      setThemeState(initialTheme);
    }
  }, []);

  // Update document class and localStorage when theme changes
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      
      // Add transition class for smooth theme change
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
      
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
        document.head.appendChild(meta);
      }
      
      // Remove transition after change completes
      setTimeout(() => {
        root.style.transition = '';
      }, 300);
    }
  }, [theme, mounted]);

  const persist = async (next: Theme) => {
    // Silent background persistence - don't block UI or show errors
    try {
      const response = await apiFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next })
      } as any);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[ThemeContext] Failed to persist theme (non-critical):', errorData);
      }
    } catch (err) {
      // Silently log but don't interrupt user experience
      console.warn('[ThemeContext] Theme persistence error (non-critical):', err);
    }
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => {
      const next = prevTheme === 'light' ? 'dark' : 'light';
      persist(next);
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    persist(newTheme);
  };

  // Always render the provider, but conditionally render theme toggle
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
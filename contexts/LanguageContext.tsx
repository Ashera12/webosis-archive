'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/safeFetch';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');
  const [mounted, setMounted] = useState(false);

  // Check for saved language preference or default to 'id'
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      const initialLanguage = savedLanguage || 'id';
      
      // Apply language to document immediately
      document.documentElement.lang = initialLanguage;
      
      if (initialLanguage !== language) {
        setLanguageState(initialLanguage);
      }
    }
  }, []);

  // Update localStorage when language changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      // Update document lang attribute
      document.documentElement.lang = language;
      // Dispatch custom event for language change
      window.dispatchEvent(new CustomEvent('languageChange', { detail: { language } }));
    }
  }, [language, mounted]);

  const persist = async (next: Language) => {
    try {
      await apiFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: next })
      } as any).catch(() => {});
    } catch (_) {}
  };

  const toggleLanguage = () => {
    const newLang = language === 'id' ? 'en' : 'id';
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLang);
      document.documentElement.lang = newLang;
      persist(newLang);
      window.location.reload();
    }
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    persist(newLanguage);
  };

  const value = {
    language,
    toggleLanguage,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

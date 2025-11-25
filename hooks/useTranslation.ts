'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { t as translate } from '@/lib/translations';
import { useEffect, useState } from 'react';

export const useTranslation = () => {
  const { language } = useLanguage();
  const [currentLang, setCurrentLang] = useState(language);

  // Force update when language changes
  useEffect(() => {
    setCurrentLang(language);
  }, [language]);

  const t = (key: string) => translate(key, currentLang);

  return { t, language: currentLang };
};

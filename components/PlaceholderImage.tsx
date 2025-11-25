'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export default function PlaceholderImage({ 
  width = 400, 
  height = 400, 
  className = '',
  alt = 'Placeholder'
}: PlaceholderImageProps) {
  const { language } = useLanguage();
  
  return (
    <Image
      src={language === 'en' ? '/images/placeholder-en.svg' : '/images/placeholder.svg'}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

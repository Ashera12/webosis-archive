'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getPageContent } from '@/lib/supabase/client';
import { fetchGlobalBackground, type GlobalBackgroundConfig } from '@/lib/adminSettings.client';

interface PageContentData {
  page_key: string;
  content_value: string;
  content_type: string;
}

function DynamicHeroInternal() {
  const { t, language } = useTranslation();
  const [content, setContent] = useState<Record<string, string>>({
    title: '',
    subtitle: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [bg, setBg] = useState<GlobalBackgroundConfig>({ mode: 'gradient' }); // Default gradient instead of 'none'

  useEffect(() => {
    async function loadContent() {
      try {
        const [pageData, bgData] = await Promise.all([
          getPageContent('home'),
          fetchGlobalBackground()
        ]);
        
        const contentMap: Record<string, string> = {};
        
        pageData.forEach((item: PageContentData) => {
          if (item.page_key === 'home_hero_title') {
            contentMap.title = item.content_value;
          } else if (item.page_key === 'home_hero_subtitle') {
            contentMap.subtitle = item.content_value;
          } else if (item.page_key === 'home_hero_description') {
            contentMap.description = item.content_value;
          }
        });

        setContent(prev => ({ ...prev, ...contentMap }));
        // Only update bg if fetch was successful and has valid data
        if (bgData && bgData.mode) {
          setBg(bgData);
        }
      } catch (error) {
        console.error('Error loading hero content:', error);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  // Determine if hero should render background
  // Hero always renders its own background (like /about page)
  // Don't rely on body background
  const shouldRenderHeroBg = true; // Always render background in hero
  
  // Debug logging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[DynamicHero] Background config:', { 
      mode: bg.mode, 
      scope: bg.scope, 
      selectedPages: bg.selectedPages,
      shouldRenderHeroBg,
      hasColor: !!bg.color,
      hasGradient: !!bg.gradient,
      hasImage: !!bg.imageUrl,
      loading
    });
  }

  // Calculate background style (non-image modes). If an imageUrl exists we let the image layers handle it
  const backgroundStyle = (() => {
    // If we have an imageUrl at all, skip inline background so image divs show
    if (bg.imageUrl) return undefined;
    if (bg.mode === 'color' && bg.color) return { background: bg.color };
    if (bg.mode === 'gradient' && bg.gradient) return { background: bg.gradient };
    return { background: 'var(--gradient-bg)' };
  })();

  if (loading) {
    return (
      <section
        className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20"
        style={{ background: 'var(--gradient-bg)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 blur-2xl animate-pulse" />
        </div>
        {/* Skeleton content */}
        <div className="space-y-6 text-center z-10 px-6 w-full max-w-3xl">
          <div className="h-10 bg-white/10 rounded-full mx-auto w-2/3 animate-pulse" />
          <div className="h-6 bg-white/10 rounded-full mx-auto w-1/2 animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl mx-auto w-full animate-pulse" />
        </div>
      </section>
    );
  }

  // Resolve displayed texts: use translations for current language; fallback to CMS for ID
  const displayTitle = language === 'id' ? (content.title || t('home.osisName')) : t('home.osisName');
  const displaySubtitle = language === 'id' ? (content.subtitle || t('home.subtitle')) : t('home.subtitle');
  const displayDescription = language === 'id' ? (content.description || t('home.description')) : t('home.description');
  const labelAbout = t('about.aboutUs');
  const labelGallery = t('home.viewGallery');

  return (
    <section 
      className={"hero-section relative min-h-screen flex items-center justify-center pt-16 md:pt-20 pb-12 sm:pb-16 lg:pb-20 " + (bg.imageStyle === 'cover' || !bg.imageUrl ? 'overflow-hidden' : 'overflow-visible')}
      /* Always apply background - image layers will render on top */
      style={backgroundStyle}
    >
      {/* Image background (render if imageUrl present regardless of mode). Show a debug badge if dev and missing */}
      {bg.imageUrl && (
        bg.imageStyle === 'contain' ? (
          // Contain: image should not crop; overlay only covers the image box
          <ContainBackground bg={bg} />
        ) : bg.imageStyle === 'smart-fit' ? (
          // Smart fit: show full image (like contain) plus subtle blurred fill behind to avoid empty bars
          <SmartFitBackground bg={bg} />
        ) : (
          // 'cover' uses background-image to fill entire hero; overlay spans full container
          <>
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${bg.imageUrl})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: bg.imagePosition || 'center',
                backgroundAttachment: bg.fixed ? 'fixed' : 'scroll'
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
                opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
              }}
            />
          </>
        )
      )}
      {!bg.imageUrl && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-xs px-2 py-1 rounded shadow">No imageUrl</div>
      )}
      
      {/* Animated background particles - Only show when no custom background */}
      {bg.mode === 'none' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <div className="absolute top-20 sm:top-32 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-64 sm:w-96 h-64 sm:h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-75" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[25rem] sm:w-[40rem] h-[25rem] sm:h-[40rem] bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-150" />
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="heading-hero text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 text-white dark:text-gray-100 animate-fade-in-up leading-tight">
            {displayTitle}
          </h1>

          {/* Subtitle */}
          <div className="inline-block mb-6 sm:mb-8 animate-fade-in-up animation-delay-200">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-yellow-300 dark:text-yellow-300 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-full bg-white/10 dark:bg-gray-700/40 backdrop-blur-sm border border-white/20 dark:border-gray-600/40">
              {displaySubtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-blue-100 dark:text-gray-200 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400 px-4">
            {displayDescription}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center animate-fade-in-up animation-delay-600 px-4">
            <a 
              href="/about" 
              className="px-6 sm:px-8 py-3 sm:py-4 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-900 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg text-sm sm:text-base text-center min-h-[48px] flex items-center justify-center"
            >
              {labelAbout}
            </a>
            <a 
              href="/gallery" 
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 hover:bg-white/20 dark:bg-gray-700/40 dark:hover:bg-gray-600/40 backdrop-blur-sm text-white dark:text-gray-100 font-semibold rounded-full border-2 border-white/30 dark:border-gray-600/40 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base text-center min-h-[48px] flex items-center justify-center"
            >
              {labelGallery}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden sm:block absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/70 rounded-full animate-scroll" />
        </div>
      </div>
    </section>
  );
}

const DynamicHero = memo(DynamicHeroInternal);
export default DynamicHero;

// Separate components to keep main hero readable
interface BgProps { bg: GlobalBackgroundConfig }

function ContainBackground({ bg }: BgProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dims, setDims] = useState<{w:number;h:number}|null>(null);
  const measure = () => {
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    }
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 'calc(100vh - 5rem - 3rem)' }}>
      <div className="relative flex items-center justify-center max-h-full">
        <img
          ref={imgRef}
          src={bg.imageUrl}
          alt=""
          className="object-contain max-h-full w-auto max-w-[95vw]"
          style={{ objectPosition: bg.imagePosition || 'center' }}
          onLoad={measure}
        />
        {bg.imageOverlayScope !== 'image' && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
        {bg.imageOverlayScope === 'image' && dims && (
          <div
            className="absolute"
            style={{
              width: dims.w,
              height: dims.h,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
      </div>
    </div>
  );
}

function SmartFitBackground({ bg }: BgProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dims, setDims] = useState<{w:number;h:number}|null>(null);
  const measure = () => {
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    }
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 'calc(100vh - 5rem - 3rem)' }}>
      {/* Blurred fill layer */}
      <div
        className="absolute inset-0 scale-110 blur-2xl opacity-40"
        style={{
          backgroundImage: `url(${bg.imageUrl})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: bg.imagePosition || 'center'
        }}
      />
      <div className="relative flex items-center justify-center">
        <img
          ref={imgRef}
          src={bg.imageUrl}
          alt=""
          className="object-contain max-h-full w-auto max-w-[95vw]"
          style={{ objectPosition: bg.imagePosition || 'center' }}
          onLoad={measure}
        />
        {bg.imageOverlayScope !== 'image' && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
        {bg.imageOverlayScope === 'image' && dims && (
          <div
            className="absolute"
            style={{
              width: dims.w,
              height: dims.h,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
      </div>
    </div>
  );
}

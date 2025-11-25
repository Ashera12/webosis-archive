'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import ClientOnly from './ClientOnly';
import { useTranslation } from '@/hooks/useTranslation';
import { useSession, signOut } from 'next-auth/react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // ESC key to close mobile menu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle hash navigation on page load
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        // Wait for page to load completely
        setTimeout(() => {
          const targetElement = document.getElementById(hash);
          if (targetElement) {
            const yOffset = -80;
            const y = targetElement.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 500);
      }
    };

    // Handle hash on initial load
    handleHashNavigation();

    // Handle hash changes (back/forward navigation)
    window.addEventListener('hashchange', handleHashNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    setIsOpen(false);
    
    // Check if we're on the home page
    const isHomePage = window.location.pathname === '/';
    
    if (isHomePage) {
      // If on home page, scroll to the section
      const targetElement = document.getElementById(id);
      if (targetElement) {
        const yOffset = -80;
        const y = targetElement.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      // If not on home page, navigate to home page with hash
      router.push(`/#${id}`);
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --nav-offset: max(72px, calc(64px + env(safe-area-inset-top)));
          --nav-height: clamp(56px, 12vw, 72px);
        }
        @media (min-width: 640px) {
          :root {
            --nav-offset: max(88px, calc(76px + env(safe-area-inset-top)));
            --nav-height: 76px;
          }
        }
      `}</style>
      <nav 
        role="navigation" 
        aria-label="Main navigation" 
        className={`navbar-fixed fixed top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 right-2 xs:right-3 sm:right-4 z-[100] transition-all duration-300 rounded-xl xs:rounded-2xl overflow-hidden ${
          isScrolled
            ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50'
            : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-xl border border-gray-200/30 dark:border-gray-700/30'
        }`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
      >
        <div className="container mx-auto px-2 xs:px-3 sm:px-4 lg:px-8 py-2 xs:py-2.5 sm:py-3 lg:py-4 flex justify-between items-center relative z-10 gap-2">
          <Link 
            href="/" 
            className="navbar-brand flex items-center gap-1.5 xs:gap-2 sm:gap-3 group relative z-20 flex-shrink min-w-0"
            aria-label={t('navbar.logoAlt')}
          >
            <div className="relative w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden flex-shrink-0">
              <img
                src="/images/logo-2.png"
                alt={t('navbar.logoAlt')}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 group-hover:scale-125 transition-transform duration-300" />
            </div>
            <span className="text-[0.65rem] xs:text-xs sm:text-sm lg:text-base font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent group-hover:from-yellow-700 group-hover:to-amber-700 dark:group-hover:from-yellow-300 dark:group-hover:to-amber-300 transition-all duration-300 leading-tight truncate">
              {t('navbar.brandName')}
            </span>
          </Link>

        {/* Desktop Menu */}
        <div className="navbar-nav hidden lg:flex items-center space-x-2 xl:space-x-4 relative z-20">
          <Link href="/" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="Home">{t('navbar.home')}</Link>
          <Link href="/about" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="About">{t('navbar.about')}</Link>
          <Link href="/info" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="Info">📰 Info</Link>
          <Link href="/bidang" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="Program Kerja">{t('navbar.programKerja')}</Link>
          <Link href="/gallery" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="Gallery">{t('navbar.gallery')}</Link>
          <Link href="/our-social-media" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="Social Media">{t('navbar.socialMedia')}</Link>
          <Link href="/people" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200" aria-label="Members">{t('navbar.members')}</Link>

          {/* Language Toggle */}
          <div className="ml-4">
            <ClientOnly fallback={
              <div className="w-16 h-10 bg-gray-200 rounded-full animate-pulse" />
            }>
              <LanguageToggle />
            </ClientOnly>
          </div>

          {/* Theme Toggle */}
          <div>
            <ClientOnly fallback={
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            }>
              <ThemeToggle />
            </ClientOnly>
          </div>

          {/* Admin/Login Buttons */}
          <div className="flex items-center gap-3 ml-2">
            {!session ? (
              <Link
                href="/admin/login"
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow hover:shadow-md hover:opacity-95 transition"
                aria-label="Login"
              >
                LOGIN
              </Link>
            ) : (
              <>
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-amber-300/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                  aria-label="Dashboard"
                >
                  {t('navbar.dashboard')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  aria-label="Logout"
                >
                  {t('navbar.logout')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Controls */}
        <div className="lg:hidden flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Language Toggle for Mobile */}
          <div className="scale-[0.65] xs:scale-75 sm:scale-85 origin-right">
            <ClientOnly fallback={
              <div className="w-10 h-6 bg-gray-200 rounded-full animate-pulse" />
            }>
              <LanguageToggle />
            </ClientOnly>
          </div>

          {/* Theme Toggle for Mobile */}
          <div className="scale-[0.65] xs:scale-75 sm:scale-85 origin-right">
            <ClientOnly fallback={
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
            }>
              <ThemeToggle />
            </ClientOnly>
          </div>

          {/* Mobile Hamburger Icon */}
          <button
            type="button"
            onClick={toggleMenu}
            className="relative p-1 xs:p-1.5 sm:p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-200 flex-shrink-0"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 flex flex-col justify-center items-center gap-[2.5px]">
              <span className={`block w-full h-[1.5px] bg-current rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
              <span className={`block w-full h-[1.5px] bg-current rounded-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
              <span className={`block w-full h-[1.5px] bg-current rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>
      </nav>

      {/* FASE 1: Premium Backdrop Wrapper */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999] lg:hidden transition-all duration-300 ease-out"
          style={{ 
            backgroundColor: 'var(--overlay-bg, rgba(0, 0, 0, 0.7))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* FASE 2-7: Premium Mobile Menu Panel */}
      <div 
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className={`lg:hidden fixed inset-x-0 top-0 z-[1000] transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Premium Panel Card */}
        <div 
          className={`mx-3 xs:mx-4 mt-3 xs:mt-4 pb-8 rounded-2xl md:rounded-3xl border border-white/10 bg-white/90 dark:bg-[#0F172A]/95 backdrop-blur-xl shadow-2xl shadow-black/50 max-h-[84vh] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-out ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* FASE 4: Navbar Content Mirror - Header dengan Logo, Toggles & Close */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/10 px-4 xs:px-5 py-3 xs:py-3.5 flex items-center justify-between gap-3">
            {/* Logo */}
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 xs:gap-2.5 group flex-shrink-0 min-w-0"
            >
              <div className="relative w-9 h-9 xs:w-10 xs:h-10 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src="/images/logo-2.png"
                  alt={t('navbar.logoAlt')}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 group-hover:scale-125 transition-transform duration-300" />
              </div>
              <span className="text-sm xs:text-base font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent truncate">
                {t('navbar.brandName')}
              </span>
            </Link>

            {/* Controls - Auto-Sync Size */}
            <div className="flex items-center gap-2 xs:gap-2.5 flex-shrink-0">
              {/* Language Toggle - Consistent wrapper */}
              <div className="w-9 h-9 xs:w-10 xs:h-10 flex items-center justify-center flex-shrink-0">
                <div className="scale-[0.8] xs:scale-90 origin-center">
                  <ClientOnly fallback={<div className="w-9 h-9 xs:w-10 xs:h-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-full animate-pulse" />}>
                    <LanguageToggle />
                  </ClientOnly>
                </div>
              </div>

              {/* Theme Toggle - Same size as Language */}
              <div className="w-9 h-9 xs:w-10 xs:h-10 flex items-center justify-center flex-shrink-0">
                <div className="scale-[0.8] xs:scale-90 origin-center">
                  <ClientOnly fallback={<div className="w-9 h-9 xs:w-10 xs:h-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-full animate-pulse" />}>
                    <ThemeToggle />
                  </ClientOnly>
                </div>
              </div>

              {/* Premium Close Button - Proportional to toggles */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 xs:w-11 xs:h-11 rounded-full border border-yellow-500/40 hover:bg-yellow-500/20 backdrop-blur-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-200 flex-shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 xs:w-5.5 xs:h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* FASE 3: Premium Menu Items - Centered & Symmetric */}
          <div className="px-4 xs:px-5 py-5 xs:py-6 space-y-1.5 xs:space-y-2">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to home"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-home w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{t('navbar.home')}</span>
              </span>
            </Link>

            <Link 
              href="/about" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to about"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-info-circle w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{t('navbar.about')}</span>
              </span>
            </Link>

            <Link 
              href="/info" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to information center"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-newspaper w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">Pusat Informasi</span>
              </span>
            </Link>

            <Link 
              href="/bidang" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to programs"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-tasks w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{t('navbar.programKerja')}</span>
              </span>
            </Link>

            <Link 
              href="/gallery" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to gallery"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-images w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{t('navbar.gallery')}</span>
              </span>
            </Link>

            <Link 
              href="/our-social-media" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to social media"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-share-alt w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{t('navbar.socialMedia')}</span>
              </span>
            </Link>

            <Link 
              href="/people" 
              onClick={() => setIsOpen(false)} 
              className="flex flex-col gap-1 px-3 xs:px-4 py-2.5 xs:py-3 min-h-[44px] rounded-xl text-base font-medium tracking-wide opacity-90 hover:opacity-100 hover:bg-white/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-200 group"
              aria-label="Navigate to members"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-users w-5 text-center text-sm group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" aria-hidden="true"></i>
                <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{t('navbar.members')}</span>
              </span>
            </Link>
          </div>

          {/* FASE 5: Premium Login Button */}
          <div className="px-3 xs:px-4 mt-6">
            {!session ? (
              <Link
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className="block w-full py-3.5 xs:py-4 px-6 text-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 text-base xs:text-lg font-semibold rounded-full shadow-[0_4px_12px_rgba(255,200,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,200,0,0.5)] hover:scale-[1.02] transition-all duration-300 active:scale-95"
                aria-label="Login to admin panel"
              >
                LOGIN
              </Link>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 px-4 text-center border-2 border-yellow-500/60 text-yellow-700 dark:text-yellow-400 text-sm xs:text-base font-semibold rounded-full hover:bg-yellow-500/10 hover:border-yellow-500 transition-all duration-200 active:scale-95"
                >
                  {t('navbar.dashboard')}
                </Link>
                <button
                  onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="flex-1 py-3 px-4 text-center bg-gray-200/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 text-sm xs:text-base font-semibold rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 active:scale-95"
                >
                  {t('navbar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
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
    <nav className={`navbar-fixed fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50'
        : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md'
      }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-4 flex justify-between items-center relative z-10">
        <Link href="/" className="navbar-brand flex items-center space-x-2 sm:space-x-3 group relative z-20">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden">
            <img
              src="/images/logo-2.png"
              alt={t('navbar.logoAlt')}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 group-hover:scale-125 transition-transform duration-300" />
          </div>
          <span className="text-xs sm:text-sm lg:text-base font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent group-hover:from-yellow-700 group-hover:to-amber-700 dark:group-hover:from-yellow-300 dark:group-hover:to-amber-300 transition-all duration-300 whitespace-nowrap leading-tight">
            {t('navbar.brandName')}
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-nav hidden lg:flex items-center space-x-2 xl:space-x-4 relative z-20">
          <Link href="/" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">{t('navbar.home')}</Link>
          <Link href="/about" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">{t('navbar.about')}</Link>
          <Link href="/info" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">📰 Info</Link>
          <Link href="/bidang" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">{t('navbar.programKerja')}</Link>
          <Link href="/gallery" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">{t('navbar.gallery')}</Link>
          <Link href="/our-social-media" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">{t('navbar.socialMedia')}</Link>
          <Link href="/people" className="nav-link px-3 py-2 rounded-lg text-sm xl:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200">{t('navbar.members')}</Link>

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
                >
                  {t('navbar.dashboard')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  {t('navbar.logout')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Controls */}
        <div className="lg:hidden flex items-center space-x-2">
          {/* Language Toggle for Mobile */}
          <div className="scale-75 sm:scale-85 origin-right">
            <ClientOnly fallback={
              <div className="w-10 h-6 bg-gray-200 rounded-full animate-pulse" />
            }>
              <LanguageToggle />
            </ClientOnly>
          </div>

          {/* Theme Toggle for Mobile */}
          <div className="scale-75 sm:scale-85 origin-right">
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
            className={`relative p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-lg transition-colors duration-300`}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex flex-col justify-center items-center gap-[3px]">
              <span className={`block w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
              <span className={`block w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden mobile-menu-dropdown transition-all duration-300 border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg ${isOpen ? 'max-h-[calc(100vh-3.5rem)] opacity-100 visible' : 'max-h-0 opacity-0 invisible'
        } overflow-y-auto overflow-x-hidden bg-white/98 dark:bg-gray-900/98 backdrop-blur-lg`}>
        <div className="container mx-auto px-3 py-2 space-y-0.5">
          <Link href="/" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2">
              <i className="fas fa-home w-4 text-center text-xs"></i>
              <span>{t('navbar.home')}</span>
            </span>
          </Link>
          <Link href="/about" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2.5">
              <i className="fas fa-info-circle w-4 text-center text-xs"></i>
              <span>{t('navbar.about')}</span>
            </span>
          </Link>
          <Link href="/info" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2">
              <i className="fas fa-newspaper w-4 text-center text-xs"></i>
              <span>Pusat Informasi</span>
            </span>
          </Link>
          <Link href="/bidang" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2">
              <i className="fas fa-tasks w-4 text-center text-xs"></i>
              <span>{t('navbar.programKerja')}</span>
            </span>
          </Link>
          <Link href="/gallery" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2">
              <i className="fas fa-images w-4 text-center text-xs"></i>
              <span>{t('navbar.gallery')}</span>
            </span>
          </Link>
          <Link href="/our-social-media" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2">
              <i className="fas fa-share-alt w-4 text-center text-xs"></i>
              <span>{t('navbar.socialMedia')}</span>
            </span>
          </Link>
          <Link href="/people" onClick={() => setIsOpen(false)} className="mobile-nav-link block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 active:bg-yellow-100 dark:active:bg-yellow-900/30 transition-all duration-200 font-medium text-sm">
            <span className="flex items-center gap-2">
              <i className="fas fa-users w-4 text-center text-xs"></i>
              <span>{t('navbar.members')}</span>
            </span>
          </Link>

          {/* Admin / Login mobile actions */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
            {!session ? (
              <Link
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className="block w-full py-2 px-4 text-center bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Login"
              >
                LOGIN
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 px-2 text-center border-2 border-amber-400 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 active:scale-95"
                >
                  {t('navbar.dashboard')}
                </Link>
                <button
                  onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="flex-1 py-2 px-2 text-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 active:scale-95"
                >
                  {t('navbar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
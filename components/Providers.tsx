'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import SmoothScroll from './SmoothScroll';
import ClientOnly from './ClientOnly';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isRegisterPage = pathname?.startsWith('/register');

  return (
    <SessionProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <SmoothScroll>
              {/* Navbar - hide on admin & register pages */}
              {!isAdminPage && !isRegisterPage && (
                <div className="fixed top-0 left-0 right-0 z-50" suppressHydrationWarning>
                  <ClientOnly>
                    <Navbar />
                  </ClientOnly>
                </div>
              )}
              <PageTransition>
                <div className={!isAdminPage && !isRegisterPage ? 'pt-16 md:pt-20' : ''} suppressHydrationWarning>
                  {children}
                </div>
              </PageTransition>
              {/* Footer - hide on admin & register pages */}
              {!isAdminPage && !isRegisterPage && <Footer />}
            </SmoothScroll>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

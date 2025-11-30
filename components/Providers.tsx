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
import { SecurityAnalyzerProvider } from './SecurityAnalyzerProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isRegisterPage = pathname?.startsWith('/register');

  return (
    <SessionProvider>
      <SecurityAnalyzerProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
            <SmoothScroll>
              {/* Navbar - hide on admin & register pages */}
              {!isAdminPage && !isRegisterPage && (
                <ClientOnly>
                  <Navbar />
                </ClientOnly>
              )}
              <PageTransition>
                <div 
                  className={!isAdminPage && !isRegisterPage ? '' : ''} 
                  style={!isAdminPage && !isRegisterPage ? { paddingTop: 'var(--nav-offset)' } : undefined}
                  suppressHydrationWarning
                >
                  {children}
                </div>
              </PageTransition>
              {/* Footer - hide on admin & register pages */}
              {!isAdminPage && !isRegisterPage && <Footer />}
            </SmoothScroll>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
      </SecurityAnalyzerProvider>
    </SessionProvider>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./globals-mobile.css";
import '@/lib/fontawesome';
import Providers from "../components/Providers";
import ClientRole from "../components/ClientRole";
import BackgroundSync from "../components/BackgroundSync";
import AIMonitorClient from "../components/AIMonitorClient";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { auth } from "@/lib/auth";
import { getAdminSettings, parseGlobalBackground } from '@/lib/adminSettings';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "OSIS SMK Informatika - Dirgantara 2025",
    description: "Student Intra-School Organization SMK Informatika - Dirgantara 2025 | Organisasi Siswa Intra Sekolah SMK Informatika - Dirgantara 2025",
    icons: {
        icon: '/images/logo-2.png',
        shortcut: '/images/logo-2.png',
        apple: '/images/logo-2.png',
    }
};

// Make layout dynamic so background changes apply immediately without rebuild
export const dynamic = 'force-dynamic';

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    // Get session server-side to determine role for chat widget
    const session = await auth();
    const role = (session?.user as any)?.role as ('super_admin' | 'member' | 'guest' | undefined);
    const chatDisabled = process.env.NEXT_PUBLIC_DISABLE_CHAT === '1';

    // Load global background settings (server-side)
    const settings = await getAdminSettings('GLOBAL_BG_');
    const bg = parseGlobalBackground(settings);

    // Determine current pathname (Edge-safe)
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('referer') || '/';
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
        console.log('[Layout] Background settings:', { 
            mode: bg.mode, 
            scope: bg.scope, 
            selectedPages: bg.selectedPages,
            hasColor: !!bg.color,
            hasGradient: !!bg.gradient,
            hasImage: !!bg.imageUrl,
            pathname 
        });
    }

    // Decide if body background should be applied for this path
    const matchSelected = (path: string, sel: string) => {
        if (sel === '/') return path === '/' || path === '';
        return path === sel || path.startsWith(sel + '/');
    };
    
    // Determine if we should apply custom admin background to body
    // NOTE: Image backgrounds are handled by individual components (e.g. DynamicHero) not body
    const shouldApplyCustomBackground = (() => {
        // Never apply on admin pages
        if (pathname.startsWith('/admin')) return false;
        // NEVER apply image mode to body - images are handled by components like DynamicHero
        if (bg.mode === 'image') return false;
        // Only apply if admin has set custom color/gradient background (mode is NOT 'none')
        if (bg.mode === 'none') return false;
        
        // Check scope for color/gradient modes
        if (bg.scope === 'all-pages') return true;
        if (bg.scope === 'homepage-only') return pathname === '/' || pathname === '';
        if (bg.scope === 'selected-pages' && Array.isArray(bg.selectedPages)) {
            return bg.selectedPages.some(sel => matchSelected(pathname, sel));
        }
        return false;
    })();

    return (
        <html lang="id" className="scroll-smooth h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
                <meta name="theme-color" content="#ffffff" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Prevent flash of unstyled content - Apply theme IMMEDIATELY
                            (function() {
                                const theme = localStorage.getItem('theme') || 
                                             (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                                document.documentElement.classList.remove('light', 'dark');
                                document.documentElement.classList.add(theme);
                                
                                const lang = localStorage.getItem('language') || 'id';
                                document.documentElement.lang = lang;
                                
                                // Ensure body background uses CSS variable (not inline style)
                                if (document.body) {
                                    document.body.style.removeProperty('background');
                                }
                            })();
                        `
                    }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Enable client-side error logging
                            (function() {
                                // Log uncaught errors
                                window.addEventListener('error', function(event) {
                                    fetch('/api/log-error', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            error_type: 'runtime_error',
                                            error_message: event.message || 'Uncaught error',
                                            error_stack: event.error?.stack,
                                            url: window.location.href,
                                            user_agent: navigator.userAgent,
                                            context: {
                                                filename: event.filename,
                                                lineno: event.lineno,
                                                colno: event.colno,
                                            },
                                        }),
                                    }).catch(function() {});
                                });
                                
                                // Log unhandled promise rejections
                                window.addEventListener('unhandledrejection', function(event) {
                                    fetch('/api/log-error', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            error_type: 'runtime_error',
                                            error_message: 'Unhandled Promise Rejection: ' + String(event.reason),
                                            error_stack: event.reason?.stack,
                                            url: window.location.href,
                                            user_agent: navigator.userAgent,
                                            context: { reason: String(event.reason) },
                                        }),
                                    }).catch(function() {});
                                });
                            })();
                        `
                    }}
                />
            </head>
            <body
                className={`${inter.className} antialiased min-h-screen`}
                suppressHydrationWarning
            >
                {/* Content wrapper */}
                <div 
                    className="relative w-full" 
                    style={{ 
                        position: 'relative', 
                        zIndex: 1
                    }} 
                    suppressHydrationWarning
                >
                    <Providers>
                        <BackgroundSync />
                        <AIMonitorClient />
                        {children}
                        {!chatDisabled && <ClientRole role={role as any} />}
                        <SpeedInsights />
                    </Providers>
                </div>
            </body>
        </html>
    );
}
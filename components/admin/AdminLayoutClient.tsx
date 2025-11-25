"use client";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';

export default function AdminLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith('/admin/login');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" suppressHydrationWarning>
      {/* Sidebar */}
      {!isLogin && session?.user && <AdminSidebar />}

      {/* Main Content */}
      <div className={isLogin || !session?.user ? '' : 'lg:pl-72 transition-all duration-300'} suppressHydrationWarning>
        {/* Header */}
        {!isLogin && session?.user && <AdminHeader />}

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto" suppressHydrationWarning>
            {children}
          </div>
        </main>

        {/* Footer */}
        {!isLogin && session?.user && (
          <footer className="mt-8 py-6 px-4 sm:px-6 border-t border-gray-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© 2025 OSIS SMK Informatika - Dirgantara. Made with ❤️ by Dirgantara Team</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

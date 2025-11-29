"use client";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';
import { useEffect, useState } from 'react';

function RoleStatusBanner() {
  // Only enable in production when explicitly configured
  if (typeof window === 'undefined') return null;
  if (process.env.NODE_ENV !== 'production') return null;
  if (process.env.NEXT_PUBLIC_DEBUG_ADMIN_ENDPOINTS !== '1') return null;

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/debug/preflight');
        if (!res.ok) return;
        const json = await res.json();
        if (active) setData(json);
      } catch {
        return;
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (!data || !data.ok) return null;

  const mismatch = data.role_mismatch;
  const missing = (data.missing_canonicals || []) as string[];
  if (!mismatch && missing.length === 0) return null;

  return (
    <div className="mb-4 p-4 rounded-xl border-2 text-sm bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
      <div className="font-semibold mb-1">Status Admin Panel</div>
      {mismatch && (
        <p>Peran session (<code>{data.session_role}</code>) berbeda dengan peran database (<code>{data.db_role}</code>). Refresh halaman atau logout/login ulang untuk sinkron.</p>
      )}
      {missing.length > 0 && (
        <p className="mt-1">Halaman canonical belum terdeteksi: {missing.map(m => <code key={m}>{m}</code>)}. Alias sudah disiapkan; lakukan redeploy jika tetap hilang.</p>
      )}
      <p className="mt-1 text-xs opacity-70">Terakhir cek: {new Date(data.timestamp).toLocaleTimeString('id-ID')}</p>
    </div>
  );
}

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
            {/* Role / route diagnostics banner (production + flag only) */}
            {session?.user && <RoleStatusBanner />}
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

'use client';
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import TerminalRunner from '@/components/admin/TerminalRunner';
import { FaTerminal } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

export default function AdminTerminalPage() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdminPanel) {
      return;
    }
  }, [status, canAccessAdminPanel]);

  return (
    <AdminPageShell
      icon={<FaTerminal className="w-8 h-8" />}
      title="Admin Terminal"
      subtitle="Jalankan command yang diizinkan. Hanya super_admin dan ALLOW_ADMIN_OPS=true."
      gradient="from-slate-700 to-gray-800"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4">
          <h2 className="text-white font-semibold flex items-center space-x-2">
            <FaTerminal />
            <span>Whitelisted Commands</span>
          </h2>
        </div>
        <div className="p-6">
          <TerminalRunner />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Note:</span> Whitelist dapat diubah pada{' '}
          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            /app/api/admin/terminal/route.ts
          </code>
        </p>
      </div>
    </AdminPageShell>
  );
}

'use client';
import React from 'react';
import TerminalRunner from '@/components/admin/TerminalRunner';
import { FaTerminal } from 'react-icons/fa';

export default function AdminTerminalPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><FaTerminal /> Admin Terminal (Whitelisted)</h1>
        <p className="text-slate-300 mt-1 text-sm">Jalankan command yang diizinkan. Hanya super_admin dan ALLOW_ADMIN_OPS=true.</p>
      </div>
      <TerminalRunner />
      <div className="text-xs text-gray-500 dark:text-gray-400">Whitelist dapat diubah pada <code>/app/api/admin/terminal/route.ts</code>.</div>
    </div>
  );
}

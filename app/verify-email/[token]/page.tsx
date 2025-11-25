"use client";
import { useEffect, useState, use } from 'react';

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('Memverifikasi email...');

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Verifikasi gagal');
        } else {
          setStatus('success');
          setMessage('Email berhasil diverifikasi. Mengalihkan ke halaman tunggu persetujuan...');
          // Redirect to waiting approval page after 2 seconds
          setTimeout(() => {
            const email = data.email || '';
            window.location.href = `/waiting-approval?email=${encodeURIComponent(email)}`;
          }, 2000);
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Kesalahan jaringan.');
      }
    }
    run();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-xl border border-amber-200/60 dark:border-amber-800/40 p-8 text-center">
        <h1 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">Verifikasi Email</h1>
        <div className="mt-4 text-sm font-medium whitespace-pre-line">
          {status === 'loading' && <span className="inline-block h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true" />}
          {message}
        </div>
        {status === 'success' && <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">Anda akan diarahkan ke halaman tunggu persetujuan...</div>}
        {status === 'error' && <div className="mt-6 text-xs text-red-600 dark:text-red-400">Silakan minta link verifikasi baru dengan registrasi ulang jika diperlukan.</div>}
        <div className="mt-8 text-xs">
          <a href="/waiting-approval" className="text-amber-600 dark:text-amber-400 hover:underline font-semibold">Ke Halaman Tunggu Persetujuan →</a>
        </div>
      </div>
    </div>
  );
}
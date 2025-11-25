'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function WaitingVerificationPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) {
      setError('Email tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim ulang verifikasi.');
        return;
      }

      setMessage(data.message || 'Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.');

      // Dev mode: log link to console only (don't expose to user)
      if (data.dev_link) {
        console.log('[DEV] Verification link:', data.dev_link);
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-amber-200/50 dark:border-amber-800/40 p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Menunggu Verifikasi Email</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Silakan verifikasi email Anda untuk melanjutkan
          </p>
        </div>

        <div className="space-y-4">
          {email && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/30 p-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Kami telah mengirim link verifikasi ke <strong className="font-semibold">{email}</strong>
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-gray-900 dark:text-white">Langkah selanjutnya:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Cek inbox email Anda</li>
              <li>Klik link verifikasi (berlaku 24 jam)</li>
              <li>Tunggu persetujuan admin</li>
              <li>Login kembali setelah disetujui</li>
            </ol>
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Tidak menerima email?
            </p>
            <button
              onClick={handleResend}
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 font-semibold text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
            </button>
          </div>

          {message && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-900/30 p-3">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-line">
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/30 p-3">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="pt-4 text-center border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Cek folder <strong>spam</strong> jika tidak menemukan email di inbox.
            </p>
            <a
              href="/admin/login"
              className="inline-block text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium hover:underline transition"
            >
              ← Kembali ke halaman login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

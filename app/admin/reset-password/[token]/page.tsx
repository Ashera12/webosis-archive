"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ResetPasswordTokenPage() {
  const router = useRouter();
  const routeParams = useParams<{ token: string }>();
  const token = (routeParams as any)?.token || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validFormat, setValidFormat] = useState(true);

  useEffect(() => {
    if (typeof token === 'string') {
      setValidFormat(/^[a-f0-9]{64}$/.test(token));
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('❌ Konfirmasi password tidak cocok');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`❌ ${data.error || 'Gagal reset password'}`);
      } else {
        setStatus('✅ Password berhasil direset. Mengarahkan ke halaman login...');
        setTimeout(() => router.push('/admin/login'), 2500);
      }
    } catch (err: any) {
      setStatus('❌ Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-700">
      <h1 className="text-xl font-bold mb-4">Reset Password</h1>
      {!validFormat && token && (
        <div className="text-sm text-red-600 mb-4">Token format tidak valid.</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Password Baru</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimal 8 karakter, huruf besar, angka"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ulangi password baru"
              suppressHydrationWarning
            />
        </div>
        <button
          type="submit"
          disabled={loading || !validFormat}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
          suppressHydrationWarning
        >
          {loading ? 'Memproses...' : 'Reset Password'}
        </button>
      </form>
      {status && <div className="mt-4 text-sm whitespace-pre-line font-medium">{status}</div>}
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        Setelah berhasil, Anda akan diarahkan ke halaman login.
      </div>
    </div>
  );
}

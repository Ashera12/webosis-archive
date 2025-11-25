"use client";
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugLink, setDebugLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setDebugLink(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok && data.error) {
        setStatus(`❌ ${data.error}`);
      } else {
        setStatus('✅ Jika email terdaftar, link reset telah dibuat. Cek inbox Anda.');
        if (data.debugResetLink) setDebugLink(data.debugResetLink);
      }
    } catch (err: any) {
      setStatus('❌ Terjadi kesalahan. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 rounded-xl shadow border dark:border-gray-700">
      <h1 className="text-xl font-bold mb-4">Lupa Password</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Masukkan email akun Anda. Kami akan mengirimkan link untuk reset password jika terdaftar.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="nama@example.com"
            suppressHydrationWarning
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
          suppressHydrationWarning
        >
          {loading ? 'Mengirim...' : 'Kirim Link Reset'}
        </button>
      </form>
      {status && <div className="mt-4 text-sm whitespace-pre-line font-medium">{status}</div>}
      {debugLink && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded text-xs break-all">
          <strong>Dev Reset Link:</strong><br />{debugLink}
        </div>
      )}
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        Jika tidak menerima email, cek folder spam atau coba lagi setelah beberapa menit.
      </div>
    </div>
  );
}

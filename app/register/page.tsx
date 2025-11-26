"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [unitSekolah, setUnitSekolah] = useState('');
  const [nik, setNik] = useState('');
  const [nisn, setNisn] = useState('');
  const [requestedRole, setRequestedRole] = useState('siswa');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay rendering the form until after hydration to avoid extension-injected attribute mismatches
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, nickname, unit_sekolah: unitSekolah, nik, nisn, role: requestedRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`❌ ${data.error || 'Registrasi gagal.'}`);
      } else {
        // Redirect to waiting verification page
        router.push('/waiting-verification');
      }
    } catch (err: any) {
      setStatus('❌ Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  if(!mounted){
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur rounded-2xl shadow-xl border border-amber-200/40 dark:border-amber-800/30 p-8 animate-pulse">
          <div className="h-5 w-40 bg-amber-200/50 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-9 w-full bg-amber-100/40 rounded" />
            <div className="h-9 w-full bg-amber-100/40 rounded" />
            <div className="h-9 w-full bg-amber-100/40 rounded" />
            <div className="h-9 w-full bg-amber-100/40 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-xl border border-amber-200/60 dark:border-amber-800/40 p-8">
        <h1 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">Registrasi Akun</h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Buat akun baru untuk akses dashboard setelah verifikasi & persetujuan admin.</p>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Form Registrasi">
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="name">Nama Lengkap</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Nama Lengkap" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="nickname">Nama Panggilan</label>
            <input id="nickname" type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Contoh: Budi" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="unit_sekolah">Unit Sekolah</label>
            <input id="unit_sekolah" type="text" value={unitSekolah} onChange={e => setUnitSekolah(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="SMP / SMA / SMK" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="nik">NIK</label>
              <input id="nik" type="text" value={nik} onChange={e => setNik(e.target.value)} maxLength={16} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="16 digit" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="nisn">NISN</label>
              <input id="nisn" type="text" value={nisn} onChange={e => setNisn(e.target.value)} maxLength={10} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="10 digit" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="role">Role (Permintaan)</label>
            <select id="role" value={requestedRole} onChange={e => setRequestedRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="siswa">Siswa</option>
              <option value="osis">OSIS</option>
              <option value="guru">Guru</option>
            </select>
            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Role final ditetapkan admin saat approval.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Minimal 8 karakter, huruf besar, angka" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 disabled:opacity-50">
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        {status && <div className="mt-4 text-xs whitespace-pre-line font-medium">{status}</div>}
        <div className="mt-6 text-[10px] text-gray-500 dark:text-gray-400">Sudah punya akun? <a href="/admin/login" className="text-amber-600 dark:text-amber-400 hover:underline">Login</a></div>
      </div>
    </div>
  );
}
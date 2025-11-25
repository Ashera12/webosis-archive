"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdErrorOutline } from "react-icons/md";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Pre-validate credentials untuk mendapatkan error message yang jelas
      const preCheck = await fetch('/api/auth/attempt-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const preResult = await preCheck.json();
      
      // Jika pre-check gagal, tampilkan error yang spesifik
      if (!preResult.success) {
        // Redirect ke waiting-verification jika email belum diverifikasi
        if (preResult.code === 'UNVERIFIED_EMAIL') {
          window.location.href = `/waiting-verification?email=${encodeURIComponent(email)}`;
          return;
        }
        
        // Tampilkan error spesifik lainnya
        setError(preResult.error || 'Login gagal. Silakan coba lagi.');
        return;
      }
      
      // Jika pre-check berhasil, lanjutkan dengan NextAuth signIn
      console.log('[Login] Calling signIn with credentials...');
      const res = await signIn("credentials", { redirect: false, email, password, callbackUrl: "/admin" });
      console.log('[Login] signIn response:', { ok: res?.ok, error: res?.error, status: res?.status, url: res?.url });

      if (res?.error) {
        // Fallback jika NextAuth tetap return error (seharusnya tidak terjadi karena sudah di-validate)
        console.error('[Login] NextAuth error:', res.error);
        setError(res.error || 'Terjadi kesalahan saat membuat sesi. Silakan coba lagi.');
      } else if (res?.ok) {
        console.log('[Login] signIn returned OK, verifying session...');
        
        // Wait a bit for session cookie to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify session exists by checking API
        const sessionCheck = await fetch('/api/auth/session');
        const sessionData = await sessionCheck.json();
        console.log('[Login] Session verification:', sessionData);
        
        if (sessionData?.user) {
          console.log('[Login] Session confirmed, redirecting to /admin');
          window.location.href = '/admin';
        } else {
          console.error('[Login] Session not found after signIn success!');
          setError('Login berhasil tetapi sesi tidak terbuat. Silakan coba lagi.');
        }
      } else {
        console.warn('[Login] Unexpected response:', res);
        setError('Login gagal dengan status tidak terduga. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error('[login] error:', err);
      setError(err?.message || 'Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  // Token-driven input styling (no hardcoded colors)
  const inputBase = [
    "w-full px-4 py-3 rounded-xl backdrop-blur transition text-sm",
    // Surfaces / borders via CSS variables
    "bg-[var(--input-bg)] focus:bg-[var(--input-bg-focus)]",
    "border border-[var(--input-border)] focus:border-[var(--input-border-focus)]",
    // Ring & outline
    "focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)]",
    // Placeholder color
    "placeholder-[var(--text-muted)]",
    "text-[var(--text-primary)]"
  ].join(" ");

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[var(--gradient-bg)]">
      {/* Soft overlay for subtle depth */}
      <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 40%, transparent 70%)"}} />
      <div className="w-full max-w-md relative z-10">
        <div className="group rounded-2xl shadow-2xl backdrop-blur-xl p-8 border bg-[var(--card-bg)] border-[var(--card-border)]/70 dark:border-[var(--card-border)] text-[var(--text-primary)]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(to_right,var(--accent-emphasis),var(--accent))]">OSIS Admin</span>
            </div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Masuk untuk mengelola konten & sistem</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Form Login Admin" data-form-type="login" suppressHydrationWarning>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-[var(--text-secondary)]" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputBase}
                required
                aria-required="true"
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide mb-1 text-[var(--text-secondary)]" htmlFor="password">
                <span>Password</span>
                <button type="button" onClick={() => setShowPw(s => !s)} className="text-[var(--accent-emphasis)] hover:brightness-110 transition text-xs font-medium" aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'} suppressHydrationWarning>
                  {showPw ? <FiEyeOff className="inline" /> : <FiEye className="inline" />}
                </button>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputBase + ' pr-12'}
                  required
                  aria-required="true"
                  suppressHydrationWarning
                />
              </div>
            </div>
            {error && (
              <div
                className="flex items-start gap-2 rounded-lg border p-3 text-xs bg-[var(--danger-bg)] border-[var(--danger)]/40 text-[var(--danger)]"
                role="alert"
              >
                <MdErrorOutline className="text-lg shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              disabled={loading}
              type="submit"
              className="w-full relative overflow-hidden rounded-xl font-semibold text-sm text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-emphasis)] disabled:opacity-50 active:scale-[0.97]"
              style={{background:"var(--button-bg)"}}
              suppressHydrationWarning
            >
              <span className="relative z-10 flex items-center justify-center gap-2 py-3">
                {loading && <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                {loading ? 'Memproses...' : 'Masuk'}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" style={{background:"var(--button-bg-hover)"}} />
            </button>
            <div className="flex flex-wrap justify-between items-center text-xs mt-1 gap-2">
              <a href="/admin/forgot-password" className="text-[var(--accent-emphasis)] hover:underline font-medium">Lupa password?</a>
              <a href="/register" className="text-green-600 dark:text-green-400 hover:underline font-medium">Daftar Akun Baru</a>
              <a href="/" className="text-[var(--text-muted)] hover:underline">← Kembali</a>
            </div>
            {error && (
              <div className="mt-2 space-y-2 text-[10px] text-[var(--text-muted)]">
                {/tidak terdaftar/i.test(error) && (
                  <p>💡 Belum punya akun? Klik <strong>"Daftar Akun Baru"</strong> untuk registrasi.</p>
                )}
                {/password salah/i.test(error) && (
                  <p>💡 Lupa password? Klik <strong>"Lupa password?"</strong> untuk reset.</p>
                )}
                {/belum diverifikasi/i.test(error) && (
                  <div className="space-y-1">
                    <p>💡 Cek inbox atau folder spam untuk link verifikasi email.</p>
                    <ResendButton targetEmail={email} />
                  </div>
                )}
                {/menunggu persetujuan/i.test(error) && (
                  <p>💡 Admin akan mereview akun Anda. Anda akan menerima notifikasi setelah disetujui.</p>
                )}
              </div>
            )}
          </form>
        </div>
        <p className="text-center mt-6 text-[10px] tracking-wide text-[var(--text-muted)]">© {new Date().getFullYear()} OSIS Internal Dashboard</p>
      </div>
    </div>
  );
}

function ResendButton({ targetEmail }: { targetEmail: string }) {
  const [state, setState] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [msg, setMsg] = useState<string>('');
  async function resend(){
    if(!targetEmail) return;
    setState('sending'); setMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: targetEmail }) });
      const data = await res.json();
      if(!res.ok){ setState('error'); setMsg(data.error || 'Gagal kirim ulang'); return; }
      setState('done'); setMsg('Email verifikasi baru dikirim.');
    } catch(e:any){ setState('error'); setMsg('Kesalahan jaringan'); }
  }
  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      <button
        type="button"
        disabled={!targetEmail || state==='sending'}
        onClick={resend}
        className="px-2 py-1 rounded font-semibold text-[10px] text-white disabled:opacity-50"
        style={{background: state==='error' ? 'var(--danger)' : 'var(--accent-emphasis)'}}
        suppressHydrationWarning
      >
        {state==='sending' ? 'Mengirim...' : 'Kirim Ulang Verifikasi'}
      </button>
      {msg && (
        <span
          className="text-[10px]"
          style={{color: state==='error' ? 'var(--danger)' : 'var(--success)'}}
        >
          {msg}
        </span>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { FaKey, FaRobot, FaDatabase, FaBell, FaSave, FaTools, FaTerminal, FaPalette, FaEye } from 'react-icons/fa';
import ImageUploader from '@/components/admin/ImageUploader';

interface EnvSetting {
  key: string;
  label: string;
  secret?: boolean;
  description: string;
}

const COLOR_PRESETS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Dark Gray', value: '#1f2937' },
  { name: 'Black', value: '#000000' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#475569' },
];

const GRADIENT_TEMPLATES = [
  { name: 'Gold Luxury', value: 'linear-gradient(135deg, #D4AF37 0%, #E6C547 50%, #F4E5B0 100%)' },
  { name: 'Blue Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' },
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Green Forest', value: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)' },
  { name: 'Fire Red', value: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' },
  { name: 'Midnight Blue', value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
  { name: 'Peach Pink', value: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)' },
  { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' },
  { name: 'Warm Flame', value: 'linear-gradient(135deg, #ff9a56 0%, #ff6a00 100%)' },
  { name: 'Night Sky', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { name: 'Rose Garden', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
];

const SETTINGS: EnvSetting[] = [
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', secret: true, description: 'Digunakan untuk provider OpenAI di AI Assistant.' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', secret: true, description: 'Digunakan untuk provider Anthropic.' },
  { key: 'GEMINI_API_KEY', label: 'Gemini API Key', secret: true, description: 'Digunakan untuk provider Google Gemini.' },
  { key: 'GEMINI_MODEL', label: 'Gemini Model', description: 'Preferred Gemini model (e.g. gemini-1.5, gemini-1.5-flash). Empty = automatic fallback.' },
  { key: 'OPENAI_MODEL', label: 'OpenAI Model', description: 'Preferred OpenAI model (e.g. gpt-4o-mini, gpt-4o). Default used if empty.' },
  { key: 'AUTO_EXECUTE_MODE', label: 'Auto Execute Mode', description: 'off | delay | auto untuk saran AI ops.' },
  { key: 'AUTO_EXECUTE_DELAY_MINUTES', label: 'Auto Execute Delay (menit)', description: 'Digunakan saat mode delay.' },
  { key: 'ALLOW_ADMIN_OPS', label: 'Allow Admin Ops', description: 'Set true untuk mengaktifkan endpoint ops & terminal.' },
  { key: 'ALLOW_UNSAFE_TERMINAL', label: 'Allow Unsafe Terminal', description: 'Set true untuk mengaktifkan raw command execution (BERBAHAYA).' },
  { key: 'ADMIN_OPS_TOKEN', label: 'Admin Ops Token', secret: true, description: 'Token untuk GitHub Action / CI memanggil auto_runner.' },
  { key: 'DATABASE_URL', label: 'Database URL', secret: true, description: 'Koneksi Postgres (untuk psql server-side migrations).' },
  { key: 'OPS_WEBHOOK_URL', label: 'Ops Webhook URL', description: 'Optional webhook notifikasi (Slack/Discord).' },
  // Global Background Customization
  { key: 'GLOBAL_BG_MODE', label: 'Global Background Mode', description: 'none | color | gradient | image' },
  { key: 'GLOBAL_BG_SCOPE', label: 'Background Scope', description: 'all-pages | homepage-only (default: all-pages)' },
  { key: 'GLOBAL_BG_COLOR', label: 'Background Color', description: 'Contoh: #ffffff atau rgb(0,0,0)' },
  { key: 'GLOBAL_BG_GRADIENT', label: 'Background Gradient', description: 'Contoh: linear-gradient(135deg,#D4AF37,#E6C547)' },
  { key: 'GLOBAL_BG_IMAGE', label: 'Background Image URL', description: 'URL gambar (public storage / cdn) untuk background.' },
  { key: 'GLOBAL_BG_IMAGE_OVERLAY_COLOR', label: 'Image Overlay Color', description: 'Warna overlay untuk readability (contoh: #000000)' },
  { key: 'GLOBAL_BG_IMAGE_OVERLAY_OPACITY', label: 'Image Overlay Opacity', description: '0-1 (contoh: 0.3 untuk overlay ringan)' },
  { key: 'GLOBAL_BG_IMAGE_STYLE', label: 'Background Image Style', description: 'cover | contain' },
  { key: 'GLOBAL_BG_IMAGE_FIXED', label: 'Background Image Fixed', description: 'true untuk fixed parallax style.' },
];

export default function AdminSettingsPage() {
  // Local form state (note: ENV tidak bisa diubah langsung di runtime Next.js tanpa redeploy; ini UI referensi)
  const [values, setValues] = useState<Record<string,string>>(() => {
    const initial: Record<string,string> = {};
    SETTINGS.forEach(s => { initial[s.key] = ''; });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [storedMeta, setStoredMeta] = useState<Record<string,{length:number;updated_at:string}>>({});
  const [lastUpdatedKeys, setLastUpdatedKeys] = useState<string[]>([]);
  const [toolsInfo, setToolsInfo] = useState<any>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [quickToggles, setQuickToggles] = useState({ ALLOW_ADMIN_OPS: false, ALLOW_UNSAFE_TERMINAL: false });
  const [togglingQuick, setTogglingQuick] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (key: string, val: string) => {
    setValues(v => ({ ...v, [key]: val }));
  };

  const handleSave = async () => {
    // Build secrets list
    const secrets = SETTINGS.filter(s => s.secret).map(s => s.key);
    
    // IMPORTANT: Don't save masked values (***) - only send values that user actually entered
    const settingsToSave: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Skip empty strings, masked values, and undefined/null
      if (value && value !== '***' && value.trim() !== '') {
        settingsToSave[key] = value;
      }
    });

    // Show confirmation dialog with what will be changed
    const changeCount = Object.keys(settingsToSave).length;
    if (changeCount === 0) {
      setMessage('⚠️ Tidak ada perubahan untuk disimpan.');
      return;
    }

    const changeList = Object.keys(settingsToSave)
      .map(key => {
        const setting = SETTINGS.find(s => s.key === key);
        const isSecret = secrets.includes(key);
        const displayValue = isSecret ? '***' : (settingsToSave[key].length > 50 ? settingsToSave[key].slice(0, 50) + '...' : settingsToSave[key]);
        return `  • ${setting?.label || key}: ${displayValue}`;
      })
      .join('\n');

    const confirmMessage = `Simpan ${changeCount} perubahan ke database?\n\n${changeList}\n\nPerubahan akan langsung aktif tanpa redeploy.`;
    
    if (!confirm(confirmMessage)) {
      setMessage('⚠️ Penyimpanan dibatalkan.');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          settings: settingsToSave,
          secrets: secrets
        }) 
      });
      const json = await res.json();
      if (res.ok) {
        const updatedKeys = Object.keys(settingsToSave);
        setLastUpdatedKeys(updatedKeys);
        setMessage(`✅ Settings tersimpan! ${updatedKeys.length} key diupdate: ${updatedKeys.join(', ')}`);
        // Reload to verify
        await loadQuickToggles();
        // If an admin ops token is present, call the refresh snapshot endpoint
        try {
          const token = settingsToSave['ADMIN_OPS_TOKEN'] || values['ADMIN_OPS_TOKEN'] || '';
          if (token && token !== '***') {
            setMessage(prev => (prev ? prev + ' • Refreshing snapshot...' : 'Refreshing snapshot...'));
            const r = await fetch('/api/admin/refresh-snapshot', { method: 'POST', headers: { 'x-admin-ops-token': token } });
            if (r.ok) {
              setMessage(prev => (prev ? prev + ' ✅ Snapshot refreshed' : '✅ Snapshot refreshed'));
            } else {
              const jr = await r.json().catch(()=>({}));
              setMessage(prev => (prev ? prev + ` ⚠️ Refresh failed: ${jr.error||r.status}` : `⚠️ Refresh failed: ${jr.error||r.status}`));
            }
          }
        } catch (e) {
          console.warn('Snapshot refresh failed:', e);
        }
      } else {
        setMessage('❌ Gagal menyimpan: ' + JSON.stringify(json));
      }
    } catch (e) {
      setMessage('Error: ' + String(e));
    } finally { setSaving(false); }
  };

  const loadToolsInfo = async () => {
    setLoadingTools(true);
    try {
      const [terminal, suggestions, ai] = await Promise.all([
        fetch('/api/admin/terminal').then(r => r.ok ? r.json() : Promise.reject('terminal error '+r.status)).catch(e => ({ error: String(e) })),
        fetch('/api/admin/suggestions').then(r => r.ok ? r.json() : Promise.reject('suggestions error '+r.status)).catch(e => ({ error: String(e) })),
        fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ prompt: 'ping', provider: 'echo' }) }).then(r => r.ok ? r.json() : Promise.reject('ai error '+r.status)).catch(e => ({ error: String(e) })),
      ]);
      setToolsInfo({ terminal, suggestionsCount: (suggestions.suggestions||[]).length, aiProviderEcho: ai.provider });
    } catch (e) {
      setToolsInfo({ error: String(e) });
    } finally { setLoadingTools(false); }
  };

  const loadQuickToggles = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      setQuickToggles({
        ALLOW_ADMIN_OPS: json.values?.ALLOW_ADMIN_OPS === 'true',
        ALLOW_UNSAFE_TERMINAL: json.values?.ALLOW_UNSAFE_TERMINAL === 'true'
      });
      // Load non-secret values and secret values that aren't masked
      setValues(prev => {
        const newValues = { ...prev };
        Object.entries(json.values || {}).forEach(([key, value]) => {
          // Don't overwrite if value is masked (***) - keep user's input
          if (value !== '***') {
            newValues[key] = value as string;
          }
        });
        return newValues;
      });
    } catch (e) {
      console.error('Failed to load quick toggles', e);
    }
  };

  const handleQuickToggle = async (key: 'ALLOW_ADMIN_OPS' | 'ALLOW_UNSAFE_TERMINAL') => {
    if (!confirm(`Toggle ${key}? Perubahan akan aktif langsung tanpa redeploy.`)) return;
    setTogglingQuick(true);
    try {
      const newVal = !quickToggles[key];
      const secrets = SETTINGS.filter(s => s.secret).map(s => s.key);
      
      const res = await fetch('/api/admin/settings', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          settings: { [key]: newVal ? 'true' : 'false' },
          secrets: secrets
        }) 
      });
      if (res.ok) {
        setQuickToggles(prev => ({ ...prev, [key]: newVal }));
        setMessage(`✅ ${key} sekarang ${newVal ? 'AKTIF' : 'NONAKTIF'} (tersimpan di DB)`);
      } else {
        const json = await res.json();
        setMessage('❌ Gagal toggle: ' + JSON.stringify(json));
      }
    } catch (e) {
      setMessage('Error toggle: ' + String(e));
    } finally { setTogglingQuick(false); }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/admin/settings/verify');
      const json = await res.json();
      setVerifyResult(json);
      if (json?.values) {
        const meta: Record<string,{length:number;updated_at:string}> = {};
        Object.entries(json.values).forEach(([k,v]:any)=>{
          meta[k] = { length: v.length, updated_at: v.updated_at };
        });
        setStoredMeta(meta);
      }
    } catch (e) {
      setVerifyResult({ error: String(e) });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySingle = async (key:string) => {
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/settings/verify');
      const json = await res.json();
      if (json?.values?.[key]) {
        setStoredMeta(prev => ({ ...prev, [key]: { length: json.values[key].length, updated_at: json.values[key].updated_at } }));
        setMessage(`ℹ️ ${key} verified (len=${json.values[key].length})`);
      } else {
        setMessage(`⚠️ ${key} tidak ditemukan di DB`);
      }
    } catch (e) {
      setMessage(`❌ Verify gagal: ${String(e)}`);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setMessage('✅ Copied to clipboard');
        return true;
      }
      // Fallback for environments without navigator.clipboard
      if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = text;
        // avoid scrolling to bottom
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setMessage('✅ Copied to clipboard (fallback)');
        return true;
      }
      setMessage('⚠️ Clipboard not available in this environment');
      return false;
    } catch (e) {
      setMessage('❌ Failed to copy: ' + String(e));
      return false;
    }
  };

  React.useEffect(() => {
    loadQuickToggles();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 rounded-2xl shadow-xl text-slate-900">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3"><FaRobot /> Pengaturan Sistem & AI</h1>
        <p className="text-lg">Kelola konfigurasi environment, API keys, mode eksekusi otomatis, dan notifikasi ops.</p>
      </div>

      {/* Quick Toggle Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><FaTools /> Quick Toggles (Live Config)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Ubah flag kritis tanpa redeploy. Tersimpan di database `admin_settings`.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow">
            <h3 className="font-semibold mb-2">ALLOW_ADMIN_OPS</h3>
            <p className="text-xs mb-3">Mengaktifkan endpoint ops, terminal, dan automation.</p>
            <button
              onClick={() => handleQuickToggle('ALLOW_ADMIN_OPS')}
              disabled={togglingQuick}
              className={`px-4 py-2 rounded-lg font-semibold transition ${quickToggles.ALLOW_ADMIN_OPS ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-slate-900 hover:bg-slate-200'} disabled:opacity-60`}
            >
              {togglingQuick ? 'Loading...' : (quickToggles.ALLOW_ADMIN_OPS ? 'DISABLE' : 'ENABLE')}
            </button>
            <p className="text-xs mt-2">Status: <strong>{quickToggles.ALLOW_ADMIN_OPS ? 'AKTIF' : 'NONAKTIF'}</strong></p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white shadow">
            <h3 className="font-semibold mb-2">ALLOW_UNSAFE_TERMINAL</h3>
            <p className="text-xs mb-3">Mengizinkan raw command execution (BERBAHAYA!).</p>
            <button
              onClick={() => handleQuickToggle('ALLOW_UNSAFE_TERMINAL')}
              disabled={togglingQuick}
              className={`px-4 py-2 rounded-lg font-semibold transition ${quickToggles.ALLOW_UNSAFE_TERMINAL ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-white text-slate-900 hover:bg-slate-200'} disabled:opacity-60`}
            >
              {togglingQuick ? 'Loading...' : (quickToggles.ALLOW_UNSAFE_TERMINAL ? 'DISABLE' : 'ENABLE')}
            </button>
            <p className="text-xs mt-2">Status: <strong>{quickToggles.ALLOW_UNSAFE_TERMINAL ? 'AKTIF' : 'NONAKTIF'}</strong></p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          ⚠️ Perubahan langsung tersimpan di DB dan langsung aktif. Tidak perlu redeploy!
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
          >
            {verifying ? 'Verifying...' : '🔍 Verify Database Values'}
          </button>
          {verifyResult && (
            <button
              onClick={() => setVerifyResult(null)}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              Clear
            </button>
          )}
        </div>
        {verifyResult && (
          <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-auto">
            <h3 className="font-semibold mb-2 text-sm">Database Values (RAW):</h3>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(verifyResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><FaKey /> API & Environment</h2>
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >{showSecrets ? 'Sembunyikan Secret' : 'Tampilkan Secret'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SETTINGS.map(s => (
            <div key={s.key} className={`space-y-2 ${lastUpdatedKeys.includes(s.key) ? 'border border-green-400 rounded-md p-2 bg-green-50 dark:bg-green-900/30' : ''}`}>          
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</label>
                <div className="flex items-center gap-2">
                  {s.secret && (
                    <button
                      type="button"
                      onClick={() => setShowSecrets(prev => !prev)}
                      className="px-2 py-0.5 rounded text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >{showSecrets ? 'Hide' : 'Show'}</button>
                  )}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(values[s.key] || '')}
                    className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500"
                  >Copy</button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type={s.secret && !showSecrets ? 'password' : 'text'}
                  value={values[s.key]}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                  placeholder={s.description}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white"
                />
                {s.key === 'ADMIN_OPS_TOKEN' && (
                  <button
                    type="button"
                    onClick={() => {
                      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                        .map(b => b.toString(16).padStart(2,'0'))
                        .join('');
                      handleChange('ADMIN_OPS_TOKEN', token);
                      setMessage('🔐 Token dibuat. Klik Simpan Settings untuk menyimpan.');
                    }}
                    className="shrink-0 px-3 py-2 rounded-md bg-yellow-500 hover:bg-amber-600 text-slate-900 text-xs font-semibold"
                  >Generate</button>
                )}
              </div>
              {s.key === 'ADMIN_OPS_TOKEN' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >Verify</button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  type="button"
                  onClick={()=>handleVerifySingle(s.key)}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-600 text-xs hover:bg-slate-200 dark:hover:bg-slate-500"
                >Lihat</button>
                {storedMeta[s.key] && (
                  <span className="text-[10px] px-2 py-1 rounded bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100 font-medium">
                    tersimpan • len:{storedMeta[s.key].length}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-amber-600 text-slate-900 rounded-lg font-semibold shadow-lg transition disabled:opacity-60"
          >
            <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Settings'}
          </button>
          {message && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</span>
          )}
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Perubahan settings tersimpan di database `admin_settings` dan langsung aktif. Tidak perlu redeploy!
        </div>
      </div>

      {/* Background Customization with Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <FaPalette /> Background Customization
          </h2>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 transition"
          >
            <FaEye /> {showPreview ? 'Sembunyikan Preview' : 'Tampilkan Preview'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Mode
              </label>
              <select
                value={values['GLOBAL_BG_MODE'] || 'none'}
                onChange={(e) => handleChange('GLOBAL_BG_MODE', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white"
              >
                <option value="none">None (Default)</option>
                <option value="color">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Background Image</option>
              </select>
            </div>

            {values['GLOBAL_BG_MODE'] && values['GLOBAL_BG_MODE'] !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apply Background To
                </label>
                <select
                  value={values['GLOBAL_BG_SCOPE'] || 'all-pages'}
                  onChange={(e) => handleChange('GLOBAL_BG_SCOPE', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white"
                >
                  <option value="all-pages">All Pages (Default)</option>
                  <option value="homepage-only">Homepage Only (Hero section)</option>
                  <option value="selected-pages">Selected Pages</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose whether background applies to all pages, only the homepage hero, or specific pages.
                </p>
                {values['GLOBAL_BG_SCOPE'] === 'selected-pages' && (
                  <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Pages
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { path: '/', label: 'Homepage (/)' },
                        { path: '/about', label: 'About' },
                        { path: '/gallery', label: 'Gallery' },
                        { path: '/bidang', label: 'Work Programs (/bidang)' },
                        { path: '/people', label: 'Members (/people)' },
                        { path: '/our-social-media', label: 'Our Social Media' },
                        { path: '/register', label: 'Register' },
                        { path: '/sekbid', label: 'Sekbid (and subpages)' },
                      ].map((p) => {
                        const selected = (() => {
                          try {
                            const arr = JSON.parse(values['GLOBAL_BG_SELECTED_PAGES'] || '[]') as string[];
                            return Array.isArray(arr) ? arr.includes(p.path) : false;
                          } catch { return false; }
                        })();
                        return (
                          <label key={p.path} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                let arr: string[] = [];
                                try { arr = JSON.parse(values['GLOBAL_BG_SELECTED_PAGES'] || '[]') as string[]; } catch { arr = []; }
                                if (!Array.isArray(arr)) arr = [];
                                if (e.target.checked) {
                                  if (!arr.includes(p.path)) arr.push(p.path);
                                } else {
                                  arr = arr.filter(x => x !== p.path);
                                }
                                handleChange('GLOBAL_BG_SELECTED_PAGES', JSON.stringify(arr));
                              }}
                            />
                            {p.label}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                      Notes: Nested routes are supported. Selecting "/sekbid" will apply to all pages under it.
                    </p>
                    
                    {/* Custom Route Input */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add Custom Route
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="/custom/path"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              const customPath = input.value.trim();
                              if (customPath && customPath.startsWith('/')) {
                                let arr: string[] = [];
                                try { arr = JSON.parse(values['GLOBAL_BG_SELECTED_PAGES'] || '[]') as string[]; } catch { arr = []; }
                                if (!Array.isArray(arr)) arr = [];
                                if (!arr.includes(customPath)) arr.push(customPath);
                                handleChange('GLOBAL_BG_SELECTED_PAGES', JSON.stringify(arr));
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            const customPath = input.value.trim();
                            if (customPath && customPath.startsWith('/')) {
                              let arr: string[] = [];
                              try { arr = JSON.parse(values['GLOBAL_BG_SELECTED_PAGES'] || '[]') as string[]; } catch { arr = []; }
                              if (!Array.isArray(arr)) arr = [];
                              if (!arr.includes(customPath)) arr.push(customPath);
                              handleChange('GLOBAL_BG_SELECTED_PAGES', JSON.stringify(arr));
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold text-sm"
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Type route path (must start with /) and press Enter or click Add
                      </p>
                    </div>

                    {/* Selected Routes Preview */}
                    {(() => {
                      let arr: string[] = [];
                      try { arr = JSON.parse(values['GLOBAL_BG_SELECTED_PAGES'] || '[]') as string[]; } catch { arr = []; }
                      if (!Array.isArray(arr)) arr = [];
                      if (arr.length > 0) {
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Active Routes ({arr.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {arr.map((route) => (
                                <div
                                  key={route}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium"
                                >
                                  <span>{route}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newArr = arr.filter(x => x !== route);
                                      handleChange('GLOBAL_BG_SELECTED_PAGES', JSON.stringify(newArr));
                                    }}
                                    className="hover:text-red-600 dark:hover:text-red-400"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleChange('GLOBAL_BG_SELECTED_PAGES', '[]')}
                              className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                            >
                              Clear All
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {values['GLOBAL_BG_MODE'] === 'color' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={values['GLOBAL_BG_COLOR'] || '#ffffff'}
                      onChange={(e) => handleChange('GLOBAL_BG_COLOR', e.target.value)}
                      className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={values['GLOBAL_BG_COLOR'] || ''}
                      onChange={(e) => handleChange('GLOBAL_BG_COLOR', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white"
                    />
                  </div>
                </div>

                {/* Color Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleChange('GLOBAL_BG_COLOR', preset.value)}
                        className="group relative px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition overflow-hidden border-2 border-gray-200 dark:border-gray-600"
                        style={{ backgroundColor: preset.value }}
                        title={preset.value}
                      >
                        <span 
                          className="relative z-10"
                          style={{ 
                            color: ['#ffffff', '#f3f4f6', '#eab308', '#FEE140', '#F4E5B0'].includes(preset.value) 
                              ? '#000000' 
                              : '#ffffff' 
                          }}
                        >
                          {preset.name}
                        </span>
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {values['GLOBAL_BG_MODE'] === 'gradient' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gradient CSS
                  </label>
                  <textarea
                    value={values['GLOBAL_BG_GRADIENT'] || ''}
                    onChange={(e) => handleChange('GLOBAL_BG_GRADIENT', e.target.value)}
                    placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white font-mono text-sm"
                  />
                </div>

                {/* Gradient Templates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {GRADIENT_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => handleChange('GLOBAL_BG_GRADIENT', template.value)}
                        className="relative px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-md hover:shadow-lg transition overflow-hidden group"
                        style={{ background: template.value }}
                        title={template.value}
                      >
                        <span className="relative z-10">{template.name}</span>
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Klik template untuk langsung apply, atau edit CSS manual di atas
                  </p>
                </div>
              </div>
            )}

            {values['GLOBAL_BG_MODE'] === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background Image
                  </label>
                  <ImageUploader
                    bucket="gallery"
                    folder="backgrounds"
                    value={values['GLOBAL_BG_IMAGE'] || ''}
                    onChange={(url: string) => handleChange('GLOBAL_BG_IMAGE', url)}
                    label="Upload Background Image"
                  />
                  {values['GLOBAL_BG_IMAGE'] && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={values['GLOBAL_BG_IMAGE']}
                        onChange={(e) => handleChange('GLOBAL_BG_IMAGE', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Anda juga bisa edit URL manual atau paste URL eksternal
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background Overlay Color (Optional)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Tambahkan warna overlay untuk readability text
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="color"
                      value={values['GLOBAL_BG_IMAGE_OVERLAY_COLOR'] || '#000000'}
                      onChange={(e) => handleChange('GLOBAL_BG_IMAGE_OVERLAY_COLOR', e.target.value)}
                      className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={values['GLOBAL_BG_IMAGE_OVERLAY_COLOR'] || ''}
                      onChange={(e) => handleChange('GLOBAL_BG_IMAGE_OVERLAY_COLOR', e.target.value)}
                      placeholder="#000000 atau rgba(0,0,0,0.5)"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white"
                    />
                  </div>
                  {/* Quick overlay color presets */}
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { name: 'Black', value: '#000000' },
                      { name: 'Gray', value: '#6b7280' },
                      { name: 'White', value: '#ffffff' },
                      { name: 'Blue', value: '#1e40af' },
                      { name: 'Purple', value: '#7c3aed' },
                      { name: 'None', value: 'transparent' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleChange('GLOBAL_BG_IMAGE_OVERLAY_COLOR', preset.value)}
                        className="group relative px-2 py-1.5 rounded text-xs font-semibold shadow hover:shadow-md transition border-2 border-gray-200 dark:border-gray-600"
                        style={{ 
                          backgroundColor: preset.value === 'transparent' ? '#f3f4f6' : preset.value,
                          backgroundImage: preset.value === 'transparent' 
                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                            : 'none',
                          backgroundSize: preset.value === 'transparent' ? '10px 10px' : 'auto',
                          backgroundPosition: preset.value === 'transparent' ? '0 0, 0 5px, 5px -5px, -5px 0px' : 'initial'
                        }}
                        title={preset.value}
                      >
                        <span 
                          className="relative z-10"
                          style={{ 
                            color: ['#ffffff', '#f3f4f6', 'transparent'].includes(preset.value) 
                              ? '#000000' 
                              : '#ffffff' 
                          }}
                        >
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overlay Opacity (0-1)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={values['GLOBAL_BG_IMAGE_OVERLAY_OPACITY'] || '0.3'}
                      onChange={(e) => handleChange('GLOBAL_BG_IMAGE_OVERLAY_OPACITY', e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={values['GLOBAL_BG_IMAGE_OVERLAY_OPACITY'] || '0.3'}
                      onChange={(e) => handleChange('GLOBAL_BG_IMAGE_OVERLAY_OPACITY', e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    0 = transparan, 1 = solid (default: 0.3)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="space-y-4">
              <div className="sticky top-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Live Preview
                </label>
                <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-gray-300 dark:border-gray-600">
                  <div
                    className="w-full h-64 flex items-center justify-center text-white font-bold text-xl relative"
                    style={{
                      background: 
                        values['GLOBAL_BG_MODE'] === 'color' ? values['GLOBAL_BG_COLOR'] || '#ffffff' :
                        values['GLOBAL_BG_MODE'] === 'gradient' ? values['GLOBAL_BG_GRADIENT'] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                        values['GLOBAL_BG_MODE'] === 'image' ? `url(${values['GLOBAL_BG_IMAGE']}) center/cover` :
                        '#f3f4f6'
                    }}
                  >
                    {values['GLOBAL_BG_MODE'] === 'image' && values['GLOBAL_BG_IMAGE_OVERLAY_COLOR'] && (
                      <div 
                        className="absolute inset-0" 
                        style={{
                          backgroundColor: values['GLOBAL_BG_IMAGE_OVERLAY_COLOR'],
                          opacity: parseFloat(values['GLOBAL_BG_IMAGE_OVERLAY_OPACITY'] || '0.3')
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div className="text-center relative z-10">
                        <div className="text-3xl mb-2">OSIS Website</div>
                        <div className="text-sm opacity-80">Background Preview</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-xs text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> Perubahan langsung terlihat di preview. Klik "Simpan Background" di bawah untuk menerapkan ke website.
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Save Background Button - Only show if mode is not 'none' */}
        {values['GLOBAL_BG_MODE'] && values['GLOBAL_BG_MODE'] !== 'none' && (
          <div className="mt-6 flex gap-4 items-center">
            <button
              onClick={async () => {
                // Build background settings to save
                const bgSettings: Record<string, string> = {
                  GLOBAL_BG_MODE: values['GLOBAL_BG_MODE'] || 'none',
                };
                
                if (values['GLOBAL_BG_SCOPE']) {
                  bgSettings.GLOBAL_BG_SCOPE = values['GLOBAL_BG_SCOPE'];
                }
                
                if (values['GLOBAL_BG_MODE'] === 'color' && values['GLOBAL_BG_COLOR']) {
                  bgSettings.GLOBAL_BG_COLOR = values['GLOBAL_BG_COLOR'];
                }
                
                if (values['GLOBAL_BG_MODE'] === 'gradient' && values['GLOBAL_BG_GRADIENT']) {
                  bgSettings.GLOBAL_BG_GRADIENT = values['GLOBAL_BG_GRADIENT'];
                }
                
                if (values['GLOBAL_BG_MODE'] === 'image') {
                  if (values['GLOBAL_BG_IMAGE']) bgSettings.GLOBAL_BG_IMAGE = values['GLOBAL_BG_IMAGE'];
                  if (values['GLOBAL_BG_IMAGE_OVERLAY_COLOR']) bgSettings.GLOBAL_BG_IMAGE_OVERLAY_COLOR = values['GLOBAL_BG_IMAGE_OVERLAY_COLOR'];
                  if (values['GLOBAL_BG_IMAGE_OVERLAY_OPACITY']) bgSettings.GLOBAL_BG_IMAGE_OVERLAY_OPACITY = values['GLOBAL_BG_IMAGE_OVERLAY_OPACITY'];
                  if (values['GLOBAL_BG_IMAGE_STYLE']) bgSettings.GLOBAL_BG_IMAGE_STYLE = values['GLOBAL_BG_IMAGE_STYLE'];
                  if (values['GLOBAL_BG_IMAGE_FIXED']) bgSettings.GLOBAL_BG_IMAGE_FIXED = values['GLOBAL_BG_IMAGE_FIXED'];
                }
                
                // Show confirmation
                const changeCount = Object.keys(bgSettings).length;
                const changeList = Object.keys(bgSettings)
                  .map(key => {
                    const setting = SETTINGS.find(s => s.key === key);
                    const value = bgSettings[key];
                    const displayValue = value.length > 50 ? value.slice(0, 50) + '...' : value;
                    return `  • ${setting?.label || key}: ${displayValue}`;
                  })
                  .join('\n');
                
                const confirmMessage = `Simpan ${changeCount} pengaturan background?\n\n${changeList}\n\nBackground akan langsung aktif di website.`;
                
                if (!confirm(confirmMessage)) {
                  setMessage('⚠️ Penyimpanan background dibatalkan.');
                  return;
                }
                
                // Save
                setSaving(true);
                setMessage(null);
                try {
                  const res = await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      settings: bgSettings,
                      secrets: []
                    })
                  });
                  const json = await res.json();
                  if (res.ok) {
                    setMessage(`✅ Background tersimpan! ${changeCount} pengaturan diupdate.`);
                    await loadQuickToggles();
                  } else {
                    setMessage('❌ Gagal menyimpan background: ' + JSON.stringify(json));
                  }
                } catch (e) {
                  setMessage('Error: ' + String(e));
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg transition disabled:opacity-60"
            >
              <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Background'}
            </button>
            {message && message.includes('Background') && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><FaDatabase /> Database & Migrations</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Gunakan halaman Tools untuk menjalankan migration SQL langsung via server psql. Pastikan `DATABASE_URL` & psql tersedia. Setelah menjalankan migration, refresh PostgREST cache (biasanya otomatis beberapa detik).</p>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>File schema utama: <code>supabase-schema.sql</code></li>
            <li>Perbaikan incremental: <code>supabase-fix-schema.sql</code></li>
            <li>Seed data: <code>supabase-seed-data.sql</code></li>
            <li>Super admin seed: <code>supabase-super-admin-seed.sql</code></li>
            <li>Audit table: <code>supabase-admin-audit*.sql</code></li>
          </ul>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">Jalankan di halaman <code>/admin/tools</code> atau gunakan PowerShell script <code>scripts/run_supabase_sql.ps1</code>.</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><FaBell /> Ops & Monitoring</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set webhook untuk notifikasi eksekusi suggestion/ops. Tambahkan integrasi Slack/Discord dengan endpoint di `OPS_WEBHOOK_URL`.</p>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Status suggestion disimpan di tabel <code>admin_actions</code>.</li>
            <li>Approval manual lewat halaman Tools.</li>
            <li>Mode auto/delay memanfaatkan kolom <code>scheduled_at</code>.</li>
            <li>Gunakan token <code>ADMIN_OPS_TOKEN</code> untuk trigger dari GitHub Actions.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><FaTools /> System Tools Status</h2>
          <button
            onClick={loadToolsInfo}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            disabled={loadingTools}
          >{loadingTools ? 'Memuat...' : 'Refresh'}</button>
        </div>
        {!toolsInfo && <p className="text-sm text-gray-600 dark:text-gray-400">Klik refresh untuk melihat status terminal, saran AI, dan provider aktif.</p>}
        {toolsInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FaTerminal /> Terminal</h3>
              {toolsInfo.terminal?.allowed ? (
                <p className="text-sm">Commands: {toolsInfo.terminal.allowed.length}</p>
              ) : (
                <p className="text-sm text-red-200">{toolsInfo.terminal?.error || 'Unavailable'}</p>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 shadow">
              <h3 className="font-semibold mb-2">AI Suggestions</h3>
              <p className="text-sm">Total Suggestions: {toolsInfo.suggestionsCount ?? 0}</p>
              <p className="text-xs mt-1">Provider Echo Test: {toolsInfo.aiProviderEcho || 'n/a'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow">
              <h3 className="font-semibold mb-2">Ops</h3>
              <p className="text-sm">Mode: {process.env.AUTO_EXECUTE_MODE || 'off'}</p>
              <p className="text-xs opacity-80">Webhook: {process.env.OPS_WEBHOOK_URL ? 'configured' : 'none'}</p>
            </div>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">Untuk menambah command terminal baru, edit whitelist di <code>/api/admin/terminal/route.ts</code>.</div>
      </div>
    </div>
  );
}

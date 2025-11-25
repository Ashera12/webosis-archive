"use client";
import React, { useState } from 'react';

export default function TerminalRunner() {
  const [list, setList] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [unsafeAllowed, setUnsafeAllowed] = useState(false);
  const [rawCmd, setRawCmd] = useState('');

  async function fetchAllowed() {
    setLoadingList(true);
    try {
      const r = await fetch('/api/admin/terminal');
      const text = await r.text();
      if (text.trim().startsWith('<')) {
        console.error('[TerminalRunner] HTML response instead of JSON:', text.substring(0, 200));
        return;
      }
      const j = JSON.parse(text);
      setList(j.allowed || []);
      setUnsafeAllowed(!!j.unsafeAllowed);
    } catch (e) {
      console.error(e);
    } finally { setLoadingList(false); }
  }

  async function run() {
    if (!selected) return alert('Select a command id');
    if (!confirm('Run terminal command: ' + selected + '?')) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/terminal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected }) });
      const text = await r.text();
      if (text.trim().startsWith('<')) {
        console.error('[TerminalRunner] HTML response instead of JSON:', text.substring(0, 200));
        setResult({ error: 'Server error - received HTML instead of JSON' });
        return;
      }
      const j = JSON.parse(text);
      setResult(j);
    } catch (e) {
      setResult({ error: String(e) });
    } finally { setRunning(false); }
  }

  async function runRaw() {
    if (!rawCmd.trim()) return alert('Masukkan perintah');
    if (!confirm('Jalankan RAW command berisiko: ' + rawCmd + ' ?')) return;
    setRunning(true);
    setResult(null);
    try {
      // Try to get token from sessionStorage first
      let token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_ops_token') : null;
      
      // If not cached, prompt user
      if (!token) {
        token = prompt('Masukkan ADMIN_OPS_TOKEN (diperlukan)') || '';
        if (token) {
          // Cache for this session
          sessionStorage.setItem('admin_ops_token', token);
        }
      }
      
      const r = await fetch('/api/admin/terminal', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-ops-token': token }, body: JSON.stringify({ raw: rawCmd }) });
      const text = await r.text();
      if (text.trim().startsWith('<')) {
        console.error('[TerminalRunner] HTML response instead of JSON:', text.substring(0, 200));
        setResult({ error: 'Server error - received HTML instead of JSON' });
        return;
      }
      const j = JSON.parse(text);
      
      // If auth error, clear cached token
      if (j.error && (j.error.includes('Invalid') || j.error.includes('token') || j.error.includes('Unauthorized'))) {
        sessionStorage.removeItem('admin_ops_token');
      }
      
      setResult(j);
    } catch (e) {
      setResult({ error: String(e) });
    } finally { setRunning(false); }
  }

  // Auto-load on mount
  React.useEffect(() => {
    fetchAllowed();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button 
          onClick={fetchAllowed} 
          disabled={loadingList} 
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingList ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </span>
          ) : 'Load Commands'}
        </button>
        <select 
          value={selected} 
          onChange={(e) => setSelected(e.target.value)} 
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
        >
          <option value="">Pilih command</option>
          {list.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        <button 
          onClick={run} 
          disabled={running || !selected} 
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Running...
            </span>
          ) : 'Run'}
        </button>
      </div>
      {result && (
        <div className="bg-slate-900 dark:bg-black border-2 border-slate-700 dark:border-slate-600 rounded-xl p-4 shadow-inner">
          <pre className="whitespace-pre-wrap text-xs text-green-400 font-mono">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="font-semibold">Info:</span> Hanya command whitelist yang bisa dieksekusi. Pengguna harus super_admin dan ALLOW_ADMIN_OPS=true.
      </p>
      {unsafeAllowed && (
        <div className="mt-6 space-y-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center space-x-2">
              <span>⚠️</span>
              <span>RAW MODE AKTIF (Berbahaya)</span>
            </div>
            <button 
              onClick={() => {
                sessionStorage.removeItem('admin_ops_token');
                alert('Token cache cleared. You will be prompted again on next RAW command.');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium transition-colors"
            >
              Clear Token
            </button>
          </div>
          <input
            value={rawCmd}
            onChange={(e)=>setRawCmd(e.target.value)}
            placeholder="contoh: node -v"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-red-400 dark:border-red-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
          <button
            onClick={runRaw}
            disabled={running || !rawCmd.trim()}
            className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >{running ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Running...
            </span>
          ) : 'Run RAW Command'}</button>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">⚠️ Gunakan hanya untuk debugging cepat. Token wajib. Hindari perintah destruktif.</p>
        </div>
      )}
    </div>
  );
}

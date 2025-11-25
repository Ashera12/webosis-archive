"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';

export default function ApplySqlControls() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  async function fetchPreview() {
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch('/api/admin/maintenance/apply-sql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'preview' }) });
      const json = await safeJson(res, { url: '/api/admin/maintenance/apply-sql', method: 'POST' }).catch(() => ({}));
      if (res.ok && json.sections) setSections(json.sections);
      else setResult(json);
    } catch (e) {
      setResult({ error: String(e) });
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchPreview(); }, []);

  async function runMode(mode: 'apply-non-destructive' | 'apply-all') {
    if (mode === 'apply-all') {
      if (!confirm('This will run destructive SQL (DELETE). Ensure backups exist. Type YES to confirm:') ) return;
    }
    setLoading(true);
    setResult(null);
    try {
      const body: any = { mode };
      if (mode === 'apply-all') body.confirm = 'YES';
      const res = await apiFetch('/api/admin/maintenance/apply-sql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await safeJson(res, { url: '/api/admin/maintenance/apply-sql', method: 'POST' }).catch(() => ({}));
      setResult(json);
      // refresh preview after apply
      await fetchPreview();
    } catch (e) {
      setResult({ error: String(e) });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Apply SQL (repo)</h4>
      <p>Preview and run SQL sections from <code>supabase-apply-all.sql</code>. Only super_admin can execute.</p>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => fetchPreview()} disabled={loading} style={{ padding: '6px 10px', marginRight: 8 }}>Refresh Preview</button>
        <button onClick={() => runMode('apply-non-destructive')} disabled={loading} style={{ padding: '6px 10px', marginRight: 8 }}>Apply non-destructive</button>
        <button onClick={() => runMode('apply-all')} disabled={loading} style={{ padding: '6px 10px' }}>Apply ALL (destructive)</button>
      </div>
      {sections.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <strong>Sections:</strong>
          <ul>
            {sections.map((s) => (<li key={s.id}>#{s.id} — {s.title} — {s.length} chars</li>))}
          </ul>
        </div>
      )}
      {result && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12 }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

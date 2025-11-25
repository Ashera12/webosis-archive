"use client";
import React from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';

export default function DuplicatesControls({}: {}) {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const downloadCSV = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/attendance/duplicates');
      if (!res.ok) throw new Error('Failed to fetch duplicates');
      const json = await safeJson(res, { url: '/api/admin/attendance/duplicates', method: 'GET' }).catch(() => ({}));
      const rows: any[] = [];
      // emails
      for (const e of json.emails || []) rows.push({ type: 'email', event_id: e.event_id, key: e.email_norm, count: e.cnt, first_seen: e.first_seen });
      for (const u of json.users || []) rows.push({ type: 'user', event_id: u.event_id, key: u.user_id, count: u.cnt, first_seen: u.first_seen });
      const headers = ['type', 'event_id', 'key', 'count', 'first_seen'];
      const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
        const v = r[h as keyof typeof r];
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(',')) ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `duplicates-preview.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Downloaded CSV');
    } catch (e: any) {
      setMessage(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    if (!confirm('This will permanently delete duplicate attendance rows (keeps earliest). Are you sure?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/attendance/cleanup', { method: 'POST' });
      const json = await safeJson(res, { url: '/api/admin/attendance/cleanup', method: 'POST' }).catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Cleanup failed');
      setMessage('Cleanup completed');
    } catch (e: any) {
      setMessage(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
      <button onClick={downloadCSV} className="btn-secondary" disabled={loading}>Download Duplicates CSV</button>
      <button onClick={runCleanup} className="btn-danger" disabled={loading}>Run Cleanup (remove duplicates)</button>
      {message && <div style={{ marginLeft: 8 }}>{message}</div>}
    </div>
  );
}

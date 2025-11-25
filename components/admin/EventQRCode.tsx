"use client";
import React from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';

export default function EventQRCode({ eventId }: { eventId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
  // send single_use default false; admin UI can toggle in future
    const res = await apiFetch(`/api/admin/events/${eventId}/generate-qr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ single_use: false }) });
      const json = await safeJson(res, { url: `/api/admin/events/${eventId}/generate-qr`, method: 'POST' }).catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed');
      setDataUrl(json.dataUrl);
      setToken(json.token);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const [downloading, setDownloading] = React.useState(false);
  const downloadCSV = async () => {
    setDownloading(true);
    setError(null);
    try {
  const res = await apiFetch(`/api/admin/events/${eventId}/attendance`, { method: 'GET', headers: { Accept: 'text/csv' } as any });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error((json && (json.error || json.message)) || `Failed to download (${res.status})`);
      }
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDownloading(false);
    }
  };

  const [viewing, setViewing] = React.useState(false);
  const [rows, setRows] = React.useState<any[] | null>(null);
  const viewAttendance = async () => {
    setError(null);
    setViewing(true);
    try {
      const res = await apiFetch(`/api/admin/events/${eventId}/attendance`, { method: 'GET', headers: { Accept: 'application/json' } as any });
      if (!res.ok) {
        const j = await safeJson(res, { url: `/api/admin/events/${eventId}/attendance`, method: 'GET' }).catch(() => null);
        throw new Error((j && (j.error || j.message)) || 'Failed to fetch attendance');
      }
      const json = await safeJson(res, { url: `/api/admin/events/${eventId}/attendance`, method: 'GET' }).catch(() => ({}));
      setRows(json.rows || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setViewing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={generate} className="btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Generate QR'}</button>
        {token && <div style={{ fontSize: 12, color: '#444' }}>Token: {token}</div>}
      </div>

      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      {dataUrl && (
        <div style={{ marginTop: 12 }}>
          <img src={dataUrl} alt="Event QR" style={{ width: 240, height: 240, objectFit: 'contain', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }} />
          <div style={{ marginTop: 8 }}>
            <a href={dataUrl} download={`event-${eventId}-qr.png`} className="btn-secondary">Download PNG</a>
            <button onClick={downloadCSV} className="btn-secondary" style={{ marginLeft: 8 }} disabled={downloading}>{downloading ? 'Downloading...' : 'Download Attendance CSV'}</button>
            <button onClick={viewAttendance} className="btn-secondary" style={{ marginLeft: 8 }} disabled={viewing}>{viewing ? 'Loading...' : 'View Attendance'}</button>
          </div>
        </div>
      )}

        {rows && rows.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <table className="table-auto" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6 }}>Scanned At</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>User ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ padding: 6 }}>{new Date(r.scanned_at).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>{r.name}</td>
                    <td style={{ padding: 6 }}>{r.email}</td>
                    <td style={{ padding: 6 }}>{r.user_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

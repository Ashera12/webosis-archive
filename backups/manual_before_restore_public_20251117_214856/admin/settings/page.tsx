import React from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="ds-container p-6">
      <h1 className="ds-heading mb-2">Admin Settings (placeholder)</h1>
      <p className="ds-subtle mb-4">Minimal settings UI restored. Full settings UI can be restored from backups on request.</p>
      <div className="flex gap-3">
        <Link href="/admin" className="px-3 py-2 bg-gray-200 rounded">Back to Admin</Link>
        <button className="ds-btn">Open Settings API</button>
      </div>
    </div>
  );
}

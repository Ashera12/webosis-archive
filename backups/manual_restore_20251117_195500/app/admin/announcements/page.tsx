import React from 'react';
import Link from 'next/link';

export default function AnnouncementsPage() {
  return (
    <div className="ds-container p-6">
      <h1 className="ds-heading">Announcements (admin)</h1>
      <p className="ds-subtle">This is a restored admin announcements page placeholder. Full UI can be restored from backups on request.</p>
      <div className="mt-4 flex gap-3">
        <Link href="/admin/announcements" className="ds-btn">Open Announcements API</Link>
        <Link href="/admin" className="px-3 py-2 bg-gray-200 rounded">Back to Admin</Link>
      </div>
    </div>
  );
}



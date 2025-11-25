import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600 mb-4">Core admin pages restored as safe placeholders. Restore full UI from backups when ready.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/admin/announcements" className="px-4 py-3 bg-blue-600 text-white rounded">Announcements</Link>
        <Link href="/admin/events" className="px-4 py-3 bg-green-600 text-white rounded">Events</Link>
        <Link href="/admin/settings" className="px-4 py-3 bg-yellow-600 text-white rounded">Settings</Link>
      </div>
    </div>
  );
}
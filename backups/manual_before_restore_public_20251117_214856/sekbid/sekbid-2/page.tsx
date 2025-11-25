export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import React from 'react';

export default function Page() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Sekbid 2</h1>
      <p className="text-lg text-gray-600">Halaman utama Sekbid 2. Konten akan segera tersedia.</p>
    </div>
  );
}

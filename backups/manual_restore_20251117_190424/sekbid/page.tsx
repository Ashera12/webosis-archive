
'use client';
import React from 'react';
import Link from 'next/link';

export default function SekbidLandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 dark:text-blue-200 mb-8 drop-shadow-lg">Bidang OSIS</h1>
      <p className="text-lg text-blue-700 dark:text-blue-300 mb-8">Pilih salah satu Sekbid untuk melihat program dan dokumentasi kegiatannya.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {[
          { name: "Sekbid 1", href: "/sekbid/sekbid-1", color: "bg-blue-100 dark:bg-blue-900/40" },
          { name: "Sekbid 2", href: "/sekbid/sekbid-2", color: "bg-green-100 dark:bg-green-900/40" },
          { name: "Sekbid 3", href: "/sekbid/sekbid-3", color: "bg-yellow-100 dark:bg-yellow-900/40" },
          { name: "Sekbid 4", href: "/sekbid/sekbid-4", color: "bg-purple-100 dark:bg-purple-900/40" },
          { name: "Sekbid 5", href: "/sekbid/sekbid-5", color: "bg-pink-100 dark:bg-pink-900/40" },
          { name: "Sekbid 6", href: "/sekbid/sekbid-6", color: "bg-orange-100 dark:bg-orange-900/40" },
        ].map(({ name, href, color }) => (
          <Link
            key={name}
            href={href}
            className={`rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-8 flex flex-col items-center justify-center text-xl font-semibold text-blue-900 dark:text-blue-200 hover:scale-105 ${color}`}
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}

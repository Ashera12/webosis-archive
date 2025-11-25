'use client';

import { useEffect, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { useTranslation } from '@/hooks/useTranslation';
import { getActiveSekbid } from '@/lib/supabase/client';
import AnimatedSection from './AnimatedSection';

interface Sekbid {
  id: number;
  name?: string;
  nama?: string;
  deskripsi?: string;
  icon?: string;
  color?: string;
  order_index?: number;
}

const canonicalSekbids: Sekbid[] = [
  { id: 1, nama: 'Sekbid 1 - Keagamaan', deskripsi: 'Membina keimanan dan ketakwaan siswa', icon: '/icons/keagamaan.svg', color: '#10B981' },
  { id: 2, nama: 'Sekbid 2 - Kaderisasi', deskripsi: 'Meningkatkan kedisiplinan, tanggung jawab, dan keteladanan bagi seluruh siswa dan pengurus OSIS', icon: '/icons/kaderisasi.svg', color: '#6366F1' },
  { id: 3, nama: 'Sekbid 3 - Akademik', deskripsi: 'Mengembangkan prestasi akademik dan non-akademik', icon: '/icons/akademik.svg', color: '#A78BFA' },
  { id: 4, nama: 'Sekbid 4 - Ekonomi Kreatif', deskripsi: 'Meningkatkan keterampilan dan jiwa wirausaha', icon: '/icons/ekonomi.svg', color: '#F59E0B' },
  { id: 5, nama: 'Sekbid 5 - Kesehatan', deskripsi: 'Menjaga kesehatan dan kelestarian lingkungan', icon: '/icons/kesehatan.svg', color: '#14B8A6' },
  { id: 6, nama: 'Sekbid 6 - Kominfo', deskripsi: 'Kominfo / Web Development', icon: '/icons/kominfo.svg', color: '#06B6D4' }
];

export default function SekbidSection() {
  const { t } = useTranslation();
  const [sekbids, setSekbids] = useState<Sekbid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSekbid() {
      try {
        // Use API for real-time sync
        const response = await apiFetch('/api/sekbid');
        if (response.ok) {
          const result = await safeJson(response, { url: '/api/sekbid', method: 'GET' }).catch(() => ({}));
          const data = result.sekbid || [];
          
          // Deduplicate fetched rows by `name` or `nama` to avoid duplicate cards
          const arr = (data as Sekbid[]) || [];
          const seen = new Set<string>();
          const unique: Sekbid[] = [];
          for (const s of arr) {
            const key = (s.name ?? s.nama ?? String(s.id)).toString().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(s);
            }
          }

          // Merge with canonical list of 6 Sekbid. Prefer fetched values when present,
          // but always render exactly these 6 in the specified order on the homepage.
          const merged = canonicalSekbids.map((c) => {
            const found = unique.find((u) => {
              if (!u) return false;
              if (u.id === c.id) return true;
              if (u.name && u.name.toLowerCase().includes(`sekbid-${c.id}`)) return true;
              if (u.nama && u.nama.toLowerCase().includes(`sekbid ${c.id}`)) return true;
              return false;
            });
            return {
              ...c,
              ...(found ?? {}),
              id: c.id,
            } as Sekbid;
          });

          setSekbids(merged);
        }
      } catch (error) {
        console.error('Error loading sekbid:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSekbid();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <AnimatedSection id="sekbid">
      <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="heading-primary text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-gray-100 mb-6">
              {(() => {
                const raw = t('people.sekbidCount') || 'Seksi Bidang';
                const parts = raw.split(' ');
                if (parts.length <= 1) return raw;
                const last = parts.pop();
                return (
                  <>
                    {parts.join(' ')} <span className="text-yellow-600 dark:text-yellow-400">{last}</span>
                  </>
                );
              })()}
            </h2>
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
              <div className="w-4 h-4 bg-yellow-400 rounded-full" />
              <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('sekbid.subtitle') || 'Seksi-seksi bidang yang menggerakkan OSIS'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {sekbids.map((sekbid, index) => (
              <div
                key={sekbid.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Colored accent bar */}
                <div
                  className="absolute top-0 left-0 w-full h-2 transition-all duration-300 group-hover:h-3"
                  style={{ backgroundColor: sekbid.color }}
                />

                {/* Icon (support both JSX icon components and string paths) */}
                <div className="mb-6 transition-transform duration-300 group-hover:scale-110">
                  {typeof sekbid.icon === 'string' ? (
                    <img
                      src={sekbid.icon?.startsWith('/') ? sekbid.icon : `/${sekbid.icon}`}
                      alt={sekbid.nama ?? sekbid.name ?? 'Sekbid icon'}
                      className="w-16 h-16 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/placeholder.svg'; }}
                      style={{ filter: sekbid.color ? undefined : undefined }}
                    />
                  ) : (
                    <div className="text-6xl" style={{ color: sekbid.color }}>
                      {sekbid.icon}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  {sekbid.nama ?? sekbid.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {sekbid.deskripsi}
                </p>

                {/* Hover effect overlay */}
                <div
                  className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  style={{ backgroundColor: sekbid.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

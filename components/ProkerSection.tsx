'use client';

import { useState, useEffect } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import AnimatedSection from './AnimatedSection';
import { getSekbidIcon } from '@/lib/sekbidIcons';
import { FaCalendar, FaClock, FaCheckCircle, FaSpinner, FaBan, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

interface Proker {
  id: string;
  title: string;
  description: string | null;
  sekbid_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  sekbid?: {
    id: number;
    name: string;
  };
}

interface SekbidGroup {
  sekbid_id: number;
  sekbid_name: string;
  programs: Proker[];
  count: number;
}

const STATUS_CONFIG = {
  planned: { label: 'Direncanakan', icon: FaClock, color: 'text-gray-600', bg: 'bg-gray-100' },
  ongoing: { label: 'Berlangsung', icon: FaSpinner, color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Selesai', icon: FaCheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Dibatalkan', icon: FaBan, color: 'text-red-600', bg: 'bg-red-100' },
};

export default function ProkerSection() {
  const [prokerData, setProkerData] = useState<Proker[]>([]);
  const [groupedData, setGroupedData] = useState<SekbidGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProker();
  }, []);

  const fetchProker = async () => {
    try {
      const response = await apiFetch('/api/proker');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await safeJson(response, { url: '/api/proker', method: 'GET' });
      const proker = data.proker || [];
      setProkerData(proker);

      // Group by sekbid
      const grouped: Record<number, SekbidGroup> = {};
      proker.forEach((p: Proker) => {
        if (p.sekbid_id && p.sekbid_id >= 1 && p.sekbid_id <= 6) {
          if (!grouped[p.sekbid_id]) {
            grouped[p.sekbid_id] = {
              sekbid_id: p.sekbid_id,
              sekbid_name: p.sekbid?.name || `Sekbid ${p.sekbid_id}`,
              programs: [],
              count: 0,
            };
          }
          grouped[p.sekbid_id].programs.push(p);
          grouped[p.sekbid_id].count++;
        }
      });

      setGroupedData(Object.values(grouped).sort((a, b) => a.sekbid_id - b.sekbid_id));
    } catch (error) {
      console.error('Error fetching proker:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-spin w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat program kerja...</p>
        </div>
      </section>
    );
  }

  if (groupedData.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">Belum ada program kerja yang tersedia.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {groupedData.map((group, idx) => {
          const sekbidInfo = getSekbidIcon(group.sekbid_id);
          const Icon = sekbidInfo?.icon;

          // Show only first 3 programs per sekbid on homepage
          const displayPrograms = group.programs.slice(0, 3);

          return (
            <AnimatedSection key={group.sekbid_id} delay={0.1 * idx}>
              <div className="mb-12 sm:mb-16 last:mb-0">
                {/* Sekbid Header */}
                <div className={`${sekbidInfo?.bgColor} dark:bg-opacity-20 rounded-2xl p-4 sm:p-6 mb-6 border-l-4`} style={{ borderColor: sekbidInfo?.color.replace('text-', '') }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {Icon && (
                        <div className={`${sekbidInfo?.bgColor} ${sekbidInfo?.color} p-3 sm:p-4 rounded-xl shadow-lg`}>
                          <Icon className="text-3xl sm:text-4xl" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          Sekbid {group.sekbid_id}: {group.sekbid_name}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          {group.count} Program Kerja
                        </p>
                      </div>
                    </div>
                    <Link 
                      href={`/sekbid/${group.sekbid_id}`}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      Lihat Semua <FaArrowRight />
                    </Link>
                  </div>
                </div>

                {/* Program Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayPrograms.map((program) => {
                    const statusInfo = STATUS_CONFIG[program.status];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={program.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700"
                      >
                        {/* Status Badge */}
                        <div className={`${statusInfo.bg} ${statusInfo.color} px-4 py-2 flex items-center gap-2`}>
                          <StatusIcon className="text-sm" />
                          <span className="text-sm font-semibold">{statusInfo.label}</span>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                            {program.title}
                          </h3>
                          
                          {program.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {program.description}
                            </p>
                          )}

                          {/* Dates */}
                          <div className="space-y-2 text-sm">
                            {program.start_date && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <FaCalendar className="text-yellow-600" />
                                <span>Mulai: {formatDate(program.start_date)}</span>
                              </div>
                            )}
                            {program.end_date && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <FaCalendar className="text-yellow-600" />
                                <span>Selesai: {formatDate(program.end_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}

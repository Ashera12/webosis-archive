'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import AnimatedSection from '@/components/AnimatedSection';
import { getSekbidIcon } from '@/lib/sekbidIcons';
import { FaCalendar, FaClock, FaCheckCircle, FaSpinner, FaBan, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

interface Proker {
  id: string;
  title: string;
  description: string | null;
  sekbid_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

const STATUS_CONFIG = {
  planned: { label: 'Direncanakan', icon: FaClock, color: 'text-gray-700', bg: 'bg-gray-100', ring: 'ring-gray-300' },
  ongoing: { label: 'Berlangsung', icon: FaSpinner, color: 'text-blue-700', bg: 'bg-blue-100', ring: 'ring-blue-300' },
  completed: { label: 'Selesai', icon: FaCheckCircle, color: 'text-green-700', bg: 'bg-green-100', ring: 'ring-green-300' },
  cancelled: { label: 'Dibatalkan', icon: FaBan, color: 'text-red-700', bg: 'bg-red-100', ring: 'ring-red-300' },
};

export default function SekbidDetailPage() {
  const params = useParams();
  const sekbidId = parseInt(params?.id as string);
  const [prokerList, setProkerList] = useState<Proker[]>([]);
  const [loading, setLoading] = useState(true);

  const sekbidInfo = getSekbidIcon(sekbidId);
  const Icon = sekbidInfo?.icon;

  useEffect(() => { 
    if (sekbidId) {
      fetchProker();
    }
  }, [sekbidId]);

  const fetchProker = async () => {
    try {
      const response = await apiFetch(`/api/proker?sekbid_id=${sekbidId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await safeJson(response, { url: `/api/proker?sekbid_id=${sekbidId}`, method: 'GET' }).catch(() => ({}));
      setProkerList(data.proker || []);
    } catch (error) {
      console.error('Error fetching proker:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Tanggal belum ditentukan';
    if (start && !end) return `Mulai ${formatDate(start)}`;
    if (!start && end) return `Sampai ${formatDate(end)}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <AnimatedSection>
          <section className={`py-16 sm:py-20 lg:py-24 ${sekbidInfo?.bgColor} dark:bg-opacity-20 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-900/50" />
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              {/* Back Button */}
              <Link 
                href="/bidang"
                className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FaArrowLeft /> Kembali ke Semua Program
              </Link>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                {Icon && (
                  <div className={`${sekbidInfo?.bgColor} ${sekbidInfo?.color} p-4 sm:p-6 rounded-2xl shadow-2xl`}>
                    <Icon className="text-4xl sm:text-5xl lg:text-6xl" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Sekbid {sekbidId}: {sekbidInfo?.name}
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300">
                    {sekbidInfo?.description}
                  </p>
                </div>
              </div>

              {!loading && (
                <div className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Total: <span className={sekbidInfo?.color}>{prokerList.length}</span> Program Kerja
                  </p>
                </div>
              )}
            </div>
          </section>
        </AnimatedSection>

        {/* Program Kerja List */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-16 sm:py-20">
                <div className="animate-spin w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat program kerja...</p>
              </div>
            ) : prokerList.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                  Belum ada program kerja untuk sekbid ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {prokerList.map((program, idx) => {
                  const statusInfo = STATUS_CONFIG[program.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <AnimatedSection key={program.id} delay={0.05 * idx}>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-gray-100 dark:border-gray-700">
                        {/* Status Header */}
                        <div className={`${statusInfo.bg} ${statusInfo.color} px-6 py-3 flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="text-lg animate-pulse" />
                            <span className="font-bold">{statusInfo.label}</span>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${statusInfo.bg} ${statusInfo.ring} ring-2`} />
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                            {program.title}
                          </h3>
                          
                          {program.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                              {program.description}
                            </p>
                          )}

                          {/* Date Info */}
                          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <FaCalendar className="text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Periode Pelaksanaan
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getDateRange(program.start_date, program.end_date)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Ditambahkan: {formatDate(program.created_at)}
                          </p>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

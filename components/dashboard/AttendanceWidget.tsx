'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaCheckCircle, FaClock, FaExclamationCircle, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';

interface TodayAttendance {
  id: number;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
  is_verified: boolean;
}

export default function AttendanceWidget() {
  const { data: session } = useSession();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAllowed = ['siswa', 'guru'].includes(userRole);

  useEffect(() => {
    if (session?.user && isAllowed) {
      fetchTodayAttendance();
    } else {
      setLoading(false);
    }
  }, [session, isAllowed]);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/history?limit=1&date=${today}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setTodayAttendance(data.data[0]);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tidak tampilkan widget jika bukan siswa/guru
  if (!isAllowed) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: 'green',
      late: 'orange',
      absent: 'red',
      sick: 'yellow',
      permission: 'blue',
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          Absensi Hari Ini
        </h2>
        <Link
          href="/attendance"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold flex items-center gap-1"
        >
          Lihat Detail <FaArrowRight className="text-xs" />
        </Link>
      </div>

      {todayAttendance ? (
        <div className={`bg-gradient-to-r from-${getStatusColor(todayAttendance.status)}-50 to-${getStatusColor(todayAttendance.status)}-100 dark:from-${getStatusColor(todayAttendance.status)}-900/20 dark:to-${getStatusColor(todayAttendance.status)}-800/20 border-2 border-${getStatusColor(todayAttendance.status)}-200 dark:border-${getStatusColor(todayAttendance.status)}-700 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <FaCheckCircle className={`text-2xl text-${getStatusColor(todayAttendance.status)}-600`} />
            <div>
              <p className={`text-sm font-semibold text-${getStatusColor(todayAttendance.status)}-900 dark:text-${getStatusColor(todayAttendance.status)}-100`}>
                Status: {todayAttendance.status === 'present' ? 'Hadir' : 'Terlambat'}
              </p>
              <p className={`text-xs text-${getStatusColor(todayAttendance.status)}-700 dark:text-${getStatusColor(todayAttendance.status)}-300`}>
                {todayAttendance.is_verified ? '✓ Terverifikasi' : '⏳ Menunggu verifikasi'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className={`text-xs text-${getStatusColor(todayAttendance.status)}-700 dark:text-${getStatusColor(todayAttendance.status)}-400 font-semibold`}>
                Check-in:
              </p>
              <p className={`font-bold text-${getStatusColor(todayAttendance.status)}-900 dark:text-${getStatusColor(todayAttendance.status)}-100`}>
                {formatTime(todayAttendance.check_in_time)}
              </p>
            </div>
            {todayAttendance.check_out_time ? (
              <div>
                <p className={`text-xs text-${getStatusColor(todayAttendance.status)}-700 dark:text-${getStatusColor(todayAttendance.status)}-400 font-semibold`}>
                  Check-out:
                </p>
                <p className={`font-bold text-${getStatusColor(todayAttendance.status)}-900 dark:text-${getStatusColor(todayAttendance.status)}-100`}>
                  {formatTime(todayAttendance.check_out_time)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold">Check-out:</p>
                <p className="font-bold text-orange-900 dark:text-orange-100">Belum</p>
              </div>
            )}
          </div>

          {!todayAttendance.check_out_time && (
            <Link
              href="/attendance"
              className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              Check-out Sekarang
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <FaExclamationCircle className="text-2xl text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                Belum Absen Hari Ini
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Jangan lupa untuk melakukan absensi
              </p>
            </div>
          </div>

          <Link
            href="/attendance"
            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all"
          >
            Absen Sekarang
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/attendance"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between"
        >
          <span>Lihat riwayat lengkap</span>
          <FaArrowRight />
        </Link>
      </div>
    </div>
  );
}

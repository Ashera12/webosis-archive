'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaClock, FaUserGraduate, FaChalkboardTeacher, FaFilter, FaDownload, FaEye, FaCheck, FaTimes, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { formatAttendanceTime, calculateDuration, getStatusColor } from '@/lib/attendance/utils';

interface AttendanceRecord {
  id: number;
  user_id: string;
  user_name: string;
  user_role: string;
  check_in_time: string;
  check_out_time: string | null;
  latitude: number;
  longitude: number;
  location_accuracy: number;
  photo_selfie_url: string;
  wifi_ssid: string;
  status: string;
  is_verified: boolean;
  notes: string | null;
  created_at: string;
}

export default function AdminAttendancePage() {
  const { data: session, status } = useSession();
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    role: 'all',
    status: 'all',
    date: '',
  });
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    siswa: 0,
    guru: 0,
    verified: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user.role || '').toLowerCase();
      if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
        redirect('/dashboard');
      } else {
        fetchAttendances();
      }
    }
  }, [session, filter]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.role !== 'all') params.append('role', filter.role);
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.date) params.append('date', filter.date);

      const response = await fetch(`/api/admin/attendance?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAttendances(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: AttendanceRecord[]) => {
    setStats({
      total: data.length,
      siswa: data.filter(a => a.user_role === 'siswa').length,
      guru: data.filter(a => a.user_role === 'guru').length,
      verified: data.filter(a => a.is_verified).length,
    });
  };

  const handleVerify = async (attendanceId: number, verified: boolean) => {
    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId,
          isVerified: verified,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Absensi ${verified ? 'diverifikasi' : 'dibatalkan'}`);
        fetchAttendances();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal update status');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nama', 'Role', 'Check-in', 'Check-out', 'Durasi', 'WiFi', 'Status', 'Verified'];
    const rows = attendances.map(a => [
      a.user_name,
      a.user_role,
      formatAttendanceTime(a.check_in_time),
      a.check_out_time ? formatAttendanceTime(a.check_out_time) : '-',
      calculateDuration(a.check_in_time, a.check_out_time),
      a.wifi_ssid,
      a.status,
      a.is_verified ? 'Ya' : 'Tidak',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Data berhasil di-export');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Memuat data absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaCheckCircle className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Absensi</h1>
                <p className="text-gray-600 dark:text-gray-300">Monitoring absensi siswa & guru</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Absensi', value: stats.total, icon: FaCheckCircle, color: 'blue' },
            { label: 'Siswa', value: stats.siswa, icon: FaUserGraduate, color: 'purple' },
            { label: 'Guru', value: stats.guru, icon: FaChalkboardTeacher, color: 'indigo' },
            { label: 'Terverifikasi', value: stats.verified, icon: FaCheck, color: 'green' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/20 dark:to-${stat.color}-800/20 border-2 border-${stat.color}-200 dark:border-${stat.color}-700 rounded-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.label}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-900 dark:text-${stat.color}-100 mt-2`}>{stat.value}</p>
                </div>
                <stat.icon className={`text-4xl text-${stat.color}-600 opacity-50`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <FaFilter className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Role</label>
              <select
                value={filter.role}
                onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none text-gray-900 dark:text-white"
              >
                <option value="all">Semua</option>
                <option value="siswa">Siswa</option>
                <option value="guru">Guru</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none text-gray-900 dark:text-white"
              >
                <option value="all">Semua</option>
                <option value="present">Hadir</option>
                <option value="late">Terlambat</option>
                <option value="sick">Sakit</option>
                <option value="permission">Izin</option>
                <option value="absent">Absen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <FaCalendar /> Tanggal
              </label>
              <input
                type="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Check-out</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Durasi</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FaClock className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada data absensi</p>
                    </td>
                  </tr>
                ) : (
                  attendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{attendance.user_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{attendance.wifi_ssid}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          attendance.user_role === 'siswa'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                          {attendance.user_role === 'siswa' ? <FaUserGraduate className="mr-1" /> : <FaChalkboardTeacher className="mr-1" />}
                          {attendance.user_role === 'siswa' ? 'Siswa' : 'Guru'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {formatAttendanceTime(attendance.check_in_time)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {attendance.check_out_time ? formatAttendanceTime(attendance.check_out_time) : (
                          <span className="text-orange-600 font-semibold">Belum checkout</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 font-semibold">
                        {calculateDuration(attendance.check_in_time, attendance.check_out_time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-${getStatusColor(attendance.status)}-100 text-${getStatusColor(attendance.status)}-700 dark:bg-${getStatusColor(attendance.status)}-900/30 dark:text-${getStatusColor(attendance.status)}-300`}>
                          {attendance.is_verified ? <FaCheck className="mr-1" /> : <FaClock className="mr-1" />}
                          {attendance.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => setSelectedAttendance(attendance)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs font-semibold"
                        >
                          <FaEye className="mr-1" /> Detail
                        </button>
                        {!attendance.is_verified && (
                          <button
                            onClick={() => handleVerify(attendance.id, true)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-all text-xs font-semibold"
                          >
                            <FaCheck className="mr-1" /> Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedAttendance && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-2xl font-bold text-white">Detail Absensi</h3>
                <button
                  onClick={() => setSelectedAttendance(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Photo */}
                {selectedAttendance.photo_selfie_url && (
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">Foto Selfie</h4>
                    <img
                      src={selectedAttendance.photo_selfie_url}
                      alt="Selfie"
                      className="w-full rounded-xl shadow-lg"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nama</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedAttendance.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedAttendance.user_role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatAttendanceTime(selectedAttendance.check_in_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedAttendance.check_out_time ? formatAttendanceTime(selectedAttendance.check_out_time) : 'Belum checkout'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">WiFi</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedAttendance.wifi_ssid}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedAttendance.status}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <FaMapMarkerAlt /> Lokasi
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Lat: {selectedAttendance.latitude.toFixed(6)}, Lon: {selectedAttendance.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Akurasi: {selectedAttendance.location_accuracy.toFixed(0)} meter
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedAttendance.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Catatan</p>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedAttendance.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

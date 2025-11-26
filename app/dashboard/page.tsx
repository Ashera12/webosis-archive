'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaGlobe, FaUser, FaChartLine, FaCalendarAlt, FaClock, FaEnvelope, FaIdCard, FaSchool, FaUserTag } from 'react-icons/fa';
import RoleBadge from '@/components/RoleBadge';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  username?: string;
  nisn?: string;
  nik?: string;
  unit?: string;
  kelas?: string;
  requested_role?: string;
  photo_url?: string;
  created_at?: string;
  email_verified?: boolean;
  approved?: boolean;
  updated_at?: string;
  sekbid_id?: number;
}

export default function UserDashboard() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Parse userId from query if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('userId');
      setTargetUserId(q);
    }
    if (session?.user) {
      loadProfile();
      
      // Auto-refresh profile every 30 seconds to detect admin changes
      const interval = setInterval(() => {
        loadProfile();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadProfile = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      const idToLoad = targetUserId || session?.user?.id;
      // Use dedicated profile endpoint for own profile, admin endpoint for viewing others
      const endpoint = targetUserId && targetUserId !== session?.user?.id 
        ? `/api/admin/users/${idToLoad}`
        : '/api/profile';
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      if (data.success) {
        const newProfile = {
          name: data.data.name || '',
          email: data.data.email || '',
          role: data.data.role || '',
          username: data.data.username || data.data.nickname || '',
          nisn: data.data.nisn || '',
          nik: data.data.nik || '',
          unit: data.data.unit || data.data.unit_sekolah || '',
          kelas: data.data.kelas || '',
          requested_role: data.data.requested_role || '',
          photo_url: data.data.profile_image || data.data.photo_url || '',
          created_at: data.data.created_at || '',
          email_verified: data.data.email_verified || false,
          approved: data.data.approved || false,
          updated_at: data.data.updated_at || '',
          sekbid_id: data.data.sekbid_id || null,
        };
        setProfile(newProfile);
        
        // Update session if role changed and viewing own profile
        if (!targetUserId && session?.user?.role !== data.data.role) {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              role: data.data.role,
              name: data.data.name,
              image: data.data.profile_image || data.data.photo_url,
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const userName = profile?.name || session?.user?.name || 'User';
  const userEmail = profile?.email || session?.user?.email || '';
  const userRole = profile?.role || session?.user?.role || 'siswa';
  const userPhoto = profile?.photo_url || session?.user?.image || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl shadow-2xl p-8 text-slate-900">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-2xl border-4 border-white">
                {userPhoto ? (
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-5xl font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">Selamat Datang, {userName}!</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <RoleBadge role={userRole} size="lg" />
                <span className="text-slate-700 font-medium">{userEmail}</span>
              </div>
              <p className="text-slate-800 text-lg">
                {userRole === 'guru' && 'Portal Guru - Monitor aktivitas dan kelola profil Anda'}
                {userRole === 'siswa' && 'Portal Siswa - Lihat progress dan kelola profil Anda'}
                {userRole === 'viewer' && 'Portal Viewer - Pantau aktivitas sekolah'}
                {userRole === 'other' && 'Selamat datang di sistem OSIS'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="/home"
                target="_blank"
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <FaGlobe className="text-xl" />
                View Public Website
              </Link>
              <Link
                href="/admin/profile"
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <FaUser className="text-xl" />
                My Profile
              </Link>
              <button
                onClick={() => loadProfile(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaClock className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUser className="text-yellow-500" />
              Data Pribadi
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaEnvelope className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{userEmail}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaUser className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nickname</p>
                  <p className={`font-medium ${profile?.username ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {profile?.username || 'belum diisi'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaIdCard className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">NIK (16 digit)</p>
                  <p className={`font-medium ${profile?.nik ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {profile?.nik || 'belum diisi'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaIdCard className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">NISN (10 digit)</p>
                  <p className={`font-medium ${profile?.nisn ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {profile?.nisn || 'belum diisi'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaSchool className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Unit Sekolah</p>
                  <p className={`font-medium ${profile?.unit ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {profile?.unit || 'belum diisi'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaSchool className="text-gray-400 text-xl" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                  <p className={`font-medium ${profile?.kelas ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {profile?.kelas || 'belum diisi'}
                  </p>
                </div>
              </div>
              
              {profile?.requested_role && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <FaUserTag className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Role Diminta</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{profile.requested_role}</p>
                  </div>
                </div>
              )}
              
              {profile?.created_at && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <FaCalendarAlt className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bergabung Sejak</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(profile.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaChartLine className="text-yellow-500" />
              Statistik
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Status Akun</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{profile?.approved ? 'Disetujui' : 'Menunggu Persetujuan'}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Email Verification</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{profile?.email_verified ? 'Verified' : 'Unverified'}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <FaEnvelope className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Role</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 capitalize">{userRole}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <FaUserTag className="text-white text-xl" />
                  </div>
                </div>
              </div>

              {profile?.updated_at && (
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-lg border-l-4 border-slate-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Terakhir Diperbarui</p>
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                        {new Date(profile.updated_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-slate-500 rounded-full flex items-center justify-center">
                      <FaClock className="text-white text-xl" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <FaGlobe className="text-white text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Public Website</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Akses website publik OSIS untuk melihat berita, event, dan informasi terbaru.
            </p>
            <Link
              href="/home"
              target="_blank"
              className="block text-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              Buka Website
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Edit Profil</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Update data pribadi, foto profil, dan informasi lainnya.
            </p>
            <Link
              href="/admin/profile"
              className="block text-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Edit Profil
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Aktivitas</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Lihat aktivitas dan partisipasi Anda dalam kegiatan OSIS.
            </p>
            <button
              disabled
              className="block w-full text-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              Segera Hadir
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white text-center">
          <p className="text-sm opacity-80">
            Anda login sebagai <span className="font-bold">{userRole.toUpperCase()}</span>. 
            Untuk mengakses fitur admin lengkap, hubungi administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

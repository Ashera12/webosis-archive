// app/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaUserCheck, 
  FaUserTimes,
  FaHeart,
  FaComment,
  FaShare,
  FaFileAlt,
  FaPoll,
  FaRobot,
  FaUserEdit,
  FaLock,
  FaCalendarAlt,
  FaImage,
  FaUsers,
  FaShieldAlt,
  FaEye,
  FaFilter,
  FaChevronDown,
  FaSpinner
} from 'react-icons/fa';

interface Activity {
  id: string;
  activity_type: string;
  action: string;
  description?: string;
  metadata?: any;
  created_at: string;
  status: string;
  ip_address?: string;
  related_type?: string;
  related_id?: string;
}

interface ActivityStats {
  [key: string]: number;
}

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  // Fetch activities
  const fetchActivities = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentOffset = loadMore ? offset : 0;
      let url = `/api/activity/timeline?limit=${limit}&offset=${currentOffset}`;
      
      if (filterType) {
        url += `&type=${filterType}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        if (loadMore) {
          setActivities(prev => [...prev, ...json.data.activities]);
        } else {
          setActivities(json.data.activities);
          setStats(json.data.stats);
        }
        setHasMore(json.data.pagination.hasMore);
        setOffset(currentOffset + limit);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (session) {
      setOffset(0);
      fetchActivities(false);
    }
  }, [session, filterType]);

  // Group activities by date
  const groupedActivities = activities.reduce((acc: any, activity) => {
    const date = new Date(activity.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = '';
    if (date.toDateString() === today.toDateString()) {
      key = 'Hari Ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Kemarin';
    } else {
      key = date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {});

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    const icons: any = {
      login: <FaSignInAlt className="text-green-500" />,
      logout: <FaSignOutAlt className="text-gray-500" />,
      attendance_checkin: <FaUserCheck className="text-blue-500" />,
      attendance_checkout: <FaUserTimes className="text-orange-500" />,
      post_create: <FaFileAlt className="text-purple-500" />,
      post_like: <FaHeart className="text-red-500" />,
      post_unlike: <FaHeart className="text-gray-400" />,
      post_comment: <FaComment className="text-blue-500" />,
      post_share: <FaShare className="text-indigo-500" />,
      poll_vote: <FaPoll className="text-teal-500" />,
      poll_create: <FaPoll className="text-green-500" />,
      ai_chat_message: <FaRobot className="text-cyan-500" />,
      ai_chat_session_start: <FaRobot className="text-green-500" />,
      ai_chat_session_end: <FaRobot className="text-gray-500" />,
      profile_update: <FaUserEdit className="text-yellow-500" />,
      password_change: <FaLock className="text-red-500" />,
      event_view: <FaCalendarAlt className="text-purple-500" />,
      event_register: <FaCalendarAlt className="text-green-500" />,
      gallery_view: <FaImage className="text-pink-500" />,
      gallery_upload: <FaImage className="text-blue-500" />,
      member_view: <FaUsers className="text-indigo-500" />,
      member_search: <FaUsers className="text-gray-500" />,
      security_validation: <FaShieldAlt className="text-orange-500" />,
      ai_verification: <FaEye className="text-purple-500" />,
    };
    return icons[type] || <FaFileAlt className="text-gray-500" />;
  };

  // Get label for activity type
  const getActivityLabel = (type: string) => {
    const labels: any = {
      login: 'Login',
      logout: 'Logout',
      attendance_checkin: 'Absen Masuk',
      attendance_checkout: 'Absen Pulang',
      post_create: 'Buat Post',
      post_like: 'Like Post',
      post_unlike: 'Unlike Post',
      post_comment: 'Komentar',
      post_share: 'Share Post',
      poll_vote: 'Vote Polling',
      poll_create: 'Buat Polling',
      ai_chat_message: 'Pesan AI',
      ai_chat_session_start: 'Mulai Chat AI',
      ai_chat_session_end: 'Selesai Chat AI',
      profile_update: 'Update Profil',
      password_change: 'Ganti Password',
      event_view: 'Lihat Event',
      event_register: 'Daftar Event',
      gallery_view: 'Lihat Galeri',
      gallery_upload: 'Upload Foto',
      member_view: 'Lihat Anggota',
      member_search: 'Cari Anggota',
      security_validation: 'Validasi Keamanan',
      ai_verification: 'Verifikasi AI',
    };
    return labels[type] || type;
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Activity type options
  const activityTypes = [
    { value: '', label: 'Semua Aktivitas' },
    { value: 'login', label: 'Login/Logout' },
    { value: 'attendance_checkin', label: 'Absensi' },
    { value: 'post_create', label: 'Post & Interaksi' },
    { value: 'poll_vote', label: 'Polling' },
    { value: 'ai_chat_message', label: 'AI Chat' },
    { value: 'profile_update', label: 'Profil & Keamanan' },
    { value: 'event_view', label: 'Event' },
    { value: 'gallery_view', label: 'Galeri' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <FaSpinner className="animate-spin text-6xl text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Memuat aktivitas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📊 Aktivitas Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Riwayat lengkap aktivitas dan partisipasi Anda
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaFilter />
              Filter
              <FaChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.values(stats).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Total Aktivitas</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(stats.attendance_checkin || 0) + (stats.attendance_checkout || 0)}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Absensi</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(stats.post_like || 0) + (stats.post_comment || 0) + (stats.post_share || 0)}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Interaksi Post</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900 dark:to-red-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.ai_chat_message || 0}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Pesan AI</div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipe Aktivitas
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Timeline */}
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <FaFileAlt className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">
              Belum Ada Aktivitas
            </p>
            <p className="text-gray-400 dark:text-gray-500">
              Aktivitas Anda akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, items]: [string, any]) => (
              <div key={date}>
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg mb-3 shadow-lg">
                  <h2 className="font-bold">{date}</h2>
                </div>
                <div className="space-y-3">
                  {items.map((activity: Activity) => (
                    <div
                      key={activity.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-4 border-l-4 border-blue-500"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {getActivityLabel(activity.activity_type)}
                            </span>
                            {activity.status !== 'success' && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                activity.status === 'failure' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                                {activity.status}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {activity.description || activity.action}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span>{formatTimeAgo(activity.created_at)}</span>
                            {activity.ip_address && (
                              <span className="flex items-center gap-1">
                                🌐 {activity.ip_address}
                              </span>
                            )}
                            {activity.metadata?.location && (
                              <span>📍 {activity.metadata.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchActivities(true)}
              disabled={loadingMore}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Memuat...
                </span>
              ) : (
                'Muat Lebih Banyak'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

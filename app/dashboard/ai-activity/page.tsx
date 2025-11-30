// app/dashboard/ai-activity/page.tsx
// USER ACTIVITY DASHBOARD - Menampilkan SEMUA aktivitas user (login, attendance, posts, AI, dll)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase/client';

interface UserActivity {
  id: number;
  created_at: string;
  activity_type: string;
  action: string;
  description: string;
  status: 'success' | 'failure' | 'pending' | 'error';
  metadata: any; // Metadata berbeda untuk setiap jenis aktivitas
  ip_address?: string;
  user_agent?: string;
  related_type?: string;
  related_id?: string;
}

export default function UserActivityDashboard() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all'); // all, login, attendance, posts, ai, etc
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
    byType: {} as Record<string, number>,
  });

  // Activity type labels untuk tampilan
  const activityTypeLabels: Record<string, string> = {
    login: '🔐 Login',
    logout: '👋 Logout',
    attendance_checkin: '✅ Check In',
    attendance_checkout: '🚪 Check Out',
    post_create: '📝 Buat Post',
    post_like: '❤️ Like Post',
    post_comment: '💬 Komentar',
    poll_vote: '🗳️ Vote Poll',
    poll_create: '📊 Buat Poll',
    ai_chat_message: '🤖 AI Chat',
    ai_verification: '🔍 AI Verifikasi',
    profile_update: '👤 Update Profil',
    event_register: '🎫 Daftar Event',
    gallery_upload: '📸 Upload Gallery',
    admin_action: '⚙️ Admin Action',
    security_validation: '🛡️ Validasi Keamanan',
    other: '📌 Lainnya',
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadActivities();
    }
  }, [status, session, filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', (session?.user as any)?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Filter by activity type
      if (filter !== 'all') {
        query = query.eq('activity_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      console.log('[User Activity] Loaded:', data?.length, 'activities');
      setActivities(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UserActivity[]) => {
    const total = data.length;
    const success = data.filter(a => a.status === 'success').length;
    const failure = data.filter(a => a.status === 'failure').length;
    
    // Count by activity type
    const byType: Record<string, number> = {};
    data.forEach(a => {
      byType[a.activity_type] = (byType[a.activity_type] || 0) + 1;
    });

    setStats({ total, success, failure, byType });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔒 Login Required</h2>
          <p className="text-gray-600">Please login to view your AI activity dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Aktivitas Saya
          </h1>
          <p className="text-gray-600">
            Riwayat semua aktivitas Anda di platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Total Aktivitas</div>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">✅ Berhasil</div>
            <div className="text-3xl font-bold text-green-600">{stats.success}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? `${((stats.success / stats.total) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">❌ Gagal</div>
            <div className="text-3xl font-bold text-red-600">{stats.failure}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? `${((stats.failure / stats.total) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Activity Type Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📌 Jenis Aktivitas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setFilter(type)}
                >
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600">
                    {activityTypeLabels[type] || type}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${((count / stats.total) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                filter === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 Semua ({stats.total})
            </button>
            {Object.keys(stats.byType).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                  filter === type
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {activityTypeLabels[type] || type} ({stats.byType[type]})
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak Ada Aktivitas</h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'Belum ada aktivitas tercatat. Mulai gunakan platform untuk melihat riwayat aktivitas.'
                  : `Tidak ada aktivitas dengan filter: ${activityTypeLabels[filter] || filter}`}
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${
                  activity.status === 'success'
                    ? 'border-green-500'
                    : activity.status === 'failure'
                    ? 'border-red-500'
                    : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">
                        {activityTypeLabels[activity.activity_type]?.split(' ')[0] || '📌'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800">
                        {activity.action}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.created_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : activity.status === 'failure'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {activity.status === 'success'
                        ? '✅ Berhasil'
                        : activity.status === 'failure'
                        ? '❌ Gagal'
                        : '⏳ Pending'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {activityTypeLabels[activity.activity_type]?.replace(/[^\w\s]/gi, '').trim() || activity.activity_type}
                    </span>
                  </div>
                </div>

                {activity.description && (
                  <p className="text-gray-700 mb-4">{activity.description}</p>
                )}

                {/* Metadata Display - Varies by activity type */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                      Detail Aktivitas
                    </div>
                    
                    {/* AI Verification specific metadata */}
                    {activity.activity_type === 'ai_verification' && activity.metadata.antiSpoofing && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Provider</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {activity.metadata.provider || 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Score</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {(activity.metadata.antiSpoofing.overallScore * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Liveness</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {(activity.metadata.antiSpoofing.liveness * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Recommendation</div>
                          <div
                            className={`text-sm font-bold ${
                              activity.metadata.antiSpoofing.recommendation === 'APPROVE'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {activity.metadata.antiSpoofing.recommendation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attendance metadata */}
                    {(activity.activity_type === 'attendance_checkin' || activity.activity_type === 'attendance_checkout') && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {activity.metadata.location && (
                          <div>
                            <div className="text-xs text-gray-500">Lokasi</div>
                            <div className="text-sm text-gray-800">
                              {activity.metadata.location.latitude?.toFixed(6)}, {activity.metadata.location.longitude?.toFixed(6)}
                            </div>
                          </div>
                        )}
                        {activity.metadata.timestamp && (
                          <div>
                            <div className="text-xs text-gray-500">Waktu</div>
                            <div className="text-sm text-gray-800">
                              {new Date(activity.metadata.timestamp).toLocaleTimeString('id-ID')}
                            </div>
                          </div>
                        )}
                        {activity.metadata.method && (
                          <div>
                            <div className="text-xs text-gray-500">Metode</div>
                            <div className="text-sm text-gray-800">{activity.metadata.method}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generic metadata for other types */}
                    {activity.activity_type !== 'ai_verification' &&
                      activity.activity_type !== 'attendance_checkin' &&
                      activity.activity_type !== 'attendance_checkout' && (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(activity.metadata)
                            .filter(([key]) => !['duration_ms', 'attemptedProviders'].includes(key))
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key}>
                                <div className="text-xs text-gray-500 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm text-gray-800 truncate">
                                  {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value)}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                    {/* Related entity info */}
                    {(activity.related_type || activity.related_id) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Related: {activity.related_type} #{activity.related_id}
                        </div>
                      </div>
                    )}

                    {/* IP and User Agent for security-relevant activities */}
                    {(activity.activity_type === 'login' || activity.activity_type === 'security_validation') && (
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activity.ip_address && (
                          <div>
                            <div className="text-xs text-gray-500">IP Address</div>
                            <div className="text-sm text-gray-800">{activity.ip_address}</div>
                          </div>
                        )}
                        {activity.user_agent && (
                          <div>
                            <div className="text-xs text-gray-500">Device</div>
                            <div className="text-sm text-gray-800 truncate">{activity.user_agent}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

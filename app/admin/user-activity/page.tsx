// app/admin/user-activity/page.tsx
// ADMIN MONITORING PANEL - Melihat SEMUA aktivitas user (login, attendance, posts, AI, dll)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserActivity {
  id: number;
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  activity_type: string;
  action: string;
  description: string;
  status: 'success' | 'failure' | 'pending' | 'error';
  metadata: any;
  ip_address?: string;
  user_agent?: string;
  related_type?: string;
  related_id?: string;
}

export default function UserActivityMonitoringAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [activityFilter, setActivityFilter] = useState<string>('all'); // Filter by activity_type
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
    pending: 0,
    byType: {} as Record<string, number>,
    byUser: {} as Record<string, number>,
    topUsers: [] as { email: string; name: string; count: number }[],
  });

  // Activity type labels
  const activityTypeLabels: Record<string, string> = {
    login: '🔐 Login',
    logout: '👋 Logout',
    attendance_checkin: '✅ Check In',
    attendance_checkout: '🚪 Check Out',
    post_create: '📝 Buat Post',
    post_like: '❤️ Like',
    post_comment: '💬 Komentar',
    poll_vote: '🗳️ Vote',
    poll_create: '📊 Poll',
    ai_chat_message: '🤖 AI Chat',
    ai_verification: '🔍 AI Verifikasi',
    profile_update: '👤 Profil',
    event_register: '🎫 Event',
    gallery_upload: '📸 Gallery',
    admin_action: '⚙️ Admin',
    security_validation: '🛡️ Keamanan',
    biometric_registration: '🔐 Biometrik',
    other: '📌 Lainnya',
  };

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        router.push('/');
        return;
      }
      loadActivities();
    }
  }, [status, session, timeRange, activityFilter]);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Time range filter
      const timeFilter = getTimeFilter();
      if (timeFilter) {
        query = query.gte('created_at', timeFilter);
      }

      // Activity type filter
      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      console.log('[Admin Monitoring] Loaded:', data?.length, 'activities');
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
    const pending = data.filter(a => a.status === 'pending').length;
    
    // Count by activity type
    const byType: Record<string, number> = {};
    data.forEach(a => {
      byType[a.activity_type] = (byType[a.activity_type] || 0) + 1;
    });

    // Count by user
    const byUser: Record<string, number> = {};
    data.forEach(a => {
      const userId = a.user_id || 'Unknown';
      byUser[userId] = (byUser[userId] || 0) + 1;
    });

    // Top users
    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => {
        const user = data.find(a => a.user_id === userId);
        return {
          email: user?.user_email || 'Unknown',
          name: user?.user_name || 'Unknown',
          count,
        };
      });

    setStats({ total, success, failure, pending, byType, byUser, topUsers });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-800 rounded-xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              📊 User Activity Monitoring
            </h1>
            <p className="text-gray-300">
              Monitor semua aktivitas users di platform (login, attendance, posts, AI, dll)
            </p>
          </div>
          
          {/* Time Range Filter */}
          <div className="bg-gray-800 rounded-xl p-2 flex gap-2">
            {(['1h', '24h', '7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {range === '1h' ? '1 Jam' : range === '24h' ? '24 Jam' : range === '7d' ? '7 Hari' : range === '30d' ? '30 Hari' : 'Semua'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Total Aktivitas</div>
            <div className="text-4xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-75 mt-2">
              {timeRange === '1h' ? 'Last Hour' : timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'All Time'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">✅ Success Rate</div>
            <div className="text-4xl font-bold">
              {stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs opacity-75 mt-2">
              {stats.success} berhasil
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">❌ Failure Rate</div>
            <div className="text-4xl font-bold">
              {stats.total > 0 ? ((stats.failure / stats.total) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs opacity-75 mt-2">
              {stats.failure} gagal
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">👥 Active Users</div>
            <div className="text-4xl font-bold">
              {Object.keys(stats.byUser).length}
            </div>
            <div className="text-xs opacity-75 mt-2">
              Unique users
            </div>
          </div>
        </div>

        {/* Activity Type Breakdown */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📌 Activity Type Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setActivityFilter(type)}
                  className={`bg-gray-900 rounded-xl p-4 border transition-all ${
                    activityFilter === type
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {activityTypeLabels[type]?.split(' ')[0] || '📌'}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <div className="text-xs text-gray-400">
                    {activityTypeLabels[type]?.replace(/[^\w\s]/gi, '').trim() || type}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? `${((count / stats.total) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </button>
              ))}
          </div>
          
          {/* Clear Filter */}
          {activityFilter !== 'all' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActivityFilter('all')}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-all"
              >
                🔄 Show All Activities
              </button>
            </div>
          )}
        </div>

        {/* Top Users */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">👥 Top Active Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topUsers.map((user, index) => (
              <div key={user.email} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl font-bold text-blue-400">#{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">
                        {user.name}
                      </div>
                      <div className="text-gray-400 text-xs truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <div className="text-2xl font-bold text-green-400">{user.count}</div>
                    <div className="text-xs text-gray-500">aktivitas</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            📋 Recent Activities
            {activityFilter !== 'all' && (
              <span className="text-base font-normal text-gray-400 ml-3">
                (Filtered: {activityTypeLabels[activityFilter] || activityFilter})
              </span>
            )}
          </h2>
          
          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">📭</div>
                <p>Tidak ada aktivitas dalam periode ini</p>
              </div>
            ) : (
              activities.map(activity => (
                <div
                  key={activity.id}
                  className={`bg-gray-900 rounded-xl p-4 border transition-colors ${
                    activity.status === 'success'
                      ? 'border-green-900/50 hover:border-green-600'
                      : activity.status === 'failure'
                      ? 'border-red-900/50 hover:border-red-600'
                      : 'border-gray-700 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xl">
                          {activityTypeLabels[activity.activity_type]?.split(' ')[0] || '📌'}
                        </span>
                        <span className="text-white font-semibold truncate">
                          {activity.user_name || activity.user_email}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            activity.status === 'success'
                              ? 'bg-green-900 text-green-300'
                              : activity.status === 'failure'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}
                        >
                          {activity.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                          {activityTypeLabels[activity.activity_type]?.replace(/[^\w\s]/gi, '').trim() || activity.activity_type}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm mb-1">
                        {activity.action}
                      </div>
                      {activity.description && (
                        <div className="text-gray-400 text-sm mb-2">
                          {activity.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🕐 {new Date(activity.created_at).toLocaleString('id-ID')}</span>
                        {activity.ip_address && (
                          <span>🌐 {activity.ip_address}</span>
                        )}
                        {activity.related_type && activity.related_id && (
                          <span>🔗 {activity.related_type} #{activity.related_id}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Metadata Preview */}
                    <div className="ml-4 text-right flex-shrink-0">
                      {activity.metadata?.provider && (
                        <div className="text-blue-400 font-semibold text-sm mb-1">
                          {activity.metadata.provider}
                        </div>
                      )}
                      {activity.metadata?.duration_ms !== undefined && (
                        <div className="text-gray-500 text-xs">
                          ⚡ {activity.metadata.duration_ms}ms
                        </div>
                      )}
                      {activity.metadata?.antiSpoofing && (
                        <div className="text-purple-400 text-sm font-bold mt-1">
                          {(activity.metadata.antiSpoofing.overallScore * 100).toFixed(1)}% confidence
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

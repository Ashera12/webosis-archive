// app/admin/ai-monitoring/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AIActivity {
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
  metadata: {
    provider?: string;
    attemptedProviders?: string[];
    duration_ms?: number;
    antiSpoofing?: {
      overallScore: number;
      passedLayers: number;
      recommendation: string;
    };
  };
}

export default function AIMonitoringAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState<AIActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
    pending: 0,
    avgScore: 0,
    avgDuration: 0,
    providers: {} as Record<string, { count: number; success: number; failure: number }>,
    userStats: {} as Record<string, number>,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        router.push('/');
        return;
      }
      loadActivities();
    }
  }, [status, session, timeRange]);

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
        .eq('activity_type', 'ai_verification')
        .order('created_at', { ascending: false })
        .limit(200);

      const timeFilter = getTimeFilter();
      if (timeFilter) {
        query = query.gte('created_at', timeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      setActivities(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: AIActivity[]) => {
    const total = data.length;
    const success = data.filter(a => a.status === 'success').length;
    const failure = data.filter(a => a.status === 'failure').length;
    const pending = data.filter(a => a.status === 'pending').length;
    
    const scores = data
      .filter(a => a.metadata?.antiSpoofing?.overallScore)
      .map(a => a.metadata.antiSpoofing!.overallScore);
    
    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    const durations = data
      .filter(a => a.metadata?.duration_ms)
      .map(a => a.metadata.duration_ms!);
    
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const providers: Record<string, { count: number; success: number; failure: number }> = {};
    data.forEach(a => {
      const provider = a.metadata?.provider || 'Unknown';
      if (!providers[provider]) {
        providers[provider] = { count: 0, success: 0, failure: 0 };
      }
      providers[provider].count++;
      if (a.status === 'success') providers[provider].success++;
      if (a.status === 'failure') providers[provider].failure++;
    });

    const userStats: Record<string, number> = {};
    data.forEach(a => {
      const userId = a.user_id || 'Unknown';
      userStats[userId] = (userStats[userId] || 0) + 1;
    });

    setStats({ total, success, failure, pending, avgScore, avgDuration, providers, userStats });
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🤖 AI Verification Monitoring
            </h1>
            <p className="text-gray-300">
              Real-time analytics untuk semua AI verification activities
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
            <div className="text-sm opacity-90 mb-1">Total Verifikasi</div>
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
              {stats.success} berhasil / {stats.failure} gagal
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">📊 Avg Confidence</div>
            <div className="text-4xl font-bold">
              {(stats.avgScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs opacity-75 mt-2">
              Average overall score
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">⚡ Avg Response</div>
            <div className="text-4xl font-bold">
              {stats.avgDuration.toFixed(0)}ms
            </div>
            <div className="text-xs opacity-75 mt-2">
              Average processing time
            </div>
          </div>
        </div>

        {/* Provider Stats */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🔧 AI Provider Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(stats.providers).map(([provider, data]) => (
              <div key={provider} className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="text-lg font-bold text-white mb-4">{provider}</div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Requests</span>
                    <span className="text-white font-semibold">{data.count}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Success</span>
                    <span className="text-green-400 font-semibold">
                      {data.success} ({((data.success / data.count) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Failure</span>
                    <span className="text-red-400 font-semibold">
                      {data.failure} ({((data.failure / data.count) * 100).toFixed(1)}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{ width: `${(data.success / data.count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity Stats */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">👥 Top Users (By Verification Count)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.userStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 9)
              .map(([userId, count]) => {
                const user = activities.find(a => a.user_id === userId);
                return (
                  <div key={userId} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">
                          {user?.user_name || 'Unknown'}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          {user?.user_email || 'No email'}
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className="text-2xl font-bold text-blue-400">{count}</div>
                        <div className="text-xs text-gray-500">verifications</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Recent Activities</h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">🤷</div>
                <p>Tidak ada aktivitas dalam periode ini</p>
              </div>
            ) : (
              activities.map(activity => (
                <div
                  key={activity.id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                      </div>
                      <div className="text-gray-400 text-sm">
                        {activity.description}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(activity.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    
                    <div className="ml-4 text-right flex-shrink-0">
                      {activity.metadata?.provider && (
                        <div className="text-blue-400 font-semibold text-sm mb-1">
                          {activity.metadata.provider}
                        </div>
                      )}
                      {activity.metadata?.duration_ms !== undefined && (
                        <div className="text-gray-500 text-xs">
                          {activity.metadata.duration_ms}ms
                        </div>
                      )}
                      {activity.metadata?.antiSpoofing && (
                        <div className="text-purple-400 text-sm font-bold mt-1">
                          {(activity.metadata.antiSpoofing.overallScore * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attempted Providers */}
                  {activity.metadata?.attemptedProviders && (
                    <div className="mt-2 text-xs text-gray-500">
                      Tried: {activity.metadata.attemptedProviders.join(' → ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

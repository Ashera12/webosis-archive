// app/dashboard/ai-activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase/client';

interface AIActivity {
  id: number;
  created_at: string;
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
      liveness: number;
      deepfake: number;
      depth: number;
    };
  };
}

export default function AIActivityDashboard() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<AIActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failure: 0,
    avgScore: 0,
    providers: {} as Record<string, number>,
  });

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
        .eq('activity_type', 'ai_verification')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('status', filter);
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
    
    const scores = data
      .filter(a => a.metadata?.antiSpoofing?.overallScore)
      .map(a => a.metadata.antiSpoofing!.overallScore);
    
    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    const providers: Record<string, number> = {};
    data.forEach(a => {
      const provider = a.metadata?.provider || 'Unknown';
      providers[provider] = (providers[provider] || 0) + 1;
    });

    setStats({ total, success, failure, avgScore, providers });
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
            🤖 AI Activity Dashboard
          </h1>
          <p className="text-gray-600">
            Riwayat verifikasi AI untuk akun Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Total Verifikasi</div>
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

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">📊 Rata-rata Score</div>
            <div className="text-3xl font-bold text-purple-600">
              {(stats.avgScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Confidence</div>
          </div>
        </div>

        {/* Provider Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 AI Provider Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.providers).map(([provider, count]) => (
              <div key={provider} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-600">{provider}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? `${((count / stats.total) * 100).toFixed(0)}%` : '0%'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                filter === 'success'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✅ Berhasil ({stats.success})
            </button>
            <button
              onClick={() => setFilter('failure')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                filter === 'failure'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ❌ Gagal ({stats.failure})
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🤷</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak Ada Aktivitas</h3>
              <p className="text-gray-600">
                Belum ada riwayat verifikasi AI. Mulai dengan enrollment atau verifikasi foto.
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
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {activity.action}
                    </h3>
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
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{activity.description}</p>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4">
                  {activity.metadata?.provider && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Provider</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {activity.metadata.provider}
                      </div>
                    </div>
                  )}
                  
                  {activity.metadata?.attemptedProviders && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Providers Tried</div>
                      <div className="text-xs text-gray-700">
                        {activity.metadata.attemptedProviders.join(' → ')}
                      </div>
                    </div>
                  )}

                  {activity.metadata?.duration_ms !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {activity.metadata.duration_ms}ms
                      </div>
                    </div>
                  )}

                  {activity.metadata?.antiSpoofing && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Overall Score</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {(activity.metadata.antiSpoofing.overallScore * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Layers Passed</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {activity.metadata.antiSpoofing.passedLayers}/8
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Liveness</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {(activity.metadata.antiSpoofing.liveness * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Deepfake Risk</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {(activity.metadata.antiSpoofing.deepfake * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Recommendation</div>
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
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

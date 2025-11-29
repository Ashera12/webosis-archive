// app/admin/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FaUsers, 
  FaFilter, 
  FaDownload,
  FaShieldAlt,
  FaRobot,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaEye,
  FaSearch,
  FaCalendar,
  FaBan,
  FaGlobe,
  FaMobileAlt
} from 'react-icons/fa';

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  activity_type: string;
  action: string;
  description: string;
  metadata: any;
  ip_address: string;
  user_agent: string;
  device_info: any;
  location_data: any;
  status: string;
  created_at: string;
}

interface AIAnalysis {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  suggestions: string[];
  auto_fixable: boolean;
}

export default function AdminActivityPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    ipAddress: '',
    searchTerm: ''
  });
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AIAnalysis>>({});
  const [stats, setStats] = useState({
    total: 0,
    suspicious: 0,
    anonymous: 0,
    failed: 0
  });

  // Fetch users list for dropdown
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/admin/users/list?limit=200');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all activities with filters
  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let url = '/api/admin/activity/all?limit=100';
      if (filters.userId) url += `&userId=${filters.userId}`;
      if (filters.type) url += `&type=${filters.type}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      if (filters.ipAddress) url += `&ipAddress=${filters.ipAddress}`;
      if (filters.searchTerm) url += `&search=${filters.searchTerm}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setActivities(json.data.activities);
        setStats(json.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI Analysis for suspicious patterns
  const analyzeWithAI = async () => {
    try {
      setAnalyzing(true);
      
      const res = await fetch('/api/admin/activity/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities })
      });

      const json = await res.json();
      
      if (json.success) {
        setAiAnalysis(json.data.analysis);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Time', 'User', 'Email', 'Role', 'Activity', 'IP', 'Device', 'Status'];
    const rows = activities.map(a => [
      new Date(a.created_at).toLocaleString('id-ID'),
      a.user_name,
      a.user_email,
      a.user_role,
      a.activity_type,
      a.ip_address,
      a.device_info?.device_type || 'Unknown',
      a.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString()}.csv`;
    a.click();
  };

  useEffect(() => {
    if (session?.user) {
      fetchUsers();
      fetchActivities();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchActivities();
    }
  }, [filters]);

  // Get risk badge
  const getRiskBadge = (activityId: string) => {
    const analysis = aiAnalysis[activityId];
    if (!analysis) return null;

    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[analysis.risk_level]}`}>
        🤖 {analysis.risk_level.toUpperCase()}
      </span>
    );
  };

  if (!session?.user) {
    return <div className="p-6 text-center">Unauthorized</div>;
  }

  const userRole = (session.user.role || '').toLowerCase();
  if (!['admin', 'super_admin'].includes(userRole)) {
    return <div className="p-6 text-center">Access Denied - Admin Only</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🔍 Activity Monitor - Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor semua aktivitas user dengan AI-powered analysis
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={analyzeWithAI}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {analyzing ? <FaSpinner className="animate-spin" /> : <FaRobot />}
                AI Analyze
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-xl transition-all"
              >
                <FaDownload />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Activities</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900 dark:to-orange-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.suspicious}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Suspicious</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.anonymous}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Anonymous</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900 dark:to-amber-900 p-4 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.failed}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Failed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaFilter /> Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaUsers className="inline mr-2" />
                User / Akun
              </label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={loadingUsers}
              >
                <option value="">Semua User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} ({user.role || 'user'})
                  </option>
                ))}
              </select>
              {loadingUsers && (
                <p className="text-xs text-gray-500 mt-1">
                  <FaSpinner className="inline animate-spin mr-1" />
                  Loading users...
                </p>
              )}
            </div>
            
            <input
              type="text"
              placeholder="🔍 Search user email..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="🌐 IP Address..."
              value={filters.ipAddress}
              onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Types</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="attendance_checkin">Attendance Check-in</option>
              <option value="attendance_checkout">Attendance Check-out</option>
              <option value="security_validation">Security Validation</option>
              <option value="ai_verification">AI Verification</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="error">Error</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Activity</th>
                  <th className="px-4 py-3 text-left">IP / Device</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">AI Analysis</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-2" />
                      <p className="text-gray-500">Loading activities...</p>
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No activities found
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">
                        {new Date(activity.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.user_name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500">{activity.user_email}</div>
                        <div className="text-xs text-gray-400">{activity.user_role}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{activity.activity_type}</div>
                        <div className="text-xs text-gray-500">{activity.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <FaGlobe className="text-blue-500" />
                          {activity.ip_address}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FaMobileAlt />
                          {activity.device_info?.device_type || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.status === 'success' ? 'bg-green-100 text-green-800' :
                          activity.status === 'failure' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getRiskBadge(activity.id)}
                        {aiAnalysis[activity.id]?.flags.map((flag, i) => (
                          <div key={i} className="text-xs text-orange-600 mt-1">
                            ⚠️ {flag}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import Link from 'next/link';
import {
  FaNewspaper,
  FaCalendarAlt,
  FaUsers,
  FaEye,
  FaFire,
  FaClock,
  FaCheckCircle,
  FaPoll,
  FaExclamationTriangle,
  FaBug,
  FaChartLine,
} from 'react-icons/fa';
import AdminNotifications from './AdminNotifications';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface ErrorSummary {
  total: number;
  critical: number;
  recent: number;
  resolved: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: string;
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);

  const [errorSummary, setErrorSummary] = useState<ErrorSummary>({
    total: 0,
    critical: 0,
    recent: 0,
    resolved: 0,
    topErrors: []
  });
  const [loadingErrors, setLoadingErrors] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && !canAccessAdminPanel) {
      return;
    }

    async function fetchErrorSummary() {
      try {
        const res = await apiFetch('/api/admin/errors?summary=true');
        if (res.ok) {
          const data = await safeJson(res, { url: '/api/admin/errors?summary=true', method: 'GET' });
          
          // Calculate summary
          const errors = data.errors || [];
          const now = Date.now();
          const oneHourAgo = now - (60 * 60 * 1000);
          
          // Group errors by message
          const errorGroups = new Map<string, number>();
          let criticalCount = 0;
          let recentCount = 0;
          
          errors.forEach((error: any) => {
            const msg = error.message || 'Unknown error';
            errorGroups.set(msg, (errorGroups.get(msg) || 0) + 1);
            
            if (error.severity === 'critical' || error.severity === 'error') {
              criticalCount++;
            }
            
            const errorTime = new Date(error.created_at).getTime();
            if (errorTime > oneHourAgo) {
              recentCount++;
            }
          });
          
          // Get top 3 errors
          const topErrors = Array.from(errorGroups.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([message, count]) => {
              const lastError = errors.find((e: any) => (e.message || 'Unknown error') === message);
              return {
                message: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                count,
                lastSeen: lastError ? new Date(lastError.created_at).toLocaleTimeString() : 'Unknown'
              };
            });
          
          setErrorSummary({
            total: errors.length,
            critical: criticalCount,
            recent: recentCount,
            resolved: 0, // TODO: implement resolved tracking
            topErrors
          });
        }
      } catch (e) {
        console.error('Failed to fetch error summary:', e);
      } finally {
        setLoadingErrors(false);
      }
    }
    
    if (status === 'authenticated' && canAccessAdminPanel) {
      fetchErrorSummary();
    }
  }, [status, canAccessAdminPanel]);
  const stats: StatCard[] = [
    {
      title: 'Total Posts',
      value: 127,
      change: '+12.5%',
      trend: 'up',
      icon: <FaNewspaper />,
      color: 'from-blue-400 to-blue-600',
    },
    {
      title: 'Events',
      value: 45,
      change: '+8.2%',
      trend: 'up',
      icon: <FaCalendarAlt />,
      color: 'from-green-400 to-green-600',
    },
    {
      title: 'Users',
      value: 234,
      change: '+15.3%',
      trend: 'up',
      icon: <FaUsers />,
      color: 'from-purple-400 to-purple-600',
    },
    {
      title: 'Total Views',
      value: '12.5K',
      change: '+23.1%',
      trend: 'up',
      icon: <FaEye />,
      color: 'from-yellow-400 to-amber-600',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'New post published',
      title: 'Classmeet 2025 - Event Terbesar Tahun Ini',
      user: 'Admin Muhammad',
      time: '5 minutes ago',
      icon: <FaNewspaper className="text-blue-500" />,
    },
    {
      id: 2,
      action: 'Event registration',
      title: '15 new registrations for Market Day',
      user: 'System',
      time: '15 minutes ago',
      icon: <FaUsers className="text-green-500" />,
    },
    {
      id: 3,
      action: 'Poll created',
      title: 'Program Favorit Bulan Ini',
      user: 'Admin Siti',
      time: '1 hour ago',
      icon: <FaClock className="text-purple-500" />,
    },
    {
      id: 4,
      action: 'Program completed',
      title: 'Murotal Pagi - Sekbid 1',
      user: 'Admin Irsyad',
      time: '2 hours ago',
      icon: <FaCheckCircle className="text-yellow-500" />,
    },
  ];

  const topPrograms = [
    { id: 1, name: 'Murotal Pagi', sekbid: 'Kerohanian', views: 245, trend: '+12%' },
    { id: 2, name: 'Market Day', sekbid: 'Ekonomi Kreatif', views: 198, trend: '+8%' },
    { id: 3, name: 'Classmeet', sekbid: 'Akademik', views: 167, trend: '+15%' },
    { id: 4, name: 'Jumat Bersih', sekbid: 'Kesehatan Lingkungan', views: 143, trend: '+5%' },
    { id: 5, name: 'Web Development', sekbid: 'Kominfo', views: 128, trend: '+20%' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Welcome back, Admin! 👋
        </h1>
        <p className="text-slate-800 text-lg">
          Here's what's happening with your OSIS dashboard today
        </p>
        <div className="mt-4">
          <AdminNotifications />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <div className="text-2xl">{stat.icon}</div>
              </div>
              <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaClock className="mr-3 text-yellow-500" />
              Recent Activity
            </h2>
            <button className="text-sm text-yellow-600 dark:text-yellow-400 font-medium hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-500">
                    <span>{activity.user}</span>
                    <span className="mx-2">•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Programs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaFire className="mr-3 text-yellow-500" />
              Top Programs
            </h2>
          </div>
          <div className="space-y-3">
            {topPrograms.map((program, index) => (
              <div
                key={program.id}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {program.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {program.sekbid}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {program.views}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {program.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Monitoring Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaExclamationTriangle className="mr-3 text-red-500" />
            Error Monitoring
          </h2>
          <Link
            href="/admin/errors"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg hover:shadow-xl"
          >
            View All Errors →
          </Link>
        </div>

        {loadingErrors ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading error data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Error Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-700">
                <div className="flex items-center justify-between mb-2">
                  <FaBug className="text-red-600 dark:text-red-400 text-xl" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{errorSummary.total}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">All time</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between mb-2">
                  <FaExclamationTriangle className="text-orange-600 dark:text-orange-400 text-xl" />
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Critical</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{errorSummary.critical}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Need attention</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-between mb-2">
                  <FaClock className="text-yellow-600 dark:text-yellow-400 text-xl" />
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Recent</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{errorSummary.recent}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Last hour</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between mb-2">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Resolved</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{errorSummary.resolved}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">This week</p>
              </div>
            </div>

            {/* Top Errors */}
            {errorSummary.topErrors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <FaChartLine className="mr-2" />
                  Top Errors
                </h3>
                <div className="space-y-2">
                  {errorSummary.topErrors.map((error, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {error.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last seen: {error.lastSeen}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                          {error.count}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorSummary.total === 0 && (
              <div className="text-center py-8">
                <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">No errors found!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your application is running smoothly.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            href="/admin/posts/new"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaNewspaper />
            </div>
            <span className="text-sm font-medium">New Post</span>
          </Link>

          <Link
            href="/admin/events"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaCalendarAlt />
            </div>
            <span className="text-sm font-medium">New Event</span>
          </Link>

          <Link
            href="/admin/polls"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaPoll />
            </div>
            <span className="text-sm font-medium">New Poll</span>
          </Link>

          <Link
            href="/admin/gallery"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaEye />
            </div>
            <span className="text-sm font-medium">Upload Image</span>
          </Link>

          <Link
            href="/admin/errors"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaExclamationTriangle />
            </div>
            <span className="text-sm font-medium">Error Monitor</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaBell, FaUser, FaChevronDown, FaMoon, FaSun, FaSearch } from 'react-icons/fa';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import RoleBadge from '@/components/RoleBadge';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminHeader() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<Array<any>>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await apiFetch('/api/admin/notifications', { credentials: 'include' } as any);
      if (!res.ok) return;
      const j = await safeJson(res, { url: '/api/admin/notifications', method: 'GET' }).catch(() => ({}));
      if (j?.ok && Array.isArray(j.actions)) setNotifications(j.actions as any[]);
    } catch (e) {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(iv);
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'reviewed').length;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login', redirect: true });
  };

  // User display data from session
  const userName = session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || 'admin@osis.com';
  const userRole = session?.user?.role || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 shadow-md border-b border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, events, users..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none transition-all"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                borderColor: 'var(--input-border)',
              }}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Global Language Toggle */}
          <LanguageToggle />

          {/* Global Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
            >
              <FaBell className="text-gray-600 dark:text-gray-300 text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 dark:text-white">
                  <h3 className="font-bold text-lg">Notifications</h3>
                  <p className="text-sm opacity-80">{unreadCount} unread</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifs && <div className="p-4 text-sm text-stone-500">Loading...</div>}
                  {!loadingNotifs && notifications.length === 0 && (
                    <div className="p-4 text-sm text-stone-500">No notifications</div>
                  )}
                  {!loadingNotifs && notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all cursor-pointer ${
                        notif.status !== 'reviewed' ? 'bg-yellow-50 dark:bg-slate-700/50' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-800 dark:text-white font-medium">
                        {notif.payload?.message || notif.action || JSON.stringify(notif.payload || {}).slice(0, 80)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-700 text-center">
                  <button className="text-sm text-yellow-600 dark:text-yellow-400 font-medium hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-3 p-2 pr-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 transition-all shadow-lg"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-inner text-xl font-bold" style={{ background: 'var(--card-bg)', border: `1px solid var(--card-border)` }}>
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{userName}</p>
                  <RoleBadge role={userRole} size="sm" showLabel={false} />
                </div>
                <p className="text-xs text-slate-700">{userRole} · {language.toUpperCase()} · {theme === 'dark' ? 'Dark' : 'Light'}</p>
              </div>
              <FaChevronDown className="text-slate-900 text-sm" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface-alt)', border: `1px solid var(--border)` }}>
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-amber-500">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900">{userName}</p>
                    <RoleBadge role={userRole} size="sm" />
                  </div>
                  <p className="text-sm text-slate-700">{userEmail}</p>
                </div>
                <div className="p-2">
                  <a
                    href="/admin/profile"
                    className="block px-4 py-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    My Profile
                  </a>
                  <a
                    href="/admin/settings"
                    className="block px-4 py-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Settings
                  </a>
                  <hr className="my-2" style={{ borderColor: 'var(--border-alt)' }} />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

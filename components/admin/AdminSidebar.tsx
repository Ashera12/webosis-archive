'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaNewspaper,
  FaCalendarAlt,
  FaImages,
  FaUsers,
  FaClipboardList,
  FaBullhorn,
  FaPoll,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaEdit,
  FaDatabase,
  FaSitemap,
  FaUserFriends,
  FaGlobe,
  FaTools,
  FaTerminal,
} from 'react-icons/fa';

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: <FaHome />, href: '/admin' },
    { name: 'Content', icon: <FaEdit />, href: '/admin/content' },
    { name: 'Posts', icon: <FaNewspaper />, href: '/admin/posts' },
    { name: 'Events', icon: <FaCalendarAlt />, href: '/admin/events', badge: 3 },
    { name: 'Gallery', icon: <FaImages />, href: '/admin/gallery' },
    { name: 'Anggota (Members)', icon: <FaUserFriends />, href: '/admin/data/members' },
    { name: 'Users', icon: <FaUsers />, href: '/admin/users' },
  ];

  const dataMenuItems: MenuItem[] = [
    { name: 'Sekbid', icon: <FaSitemap />, href: '/admin/data/sekbid' },
    { name: 'Anggota (Members)', icon: <FaUserFriends />, href: '/admin/data/members' },
    { name: 'Program Kerja', icon: <FaClipboardList />, href: '/admin/proker' },
    { name: 'Announcements', icon: <FaBullhorn />, href: '/admin/announcements' },
    { name: 'Polls', icon: <FaPoll />, href: '/admin/polls' },
  ];

  const settingsItems: MenuItem[] = [
    { name: 'Settings', icon: <FaCog />, href: '/admin/settings' },
    { name: 'Tools', icon: <FaTools />, href: '/admin/tools' },
    { name: 'Terminal', icon: <FaTerminal />, href: '/admin/terminal' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
          text-white shadow-2xl z-40 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-72'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="relative h-20 flex items-center justify-between px-6 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 shadow-xl">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  O
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">OSIS Admin</h1>
                <p className="text-xs text-slate-700">Dashboard</p>
              </div>
            </div>
          )}
          
          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all text-slate-900"
          >
            {collapsed ? <FaChevronRight className="text-sm" /> : <FaChevronLeft className="text-sm" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-160px)] custom-scrollbar">
          {/* Back to Website Button */}
          <Link
            href="/home"
            target="_blank"
            className="group relative flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 mb-4"
          >
            <FaGlobe className={`text-xl ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && (
              <span className="flex-1 font-medium">View Public Website</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                View Public Website
              </div>
            )}
          </Link>

          {/* Divider */}
          <div className="border-t border-slate-700 my-3"></div>

          {/* Main Menu */}
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-200 overflow-hidden
                  ${active
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 shadow-lg'
                    : 'hover:bg-slate-700/50 text-gray-300 hover:text-white'
                  }
                `}
              >
                {/* Active Indicator */}
                {active && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />
                )}

                {/* Icon */}
                <div className={`text-xl ${collapsed ? 'mx-auto' : ''}`}>
                  {item.icon}
                </div>

                {/* Label */}
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.name}</span>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Data Management Section */}
          {!collapsed && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <FaDatabase className="text-sm" />
                <span>Data Management</span>
              </div>
            </div>
          )}
          
          {dataMenuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-200 overflow-hidden
                  ${active
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 shadow-lg'
                    : 'hover:bg-slate-700/50 text-gray-300 hover:text-white'
                  }
                `}
              >
                {active && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />
                )}
                <div className={`text-xl ${collapsed ? 'mx-auto' : ''}`}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Settings Section */}
          {!collapsed && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <FaCog className="text-sm" />
                <span>System</span>
              </div>
            </div>
          )}
          
          {settingsItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-200 overflow-hidden
                  ${active
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 shadow-lg'
                    : 'hover:bg-slate-700/50 text-gray-300 hover:text-white'
                  }
                `}
              >
                {active && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />
                )}
                <div className={`text-xl ${collapsed ? 'mx-auto' : ''}`}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="flex-1 font-medium">{item.name}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
          <button
            className={`
              group w-full flex items-center space-x-3 px-4 py-3 rounded-xl
              bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white
              transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <FaSignOutAlt className="text-xl" />
            {!collapsed && <span className="font-medium">Logout</span>}
            
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { FaBullhorn, FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getActiveAnnouncements } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'normal';
  created_at: string;
  expires_at: string | null;
}

const priorityConfig = {
  urgent: { 
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    icon: FaExclamationTriangle 
  },
  high: { 
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: FaExclamationCircle 
  },
  medium: { 
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: FaInfoCircle 
  },
  low: { 
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: FaInfoCircle 
  },
  normal: { 
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: FaInfoCircle 
  },
};

export default function AnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getActiveAnnouncements();
        console.log('[AnnouncementsWidget] Loaded announcements:', data.length);
        setAnnouncements(data.slice(0, 5)); // Show latest 5
      } catch (error) {
        console.error('[AnnouncementsWidget] Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <FaBullhorn className="text-5xl text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pengumuman</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
    return null; // Don't show section if no announcements
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <FaBullhorn className="text-5xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pengumuman Penting
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Informasi terkini dari OSIS SMK Fithrah Insani
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {announcements.map((announcement) => {
            const config = priorityConfig[announcement.priority] || priorityConfig.normal;
            const Icon = config.icon;
            const isExpanded = expandedId === announcement.id;

            return (
              <div
                key={announcement.id}
                className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`text-2xl ${config.textColor}`} />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getRelativeTime(announcement.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${config.textColor}`}>
                      {announcement.priority}
                    </span>
                  </div>

                  <div className={`text-gray-700 dark:text-gray-300 whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {announcement.content}
                  </div>

                  {announcement.content.length > 100 && (
                    <button
                      onClick={() => toggleExpand(announcement.id)}
                      className={`mt-3 flex items-center gap-2 ${config.textColor} hover:underline font-semibold`}
                    >
                      {isExpanded ? (
                        <>
                          Sembunyikan <FaChevronUp />
                        </>
                      ) : (
                        <>
                          Selengkapnya <FaChevronDown />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

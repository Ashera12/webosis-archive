'use client';

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { getUpcomingEvents } from '@/lib/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location?: string;
  max_participants?: number;
  image_url?: string;
}

const EventSection: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getUpcomingEvents(5); // Get next 5 upcoming events
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const currentEvent = events[currentEventIndex];

  const handlePrevious = () => {
    setCurrentEventIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentEventIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card-gradient rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card-gradient rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('events.noUpcoming') || 'Tidak ada event mendatang'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('events.checkBackLater') || 'Silakan cek kembali nanti untuk event terbaru!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Navigation Arrows */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-yellow-400 hover:text-white dark:hover:bg-yellow-500 transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
        aria-label="Previous event"
      >
        <FaChevronLeft size={20} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-yellow-400 hover:text-white dark:hover:bg-yellow-500 transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
        aria-label="Next event"
      >
        <FaChevronRight size={20} />
      </button>

      {/* Event Card */}
      <div className="card-gradient rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 card-hover transition-all duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-l-2xl lg:rounded-l-2xl lg:rounded-r-none overflow-hidden">
              {currentEvent.image_url ? (
                <img
                  src={currentEvent.image_url}
                  alt={currentEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                  📅
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-gray-800">
            {/* Event Badge */}
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-4 py-2 rounded-full text-sm font-semibold mb-6 w-fit">
              <span className="mr-2">📅</span>
              {t('events.title') || 'Event'}
            </div>

            {/* Title */}
            <h3 className="heading-primary text-3xl lg:text-4xl text-gray-900 dark:text-gray-100 mb-4">
              {currentEvent.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg">
              {currentEvent.description}
            </p>

            {/* Event Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <span className="text-yellow-500 dark:text-yellow-400 mr-3 text-lg">📅</span>
                <span className="font-medium">{formatDate(currentEvent.start_date)}</span>
              </div>
              {currentEvent.location && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-3 text-lg">📍</span>
                  <span className="font-medium">{currentEvent.location}</span>
                </div>
              )}
              {currentEvent.max_participants && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-3 text-lg">👥</span>
                  <span className="font-medium">
                    {t('events.maxParticipants') || 'Maksimal'} {currentEvent.max_participants} {t('events.people') || 'orang'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentEventIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentEventIndex
                ? 'w-8 bg-yellow-400'
                : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-yellow-300'
            }`}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default EventSection;
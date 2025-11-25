'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import MediaRenderer from '@/components/MediaRenderer';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  created_at: string;
  event_id?: string | null;
  sekbid_id?: number | null;
}

interface EventItem {
  id: string;
  title: string;
  event_date?: string | null;
}

interface SekbidItem {
  id: number;
  name: string;
}

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [sekbidFilter, setSekbidFilter] = useState<'all' | number>('all');
  const [eventFilter, setEventFilter] = useState<'all' | string>('all');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sekbids, setSekbids] = useState<SekbidItem[]>([
    { id: 1, name: 'Sekbid 1' },
    { id: 2, name: 'Sekbid 2' },
    { id: 3, name: 'Sekbid 3' },
    { id: 4, name: 'Sekbid 4' },
    { id: 5, name: 'Sekbid 5' },
    { id: 6, name: 'Sekbid 6' },
    { id: 7, name: 'Sekbid 7' },
    { id: 8, name: 'Sekbid 8' },
  ]);

  useEffect(() => {
    fetchGallery();
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        const raw = data.gallery || [];
        const safe = raw.map((g: any, i: number) => {
          let id = g?.id;
          if (id === null || id === undefined || id === '') {
            const base = g?.image_url || g?.title || 'item';
            id = `gal-${i}-${base}`;
          }
          return { ...g, id };
        });
        setGallery(safe);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGallery = gallery.filter(item => {
    const sekbidOk = sekbidFilter === 'all' ? true : item.sekbid_id === sekbidFilter;
    const eventOk = eventFilter === 'all' ? true : item.event_id === eventFilter;
    return sekbidOk && eventOk;
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        const arr: EventItem[] = Array.isArray(data?.events) ? data.events : [];
        // Basic normalization of id/title
        setEvents(arr.map(e => ({ id: e.id, title: e.title, event_date: e.event_date })));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => setSelectedImage(prev => prev !== null ? (prev + 1) % filteredGallery.length : 0);
  const prevImage = () => setSelectedImage(prev => prev !== null ? (prev - 1 + filteredGallery.length) % filteredGallery.length : 0);

  if (loading) {
    return (
      <div className="page-content">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat galeri...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Galeri Kegiatan
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300">
              Dokumentasi kegiatan dan prestasi OSIS
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section (Event + Sekbid) */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Event Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Event (Opsional)</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Event</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
          {/* Sekbid Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Sekbid (Opsional)</label>
            <select
              value={sekbidFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSekbidFilter(val === 'all' ? 'all' : parseInt(val, 10));
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Sekbid</option>
              {sekbids.map(sb => (
                <option key={sb.id} value={sb.id}>{sb.name}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Quick Sekbid Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mt-6">
          <button
            onClick={() => setSekbidFilter('all')}
            className={`px-4 py-2 rounded-full transition-all ${
              sekbidFilter === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >Semua</button>
          {sekbids.map(sb => (
            <button
              key={`sekbtn-${sb.id}`}
              onClick={() => setSekbidFilter(sb.id)}
              className={`px-4 py-2 rounded-full transition-all ${
                sekbidFilter === sb.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >{sb.name}</button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
        {filteredGallery.length === 0 ? (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
              {sekbidFilter === 'all' && eventFilter === 'all' ? 'Belum ada foto di galeri' : 'Belum ada foto untuk filter ini'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredGallery.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer bg-gray-200 dark:bg-gray-700"
                onClick={() => openLightbox(index)}
              >
                <MediaRenderer
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  controlsForVideo={false}
                  autoPlay
                  loop
                  muted
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                    <h3 className="font-bold text-base sm:text-lg line-clamp-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <FaTimes size={32} />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
          >
            <FaChevronLeft size={32} />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
          >
            <FaChevronRight size={32} />
          </button>

          <div className="max-w-6xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <MediaRenderer
                src={filteredGallery[selectedImage].image_url}
                alt={filteredGallery[selectedImage].title}
                className="w-full h-full object-contain"
                controlsForVideo={true}
              />
            </div>
            <div className="mt-4 text-center text-white">
              <h3 className="text-2xl font-bold">{filteredGallery[selectedImage].title}</h3>
              {filteredGallery[selectedImage].description && (
                <p className="mt-2 text-gray-300">{filteredGallery[selectedImage].description}</p>
              )}
              <p className="mt-2 text-sm text-gray-400">
                {selectedImage + 1} / {filteredGallery.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

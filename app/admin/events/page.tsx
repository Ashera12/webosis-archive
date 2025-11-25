'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { uploadWithProgress } from '@/lib/client/uploadWithProgress';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import ImageUploadField from '@/components/ImageUploadField';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt, FaLink, FaClock, FaImage } from 'react-icons/fa';
import MediaRenderer from '@/components/MediaRenderer';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  registration_link: string | null;
  created_at: string;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    image_url: '',
    registration_link: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[Admin Events] Fetching...');
      const response = await apiFetch('/api/admin/events');
      
      if (!response.ok) {
        const errorData = await safeJson(response, { url: '/api/admin/events', method: 'GET' });
        console.error('[Admin Events] HTTP error:', response.status, errorData);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to view events.');
        }
        throw new Error(errorData?.error || errorData?.message || `Failed to fetch (${response.status})`);
      }
      
      const data = await safeJson(response, { url: '/api/admin/events', method: 'GET' });
      console.log('[Admin Events] Response:', data);
      
      // Use event_date directly from database
      setItems(data.events || []);
    } catch (error) {
      console.error('[Admin Events] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to load events: ${errorMessage}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  const handleImageChange = async (imageUrl: string, file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', file);
      // Use existing storage bucket and scoped folder
      formData.append('bucket', 'gallery');
      formData.append('folder', 'events');
      const { status, json } = await uploadWithProgress('/api/upload', formData, (p) => setUploadProgress(p));
      if (status < 200 || status >= 300) {
        throw new Error(json?.error || 'Upload failed');
      }
      const { url } = json || {};
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (error) {
      console.error('[Events] Upload error:', error);
      alert('Gagal upload gambar');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.event_date) {
      alert('Judul dan tanggal event wajib diisi!');
      return;
    }

    try {
      const url = editingId 
        ? `/api/admin/events/${editingId}` 
        : '/api/admin/events';
      const method = editingId ? 'PUT' : 'POST';
      
      console.log('[Admin Events] Submitting:', { url, method, formData });
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await safeJson(response, { url, method }).catch(() => ({}));
      
      if (!response.ok) {
        console.error('[Admin Events] Save failed:', result);
        throw new Error(result.error || 'Failed to save');
      }
      
      console.log('[Admin Events] Save success:', result);
      
      // Optimistic update - add/update event in local state immediately
      if (result.data) {
        if (editingId) {
          setItems(prev => prev.map(item => item.id === editingId ? result.data : item));
        } else {
          setItems(prev => [result.data, ...prev]);
        }
      }
      
      alert('Event berhasil disimpan!');
      
      // Reset form first
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        event_date: '',
        location: '',
        image_url: '',
        registration_link: '',
      });
      
      // Then refresh data to ensure consistency
      await fetchData();
    } catch (error) {
      console.error('[Admin Events] Error saving:', error);
      alert('Gagal menyimpan event: ' + (error as Error).message);
    }
  };

  const handleEdit = (item: Event) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      event_date: item.event_date ? item.event_date.split('T')[0] : '',
      location: item.location || '',
      image_url: item.image_url || '',
      registration_link: item.registration_link || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus event ini?')) return;
    
    try {
      const response = await apiFetch(`/api/admin/events/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      alert('Event berhasil dihapus!');
      await fetchData();
    } catch (error) {
      console.error('[Admin Events] Error deleting:', error);
      alert('Gagal menghapus event');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <FaCalendarAlt className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Manajemen Event
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Kelola acara dan kegiatan organisasi
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  title: '',
                  description: '',
                  event_date: '',
                  location: '',
                  image_url: '',
                  registration_link: '',
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <FaPlus /> Tambah Event
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      {editingId ? 'Edit Event' : 'Tambah Event Baru'}
                    </h2>
                    <p className="text-green-100 mt-1">
                      {editingId ? 'Update informasi event' : 'Buat event baru untuk organisasi'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-2xl text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Judul Event *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Contoh: Seminar Kepemimpinan 2024"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-500 transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Jelaskan detail acara..."
                    rows={4}
                  />
                </div>

                {/* Event Date & Location */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaClock className="inline mr-2 text-green-600" />
                      Tanggal Event *
                    </label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaMapMarkerAlt className="inline mr-2 text-green-600" />
                      Lokasi
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Contoh: Aula Utama"
                    />
                  </div>
                </div>

                {/* Registration Link */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FaLink className="inline mr-2 text-green-600" />
                    Link Pendaftaran
                  </label>
                  <input
                    type="url"
                    value={formData.registration_link}
                    onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://forms.google.com/..."
                  />
                </div>

                {/* Image Upload with Crop */}
                <ImageUploadField
                  label="Gambar Event"
                  currentImage={formData.image_url}
                  onImageChange={handleImageChange}
                  onImageRemove={() => setFormData({ ...formData, image_url: '' })}
                  aspectRatio={16 / 9}
                  suggestedRatios={[
                    { label: '16:9 (Banner)', value: 16 / 9 },
                    { label: '4:3 (Standard)', value: 4 / 3 },
                    { label: '1:1 (Square)', value: 1 },
                  ]}
                />

                {uploading && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
                      <div className="h-2 bg-green-500 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mengupload {uploadProgress}%</p>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Mengupload...' : editingId ? '💾 Update Event' : '✨ Buat Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-semibold transition-all duration-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaCalendarAlt className="text-5xl text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Belum ada event
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Mulai buat event pertama untuk organisasi Anda
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
                >
                  <FaPlus /> Buat Event Pertama
                </button>
              </div>
            </div>
          ) : (
            items.map((event, index) => {
              // Create unique key using id, title, and timestamp
              const uniqueKey = event.id || `${event.title}-${event.event_date}-${event.created_at || index}`;
              return (
              <div
                key={uniqueKey}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <div className="md:flex">
                  {/* Image */}
                  {event.image_url && (
                    <div className="md:w-1/3 relative overflow-hidden">
                      <MediaRenderer
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        controlsForVideo={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  {/* Content */}
                  <div className={`p-8 ${event.image_url ? 'md:w-2/3' : 'w-full'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all"
                          title="Hapus"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <FaClock className="text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(event.event_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {event.location}
                          </span>
                        </div>
                      )}
                      {event.registration_link && (
                        <a
                          href={event.registration_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-all font-medium"
                        >
                          <FaLink />
                          Daftar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
}

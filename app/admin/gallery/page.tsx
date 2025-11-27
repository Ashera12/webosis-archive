'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { uploadWithProgress } from '@/lib/client/uploadWithProgress';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import Image from 'next/image';
import MediaRenderer from '@/components/MediaRenderer';
import { FaImage, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import ImageUploadField from '@/components/ImageUploadField';
import AdminPageShell from '@/components/admin/AdminPageShell';

// Force dynamic rendering - prevent static optimization issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_id: string | null;
  sekbid_id: string | null;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
}

interface Sekbid {
  id: number;
  name: string;
}

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sekbids, setSekbids] = useState<Sekbid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_id: '',
    sekbid_id: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [galleryRes, eventsRes, sekbidsRes] = await Promise.all([
        apiFetch('/api/admin/gallery', { credentials: 'include' }),
        apiFetch('/api/admin/events', { credentials: 'include' }),
        apiFetch('/api/admin/sekbid', { credentials: 'include' })
      ]);

      if (!galleryRes.ok) throw new Error('Failed to fetch gallery');
      const galleryData = await safeJson(galleryRes, { url: '/api/admin/gallery', method: 'GET' });
      // Expect shape { gallery: [...] }
      const rawGalleryArray = Array.isArray(galleryData?.gallery) ? galleryData.gallery : (Array.isArray(galleryData) ? galleryData : []);
      // Ensure every item has a stable non-null id to avoid React key warnings
      const galleryArray = rawGalleryArray.map((g: any, i: number) => {
        let id = g?.id;
        if (id === null || id === undefined || id === '') {
          // Build deterministic fallback key using index + stable fields
          const base = (g?.image_url || g?.title || 'item');
          id = `tmp-${i}-${base}`;
        }
        return { ...g, id };
      });
      setItems(galleryArray);
      
      if (eventsRes.ok) {
        const eventsData = await safeJson(eventsRes, { url: '/api/admin/events', method: 'GET' });
        console.log('[Gallery] Raw events data:', eventsData);
        const eventsArray = Array.isArray(eventsData?.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []);
        console.log('[Gallery] Events array:', eventsArray.length, eventsArray);
        // Deduplicate events using title as fallback identifier
        const uniqueEvents = Array.isArray(eventsArray) ? eventsArray.filter((e: any, idx: number, arr: any[]) => {
          if (!e) return false;
          if (!e.title) return false;
          // Use title as fallback for deduplication if id is missing
          const identifier = e.id || e.title;
          return arr.findIndex((x: any) => (x.id || x.title) === identifier) === idx;
        }) : [];
        console.log('[Gallery] Final events:', uniqueEvents.length, Array.isArray(uniqueEvents) ? uniqueEvents.map((e: any) => ({ id: e.id, title: e.title })) : []);
        setEvents(uniqueEvents);
      } else {
        console.error('[Gallery] Failed to load events:', eventsRes.status);
        setEvents([]);
      }
      
      if (sekbidsRes.ok) {
        const sekbidsData = await safeJson(sekbidsRes, { url: '/api/admin/sekbid', method: 'GET' });
        const sekbidsArray = Array.isArray(sekbidsData?.sekbids) ? sekbidsData.sekbids : (Array.isArray(sekbidsData) ? sekbidsData : []);
        setSekbids(sekbidsArray as any);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      // Middleware controls role-based access; avoid client-side 404.
      fetchData();
    }
  }, [status, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      alert('Silakan upload gambar terlebih dahulu');
      return;
    }

    try {
      const url = editingId 
        ? `/api/admin/gallery/${editingId}` 
        : '/api/admin/gallery';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url,
          event_id: formData.event_id || null,
          sekbid_id: formData.sekbid_id ? parseInt(formData.sekbid_id) : null
        })
      });

      let result: any = null;
      try { result = await safeJson(response, { url, method }); } catch (_) {}

      if (!response.ok || !result?.success) {
        console.error('Gallery save failed:', { status: response.status, result });
        alert('Gagal menyimpan: ' + (result?.error || 'Unknown error'));
        return;
      }

      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', description: '', event_id: '', sekbid_id: '', image_url: '' });
    } catch (error) {
      console.error('Error saving gallery item:', error);
      alert('Gagal menyimpan gambar');
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      event_id: item.event_id || '',
      sekbid_id: item.sekbid_id?.toString() || '',
      image_url: item.image_url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus gambar ini?')) return;
    
    try {
      const response = await apiFetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      alert('Gagal menghapus gambar');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="ds-container p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle cropping upload via ImageUploadField
  const handleImageChange = async (imageUrl: string, file: File) => {
    try {
      console.log('[Gallery handleImageChange] Starting upload:', {
        imageUrl: imageUrl.substring(0, 100),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      setUploading(true);
      setUploadProgress(0);
      const fd = new FormData();
      const isVideo = file.type.startsWith('video/');
      const filename = isVideo ? file.name : 'gallery-image.jpg';
      
      console.log('[Gallery handleImageChange] Appending to FormData:', {
        isVideo,
        filename,
        bucket: 'gallery',
        folder: 'general'
      });

      fd.append('file', file, filename);
      fd.append('bucket', 'gallery');
      fd.append('folder', 'general');
      
      const { status, json } = await uploadWithProgress('/api/upload', fd, (p)=> setUploadProgress(p));
      
      console.log('[Gallery handleImageChange] Upload response:', { status, json });
      
      if (status < 200 || status >= 300) {
        console.error('[Gallery handleImageChange] Upload failed:', json);
        throw new Error(json?.error || 'Upload gagal');
      }
      const { url } = json || {};
      console.log('[Gallery handleImageChange] ✅ Upload success, URL:', url);
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (e) {
      console.error('[Gallery handleImageChange] Exception:', e);
      alert('Gagal upload gambar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
      setTimeout(()=> setUploadProgress(0), 400);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  return (
    <AdminPageShell
      icon={<FaImage className="w-8 h-8" />}
      title="Manajemen Galeri"
      subtitle="Kelola gambar dokumentasi kegiatan dan arsip visual"
      gradient="from-blue-600 to-indigo-600"
      actions={(
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: '', description: '', event_id: '', sekbid_id: '', image_url: '' });
          }}
          className="flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaPlus />
          <span>Tambah Gambar</span>
        </button>
      )}
    >

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                <FaImage />
                <span>{editingId ? 'Edit Gambar' : 'Tambah Gambar'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ title: '', description: '', event_id: '', sekbid_id: '', image_url: '' });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <ImageUploadField
                label="Gambar"
                currentImage={formData.image_url}
                onImageChange={handleImageChange}
                onImageRemove={handleImageRemove}
                aspectRatio={16/9}
                suggestedRatios={[
                  { label: '16:9 (Banner)', value: 16/9 },
                  { label: '4:3 (Standard)', value: 4/3 },
                  { label: '1:1 (Square)', value: 1 },
                  { label: 'Free', value: 0 }
                ]}
              />
              {uploading && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
                    <div className="h-2 bg-blue-500 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mengupload {uploadProgress}%</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Judul <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  placeholder="Masukkan judul gambar"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all resize-none"
                  placeholder="Masukkan deskripsi (opsional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Event (Opsional)</label>
                <select
                  value={formData.event_id}
                  onChange={(e) => {
                    console.log('[Gallery Form] Event selected:', e.target.value);
                    setFormData({ ...formData, event_id: e.target.value });
                  }}
                  className="relative z-10 pointer-events-auto w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                >
                  <option value="">- Pilih Event -</option>
                  {events.map((event) => (
                    <option key={event.id || event.title} value={event.id || ''}>{event.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Sekbid (Opsional)</label>
                <select
                  value={formData.sekbid_id}
                  onChange={(e) => {
                    console.log('[Gallery Form] Sekbid selected:', e.target.value);
                    setFormData({ ...formData, sekbid_id: e.target.value });
                  }}
                  className="relative z-10 pointer-events-auto w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                >
                  <option value="">- Pilih Sekbid -</option>
                  {sekbids.map((sekbid, idx) => {
                    const id = (sekbid as any).id;
                    const safeId = id === null || id === undefined ? `sek-${idx}-${sekbid.name}` : id;
                    return (
                      <option key={safeId} value={id ?? ''}>{sekbid.name}</option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {editingId ? 'Update Gambar' : 'Simpan Gambar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ title: '', description: '', event_id: '', sekbid_id: '', image_url: '' });
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <FaImage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada gambar di galeri</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Klik tombol "Tambah Gambar" untuk mulai menambah dokumentasi</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-56 overflow-hidden">
                <MediaRenderer
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  controlsForVideo={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70 pointer-events-none" />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg shadow hover:bg-white"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg shadow hover:bg-white"
                    title="Hapus"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                  {(item.event_id || item.sekbid_id) && (
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-md">
                      {item.event_id ? 'Event' : 'Sekbid'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}

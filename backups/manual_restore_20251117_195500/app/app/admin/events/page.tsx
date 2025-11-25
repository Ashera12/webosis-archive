"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import EventQRCode from '@/components/admin/EventQRCode';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt, FaUsers, FaClock } from 'react-icons/fa';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  max_participants: number | null;
  registration_deadline: string | null;
  image_url: string | null;
  created_at: string;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showQRFor, setShowQRFor] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    max_participants: '',
    registration_deadline: '',
    image_url: '',
  });

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems();
    }
  }, [status]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        }),
      });

      if (res.ok) {
        setFormData({ title: '', description: '', start_date: '', end_date: '', location: '', max_participants: '', registration_deadline: '', image_url: '' });
        setShowForm(false);
        fetchItems();
      } else {
        try {
          const err = await res.json();
          const msg = err?.error || err?.message || 'Gagal membuat event';
          const action = err?.action ? `\nSaran: ${err.action}` : '';
          alert(`${msg}${action}`);
          console.error('Create event failed:', err);
        } catch {
          alert('Gagal membuat event');
        }
      }
    } catch (error) {
      console.error('Error creating:', error);
      alert('Error saat membuat event');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const res = await fetch(`/api/admin/events/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setFormData({ title: '', description: '', start_date: '', end_date: '', location: '', max_participants: '', registration_deadline: '', image_url: '' });
        setShowForm(false);
        fetchItems();
      } else {
        try {
          const err = await res.json();
          const msg = err?.error || err?.message || 'Gagal mengupdate event';
          alert(msg);
          console.error('Update event failed:', err);
        } catch {
          alert('Gagal mengupdate event');
        }
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error saat mengupdate event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchItems();
      } else {
        try {
          const err = await res.json();
          const msg = err?.error || err?.message || 'Gagal menghapus event';
          alert(msg);
          console.error('Delete event failed:', err);
        } catch {
          alert('Gagal menghapus event');
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error saat menghapus event');
    }
  };

  const startEdit = (item: Event) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '',
      end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : '',
      location: item.location || '',
      max_participants: item.max_participants?.toString() || '',
      registration_deadline: item.registration_deadline ? new Date(item.registration_deadline).toISOString().slice(0, 16) : '',
      image_url: item.image_url || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', start_date: '', end_date: '', location: '', max_participants: '', registration_deadline: '', image_url: '' });
    setShowForm(false);
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

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="ds-container p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="ds-heading">
            <FaCalendarAlt className="inline-block mr-3 text-blue-600" />
            Events Management
          </h1>
          <p className="ds-subtle">Kelola event dan kegiatan OSIS</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) cancelEdit();
          }}
          className="ds-btn"
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? 'Batal' : 'Tambah Event'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Event' : 'Tambah Event Baru'}
          </h2>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Judul Event *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Mulai *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Aula, Lapangan, dll"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maks. Peserta
                </label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="Kosongkan jika unlimited"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline Registrasi
                </label>
                <input
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <ImageUploader
                  label="Poster / Gambar Event"
                  folder="events"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  helperText="Upload langsung atau tempel URL gambar. Disarankan upload ke storage."
                  previewAspect="16/9"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {editingId ? 'Update' : 'Tambah'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 && !loading ? (
        <div className="text-center py-20">
          <FaCalendarAlt className="mx-auto text-gray-400 text-6xl mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Belum ada event
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Klik tombol "Tambah Event" untuk mulai menambahkan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {item.image_url && (
                <div className="relative h-48">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {isUpcoming(item.start_date) && (
                    <span className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                      Upcoming
                    </span>
                  )}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaClock className="text-blue-500" />
                    <span>{formatDate(item.start_date)}</span>
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaMapMarkerAlt className="text-red-500" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.max_participants && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaUsers className="text-green-500" />
                      <span>Max: {item.max_participants} peserta</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => setShowQRFor(s => ({ ...s, [item.id]: !s[item.id] }))}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                  >
                    QR
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <FaTrash /> Hapus
                  </button>
                </div>
                {showQRFor[item.id] && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <EventQRCode eventId={item.id} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


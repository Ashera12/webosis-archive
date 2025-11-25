'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaBullhorn, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
  expires_at: string | null;
}

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    is_active: true,
    expires_at: ''
  });

  const fetchData = useCallback(async () => {
    try {
      console.log('[Admin Announcements] Fetching...');
      const response = await fetch('/api/admin/announcements');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      console.log('[Admin Announcements] Response:', data);
      setItems(data.announcements || []);
    } catch (error) {
      console.error('[Admin Announcements] Error:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId 
        ? `/api/admin/announcements/${editingId}` 
        : '/api/admin/announcements';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', type: 'info', is_active: true, expires_at: '' });
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Gagal menyimpan pengumuman');
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      is_active: item.is_active,
      expires_at: item.expires_at ? item.expires_at.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Gagal menghapus pengumuman');
    }
  };

  const getTypeColor = (type: string) => {
    return ANNOUNCEMENT_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="ds-container p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaBullhorn className="text-3xl text-blue-600" />
          <h1 className="ds-heading">Manajemen Pengumuman</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: '', content: '', type: 'info', is_active: true, expires_at: '' });
          }}
          className="ds-btn flex items-center gap-2"
        >
          <FaPlus /> Tambah Pengumuman
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Masukkan judul pengumuman"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Konten *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  placeholder="Masukkan isi pengumuman"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipe
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Berakhir (Opsional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="ds-btn flex-1">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            Belum ada pengumuman
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(item.type)}`}>
                      {ANNOUNCEMENT_TYPES.find(t => t.value === item.type)?.label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                    {item.expires_at && (
                      <span className="ml-4">
                        Berakhir: {new Date(item.expires_at).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                  >
                    <FaTrash /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



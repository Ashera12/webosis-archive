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
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
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
    priority: 'normal',
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

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save');
      }
      
      alert('Pengumuman berhasil disimpan!');
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', priority: 'normal', expires_at: '' });
    } catch (error) {
      console.error('[Admin Announcements] Error saving:', error);
      alert('Gagal menyimpan pengumuman: ' + (error as Error).message);
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      priority: item.priority || 'normal',
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
      alert('Pengumuman berhasil dihapus!');
      await fetchData();
    } catch (error) {
      console.error('[Admin Announcements] Error deleting:', error);
      alert('Gagal menghapus pengumuman');
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaBullhorn className="text-blue-600" />
            Manajemen Pengumuman
          </h1>
          <p className="text-gray-600 mt-1">Kelola pengumuman penting</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: '', content: '', priority: 'normal', expires_at: '' });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Tambah Pengumuman
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Judul *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Judul pengumuman"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Konten *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Isi pengumuman"
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prioritas
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tanggal Berakhir (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Update' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Belum ada pengumuman</p>
            <p className="text-gray-400 text-sm mt-2">Klik "Tambah Pengumuman" untuk membuat yang pertama</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded font-semibold ${getPriorityColor(item.priority)}`}>
                  {PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label || item.priority}
                </span>
                <span>Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                {item.expires_at && (
                  <span className="text-orange-600">
                    Berakhir: {new Date(item.expires_at).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

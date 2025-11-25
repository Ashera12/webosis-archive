'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import { FaBullhorn, FaPlus, FaEdit, FaTrash, FaTimes, FaExclamationTriangle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  target_audience: string | null;
  published: boolean;
  expires_at: string | null;
  image_url?: string | null;
  created_at: string;
}

const priorityConfig = {
  urgent: { color: 'bg-red-500', textColor: 'text-red-700', borderColor: 'border-red-500', label: 'Urgent', icon: FaExclamationTriangle },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700', borderColor: 'border-orange-500', label: 'High', icon: FaExclamationCircle },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', borderColor: 'border-yellow-500', label: 'Medium', icon: FaInfoCircle },
  low: { color: 'bg-gray-500', textColor: 'text-gray-700', borderColor: 'border-gray-500', label: 'Low', icon: FaInfoCircle },
};

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as Announcement['priority'],
    target_audience: '',
    published: true,
    expires_at: '',
    image_url: '',
  });

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
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
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ title: '', content: '', priority: 'medium', target_audience: '', published: true, expires_at: '', image_url: '' });
        setShowForm(false);
        fetchItems();
      } else {
        alert('Gagal membuat pengumuman');
      }
    } catch (error) {
      console.error('Error creating:', error);
      alert('Error saat membuat pengumuman');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const res = await fetch(`/api/admin/announcements/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingId(null);
        setFormData({ title: '', content: '', priority: 'medium', target_audience: '', published: true, expires_at: '', image_url: '' });
        setShowForm(false);
        fetchItems();
      } else {
        alert('Gagal mengupdate pengumuman');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error saat mengupdate pengumuman');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchItems();
      } else {
        alert('Gagal menghapus pengumuman');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error saat menghapus pengumuman');
    }
  };

    const startEdit = (item: Announcement) => {
      setEditingId(item.id);
      setFormData({
        title: item.title,
        content: item.content,
        priority: item.priority,
        target_audience: item.target_audience || '',
        published: item.published,
        expires_at: item.expires_at || '',
        image_url: item.image_url || '',
      });
      setShowForm(true);
    };

    const cancelEdit = () => {
      setEditingId(null);
      setFormData({ title: '', content: '', priority: 'medium', target_audience: '', published: true, expires_at: '', image_url: '' });
      setShowForm(false);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="ds-heading flex items-center gap-3"><FaBullhorn /> Pengumuman</h1>
            <p className="ds-subtle">Kelola pengumuman OSIS</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) cancelEdit();
            }}
            className="ds-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Batal' : 'Tambah Pengumuman'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h2>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul *</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konten</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioritas</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Announcement['priority'] })} className="w-full border px-3 py-2 rounded">
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publikasikan</label>
                  <select value={formData.published ? 'yes' : 'no'} onChange={(e) => setFormData({ ...formData, published: e.target.value === 'yes' })} className="w-full border px-3 py-2 rounded">
                    <option value="yes">Ya</option>
                    <option value="no">Tidak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Expire</label>
                  <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} className="w-full border px-3 py-2 rounded" />
                </div>
              </div>

              <div>
                <ImageUploader label="Gambar (opsional)" folder="announcements" value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })} />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="ds-btn">{editingId ? 'Update' : 'Buat'}</button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 border rounded">Batal</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it) => {
            const cfg = priorityConfig[it.priority] || priorityConfig.medium;
            return (
              <div key={it.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{it.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{it.content}</p>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 text-xs font-semibold rounded ${cfg.textColor}`}>{cfg.label}</div>
                  </div>
                </div>
                {it.image_url && <img src={it.image_url} alt={it.title} className="w-full h-40 object-cover rounded mt-3" />}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-500">{new Date(it.created_at).toLocaleString('id-ID')}</div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(it)} className="px-3 py-1 bg-yellow-500 text-white rounded">{<FaEdit />}</button>
                    <button onClick={() => handleDelete(it.id)} className="px-3 py-1 bg-red-500 text-white rounded">{<FaTrash />}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }


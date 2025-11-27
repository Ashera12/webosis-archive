'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { useState, useEffect, useCallback } from 'react';
import { FaFolderOpen, FaPlus, FaEdit, FaTrash, FaTimes, FaSortNumericDown } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

interface Sekbid {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
}

// Force dynamic rendering - prevent static optimization issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SekbidManagementPage() {
  const { data: session, status } = useSession();
  
  // Access control is already enforced by middleware for /admin routes.
  // We avoid client-side 404 redirects to prevent race conditions where the
  // session is available but the role hasn't populated yet on first hydration.
  // This previously caused super_admin to see a 404 on Vercel.
  
  const [items, setItems] = useState<Sekbid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/sekbid');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await safeJson(response, { url: '/api/admin/sekbid', method: 'GET' }).catch(() => ({ sekbid: [] }));
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sekbid:', error);
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
      // Role already validated by middleware; just load data.
      fetchData();
    }
  }, [status, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `/api/admin/sekbid/${editingId}` 
        : '/api/admin/sekbid';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save');
      
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', display_order: 0 });
    } catch (error) {
      console.error('Error saving sekbid:', error);
      alert('Gagal menyimpan sekbid');
    }
  };

  const handleEdit = (item: Sekbid) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      display_order: item.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus sekbid ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/sekbid/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (error) {
      console.error('Error deleting sekbid:', error);
      alert('Gagal menghapus sekbid');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageShell
      icon={<FaFolderOpen className="w-8 h-8" />}
      title="Manajemen Sekbid"
      subtitle="Kelola Seksi Bidang (Sekbid) organisasi OSIS"
      gradient="from-amber-600 to-orange-600"
      actions={(
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: '', description: '', display_order: 0 });
          }}
          className="flex items-center space-x-2 bg-white text-amber-600 px-6 py-3 rounded-xl font-semibold hover:bg-amber-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaPlus />
          <span>Tambah Sekbid</span>
        </button>
      )}
    >
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                <FaFolderOpen />
                <span>{editingId ? 'Edit Sekbid' : 'Tambah Sekbid'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', display_order: 0 });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Nama Sekbid <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  placeholder="Masukkan nama sekbid"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all resize-none"
                  placeholder="Masukkan deskripsi (opsional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Urutan Tampilan
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {editingId ? 'Update Sekbid' : 'Simpan Sekbid'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', description: '', display_order: 0 });
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <FaFolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada sekbid</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Klik tombol "Tambah Sekbid" untuk membuat sekbid pertama</p>
          </div>
        ) : (
          items
            .sort((a, b) => a.display_order - b.display_order)
            .map((item) => (
              <div
                key={item.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 border-amber-500"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 flex items-center space-x-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">
                      <FaSortNumericDown className="w-3 h-3" />
                      <span>{item.display_order}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center space-x-2 p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                      <span className="font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center space-x-2 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 transition-colors"
                    >
                      <FaTrash className="w-4 h-4" />
                      <span className="font-medium">Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </AdminPageShell>
  );
}

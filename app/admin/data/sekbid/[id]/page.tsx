'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaSave, FaArrowLeft, FaTrash } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

interface Sekbid {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
}

export default function EditSekbidPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const [sekbidId, setSekbidId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0
  });

  // Read id from route params (client-safe)
  useEffect(() => {
    const id = (routeParams as any)?.id;
    if (typeof id === 'string') setSekbidId(id);
  }, [routeParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && sekbidId) {
      fetchSekbid();
    }
  }, [status, sekbidId]);

  const fetchSekbid = async () => {
    if (!sekbidId) return;
    
    try {
      const response = await fetch(`/api/admin/sekbid/${sekbidId}`);
      if (!response.ok) {
        if (response.status === 404) {
          alert('Sekbid tidak ditemukan');
          router.push('/admin/data/sekbid');
          return;
        }
        throw new Error('Failed to fetch sekbid');
      }
      
      const data = await response.json();
      const sekbid = data.sekbid || data;
      
      setFormData({
        name: sekbid.name || '',
        description: sekbid.description || '',
        display_order: sekbid.display_order || 0
      });
    } catch (error) {
      console.error('Error fetching sekbid:', error);
      alert('Gagal memuat data sekbid');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekbidId) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/sekbid/${sekbidId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
      
      alert('Sekbid berhasil diupdate!');
      router.push('/admin/data/sekbid');
    } catch (error: any) {
      console.error('Error saving sekbid:', error);
      alert(error.message || 'Gagal menyimpan sekbid');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sekbidId) return;
    if (!confirm('Yakin ingin menghapus sekbid ini? Ini akan mempengaruhi data program kerja yang terkait.')) return;
    
    try {
      const response = await fetch(`/api/admin/sekbid/${sekbidId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      alert('Sekbid berhasil dihapus!');
      router.push('/admin/data/sekbid');
    } catch (error: any) {
      console.error('Error deleting sekbid:', error);
      alert(error.message || 'Gagal menghapus sekbid');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminPageShell title="Edit Seksi Bidang">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Edit Seksi Bidang">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/admin/data/sekbid')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <FaArrowLeft />
              <span>Kembali</span>
            </button>
            
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <FaTrash />
              <span>Hapus</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Seksi Bidang *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
                placeholder="Contoh: Sekbid I - Ketaqwaan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Deskripsi singkat seksi bidang ini..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Urutan Tampilan
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Urutan untuk menampilkan seksi bidang (semakin kecil, semakin awal ditampilkan)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/admin/data/sekbid')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
}

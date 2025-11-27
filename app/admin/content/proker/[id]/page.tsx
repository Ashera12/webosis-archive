'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaSave, FaArrowLeft, FaTrash } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

interface Sekbid {
  id: number;
  name: string;
}

interface Proker {
  id: number;
  title: string;
  description: string | null;
  sekbid_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProkerPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [prokerId, setProkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sekbidList, setSekbidList] = useState<Sekbid[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sekbid_id: '',
    start_date: '',
    end_date: '',
    status: 'planned' as 'planned' | 'ongoing' | 'completed' | 'cancelled'
  });

  // Unwrap async params
  useEffect(() => {
    params.then(p => setProkerId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && prokerId) {
      fetchSekbid();
      fetchProker();
    }
  }, [status, prokerId]);

  const fetchSekbid = async () => {
    try {
      const response = await fetch('/api/admin/sekbid');
      if (response.ok) {
        const data = await response.json();
        setSekbidList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching sekbid:', error);
    }
  };

  const fetchProker = async () => {
    if (!prokerId) return;
    
    try {
      const response = await fetch(`/api/admin/proker/${prokerId}`);
      if (!response.ok) {
        if (response.status === 404) {
          alert('Program kerja tidak ditemukan');
          router.push('/admin/content/proker');
          return;
        }
        throw new Error('Failed to fetch proker');
      }
      
      const proker: Proker = await response.json();
      
      setFormData({
        title: proker.title || '',
        description: proker.description || '',
        sekbid_id: proker.sekbid_id?.toString() || '',
        start_date: proker.start_date ? proker.start_date.split('T')[0] : '',
        end_date: proker.end_date ? proker.end_date.split('T')[0] : '',
        status: proker.status || 'planned'
      });
    } catch (error) {
      console.error('Error fetching proker:', error);
      alert('Gagal memuat data program kerja');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prokerId) return;
    
    setSaving(true);
    try {
      const payload = {
        ...formData,
        sekbid_id: formData.sekbid_id ? parseInt(formData.sekbid_id) : null
      };

      const response = await fetch(`/api/admin/proker/${prokerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
      
      alert('Program kerja berhasil diupdate!');
      router.push('/admin/content/proker');
    } catch (error: any) {
      console.error('Error saving proker:', error);
      alert(error.message || 'Gagal menyimpan program kerja');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!prokerId) return;
    if (!confirm('Yakin ingin menghapus program kerja ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/proker/${prokerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      alert('Program kerja berhasil dihapus!');
      router.push('/admin/content/proker');
    } catch (error: any) {
      console.error('Error deleting proker:', error);
      alert(error.message || 'Gagal menghapus program kerja');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminPageShell title="Edit Program Kerja">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Edit Program Kerja">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/admin/content/proker')}
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
                Judul Program Kerja *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
                placeholder="Contoh: Peringatan Hari Santri Nasional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seksi Bidang
              </label>
              <select
                value={formData.sekbid_id}
                onChange={(e) => setFormData({ ...formData, sekbid_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Pilih Seksi Bidang (Opsional)</option>
                {sekbidList.map((sekbid) => (
                  <option key={sekbid.id} value={sekbid.id}>
                    {sekbid.name}
                  </option>
                ))}
              </select>
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
                placeholder="Deskripsi program kerja..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                onClick={() => router.push('/admin/content/proker')}
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

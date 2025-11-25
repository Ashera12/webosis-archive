'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaClipboardList, FaPlus, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaClock, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa';

interface Proker {
  id: string;
  title: string;
  description: string | null;
  sekbid_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  sekbid?: {
    id: number;
    name: string;
  };
}

interface Sekbid {
  id: number;
  name: string;
}

const STATUS_CONFIG = {
  planned: {
    label: 'Direncanakan',
    icon: FaClock,
    gradient: 'from-gray-500 to-gray-600',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    border: 'border-gray-300 dark:border-gray-600'
  },
  ongoing: {
    label: 'Berlangsung',
    icon: FaCheckCircle,
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-600'
  },
  completed: {
    label: 'Selesai',
    icon: FaCheckCircle,
    gradient: 'from-green-500 to-emerald-600',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    border: 'border-green-300 dark:border-green-600'
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: FaTimes,
    gradient: 'from-red-500 to-rose-600',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
    border: 'border-red-300 dark:border-red-600'
  }
};

export default function ProkerPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Proker[]>([]);
  const [sekbids, setSekbids] = useState<Sekbid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sekbid_id: '',
    start_date: '',
    end_date: '',
    status: 'planned'
  });

  const fetchData = useCallback(async () => {
    try {
      const [prokerRes, sekbidRes] = await Promise.all([
        fetch('/api/admin/proker'),
        fetch('/api/admin/sekbid')
      ]);
      
      if (!prokerRes.ok) throw new Error('Failed to fetch proker');
      const prokerData = await prokerRes.json();
      setItems(Array.isArray(prokerData) ? prokerData : []);
      
      if (sekbidRes.ok) {
        const sekbidData = await sekbidRes.json();
        setSekbids(Array.isArray(sekbidData) ? sekbidData : []);
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
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId 
        ? `/api/admin/proker/${editingId}` 
        : '/api/admin/proker';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sekbid_id: formData.sekbid_id ? parseInt(formData.sekbid_id) : null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', description: '', sekbid_id: '', start_date: '', end_date: '', status: 'planned' });
    } catch (error) {
      console.error('Error saving proker:', error);
      alert('Gagal menyimpan program kerja');
    }
  };

  const handleEdit = (item: Proker) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      sekbid_id: item.sekbid_id?.toString() || '',
      start_date: item.start_date ? item.start_date.split('T')[0] : '',
      end_date: item.end_date ? item.end_date.split('T')[0] : '',
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus program kerja ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/proker/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (error) {
      console.error('Error deleting proker:', error);
      alert('Gagal menghapus program kerja');
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaClipboardList className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manajemen Program Kerja</h1>
                <p className="text-teal-100 mt-1">Kelola program kerja OSIS</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ title: '', description: '', sekbid_id: '', start_date: '', end_date: '', status: 'planned' });
              }}
              className="flex items-center space-x-2 bg-white text-teal-600 px-6 py-3 rounded-xl font-semibold hover:bg-teal-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus />
              <span>Tambah Proker</span>
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <FaClipboardList />
                  <span>{editingId ? 'Edit Program Kerja' : 'Tambah Program Kerja'}</span>
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ title: '', description: '', sekbid_id: '', start_date: '', end_date: '', status: 'planned' });
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Nama Program Kerja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    placeholder="Masukkan nama program kerja"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    rows={4}
                    placeholder="Deskripsi program kerja"
                  />
                </div>

                {/* Sekbid */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Sekbid
                  </label>
                  <select
                    value={formData.sekbid_id}
                    onChange={(e) => setFormData({ ...formData, sekbid_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  >
                    <option value="">- Pilih Sekbid (Opsional) -</option>
                    {sekbids.map((sekbid) => (
                      <option key={sekbid.id} value={sekbid.id}>
                        {sekbid.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                  >
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingId ? 'Update Proker' : 'Simpan Proker'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ title: '', description: '', sekbid_id: '', start_date: '', end_date: '', status: 'planned' });
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

        {/* Proker Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {items.length === 0 ? (
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <FaClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada program kerja</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Klik tombol "Tambah Proker" untuk membuat program kerja</p>
            </div>
          ) : (
            items.map((proker) => {
              const statusConfig = getStatusConfig(proker.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={proker.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 ${statusConfig.border}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {proker.title}
                        </h3>
                        {proker.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                            {proker.description}
                          </p>
                        )}
                      </div>
                      <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${statusConfig.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {proker.sekbid && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <FaLayerGroup className="w-4 h-4 text-teal-600" />
                          <span>{proker.sekbid.name}</span>
                        </div>
                      )}
                      {(proker.start_date || proker.end_date) && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <FaCalendarAlt className="w-4 h-4 text-teal-600" />
                          <span>
                            {proker.start_date && new Date(proker.start_date).toLocaleDateString('id-ID')}
                            {proker.start_date && proker.end_date && ' - '}
                            {proker.end_date && new Date(proker.end_date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(proker)}
                        className="flex-1 flex items-center justify-center space-x-2 p-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:hover:bg-teal-800 transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                        <span className="font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(proker.id)}
                        className="flex-1 flex items-center justify-center space-x-2 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                        <span className="font-medium">Hapus</span>
                      </button>
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

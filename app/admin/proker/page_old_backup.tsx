'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaClipboardList, FaPlus, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaClock } from 'react-icons/fa';

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

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Direncanakan', color: 'bg-gray-100 text-gray-800' },
  { value: 'ongoing', label: 'Berlangsung', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
];

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

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
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
          <FaClipboardList className="text-3xl text-blue-600" />
          <h1 className="ds-heading">Manajemen Program Kerja</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: '', description: '', sekbid_id: '', start_date: '', end_date: '', status: 'planned' });
          }}
          className="ds-btn flex items-center gap-2"
        >
          <FaPlus /> Tambah Program Kerja
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Program Kerja' : 'Tambah Program Kerja'}
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
                  Nama Program Kerja *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Masukkan nama program kerja"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  placeholder="Masukkan deskripsi program kerja"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sekbid (Opsional)
                </label>
                <select
                  value={formData.sekbid_id}
                  onChange={(e) => setFormData({ ...formData, sekbid_id: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  <option value="">- Pilih Sekbid -</option>
                  {sekbids.map((sekbid) => (
                    <option key={sekbid.id} value={sekbid.id}>
                      {sekbid.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            Belum ada program kerja
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {STATUS_OPTIONS.find(s => s.value === item.status)?.label}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-700 mb-3">{item.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {item.sekbid && (
                      <span className="flex items-center gap-1">
                        <FaClipboardList className="text-blue-600" />
                        {item.sekbid.name}
                      </span>
                    )}
                    {item.start_date && (
                      <span className="flex items-center gap-1">
                        <FaClock className="text-green-600" />
                        Mulai: {new Date(item.start_date).toLocaleDateString('id-ID')}
                      </span>
                    )}
                    {item.end_date && (
                      <span className="flex items-center gap-1">
                        <FaCheckCircle className="text-purple-600" />
                        Selesai: {new Date(item.end_date).toLocaleDateString('id-ID')}
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

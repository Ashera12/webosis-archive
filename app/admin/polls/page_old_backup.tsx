'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaPoll, FaPlus, FaEdit, FaTrash, FaTimes, FaChartBar } from 'react-icons/fa';

interface PollOption {
  id: string;
  option_text: string;
  votes: number;
  order_index: number;
}

interface Poll {
  id: string;
  question: string;
  expires_at: string | null;
  created_at: string;
  poll_options?: PollOption[];
}

export default function PollsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    expires_at: '',
    options: ['', '']
  });

  const fetchData = useCallback(async () => {
    try {
      console.log('[Admin Polls] Fetching polls...');
      const response = await fetch('/api/admin/polls');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      console.log('[Admin Polls] Response:', data);
      setItems(data.polls || []);
    } catch (error) {
      console.error('[Admin Polls] Error fetching polls:', error);
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
    
    const validOptions = formData.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Minimal 2 opsi jawaban');
      return;
    }

    try {
      const url = editingId 
        ? `/api/admin/polls/${editingId}` 
        : '/api/admin/polls';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          options: validOptions,
          expires_at: formData.expires_at || null
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save');
      }
      
      alert('Polling berhasil disimpan!');
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ question: '', expires_at: '', options: ['', ''] });
    } catch (error) {
      console.error('[Admin Polls] Error saving poll:', error);
      alert('Gagal menyimpan polling: ' + (error as Error).message);
    }
  };

  const handleEdit = (item: Poll) => {
    setEditingId(item.id);
    setFormData({
      question: item.question,
      expires_at: item.expires_at || '',
      options: item.poll_options?.map(opt => opt.option_text) || ['', '']
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus polling ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/polls/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Gagal menghapus polling');
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      alert('Minimal 2 opsi');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
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
          <FaPoll className="text-3xl text-blue-600" />
          <h1 className="ds-heading">Manajemen Polling</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ question: '', description: '', is_active: true, end_date: '', options: ['', ''] });
          }}
          className="ds-btn flex items-center gap-2"
        >
          <FaPlus /> Buat Polling
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Polling' : 'Buat Polling'}
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
                  Pertanyaan *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Masukkan pertanyaan polling"
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
                  placeholder="Masukkan deskripsi (opsional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opsi Jawaban *
                </label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder={`Opsi ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Tambah Opsi
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Berakhir
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
            Belum ada polling
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{item.question}</h3>
                  {item.description && (
                    <p className="text-gray-600 mb-2">{item.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {item.end_date && (
                      <span>Berakhir: {new Date(item.end_date).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
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

              {item.options && item.options.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FaChartBar /> Hasil Voting:
                  </h4>
                  {item.options.map((option) => {
                    const totalVotes = item.options?.reduce((sum, opt) => sum + opt.vote_count, 0) || 0;
                    const percentage = totalVotes > 0 ? (option.vote_count / totalVotes * 100).toFixed(1) : 0;
                    return (
                      <div key={option.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between mb-1">
                          <span>{option.option_text}</span>
                          <span className="font-semibold">{option.vote_count} suara ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaPoll, FaPlus, FaEdit, FaTrash, FaTimes, FaChartBar } from 'react-icons/fa';
import { apiFetch, safeJson } from '@/lib/safeFetch';

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
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);
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
      const response = await apiFetch('/api/admin/polls');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await safeJson(response, { url: '/api/admin/polls', method: 'GET' });
      console.log('[Admin Polls] Response:', data);
      setItems(data.polls || []);
    } catch (error) {
      console.error('[Admin Polls] Error fetching polls:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdminPanel) {
      return;
    }
    if (status === 'authenticated' && canAccessAdminPanel) {
      fetchData();
    }
  }, [status, fetchData, canAccessAdminPanel]);

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
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          options: validOptions,
          expires_at: formData.expires_at || null
        })
      });
      const result = await safeJson(response, { url, method }).catch(() => ({}));
      
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
      expires_at: item.expires_at ? item.expires_at.split('T')[0] : '',
      options: item.poll_options?.map(opt => opt.option_text) || ['', '']
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus polling ini?')) return;
    
    try {
      const response = await apiFetch(`/api/admin/polls/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      alert('Polling berhasil dihapus!');
      await fetchData();
    } catch (error) {
      console.error('[Admin Polls] Error deleting poll:', error);
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

  const getTotalVotes = (poll: Poll) => {
    return poll.poll_options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
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
            <FaPoll className="text-purple-600" />
            Manajemen Polling
          </h1>
          <p className="text-gray-600 mt-1">Kelola polling dan lihat hasil voting</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ question: '', expires_at: '', options: ['', ''] });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Tambah Polling
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Polling' : 'Tambah Polling Baru'}
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
                    Pertanyaan Polling *
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Contoh: Acara apa yang kalian inginkan?"
                  />
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
                  <p className="text-xs text-gray-500 mt-1">
                    Kosongkan jika polling tidak pernah berakhir
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opsi Jawaban (Min. 2) *
                  </label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Opsi ${index + 1}`}
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <FaPlus /> Tambah Opsi
                  </button>
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

      {/* Polls List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <FaPoll className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Belum ada polling</p>
            <p className="text-gray-400 text-sm mt-2">Klik "Tambah Polling" untuk membuat yang pertama</p>
          </div>
        ) : (
          items.map((poll) => {
            const totalVotes = getTotalVotes(poll);
            
            return (
              <div key={poll.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {poll.question}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Dibuat: {new Date(poll.created_at).toLocaleDateString('id-ID')}</span>
                      {poll.expires_at && (
                        <span className="text-orange-600">
                          Berakhir: {new Date(poll.expires_at).toLocaleDateString('id-ID')}
                        </span>
                      )}
                      <span className="font-semibold text-purple-600">
                        <FaChartBar className="inline mr-1" />
                        {totalVotes} total votes
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(poll)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(poll.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Hapus"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>

                {/* Vote Results */}
                <div className="space-y-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Hasil Voting:
                  </h4>
                  {poll.poll_options?.sort((a, b) => a.order_index - b.order_index).map((option) => {
                    const percentage = totalVotes > 0 
                      ? Math.round((option.votes / totalVotes) * 100) 
                      : 0;
                    
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {option.option_text}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {option.votes} votes ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

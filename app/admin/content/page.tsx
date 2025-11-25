'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaSave, FaUndo, FaFileAlt } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

interface ContentSection {
  id: string;
  key: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function ContentPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/content');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching content:', error);
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

  const handleEdit = (item: ContentSection) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });

      if (!response.ok) throw new Error('Failed to save');
      
      await fetchData();
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Gagal menyimpan konten');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageShell
      icon={<FaFileAlt className="w-8 h-8" />}
      title="Manajemen Konten"
      subtitle="Edit konten statis dan teks informatif website"
      gradient="from-purple-600 to-indigo-600"
    >
      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <FaFileAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada konten</p>
          </div>
        ) : (
          items.map((item) => {
            const isEditing = editingId === item.id;
            
            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="border-l-4 border-purple-500 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-mono">
                          {item.key}
                        </code>
                        <span className="flex items-center space-x-1">
                          <FaEdit className="w-3 h-3" />
                          <span>Terakhir update: {new Date(item.updated_at).toLocaleString('id-ID')}</span>
                        </span>
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <FaEdit />
                        <span>Edit Konten</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Konten
                        </label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all font-mono text-sm"
                          rows={12}
                          placeholder="Masukkan konten..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={saving}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaSave />
                          <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          <FaUndo />
                          <span>Batal</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                        {item.content}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminPageShell>
  );
}

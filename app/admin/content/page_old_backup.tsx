'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaSave, FaUndo } from 'react-icons/fa';

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
      <div className="flex items-center gap-3 mb-6">
        <FaEdit className="text-3xl text-blue-600" />
        <div>
          <h1 className="ds-heading">Manajemen Konten</h1>
          <p className="text-sm text-gray-600">Edit konten statis website</p>
        </div>
      </div>

      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            Belum ada konten
          </div>
        ) : (
          items.map((item) => {
            const isEditing = editingId === item.id;
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      Kunci: <code className="bg-gray-100 px-2 py-1 rounded">{item.key}</code>
                      {' • '}
                      Terakhir update: {new Date(item.updated_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  
                  {!isEditing && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none font-mono text-sm"
                      rows={10}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        <FaSave /> {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
                      >
                        <FaUndo /> Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{item.content}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

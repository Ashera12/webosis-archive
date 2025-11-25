'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FaNewspaper, FaPlus, FaEdit, FaTrash, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import ImageUploader from '@/components/admin/ImageUploader';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  author_id: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function PostsPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    is_published: false
  });

  const fetchData = useCallback(async () => {
    try {
      console.log('[Posts] Fetching data...');
      const response = await fetch('/api/admin/posts', { credentials: 'include' });
      console.log('[Posts] Response status:', response.status);
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('[Posts] Fetch failed:', response.status, errText);
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      console.log('[Posts] Data received:', data);
      console.log('[Posts] Data is array?', Array.isArray(data));
      console.log('[Posts] Data length:', data?.length);
      
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Posts] Error fetching posts:', error);
      setItems([]);
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
        ? `/api/admin/posts/${editingId}` 
        : '/api/admin/posts';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Post save failed:', { status: response.status, error: errData });
        alert('Gagal menyimpan post: ' + (errData?.error || 'Unknown error'));
        return;
      }

      const result = await response.json();
      if (!result?.success) {
        console.error('Post save no success flag:', result);
        alert('Gagal menyimpan post: ' + (result?.error || 'No success flag'));
        return;
      }
      
      console.log('Post saved successfully:', result.data);
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', excerpt: '', image_url: '', is_published: false });
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Gagal menyimpan post: ' + (error as Error).message);
    }
  };

  const handleEdit = (item: Post) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || '',
      image_url: item.image_url || '',
      is_published: item.is_published
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus post ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      let result: any = null; try { result = await response.json(); } catch(_) {}
      if (!response.ok || !result?.success) throw new Error('Failed to delete');
      await fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Gagal menghapus post');
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_published: !currentStatus })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Toggle publish failed:', { status: response.status, error: errData });
        throw new Error(errData.error || 'Failed to toggle publish');
      }
      
      const result = await response.json();
      if (!result?.success) {
        console.error('Toggle publish no success flag:', result);
        throw new Error(result?.error || 'Failed to toggle publish');
      }
      
      await fetchData();
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert(`Gagal mengubah status publikasi: ${(error as Error).message}`);
    }
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
          <FaNewspaper className="text-3xl text-blue-600" />
          <h1 className="ds-heading">Manajemen Post</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: '', content: '', excerpt: '', image_url: '', is_published: false });
          }}
          className="ds-btn flex items-center gap-2"
        >
          <FaPlus /> Buat Post
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Post' : 'Buat Post'}
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
                <label className="block text-sm font-medium mb-2">
                  Gambar Unggulan (Opsional)
                </label>
                <ImageUploader
                  value={formData.image_url}
                  onChange={(url: string) => setFormData({ ...formData, image_url: url })}
                  bucket="gallery"
                  folder="posts"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      width={400}
                      height={200}
                      className="rounded object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Masukkan judul post"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Excerpt (Ringkasan)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Ringkasan singkat untuk preview..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Konten *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  placeholder="Masukkan isi post"
                  rows={12}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_published" className="text-sm font-medium">
                  Publikasikan sekarang
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
            Belum ada post
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex gap-4 p-6">
                {item.image_url && (
                  <div className="w-48 h-32 flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      width={192}
                      height={128}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  {item.excerpt && (
                    <p className="text-gray-600 mb-2 line-clamp-2">{item.excerpt}</p>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    Dibuat: {new Date(item.created_at).toLocaleString('id-ID')}
                    {item.published_at && (
                      <> • Dipublikasi: {new Date(item.published_at).toLocaleString('id-ID')}</>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => togglePublish(item.id, item.is_published)}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${item.is_published ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    {item.is_published ? <><FaEyeSlash /> Unpublish</> : <><FaEye /> Publish</>}
                  </button>
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

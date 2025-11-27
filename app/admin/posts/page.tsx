'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import MediaRenderer from '@/components/MediaRenderer';
import { FaNewspaper, FaPlus, FaEdit, FaTrash, FaTimes, FaEye, FaEyeSlash, FaImage, FaCalendarAlt } from 'react-icons/fa';
import ImageUploadField from '@/components/ImageUploadField';
import { uploadWithProgress } from '@/lib/client/uploadWithProgress';

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
  
  // STRICT: Only super_admin, admin, osis can access admin panel
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);
  
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('[Posts] Fetch failed:', response.status, errText);
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
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
      return;
    }
    if (status === 'authenticated') {
      // Access control enforced by middleware; avoid client-side 404 race.
      fetchData();
    }
  }, [status, fetchData]);

  const handleImageChange = async (imageUrl: string, file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      // Upload to Supabase Storage
      const uploadFormData = new FormData();
      // Preserve original filename for videos; use generic for cropped images
      const isVideo = file.type.startsWith('video/');
      const filename = isVideo ? file.name : 'post-image.jpg';
      uploadFormData.append('file', file, filename);
      uploadFormData.append('bucket', 'gallery');
      uploadFormData.append('folder', 'posts');
      const { status, json } = await uploadWithProgress('/api/upload', uploadFormData, (p)=> setUploadProgress(p));
      if (status < 200 || status >= 300) {
        throw new Error(json?.error || 'Upload failed');
      }
      const { url } = json || {};
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal upload gambar');
    } finally {
      setUploading(false);
      setTimeout(()=> setUploadProgress(0), 400);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

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
      let result: any = null; 
      try { result = await response.json(); } catch(_) {}
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
      
      if (!response.ok) throw new Error('Failed to toggle publish');
      
      await fetchData();
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Gagal mengubah status publish');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaNewspaper className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manajemen Posts</h1>
                <p className="text-indigo-100 mt-1">Kelola artikel dan berita OSIS</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ title: '', content: '', excerpt: '', image_url: '', is_published: false });
              }}
              className="flex items-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus />
              <span>Tambah Post</span>
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <FaNewspaper />
                  <span>{editingId ? 'Edit Post' : 'Tambah Post Baru'}</span>
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ title: '', content: '', excerpt: '', image_url: '', is_published: false });
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
                    Judul Post <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                    placeholder="Masukkan judul post"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Ringkasan
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    rows={2}
                    placeholder="Ringkasan singkat post (opsional)"
                  />
                </div>

                {/* Featured Image */}
                <ImageUploadField
                  label="Featured Image"
                  currentImage={formData.image_url}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  aspectRatio={16 / 9}
                  suggestedRatios={[
                    { label: '16:9 (Banner)', value: 16 / 9 },
                    { label: '4:3 (Standard)', value: 4 / 3 },
                    { label: '1:1 (Square)', value: 1 }
                  ]}
                />

                {uploading && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
                      <div className="h-2 bg-indigo-500 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mengupload {uploadProgress}%</p>
                  </div>
                )}

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Konten <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    rows={8}
                    required
                    placeholder="Masukkan konten post"
                  />
                </div>

                {/* Publish Status */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                    Publikasikan post ini
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingId ? 'Update Post' : 'Simpan Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ title: '', content: '', excerpt: '', image_url: '', is_published: false });
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

        {/* Posts Grid */}
        <div className="grid gap-6">
          {items.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <FaNewspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada post</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Klik tombol "Tambah Post" untuk membuat post pertama</p>
            </div>
          ) : (
            items.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <div className="md:flex">
                  {/* Featured Media (Image or Video) */}
                  {post.image_url ? (
                    <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                      <MediaRenderer
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        controlsForVideo={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  ) : (
                    <div className="md:w-1/3 relative h-48 md:h-auto bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center">
                      <FaImage className="w-16 h-16 text-indigo-300 dark:text-indigo-600" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => togglePublish(post.id, post.is_published)}
                        className={`ml-4 p-2 rounded-lg transition-colors ${
                          post.is_published
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        title={post.is_published ? 'Published' : 'Draft'}
                      >
                        {post.is_published ? <FaEye className="w-5 h-5" /> : <FaEyeSlash className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt className="w-4 h-4" />
                          <span>{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        {post.is_published && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-semibold">
                            Published
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                          title="Hapus"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

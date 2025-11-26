'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { uploadWithProgress } from '@/lib/client/uploadWithProgress';
import ImageUploadField from '@/components/ImageUploadField';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaTimes, FaUserShield, FaUserCheck, FaBan, FaEnvelope, FaIdCard, FaClock, FaEye, FaSchool, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  name: string | null;
  nickname?: string | null;
  unit_sekolah?: string | null;
  kelas?: string | null;
  nik?: string | null;
  nisn?: string | null;
  requested_role?: string | null;
  role: string;
  is_active: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
  email_verified?: boolean;
  profile_image?: string | null;
  created_at: string;
  last_login: string | null;
}

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    color: 'from-red-600 to-fuchsia-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    icon: FaUserShield,
  },
  admin: {
    label: 'Admin',
    color: 'from-red-500 to-pink-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    icon: FaUserShield,
  },
  moderator: {
    label: 'Moderator',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: FaEdit,
  },
  osis: {
    label: 'OSIS',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: FaUserCheck,
  },
  siswa: {
    label: 'Siswa',
    color: 'from-gray-500 to-slate-600',
    bgColor: 'bg-gray-50 dark:bg-gray-700/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: FaUserCheck,
  },
  guru: {
    label: 'Guru',
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: FaUserShield,
  },
  other: {
    label: 'Other',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-700/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: FaUserCheck,
  },
  viewer: {
    label: 'Viewer',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-700/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: FaUserCheck,
  },
} as const;

export default function UsersPage() {
  const { data: session, status } = useSession();
  // STRICT: Only super_admin, admin, osis can access admin users panel
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    nickname: '',
    unit_sekolah: '',
    kelas: '',
    nik: '',
    nisn: '',
    instagram_username: '',
    role: 'siswa',
    password: '',
    is_active: true,
    profile_image: '',
    new_password: '' // For edit mode password change
  });

  // Create Supabase client (browser) for realtime & lightweight fetches
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: false, autoRefreshToken: false } });

  const fetchData = useCallback(async () => {
    try {
      console.log('[Admin Users] Fetching from /api/admin/users...');
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      console.log('[Admin Users] Response status:', response.status);
      
      if (!response.ok) {
        const errJson = await response.json().catch(()=>({}));
        console.error('[Admin Users] API Error:', errJson);
        throw new Error(errJson.error || errJson.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Admin Users] Raw response:', data);
      console.log('[Admin Users] Is array?', Array.isArray(data));
      console.log('[Admin Users] Data length:', Array.isArray(data) ? data.length : (data.users?.length || 0));
      
      // Handle both array and object response formats
      const list = Array.isArray(data) ? data : (data.users || []);
      console.log('[Admin Users] Final list:', list.length, 'users');
      
      if (list.length === 0) {
        console.warn('[Admin Users] No users returned from API');
      }
      
      setItems(list);
      setFallbackMode(!Array.isArray(data) && !!data.fallback);
    } catch (error) {
      console.error('[Admin Users] Fetch error:', error);
      console.error('[Admin Users] Error stack:', (error as Error).stack);
      alert('Gagal memuat data users: ' + (error as Error).message);
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
      if (!canAccessAdminPanel) {
        // Unauthorized access - redirect to 404
        redirect('/404');
        return;
      }
      fetchData();
    }
  }, [status, fetchData, canAccessAdminPanel]);

  // Realtime subscription for users table (INSERT/UPDATE/DELETE)
  useEffect(() => {
    if (status !== 'authenticated') return;
    console.log('[Admin Users] Subscribing to realtime users changes');
    const channel = supabase.channel('users-admin-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        try {
          console.log('[Realtime users] Event:', payload.eventType, payload);
          setItems(prev => {
            const event = payload.eventType;
            const newRow: any = payload.new ?? payload.old;
            if (!newRow?.id) return prev;
            if (event === 'DELETE') {
              return prev.filter(u => u.id !== newRow.id);
            }
            // Build mapped user from newRow
            const mapped = {
              id: newRow.id,
              email: newRow.email,
              name: newRow.name ?? null,
              nickname: newRow.nickname ?? null,
              unit_sekolah: newRow.unit_sekolah ?? null,
              nik: newRow.nik ?? null,
              nisn: newRow.nisn ?? null,
              requested_role: newRow.requested_role ?? null,
              role: (newRow.role || 'osis'),
              is_active: !!newRow.approved,
              rejected: !!newRow.rejected,
              rejection_reason: newRow.rejection_reason ?? null,
              email_verified: !!newRow.email_verified,
              profile_image: newRow.photo_url ?? null,
              created_at: newRow.created_at,
              last_login: null,
            } as User;
            // Replace or insert
            const idx = prev.findIndex(u => u.id === newRow.id);
            if (idx === -1) return [mapped, ...prev];
            const copy = [...prev];
            copy[idx] = mapped;
            return copy;
          });
        } catch (e) {
          console.error('[Realtime users] Error processing payload', e);
        }
      });
    channel.subscribe(status => console.log('[Realtime users] Subscription status:', status));
    return () => {
      console.log('[Admin Users] Unsubscribing realtime');
      supabase.removeChannel(channel);
    };
  }, [status]);

  const handleImageChange = async (imageUrl: string, file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('bucket', 'gallery');
      formDataUpload.append('folder', 'profiles');
      // Use progress helper
      const { status, json } = await uploadWithProgress('/api/upload', formDataUpload, (p)=> setUploadProgress(p));
      if (status < 200 || status >= 300) {
        throw new Error(json?.error || 'Upload failed');
      }
      const { url } = json || {};
      setFormData(prev => ({ ...prev, profile_image: url }));
    } catch (error) {
      console.error('[Users] Upload error:', error);
      alert('Gagal upload foto profil');
    } finally {
      setUploading(false);
      setTimeout(()=> setUploadProgress(0), 400);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId 
        ? `/api/admin/users/${editingId}` 
        : '/api/admin/users';
      const method = editingId ? 'PUT' : 'POST';
      
      console.log('[Admin Users] Submitting form:', { editingId, is_active: formData.is_active });
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? {
          name: formData.name,
          nickname: formData.nickname,
          unit_sekolah: formData.unit_sekolah,
          kelas: formData.kelas,
          nik: formData.nik,
          nisn: formData.nisn,
          instagram_username: formData.instagram_username,
          role: formData.role,
          is_active: formData.is_active,
          profile_image: formData.profile_image,
          password: formData.new_password || undefined // Only send if provided
        } : formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save');
      }

      console.log('[Admin Users] Save success:', result);
      
      // Optimistic update - immediately update local state
      if (editingId && result.data) {
        setItems(prev => prev.map(item => 
          item.id === editingId 
            ? { ...item, ...result.data, is_active: !!result.data.is_active }
            : item
        ));
      }
      
      alert('User berhasil disimpan!');
      await fetchData(); // Still fetch to ensure consistency
      setShowForm(false);
      setEditingId(null);
      setFormData({
        email: '',
        name: '',
        nickname: '',
        unit_sekolah: '',
        kelas: '',
        nik: '',
        nisn: '',
        instagram_username: '',
        role: 'siswa',
        password: '',
        is_active: true,
        profile_image: '',
        new_password: ''
      });
    } catch (error) {
      console.error('[Admin Users] Error saving:', error);
      alert('Gagal menyimpan user: ' + (error as Error).message);
    }
  };

  const handleEdit = (item: User) => {
    setEditingId(item.id);
    setFormData({
      email: item.email,
      name: item.name || '',
      nickname: item.nickname || '',
      unit_sekolah: item.unit_sekolah || '',
      kelas: item.kelas || '',
      nik: item.nik || '',
      nisn: item.nisn || '',
      instagram_username: (item as any).instagram_username || '',
      role: item.role,
      password: '',
      is_active: item.is_active,
      profile_image: item.profile_image || '',
      new_password: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      alert('User berhasil dihapus!');
      await fetchData();
    } catch (error) {
      console.error('[Admin Users] Error deleting:', error);
      alert('Gagal menghapus user');
    }
  };

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.other;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <FaUsers className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Manajemen Users
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Kelola akun pengguna dan hak akses
                </p>
              </div>
            </div>
              {/* Role counts summary */}
              <div className="hidden md:flex items-center gap-2">
                {Object.keys(ROLE_CONFIG).map((role) => {
                  const count = items.filter(u => u.role === role).length;
                  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                  return (
                    <span key={role} className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.bgColor} ${cfg.textColor}`}>
                      {cfg.label}: {count}
                    </span>
                  );
                })}
              </div>
            <div className="flex items-center gap-3">
              <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  email: '',
                  name: '',
                  nickname: '',
                  unit_sekolah: '',
                  kelas: '',
                  nik: '',
                  nisn: '',
                  instagram_username: '',
                  role: 'siswa',
                  password: '',
                  is_active: true,
                  profile_image: '',
                  new_password: ''
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <FaPlus /> Tambah User
              </button>
              <button
                onClick={() => fetchData()}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                title="Refresh data manual"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          {fallbackMode && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium">
              Mode fallback: menggunakan anon key Supabase. Beberapa data sensitif mungkin tidak tampil. Tambahkan <code>SUPABASE_SERVICE_ROLE_KEY</code> untuk akses penuh.
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      {editingId ? 'Edit User' : 'Tambah User Baru'}
                    </h2>
                    <p className="text-purple-100 mt-1">
                      {editingId ? 'Update informasi user' : 'Buat akun user baru'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-2xl text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Profile Image */}
                <ImageUploadField
                  label="Foto Profil"
                  currentImage={formData.profile_image}
                  onImageChange={handleImageChange}
                  onImageRemove={() => setFormData({ ...formData, profile_image: '' })}
                  aspectRatio={1}
                  suggestedRatios={[
                    { label: '1:1 (Profil)', value: 1 },
                    { label: '4:3', value: 4 / 3 },
                    { label: 'Free', value: 0 },
                  ]}
                />

                {uploading && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
                      <div className="h-2 bg-purple-500 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mengupload {uploadProgress}%</p>
                  </div>
                )}

                {/* Name & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaIdCard className="inline mr-2 text-purple-600" />
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Nama user"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaEnvelope className="inline mr-2 text-purple-600" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="user@example.com"
                      required
                      disabled={!!editingId}
                    />
                  </div>
                </div>

                {/* Nickname & Unit Sekolah */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Contoh: Budi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Unit Sekolah
                    </label>
                    <input
                      type="text"
                      value={formData.unit_sekolah}
                      onChange={(e) => setFormData({ ...formData, unit_sekolah: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="SMP / SMA / SMK"
                    />
                  </div>
                </div>

                {/* Kelas, NIK & NISN */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="X IPA 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      NIK (16 digit)
                    </label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      maxLength={16}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="16 digit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      NISN (10 digit)
                    </label>
                    <input
                      type="text"
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      maxLength={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="10 digit"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <svg className="inline w-4 h-4 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">@</span>
                    <input
                      type="text"
                      value={formData.instagram_username}
                      onChange={(e) => {
                        const value = e.target.value.replace(/@/g, '');
                        setFormData({ ...formData, instagram_username: value });
                      }}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="username_instagram"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Masukkan username Instagram pengguna</p>
                </div>

                {/* Role & Password */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FaUserShield className="inline mr-2 text-purple-600" />
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!editingId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Min. 6 karakter"
                        required={!editingId}
                        minLength={6}
                      />
                    </div>
                  )}

                  {editingId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Ganti Password (opsional)
                      </label>
                      <input
                        type="password"
                        value={formData.new_password}
                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Kosongkan jika tidak ingin mengubah"
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimal 6 karakter. Biarkan kosong jika tidak ingin mengubah password.</p>
                    </div>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FaUserCheck className="inline mr-2 text-green-600" />
                    Akun Aktif (user dapat login)
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Mengupload...' : editingId ? '💾 Update User' : '✨ Buat User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-semibold transition-all duration-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaUsers className="text-5xl text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Belum ada users
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tambahkan user pertama untuk memulai
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
                >
                  <FaPlus /> Tambah User Pertama
                </button>
              </div>
            </div>
          ) : (
            items.map((user) => {
              const config = getRoleConfig(user.role);
              const Icon = config.icon;

              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Profile Image */}
                  <div className="relative h-32 bg-gradient-to-br from-purple-500 to-pink-600">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaUsers className="text-6xl text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => setDetailUser(user)}
                        className="p-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-lg shadow-lg hover:scale-110 transition-transform"
                        title="Detail"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-lg hover:scale-110 transition-transform"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg shadow-lg hover:scale-110 transition-transform"
                        title="Hapus"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        {user.name || 'No Name'}
                      </h3>
                        <div className="flex gap-2">
                          {user.is_active ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full" title="Akun disetujui admin">
                              Disetujui
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full" title="Menunggu persetujuan admin">
                              Pending
                            </span>
                          )}
                          {user.email_verified ? (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full" title="Email terverifikasi">
                              Email ✓
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full" title="Email belum diverifikasi">
                              Email ✗
                            </span>
                          )}
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <FaEnvelope className="text-purple-600" />
                      {user.email}
                    </p>

                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${config.bgColor} ${config.textColor} font-medium text-sm`}>
                      <Icon />
                      {config.label}
                    </div>

                    {user.last_login && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-2">
                        <FaClock />
                        Login: {new Date(user.last_login).toLocaleDateString('id-ID')}
                      </p>
                    )}

                    {/* View Dashboard Button - Prominent at bottom of card */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={`/dashboard?userId=${user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                        title="Lihat dashboard user ini"
                      >
                        <FaEye size={16} className="group-hover:scale-110 transition-transform" />
                        Lihat Dashboard User
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Modal */}
        {detailUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 px-8 py-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white">Detail User</h2>
                    <p className="text-green-100 mt-1">Informasi lengkap akun</p>
                  </div>
                  <button
                    onClick={() => setDetailUser(null)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-2xl text-white" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Profile Image */}
                {detailUser.profile_image && (
                  <div className="flex justify-center">
                    <img
                      src={detailUser.profile_image}
                      alt={detailUser.name || 'User'}
                      className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-lg"
                    />
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.name || '-'}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Panggilan</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.nickname || '-'}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <FaEnvelope className="text-green-600" /> Email
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.email}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <FaSchool className="text-green-600" /> Unit Sekolah
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.unit_sekolah || '-'}</div>
                  </div>
                </div>

                {/* ID Numbers */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <FaIdCard className="text-green-600" /> NIK
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{detailUser.nik || '-'}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <FaIdCard className="text-green-600" /> NISN
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{detailUser.nisn || '-'}</div>
                  </div>
                </div>

                {/* Role & Status */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Role Saat Ini</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{getRoleConfig(detailUser.role).label}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Role Diminta</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.requested_role || '-'}</div>
                  </div>
                </div>

                {/* Verification & Status */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Email Terverifikasi</div>
                    {detailUser.email_verified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <FaCheckCircle /> <span className="text-sm font-medium">Ya</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <FaTimesCircle /> <span className="text-sm font-medium">Belum</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Akun Aktif</div>
                    {detailUser.is_active ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <FaCheckCircle /> <span className="text-sm font-medium">Ya</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <FaTimesCircle /> <span className="text-sm font-medium">Tidak</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Status Ditolak</div>
                    {detailUser.rejected ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <FaBan /> <span className="text-sm font-medium">Ya</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaCheckCircle /> <span className="text-sm font-medium">Tidak</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {detailUser.rejected && detailUser.rejection_reason && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Alasan Penolakan</div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200 italic">{detailUser.rejection_reason}</div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <FaClock className="text-green-600" /> Terdaftar
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{new Date(detailUser.created_at).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <FaClock className="text-green-600" /> Login Terakhir
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.last_login ? new Date(detailUser.last_login).toLocaleString('id-ID') : '-'}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setDetailUser(null);
                      handleEdit(detailUser);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FaEdit /> Edit User
                  </button>
                  <button
                    onClick={() => setDetailUser(null)}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-semibold transition-all duration-200"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

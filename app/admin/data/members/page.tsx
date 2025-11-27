'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaInstagram, FaEnvelope } from 'react-icons/fa';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { apiFetch, safeJson } from '@/lib/safeFetch';

interface Sekbid {
  id: number;
  name?: string;
  nama?: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
  sekbid_id: number | null;
  sekbid?: Sekbid | null;
  photo_url: string | null;
  instagram: string | null;
  email: string | null;
  quote: string | null;
  kelas?: string | null;
  display_order: number;
  is_active: boolean;
}

export default function MembersAdminPage() {
    const { data: session, status } = useSession();
    
    // STRICT: Only super_admin, admin, osis can access admin panel
    const role = ((session?.user as any)?.role || '').toLowerCase();
    const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);
    
    // Helper: reset form to default values
    function resetForm() {
      setFormData({
        name: '',
        role: 'Anggota',
        sekbid_id: null,
        photo_url: null,
        instagram: null,
        email: null,
        quote: null,
        display_order: 0,
        is_active: true,
        class: '',
      });
      setPhotoPath(null);
    }

    // Helper: start editing a member
    function startEdit(member: Member) {
      setEditingId(member.id);
      setFormData({
        name: member.name || '',
        role: member.role || 'Anggota',
        sekbid_id: member.sekbid_id ?? null,
        photo_url: member.photo_url || null,
        instagram: member.instagram || null,
        email: member.email || null,
        quote: member.quote || null,
        display_order: member.display_order ?? 0,
        is_active: member.is_active !== false,
        class: member.kelas || '',
      });
      setPhotoPath(null);
    }
  // --- State declarations ---
  const ROLE_OPTIONS = [
    'Ketua OSIS',
    'Wakil Ketua',
    'Sekretaris',
    'Bendahara',
    'Koordinator Sekbid',
    'Anggota',
  ];
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [enableCompress, setEnableCompress] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    sekbid_id: number | null;
    photo_url: string | null;
    instagram: string | null;
    email: string | null;
    quote: string | null;
    display_order: number;
    is_active: boolean;
    class?: string | null;
  }>({
    name: '',
    role: 'Anggota',
    sekbid_id: null,
    photo_url: null,
    instagram: null,
    email: null,
    quote: null,
    display_order: 0,
    is_active: true,
    class: '',
  });
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [sekbids, setSekbids] = useState<Sekbid[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterSekbid, setFilterSekbid] = useState<string>('all');

  // --- fetchData function (defined before useEffect) ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch sekbids
      console.log('[Members Admin] Fetching sekbids...');
      const sekbidRes = await apiFetch('/api/admin/sekbid');
      if (sekbidRes.ok) {
        const sekbidData = await safeJson(sekbidRes, { url: '/api/admin/sekbid', method: 'GET' });
        console.log('[Members Admin] Fetched sekbids:', sekbidData);
        // API returns array directly, not wrapped in object
        setSekbids(Array.isArray(sekbidData) ? sekbidData : []);
      } else {
        console.error('[Members Admin] Failed to fetch sekbids:', sekbidRes.status);
      }

      // Fetch members
      let url = '/api/admin/members?include_inactive=true';
      if (filterSekbid !== 'all') {
        url += `&sekbid_id=${filterSekbid}`;
      }
      
      console.log('[Members Admin] Fetching members from:', url);
      const memberRes = await apiFetch(url);
      
      console.log('[Members Admin] Response status:', memberRes.status);
      console.log('[Members Admin] Response ok:', memberRes.ok);
      
      if (memberRes.ok) {
        const memberData = await safeJson(memberRes, { url, method: 'GET' });
        console.log('[Members Admin] Raw response:', memberData);
        console.log('[Members Admin] Members count:', memberData.members?.length || 0);
        
        // Normalize API field names
        const normalized = (memberData.members || []).map((m: any) => ({
          id: m.id,
          name: m.name ?? m.nama ?? '',
          role: m.role ?? m.jabatan ?? '',
          sekbid_id: m.sekbid_id ?? null,
          sekbid: m.sekbid ? { id: m.sekbid.id, name: m.sekbid.name ?? m.sekbid.nama ?? '' } : null,
          photo_url: m.photo_url ?? m.foto_url ?? '',
          instagram: m.instagram ?? '',
          email: m.email ?? '',
          quote: m.quote ?? m.quotes ?? '',
          display_order: m.display_order ?? m.order_index ?? 0,
          is_active: m.is_active ?? m.active ?? true,
          kelas: m.kelas ?? m.class ?? '',
        }));

        console.log('[Members Admin] Normalized members:', normalized.length);

        // Sort members
        const sorted = normalized.slice().sort((a: Member, b: Member) => {
          const aSek = a.sekbid_id === null || a.sekbid_id === undefined ? 7 : a.sekbid_id;
          const bSek = b.sekbid_id === null || b.sekbid_id === undefined ? 7 : b.sekbid_id;
          if (aSek !== bSek) return aSek - bSek;
          const aOrder = (a.display_order ?? 0) as number;
          const bOrder = (b.display_order ?? 0) as number;
          return aOrder - bOrder;
        });

        console.log('[Members Admin] Final sorted members:', sorted.length);
        setMembers(sorted);
      } else if (memberRes.status === 401) {
        console.error('[Members Admin] Unauthorized - please login');
        alert('Session expired. Please login again.');
        window.location.href = '/admin/login';
      } else if (memberRes.status === 404) {
        console.error('[Members Admin] 404 Not Found - API endpoint tidak ada');
        alert('API endpoint /api/admin/members tidak ditemukan. Periksa routing.');
        setMembers([]);
      } else {
        const error = await safeJson(memberRes, { url, method: 'GET' }).catch(() => ({ error: 'Unknown error' }));
        console.error('[Members Admin] Failed to fetch members:', memberRes.status, error);
        alert(`Gagal memuat members: ${memberRes.status} - ${error.error || 'Unknown error'}`);
        setMembers([]);
      }
    } catch (error) {
      console.error('[Members Admin] Error fetching data:', error);
      console.error('[Members Admin] Error stack:', (error as Error).stack);
      alert('Terjadi kesalahan saat memuat data: ' + (error as Error).message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [filterSekbid]);

  // Fetch data on mount and when filterSekbid changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      // Middleware already enforced role access; avoid client-side 404 redirects
      // that were causing production 404 flashes on Vercel due to hydration delay.
      fetchData();
    }
  }, [fetchData, status]);
  // ...existing code...

  // --- File upload handler (must be above onDrop) ---
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      let uploadFile = file;
      if (enableCompress && file.type.startsWith('image/')) {
        setUploadProgress(10);
        uploadFile = await compressImage(file);
        setUploadProgress(20);
      }
      
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('bucket', 'gallery');
      form.append('folder', 'members');
      
      setUploadProgress(30);
      const res = await apiFetch('/api/admin/upload', { method: 'POST', body: form });
      setUploadProgress(80);
      
      if (res.ok) {
        const result = await safeJson(res, { url: '/api/admin/upload', method: 'POST' });
        if (result.success && result.data?.publicUrl) {
          setFormData({ ...formData, photo_url: result.data.publicUrl });
          setPhotoPath(result.data.path);
          setUploadProgress(100);
          alert('✅ Upload berhasil!');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } else {
        const error = await safeJson(res, { url: '/api/admin/upload', method: 'POST' }).catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('❌ Upload gagal: ' + error.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Helper: delete a member
  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus member ini?')) return;
    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        alert('✅ Member berhasil dihapus!');
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal hapus member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Terjadi kesalahan');
    }
  };

  // Helper: delete uploaded photo
  const handleDeleteUploadedPhoto = async () => {
    if (!formData.photo_url) {
      setFormData({ ...formData, photo_url: '' });
      setPhotoPath(null);
      return;
    }
    if (!photoPath) {
      setFormData({ ...formData, photo_url: '' });
      setPhotoPath(null);
      return;
    }
    try {
      const res = await apiFetch(
        `/api/admin/upload?path=${encodeURIComponent(photoPath ?? '')}&bucket=gallery`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const j = await safeJson(res, { url: '/api/admin/upload', method: 'DELETE' }).catch(() => ({}));
        alert(j.error || 'Gagal menghapus foto dari storage');
        return;
      }
      setFormData({ ...formData, photo_url: '' });
      setPhotoPath(null);
    } catch (e) {
      console.error('Delete photo error:', e);
      alert('Terjadi kesalahan saat menghapus foto');
    }
  };

  // Helper: cancel edit/create
  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  // Dropzone hooks
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = acceptedFiles?.[0];
      if (f) handleFileUpload(f);
    },
    [handleFileUpload]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  // Render form
  // --- Render form helper ---
  const renderForm = (onSave: () => void, saveLabel: string) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Lengkap *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="John Doe"
            required
          />
        </div>

        {/* Role/Jabatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Jabatan *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Sekbid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sekbid
          </label>
          <select
            value={formData.sekbid_id ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                sekbid_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">-- Tidak ada sekbid --</option>
            {sekbids.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Urutan Tampil
          </label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({ ...formData, display_order: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="0"
            min="0"
          />
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Instagram
          </label>
          <input
            type="text"
            value={formData.instagram || ''}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="@username"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="john@example.com"
          />
        </div>

        {/* Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kelas
          </label>
          <input
            type="text"
            value={formData.class || ''}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="XII RPL 1"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Member Aktif
            </span>
          </label>
        </div>

        {/* Quote - Full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Quote / Motto
          </label>
          <textarea
            value={formData.quote || ''}
            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none resize-none"
            placeholder="Masukkan quote atau motto member..."
            rows={3}
          />
        </div>

        {/* Photo Upload - Full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Foto URL
          </label>
          <input
            type="text"
            value={formData.photo_url || ''}
            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
            placeholder="https://example.com/photo.jpg atau upload di bawah"
          />
          {/* Drag-and-drop upload zone */}
          <div
            {...getRootProps()}
            className={`mt-3 p-4 border-2 border-dashed rounded-lg text-sm cursor-pointer transition ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              {isDragActive ? (
                <p className="text-blue-600 dark:text-blue-400">📸 Lepaskan gambar di sini…</p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  🖼️ Drag & drop foto, atau <span className="text-blue-600 font-semibold">klik di sini</span>
                </p>
              )}
            </div>
          </div>
          {/* Compression toggle and manual file input */}
          <div className="mt-2 flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableCompress}
                onChange={(e) => setEnableCompress(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-700 dark:text-gray-300">Kompres otomatis (hemat data)</span>
            </label>
          </div>
          {/* Progress bar */}
          {uploading && uploadProgress > 0 && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📤 Mengupload… {uploadProgress}%
              </p>
            </div>
          )}
          {formData.photo_url ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.photo_url}
                alt="Preview foto"
                className="w-16 h-16 object-cover rounded"
              />
              <button
                type="button"
                onClick={handleDeleteUploadedPhoto}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded"
              >
                Hapus Foto
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Maks 10MB. Tipe: PNG, JPEG, WEBP, GIF.
            </p>
          )}
        </div>
        {/* ...rest of form fields and buttons... */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaSave /> {saveLabel}
          </button>
          <button
            onClick={cancelEdit}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <FaTimes /> Batal
          </button>
        </div>
      </div>
    </>
  );
  // Remove duplicate state declarations (keep only one set at the top of the component)

  // --- compressImage helper ---
  const compressImage = async (file: File, maxW = 1600, maxH = 1600, quality = 0.82): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, w, h);
        const targetType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Gagal kompres gambar'));
          // Convert Blob to File
          const compressedFile = new File([blob], file.name, { type: targetType });
          resolve(compressedFile);
        }, targetType, quality);
      };
      img.onerror = (e) => reject(new Error('Gagal memuat gambar untuk kompresi'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        img.src = ev.target?.result as string;
      };
      reader.onerror = (e) => reject(new Error('Gagal membaca file untuk kompresi'));
      reader.readAsDataURL(file);
    });
  };

  // --- handleCreate: pindahkan ke luar fetchData ---
  const handleCreate = async () => {
    try {
      // Keep role clean without sekbid reference
      // Sekbid relationship is stored separately in sekbid_id field
      const effectiveRole = formData.role || 'Anggota';

      const payload = {
        name: formData.name,
        role: effectiveRole,
        sekbid_id: formData.sekbid_id ?? null,
        photo_url: formData.photo_url ?? null,
        instagram: formData.instagram ?? null,
        class: formData.class ?? null,
        quote: formData.quote ?? null,
        display_order: formData.display_order ?? 0,
        is_active: formData.is_active !== false,
      };

      const res = await apiFetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchData();
        setIsCreating(false);
        resetForm();
        alert('✅ Member berhasil ditambahkan!');
      } else {
        const error = await safeJson(res, { url: '/api/admin/members', method: 'POST' }).catch(() => ({ error: 'Gagal membuat member' }));
        alert(error.error || 'Gagal membuat member');
      }
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Terjadi kesalahan');
    }
  };

  // --- Tambahkan implementasi handleUpdate di bawah ini jika diperlukan ---
  const handleUpdate = async (id: number) => {
    try {
      // Keep role clean without sekbid reference
      // Sekbid relationship is stored separately in sekbid_id field
      const effectiveRole = formData.role || 'Anggota';

      const payload = {
        name: formData.name,
        role: effectiveRole,
        sekbid_id: formData.sekbid_id ?? null,
        photo_url: formData.photo_url ?? null,
        instagram: formData.instagram ?? null,
        class: formData.class ?? null,
        quote: formData.quote ?? null,
        display_order: formData.display_order ?? 0,
        is_active: formData.is_active !== false,
      };

      const res = await apiFetch(`/api/admin/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchData();
        setEditingId(null);
        resetForm();
        alert('✅ Member berhasil diupdate!');
      } else {
        const error = await safeJson(res, { url: `/api/admin/members/${id}`, method: 'PUT' }).catch(() => ({ error: 'Gagal update member' }));
        alert('❌ ' + (error.error || 'Gagal update member'));
      }
    } catch (error) {
      console.error('Error updating member:', error);
      alert('❌ Terjadi kesalahan saat update');
    }
  };

  // --- UI rendering ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kelola semua anggota OSIS dan Sekbid
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaPlus /> Tambah Member
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Sekbid
        </label>
        <select
          value={filterSekbid}
          onChange={(e) => setFilterSekbid(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Semua</option>
          <option value="null">Pengurus Inti (Tanpa Sekbid)</option>
          {sekbids.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name ?? s.nama}
            </option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border-2 border-green-500">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Tambah Member Baru</h3>
          {renderForm(handleCreate, 'Simpan')}
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
              editingId === member.id ? 'border-2 border-blue-500' : ''
            }`}
          >
            {editingId === member.id ? (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Member</h3>
                {renderForm(() => handleUpdate(member.id), 'Update')}
              </div>
            ) : (
              <>
                {/* Photo */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                    {member.photo_url ? (
                    // Prefer native <img> for external SVG avatars (ui-avatars) to avoid Next/Image SVG handling
                    (member.photo_url.includes('ui-avatars.com') || member.photo_url.endsWith('.svg')) ? (
                      // plain img for SVG or ui-avatars
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl text-white">👤</div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {member.name}
                      </h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {(() => {
                              // If member has a sekbid but the stored role is just 'Anggota',
                              // show a computed label to keep the UI consistent even if DB is out-of-sync.
                              try {
                                const r = member.role ?? '';
                                if (member.sekbid && /^\s*Anggota\s*$/i.test(String(r))) {
                                  const label = member.sekbid.name ?? member.sekbid.nama ?? `Sekbid ${member.sekbid.id}`;
                                  return `Anggota ${label}`;
                                }
                              } catch (e) {
                                // fall back to raw role
                              }
                              return member.role;
                            })()}
                          </p>
                    </div>
                    {!member.is_active && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                        Nonaktif
                      </span>
                    )}
                  </div>

                  {member.sekbid && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {member.sekbid.name ?? member.sekbid.nama}
                    </p>
                  )}

                  {member.quote && (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-3">
                      "{member.quote}"
                    </p>
                  )}

                  <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {member.instagram && (
                      <a
                        href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-pink-600"
                      >
                        <FaInstagram /> {member.instagram}
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <FaEnvelope />
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2 border-t dark:border-gray-700 pt-4">
                    <button
                      onClick={() => startEdit(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                    >
                      <FaTrash /> Hapus
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Belum ada member. Klik "Tambah Member" untuk membuat yang baru.
        </div>
      )}
    </div>
  );
}

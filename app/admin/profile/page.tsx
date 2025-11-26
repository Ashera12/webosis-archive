'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaCamera, FaSave, FaTimes, FaIdCard, FaSchool, FaUserTag } from 'react-icons/fa';
import { useToast } from '@/contexts/ToastContext';
import RoleBadge from '@/components/RoleBadge';
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    nisn: '',
    unit: '',
    kelas: '',
    photo_url: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadUserProfile();
    }
  }, [session]);

  const loadUserProfile = async () => {
    try {
      const res = await fetch(`/api/admin/users/${session?.user?.id}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      if (data.success) {
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          username: data.data.username || '',
          nisn: data.data.nisn || '',
          unit: data.data.unit || '',
          kelas: data.data.kelas || '',
          photo_url: data.data.profile_image || data.data.photo_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File terlalu besar! Maksimal 5MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar!', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'profile-photos');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      if (data.success && data.publicUrl) {
        setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
        showToast('Foto berhasil diupload!', 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Gagal upload foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          nisn: formData.nisn,
          unit: formData.unit,
          kelas: formData.kelas,
          profile_image: formData.photo_url,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();

      if (data.success) {
        showToast('Profil berhasil diperbarui!', 'success');
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
            image: formData.photo_url,
          },
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('Gagal memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Password baru tidak cocok!', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('Password minimal 8 karakter!', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      });

      if (!res.ok) throw new Error('Failed to change password');
      const data = await res.json();

      if (data.success) {
        showToast('Password berhasil diubah!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToast('Gagal mengubah password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {formData.photo_url ? (
                <Image
                  src={formData.photo_url}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                formData.name.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formData.name || 'User'}
              </h1>
              <RoleBadge role={session.user.role} size="md" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">{formData.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informasi Pribadi</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaUser /> Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
              disabled
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email tidak dapat diubah</p>
          </div>

          {/* Username */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaUserTag /> Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* NISN */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaIdCard /> NISN
            </label>
            <input
              type="text"
              value={formData.nisn}
              onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaSchool /> Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Pilih Unit</option>
              <option value="SMK">SMK</option>
              <option value="SMP">SMP</option>
              <option value="SD">SD</option>
            </select>
          </div>

          {/* Kelas */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaSchool /> Kelas
            </label>
            <input
              type="text"
              value={formData.kelas}
              onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
              placeholder="Contoh: XII RPL 1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <FaSave /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <FaTimes /> Batal
          </button>
        </div>
      </form>

      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ubah Password</h2>
          <button
            type="button"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            {showPasswordForm ? 'Tutup' : 'Ubah Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaLock /> Password Baru
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimal 8 karakter</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaLock /> Konfirmasi Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <FaLock /> {loading ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

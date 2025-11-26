'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaCamera, FaSave, FaTimes, FaIdCard, FaSchool, FaUserTag, FaSpinner } from 'react-icons/fa';
import { useToast } from '@/contexts/ToastContext';
import RoleBadge from '@/components/RoleBadge';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const ImageCropperModal = dynamic(() => import('@/components/ImageCropperModal'), { ssr: false });

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    nisn: '',
    nik: '',
    unit: '',
    kelas: '',
    instagram_username: '',
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
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      if (data.success) {
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          username: data.data.username || '',
          nisn: data.data.nisn || '',
          nik: data.data.nik || '',
          unit: data.data.unit || '',
          kelas: data.data.kelas || '',
          instagram_username: data.data.instagram_username || '',
          photo_url: data.data.profile_image || data.data.photo_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ File terlalu besar! Maksimal 5MB', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('❌ File harus berupa gambar!', 'error');
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      setTempImageSrc(objectUrl);
      setShowCropper(true);
      showToast('⏳ Siapkan pemotongan gambar…', 'info');
    } catch (error) {
      console.error('Photo select error:', error);
      showToast('❌ Gagal memproses gambar untuk cropping', 'error');
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setUploading(true);
    showToast('⏳ Mengunggah foto profil…', 'info');

    const fd = new FormData();
    fd.append('file', croppedBlob, 'profile.jpg');
    fd.append('folder', 'profile-photos');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      if (data.success && data.publicUrl) {
        setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
        showToast('✅ Foto berhasil diunggah!', 'success');
      } else {
        showToast('❌ Respons unggah tidak valid', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('❌ Gagal mengunggah foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          nisn: formData.nisn,
          nik: formData.nik,
          unit: formData.unit,
          kelas: formData.kelas,
          instagram_username: formData.instagram_username,
          profile_image: formData.photo_url,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();

      if (data.success) {
        showToast('✅ Profil berhasil diperbarui!', 'success');
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
      showToast('❌ Gagal memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('❌ Password baru tidak cocok!', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('❌ Password minimal 8 karakter!', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      });

      if (!res.ok) throw new Error('Failed to change password');
      const data = await res.json();

      if (data.success) {
        showToast('✅ Password berhasil diubah!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToast('❌ Gagal mengubah password', 'error');
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
    <>
    {showCropper && (
      <ImageCropperModal
      imageSrc={tempImageSrc}
      onCancel={() => {
        setShowCropper(false);
        setTempImageSrc('');
      }}
      onCropComplete={handleCropComplete}
      aspectRatio={1}
    />
    )}
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-3xl font-bold">
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
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <FaSpinner className="animate-spin text-white text-2xl" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white p-2 rounded-full cursor-pointer shadow-lg disabled:opacity-60">
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
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
            {uploading && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Mengunggah foto…</p>
            )}
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
              <FaIdCard /> NISN (10 digit)
            </label>
            <input
              type="text"
              value={formData.nisn}
              onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              maxLength={10}
              placeholder="10 digit"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* NIK */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FaIdCard /> NIK (16 digit)
            </label>
            <input
              type="text"
              value={formData.nik}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              maxLength={16}
              placeholder="16 digit"
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

          {/* Instagram Username */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </label>
            <input
              type="text"
              value={formData.instagram_username}
              onChange={(e) => {
                const value = e.target.value.replace('@', '');
                setFormData({ ...formData, instagram_username: value });
              }}
              placeholder="username (tanpa @)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Username Instagram tanpa simbol @</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
          >
            <FaSave /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
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
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
            >
              <FaLock /> {loading ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>
        )}
      </div>
    </div>
    </>
  );
}

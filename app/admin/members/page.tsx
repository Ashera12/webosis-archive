'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaUserGraduate, FaFolder, FaImage, FaInstagram, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ImageUploadField from '@/components/ImageUploadField';

interface Member {
  id: number;
  name: string;
  role: string;
  sekbid_id: number | null;
  sekbid?: { name: string; color?: string; icon?: string };
  email?: string;
  phone?: string;
  photo_url?: string;
  class?: string;
  instagram?: string;
  quote?: string;
  display_order?: number;
  is_active?: boolean;
}

interface Sekbid {
  id: number;
  name: string;
  color?: string;
}

export default function AdminMembersPage() {
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [sekbids, setSekbids] = useState<Sekbid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    sekbid_id: null as number | null,
    email: '',
    phone: '',
    photo_url: '',
    class: '',
    instagram: '',
    quote: '',
    display_order: 0,
    is_active: true
  });

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, sekbidsRes] = await Promise.all([
        fetch('/api/admin/members'),
        fetch('/api/admin/sekbid')
      ]);
      
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || data || []);
      }
      
      if (sekbidsRes.ok) {
        const data = await sekbidsRes.json();
        setSekbids(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  const handleEdit = (member: Member) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      sekbid_id: member.sekbid_id,
      email: member.email || '',
      phone: member.phone || '',
      photo_url: member.photo_url || '',
      class: member.class || '',
      instagram: member.instagram || '',
      quote: member.quote || '',
      display_order: member.display_order || 0,
      is_active: member.is_active !== undefined ? member.is_active : true
    });
    setShowForm(true);
  };

  const handleImageChange = async (imageUrl: string, file: File) => {
    setUploading(true);
    setUploadProgress(0);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('bucket', 'gallery');
    formDataUpload.append('folder', 'members');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.publicUrl) {
        setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
        toast.success('Foto berhasil diupload!');
      } else {
        throw new Error('Invalid upload response');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload foto');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editingId ? 'Memperbarui...' : 'Menyimpan...');
    try {
      const url = editingId 
        ? `/api/admin/members/${editingId}` 
        : '/api/admin/members';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save');
      
      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ 
        name: '', 
        role: '', 
        sekbid_id: null, 
        email: '', 
        phone: '', 
        photo_url: '', 
        class: '', 
        instagram: '', 
        quote: '', 
        display_order: 0, 
        is_active: true 
      });
      toast.success(editingId ? 'Anggota berhasil diperbarui!' : 'Anggota berhasil ditambahkan!', { id: toastId });
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Gagal menyimpan anggota', { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus anggota ini?')) return;
    const toastId = toast.loading('Menghapus...');
    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
      toast.success('Anggota berhasil dihapus!', { id: toastId });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Gagal menghapus anggota', { id: toastId });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaUserGraduate className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Manajemen Anggota
                </h1>
                <p className="text-slate-500 text-sm mt-1">Kelola data anggota OSIS dengan lengkap</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ 
                  name: '', 
                  role: '', 
                  sekbid_id: null, 
                  email: '', 
                  phone: '', 
                  photo_url: '', 
                  class: '', 
                  instagram: '', 
                  quote: '', 
                  display_order: 0, 
                  is_active: true 
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FaPlus /> Tambah Anggota
            </button>
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {editingId ? <FaEdit /> : <FaPlus />}
                  {editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Photo Upload with Crop */}
                <div className="col-span-2">
                  <ImageUploadField
                    label="Foto Anggota"
                    currentImage={formData.photo_url}
                    onImageChange={handleImageChange}
                    onImageRemove={handleImageRemove}
                    aspectRatio={1}
                    suggestedRatios={[
                      { label: '1:1 (Profil)', value: 1 },
                      { label: '4:3', value: 4 / 3 },
                      { label: 'Free', value: 0 },
                    ]}
                  />
                  {uploading && (
                    <div className="mt-3">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 text-center">Mengupload... {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                {/* Info Helper */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-4 rounded-lg">
                  <div className="flex gap-3">
                    <div className="text-purple-600 text-xl">ℹ️</div>
                    <div className="text-sm text-slate-700">
                      <p className="font-semibold mb-1">Panduan Pengisian:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Tim Inti</strong> (Ketua, Wakil, Sekretaris, Bendahara) → Sekbid otomatis kosong</li>
                        <li>• <strong>Koordinator/Ketua Sekbid</strong> → Pilih Sekbid yang dipimpin</li>
                        <li>• <strong>Anggota</strong> → Pilih Sekbid yang diikuti</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      placeholder="Contoh: Ahmad Rifai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Jabatan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({ 
                          ...formData, 
                          role: newRole,
                          // Auto set sekbid_id null untuk Tim Inti
                          sekbid_id: ['Ketua OSIS', 'Wakil Ketua', 'Sekretaris', 'Bendahara'].includes(newRole) 
                            ? null 
                            : formData.sekbid_id
                        });
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      required
                    >
                      <option value="">Pilih Jabatan</option>
                      <optgroup label="🎯 Tim Inti (Pengurus Inti)">
                        <option value="Ketua OSIS">Ketua OSIS</option>
                        <option value="Wakil Ketua">Wakil Ketua</option>
                        <option value="Sekretaris">Sekretaris</option>
                        <option value="Bendahara">Bendahara</option>
                      </optgroup>
                      <optgroup label="👥 Koordinator Sekbid">
                        <option value="Koordinator Sekbid">Koordinator Sekbid</option>
                        <option value="Ketua Sekbid">Ketua Sekbid</option>
                        <option value="Wakil Ketua Sekbid">Wakil Ketua Sekbid</option>
                      </optgroup>
                      <optgroup label="👤 Anggota">
                        <option value="Anggota">Anggota</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Seksi Bidang
                      {['Ketua OSIS', 'Wakil Ketua', 'Sekretaris', 'Bendahara'].includes(formData.role) && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">(Otomatis kosong untuk Tim Inti)</span>
                      )}
                    </label>
                    <select
                      value={formData.sekbid_id || ''}
                      onChange={(e) => setFormData({ ...formData, sekbid_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      disabled={['Ketua OSIS', 'Wakil Ketua', 'Sekretaris', 'Bendahara'].includes(formData.role)}
                    >
                      <option value="">
                        {['Ketua OSIS', 'Wakil Ketua', 'Sekretaris', 'Bendahara'].includes(formData.role) 
                          ? 'Tim Inti (Tidak ada Sekbid)' 
                          : 'Pilih Sekbid (Opsional)'}
                      </option>
                      {sekbids.map(sekbid => (
                        <option key={sekbid.id} value={sekbid.id}>{sekbid.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      placeholder="Contoh: XII IPA 1"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <FaEnvelope className="text-purple-500" /> Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      placeholder="ahmad@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      placeholder="0812-3456-7890"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <FaInstagram className="text-purple-500" /> Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Quote / Motto
                  </label>
                  <textarea
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-medium text-slate-900 resize-none"
                    placeholder="Masukkan quote atau motto pribadi..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Anggota Aktif
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave /> {editingId ? 'Update' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-xl border border-slate-200 p-16 text-center">
              <FaUsers className="mx-auto text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium text-lg">Belum ada data anggota</p>
              <p className="text-slate-400 text-sm mt-1">Klik tombol "Tambah Anggota" untuk memulai</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all group">
                {/* Photo */}
                <div className="relative h-64 bg-gradient-to-br from-purple-100 to-purple-50 overflow-hidden">
                  {member.photo_url ? (
                    <img 
                      src={member.photo_url} 
                      alt={member.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUserGraduate className="text-6xl text-purple-300" />
                    </div>
                  )}
                  {/* Badge Sekbid */}
                  {member.sekbid?.name && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-lg text-xs font-bold text-purple-700 border border-purple-200">
                        <FaFolder /> {member.sekbid.name}
                      </span>
                    </div>
                  )}
                  {/* Status Badge */}
                  {member.is_active === false && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                        Tidak Aktif
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="text-purple-600 font-semibold text-sm">{member.role}</p>
                  </div>

                  {member.class && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {member.class}
                    </div>
                  )}

                  {member.quote && (
                    <p className="text-slate-600 text-sm italic border-l-4 border-purple-300 pl-3 py-1">
                      "{member.quote}"
                    </p>
                  )}

                  <div className="pt-2 space-y-1.5 text-sm">
                    {member.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <FaEnvelope className="text-purple-500" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.instagram && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <FaInstagram className="text-purple-500" />
                        <span>{member.instagram}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 px-4 py-2.5 bg-purple-50 text-purple-700 font-semibold rounded-lg hover:bg-purple-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2"
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
    </div>
  );
}

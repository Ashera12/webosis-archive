"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaCheckCircle, FaClock, FaEnvelope } from 'react-icons/fa';

export default function WaitingApprovalPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (status === 'loading') return;
      
      // If already logged in (approved), redirect to admin
      if (session?.user) {
        window.location.href = '/admin';
        return;
      }

      // Try to get user info from email in query or session
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      
      if (email) {
        setUserData({ email });
      }
      
      setLoading(false);
    }

    checkStatus();
  }, [session, status]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-2xl border border-blue-200/60 dark:border-blue-800/40 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-center mb-3">
            <div className="p-4 bg-white/20 rounded-full">
              <FaClock className="text-5xl text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white text-center">
            Menunggu Persetujuan Admin
          </h1>
          <p className="text-blue-100 text-center mt-2">
            Email Anda sudah terverifikasi
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FaCheckCircle className="text-3xl text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  Email Berhasil Diverifikasi!
                </h2>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Terima kasih telah memverifikasi email Anda. Akun Anda sekarang menunggu persetujuan dari admin.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {userData?.email && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-blue-600 dark:text-blue-400 text-xl" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Email Terdaftar</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{userData.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Langkah Selanjutnya:</h3>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span>Admin akan meninjau pendaftaran Anda dan menyetujui akun dalam waktu 1-2 hari kerja.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <span>Anda akan menerima notifikasi email saat akun Anda disetujui.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <span>Setelah disetujui, Anda dapat login menggunakan email dan password yang sudah didaftarkan.</span>
              </li>
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Penting:</strong> Jangan mencoba login sebelum admin menyetujui akun Anda. Anda akan menerima pesan error jika mencoba login sebelum disetujui.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/admin/login"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ke Halaman Login
            </a>
          </div>

          {/* Support */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
            Mengalami masalah? Hubungi admin melalui email atau kontak yang tersedia.
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaTools, FaDatabase, FaSync, FaTrash, FaFileExport, FaFileImport, FaCheckCircle } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

// Force dynamic rendering - prevent static optimization issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ToolsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportTables, setExportTables] = useState<string[]>(['members', 'events', 'gallery', 'posts']);

  if (status === 'unauthenticated') {
    redirect('/admin/login');
  }

  const runExport = async () => {
    setLoading('Export Data');
    setResult(null);
    setShowExportDialog(false);
    
    try {
      const response = await fetch('/api/admin/tools/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: exportFormat, tables: exportTables }),
      });

      if (!response.ok) throw new Error('Export failed');

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setResult(`✅ Export berhasil! File telah didownload.`);
    } catch (error: any) {
      setResult(`❌ Export gagal: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const runTool = async (toolName: string, endpoint: string, method: string = 'POST') => {
    if (!confirm(`Yakin ingin menjalankan ${toolName}?`)) return;
    
    setLoading(toolName);
    setResult(null);
    
    try {
      const response = await apiFetch(endpoint, { method });
      const data = await safeJson(response, { url: endpoint, method }).catch(() => ({ message: 'Non-JSON response' }));

      if (!response.ok) throw new Error(data.message || 'Failed');

      setResult(`✅ ${toolName} berhasil: ${data.message || 'Success'}`);
    } catch (error: any) {
      setResult(`❌ ${toolName} gagal: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const tools = [
    {
      name: 'Sync Data',
      description: 'Sinkronisasi data dari sumber eksternal',
      icon: <FaSync className="w-8 h-8" />,
      action: () => runTool('Sync Data', '/api/admin/tools/sync'),
      gradient: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      name: 'Clear Cache',
      description: 'Hapus semua cache untuk refresh data',
      icon: <FaTrash className="w-8 h-8" />,
      action: () => runTool('Clear Cache', '/api/admin/tools/clear-cache'),
      gradient: 'from-orange-500 to-amber-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900'
    },
    {
      name: 'Database Backup',
      description: 'Buat backup database',
      icon: <FaDatabase className="w-8 h-8" />,
      action: () => runTool('Database Backup', '/api/admin/tools/backup'),
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900'
    },
    {
      name: 'Export Data',
      description: 'Export data ke format JSON/CSV',
      icon: <FaFileExport className="w-8 h-8" />,
      action: () => setShowExportDialog(true),
      gradient: 'from-purple-500 to-violet-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      name: 'Import Data',
      description: 'Import data dari file',
      icon: <FaFileImport className="w-8 h-8" />,
      action: () => runTool('Import Data', '/api/admin/tools/import'),
      gradient: 'from-indigo-500 to-blue-600',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900'
    },
    {
      name: 'Health Check',
      description: 'Cek kesehatan sistem',
      icon: <FaCheckCircle className="w-8 h-8" />,
      action: () => runTool('Health Check', '/api/admin/tools/health', 'GET'),
      gradient: 'from-teal-500 to-cyan-600',
      iconBg: 'bg-teal-100 dark:bg-teal-900'
    }
  ];

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageShell
      icon={<FaTools className="w-8 h-8" />}
      title="Admin Tools"
      subtitle="Utilitas dan tools untuk maintenance sistem"
      gradient="from-orange-600 to-red-600"
    >
      {result && (
        <div className={`p-4 rounded-2xl shadow-lg ${
          result.startsWith('✅') 
            ? 'bg-green-50 border-2 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200' 
            : 'bg-red-50 border-2 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
        }`}>
          <p className="font-semibold">{result}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-transparent"
          >
            <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />
            <div className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-2xl ${tool.iconBg} text-gray-700 dark:text-gray-200 group-hover:scale-110 transition-transform duration-300`}>
                  {tool.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {tool.description}
                  </p>
                </div>
                <button
                  onClick={tool.action}
                  disabled={loading !== null}
                  className={`w-full px-6 py-3 bg-gradient-to-r ${tool.gradient} text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                >
                  {loading === tool.name ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    'Run Tool'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <FaFileExport className="text-purple-600" />
              Export Data
            </h3>

            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {['json', 'csv'].map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt as any)}
                      className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                        exportFormat === fmt
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Pilih Data</label>
                <div className="grid grid-cols-2 gap-3">
                  {['members', 'events', 'gallery', 'posts', 'announcements', 'polls', 'proker', 'sekbid'].map(table => (
                    <button
                      key={table}
                      type="button"
                      onClick={() => {
                        setExportTables(prev =>
                          prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
                        );
                      }}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                        exportTables.includes(table)
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {table.charAt(0).toUpperCase() + table.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={runExport}
                  disabled={exportTables.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download {exportFormat.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6 shadow-lg">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center space-x-2 text-lg">
          <span>⚠️</span>
          <span>Peringatan</span>
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2 list-disc list-inside">
          <li>Gunakan tools ini dengan hati-hati</li>
          <li>Beberapa operasi tidak dapat di-undo</li>
          <li>Pastikan backup data sebelum menjalankan operasi destructive</li>
          <li>Jalankan hanya saat diperlukan untuk maintenance</li>
        </ul>
      </div>
    </AdminPageShell>
  );
}

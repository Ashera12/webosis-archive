'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { FaTools, FaDatabase, FaSync, FaTrash, FaFileExport, FaFileImport, FaCheckCircle } from 'react-icons/fa';

export default function ToolsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (status === 'unauthenticated') {
    redirect('/admin/login');
  }

  const runTool = async (toolName: string, endpoint: string, method: string = 'POST') => {
    if (!confirm(`Yakin ingin menjalankan ${toolName}?`)) return;
    
    setLoading(toolName);
    setResult(null);
    
    try {
      const response = await fetch(endpoint, { method });
      const data = await response.json();
      
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
      icon: <FaSync className="text-3xl text-blue-600" />,
      action: () => runTool('Sync Data', '/api/admin/tools/sync'),
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Clear Cache',
      description: 'Hapus semua cache untuk refresh data',
      icon: <FaTrash className="text-3xl text-orange-600" />,
      action: () => runTool('Clear Cache', '/api/admin/tools/clear-cache'),
      color: 'bg-orange-50 border-orange-200'
    },
    {
      name: 'Database Backup',
      description: 'Buat backup database',
      icon: <FaDatabase className="text-3xl text-green-600" />,
      action: () => runTool('Database Backup', '/api/admin/tools/backup'),
      color: 'bg-green-50 border-green-200'
    },
    {
      name: 'Export Data',
      description: 'Export data ke format JSON/CSV',
      icon: <FaFileExport className="text-3xl text-purple-600" />,
      action: () => runTool('Export Data', '/api/admin/tools/export'),
      color: 'bg-purple-50 border-purple-200'
    },
    {
      name: 'Import Data',
      description: 'Import data dari file',
      icon: <FaFileImport className="text-3xl text-indigo-600" />,
      action: () => runTool('Import Data', '/api/admin/tools/import'),
      color: 'bg-indigo-50 border-indigo-200'
    },
    {
      name: 'Health Check',
      description: 'Cek kesehatan sistem',
      icon: <FaCheckCircle className="text-3xl text-teal-600" />,
      action: () => runTool('Health Check', '/api/admin/tools/health', 'GET'),
      color: 'bg-teal-50 border-teal-200'
    }
  ];

  if (status === 'loading') {
    return (
      <div className="ds-container p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-container p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaTools className="text-3xl text-blue-600" />
        <div>
          <h1 className="ds-heading">Admin Tools</h1>
          <p className="text-sm text-gray-600">Utilitas dan tools untuk maintenance sistem</p>
        </div>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-lg ${result.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          <p className="font-medium">{result}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className={`${tool.color} border rounded-lg p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div>{tool.icon}</div>
              <div>
                <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
              </div>
              <button
                onClick={tool.action}
                disabled={loading !== null}
                className="w-full px-4 py-2 bg-white border-2 border-current rounded-lg font-semibold hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === tool.name ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processing...
                  </span>
                ) : (
                  'Run Tool'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-bold text-yellow-800 mb-2">⚠️ Peringatan</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Gunakan tools ini dengan hati-hati</li>
          <li>Beberapa operasi tidak dapat di-undo</li>
          <li>Pastikan backup data sebelum menjalankan operasi destructive</li>
          <li>Jalankan hanya saat diperlukan untuk maintenance</li>
        </ul>
      </div>
    </div>
  );
}

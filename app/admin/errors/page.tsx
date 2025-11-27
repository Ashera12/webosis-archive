'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaBug, FaRobot, FaCheck, FaExclamationTriangle, FaCode, FaSync } from 'react-icons/fa';

// Force dynamic rendering - prevent static optimization issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ErrorLog {
  id: string;
  error_type: string;
  url: string;
  method: string;
  status_code: number;
  error_message: string;
  error_stack: string;
  created_at: string;
  fix_status: string;
  ai_analysis: any;
}

export default function ErrorMonitoringPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/admin/errors');
      const j = await safeJson(r, { url: '/api/admin/errors', method: 'GET' });
      
      if (j.setupRequired) {
        setSetupRequired(true);
        setErrors([]);
      } else {
        setSetupRequired(false);
        setErrors(j.errors || []);
      }
    } catch (e) {
      console.error('Failed to load errors:', e);
    } finally {
      setLoading(false);
    }
  };

  const analyzeError = async (errorLog: ErrorLog) => {
    if (!confirm('Analyze error dengan AI? Ini akan menggunakan OpenAI API.')) return;
    setAnalyzing(errorLog.id);
    try {
      const r = await apiFetch('/api/admin/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId: errorLog.id, errorData: errorLog }),
      });
      const j = await safeJson(r, { url: '/api/admin/errors', method: 'POST' }).catch(() => ({}));
      if (r.ok) {
        alert('✅ AI analysis complete! Refresh untuk melihat fix suggestions.');
        await loadErrors();
      } else {
        alert('❌ Analysis failed: ' + JSON.stringify(j));
      }
    } catch (e) {
      alert('Error: ' + String(e));
    } finally {
      setAnalyzing(null);
    }
  };

  const applyFix = async (errorId: string, fixIndex: number) => {
    if (!confirm('Apply fix suggestion? Ini akan mengubah code.')) return;
    setFixing(errorId);
    try {
      const r = await apiFetch('/api/admin/errors/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId, fixIndex }),
      });
      const j = await safeJson(r, { url: '/api/admin/errors/fix', method: 'POST' }).catch(() => ({}));
      if (r.ok && j.ok) {
        alert('✅ Fix applied! Output:\n' + j.output);
        await loadErrors();
      } else {
        alert('❌ Fix failed:\n' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      alert('Error: ' + String(e));
    } finally {
      setFixing(null);
    }
  };

  useEffect(() => {
    loadErrors();
  }, []);

  return (
    <div className="ds-container space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8 rounded-2xl shadow-xl text-white">
        <h1 className="ds-heading flex items-center gap-3">
          <FaBug /> Error Monitoring & AI Auto-Fix
        </h1>
        <p className="ds-subtle">Sistem otomatis mendeteksi error, analisa dengan AI, dan suggest/apply fix.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-500" />
              Recent Errors
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {errors.length} error(s) detected
            </p>
          </div>
          <button
            onClick={loadErrors}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {setupRequired ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-4xl flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-3">
                  Database Setup Required
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Table <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded text-sm font-mono">error_logs</code> belum ada di database Supabase.
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Setup:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                    <li>Pilih project Anda</li>
                    <li>Klik <strong>SQL Editor</strong> di sidebar</li>
                    <li>Klik <strong>New Query</strong></li>
                    <li>Copy SQL dari file <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">create_error_logs_table.sql</code></li>
                    <li>Paste dan klik <strong>Run</strong></li>
                  </ol>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open('/ERROR_LOGS_SETUP_GUIDE.md', '_blank')}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium"
                  >
                    📖 Lihat Panduan Lengkap
                  </button>
                  <button
                    onClick={loadErrors}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                  >
                    ✓ Sudah Setup, Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSync className="animate-spin text-4xl text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading errors...</span>
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-12">
            <FaCheck className="text-6xl text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No errors detected!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your application is running smoothly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {errors.map((err) => (
              <div
                key={err.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        err.status_code >= 500 ? 'bg-red-100 text-red-800' :
                        err.status_code >= 400 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {err.status_code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(err.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {err.error_type}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {err.method} {err.url}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {err.error_message}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!err.ai_analysis ? (
                      <button
                        onClick={() => analyzeError(err)}
                        disabled={analyzing === err.id}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition disabled:opacity-50"
                      >
                        <FaRobot className={analyzing === err.id ? 'animate-spin' : ''} />
                        {analyzing === err.id ? 'Analyzing...' : 'Analyze'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 text-sm rounded-lg">
                        <FaCheck /> Analyzed
                      </span>
                    )}
                  </div>
                </div>

                {err.ai_analysis && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FaRobot className="text-purple-600" />
                      AI Analysis & Suggestions
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Root Cause:</strong> {err.ai_analysis.root_cause}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Severity:</strong> <span className="capitalize">{err.ai_analysis.severity}</span>
                      </p>
                    </div>
                    {err.ai_analysis.suggestions?.length > 0 && (
                      <div className="space-y-2">
                        {err.ai_analysis.suggestions.map((suggestion: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {suggestion.action}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {suggestion.details}
                              </p>
                            </div>
                            {err.fix_status !== 'applied' && (
                              <button
                                onClick={() => applyFix(err.id, idx)}
                                disabled={fixing === err.id}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition disabled:opacity-50"
                              >
                                {fixing === err.id ? 'Applying...' : 'Apply'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {err.error_stack && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Show Stack Trace
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
                      {err.error_stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

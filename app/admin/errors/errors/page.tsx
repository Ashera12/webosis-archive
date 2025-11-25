'use client';

import React, { useState, useEffect } from 'react';
import { FaBug, FaRobot, FaCheck, FaExclamationTriangle, FaCode, FaSync } from 'react-icons/fa';

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

  const loadErrors = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/errors');
      const j = await r.json();
      setErrors(j.errors || []);
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
      const r = await fetch('/api/admin/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId: errorLog.id, errorData: errorLog }),
      });
      const j = await r.json();
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
      const r = await fetch('/api/admin/errors/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId, fixIndex }),
      });
      const j = await r.json();
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

      <div className="p-6">
        <h2 className="ds-heading">Recent Errors</h2>
        <p className="ds-subtle">Error monitoring UI (backup)</p>
      </div>
    </div>
  );
}

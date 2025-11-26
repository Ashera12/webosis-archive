'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ImageUploadField from '@/components/ImageUploadField';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaCog, FaRobot, FaDatabase, FaPalette, FaEye, FaSave, FaChevronDown, FaChevronUp, FaKey, FaTools, FaDownload, FaImage, FaTint, FaMagic, FaCopy, FaSun, FaMoon } from 'react-icons/fa';
import AdminPageShell from '@/components/admin/AdminPageShell';

interface EnvSetting {
  key: string;
  label: string;
  secret: boolean;
  description: string;
}

// Preset beautiful gradients
const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Cool Blues', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Cosmic', value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)' },
  { name: 'Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
];

const SETTINGS_GROUPS = {
  ai: {
    title: 'AI & Automation',
    icon: <FaRobot className="w-5 h-5" />,
    color: 'from-purple-600 to-indigo-600',
    settings: [
      { key: 'GEMINI_API_KEY', label: 'Google Gemini API Key (AIza...)', secret: true, description: '🔑 Paste Gemini key here - must start with AIza' },
      { key: 'OPENAI_API_KEY', label: 'OpenAI API Key (sk-proj...)', secret: true, description: '🔑 Paste OpenAI key here - must start with sk- or sk-proj-' },
      { key: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude API Key (sk-ant...)', secret: true, description: '🔑 Paste Claude key here - must start with sk-ant-' },
      { key: 'HUGGINGFACE_API_KEY', label: 'HuggingFace API Key (hf_...)', secret: true, description: '🔑 Token HuggingFace Read (https://huggingface.co/settings/tokens) - harus mulai hf_' },
      { key: 'GEMINI_MODEL', label: 'Gemini Model', secret: false, description: 'models/gemini-1.5-flash (default) | models/gemini-1.5-pro' },
      { key: 'OPENAI_MODEL', label: 'OpenAI Model', secret: false, description: 'gpt-4o-mini | gpt-4o | gpt-4-turbo' },
      { key: 'HUGGINGFACE_MODEL', label: 'HuggingFace Model', secret: false, description: 'black-forest-labs/FLUX.1-schnell (default) | black-forest-labs/FLUX.1-dev' },
      { key: 'AUTO_EXECUTE_MODE', label: 'Auto Execute Mode', secret: false, description: 'off | delay | auto' },
      { key: 'AUTO_EXECUTE_DELAY_MINUTES', label: 'Auto Execute Delay', secret: false, description: 'Delay dalam menit' },
    ]
  },
  admin: {
    title: 'Admin & Security',
    icon: <FaKey className="w-5 h-5" />,
    color: 'from-red-600 to-orange-600',
    settings: [
      { key: 'ALLOW_ADMIN_OPS', label: 'Allow Admin Ops', secret: false, description: 'Enable ops endpoints (true/false)' },
      { key: 'ALLOW_UNSAFE_TERMINAL', label: 'Allow Unsafe Terminal', secret: false, description: 'Enable raw commands (DANGEROUS)' },
      { key: 'ADMIN_OPS_TOKEN', label: 'Admin Ops Token', secret: true, description: 'Token untuk CI/CD operations' },
    ]
  },
  database: {
    title: 'Database & Infrastructure',
    icon: <FaDatabase className="w-5 h-5" />,
    color: 'from-blue-600 to-cyan-600',
    settings: [
      { key: 'DATABASE_URL', label: 'Database URL', secret: true, description: 'PostgreSQL connection string' },
      { key: 'OPS_WEBHOOK_URL', label: 'Ops Webhook URL', secret: false, description: 'Webhook untuk notifikasi' },
    ]
  },
  theme: {
    title: 'Theme & Background',
    icon: <FaPalette className="w-5 h-5" />,
    color: 'from-pink-600 to-rose-600',
    settings: [
      { key: 'GLOBAL_BG_MODE', label: 'Background Mode', secret: false, description: 'none | color | gradient | image' },
      { key: 'GLOBAL_BG_SCOPE', label: 'Background Scope', secret: false, description: 'all-pages | homepage-only' },
      { key: 'GLOBAL_BG_COLOR', label: 'Background Color', secret: false, description: 'Hex color (#ffffff)' },
      { key: 'GLOBAL_BG_GRADIENT', label: 'Background Gradient', secret: false, description: 'CSS gradient value' },
      { key: 'GLOBAL_BG_IMAGE', label: 'Background Image URL', secret: false, description: 'URL gambar background' },
      { key: 'GLOBAL_BG_PAGES', label: 'Background Pages', secret: false, description: 'Halaman yang memakai background (comma separated, e.g. all,home,about,posts)' },
      { key: 'GLOBAL_BG_IMAGE_OVERLAY_COLOR', label: 'Overlay Color', secret: false, description: 'Warna overlay (#000000)' },
      { key: 'GLOBAL_BG_IMAGE_OVERLAY_OPACITY', label: 'Overlay Opacity', secret: false, description: '0-1 (0.3 recommended)' },
      { key: 'GLOBAL_BG_IMAGE_STYLE', label: 'Image Style', secret: false, description: 'cover | contain' },
      { key: 'GLOBAL_BG_IMAGE_FIXED', label: 'Fixed Background', secret: false, description: 'true untuk parallax' },
    ]
  }
};

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ai: true,
    admin: false,
    database: false,
    theme: false
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgPages, setBgPages] = useState<string[]>([]);
  const [bgMode, setBgMode] = useState<'none' | 'color' | 'gradient' | 'image'>('gradient');
  const [bgColor, setBgColor] = useState<string>('#667eea');
  const [bgGradient, setBgGradient] = useState<string>('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [bgOpacity, setBgOpacity] = useState<number>(0.3);
  const [showPreview, setShowPreview] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Theme editor states
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: string, val: string) => {
    setValues(v => ({ ...v, [key]: val }));
  };

  const clearField = (key: string) => {
    setValues(v => ({ ...v, [key]: '' }));
    setMessage(`🗑️ Field ${key} cleared. You can now enter new value.`);
  };

  const handleSave = async () => {
    const allSettings = Object.values(SETTINGS_GROUPS).flatMap(g => g.settings);
    const secrets = allSettings.filter(s => s.secret).map(s => s.key);
    
    // Validate API key formats BEFORE save
    const validationErrors: string[] = [];
    
    if (values.OPENAI_API_KEY && values.OPENAI_API_KEY !== '***') {
      if (!values.OPENAI_API_KEY.startsWith('sk-') && !values.OPENAI_API_KEY.startsWith('sk-proj-')) {
        validationErrors.push('❌ OPENAI_API_KEY harus dimulai dengan "sk-" atau "sk-proj-"');
      }
    }
    
    if (values.GEMINI_API_KEY && values.GEMINI_API_KEY !== '***') {
      if (!values.GEMINI_API_KEY.startsWith('AIza')) {
        validationErrors.push('❌ GEMINI_API_KEY harus dimulai dengan "AIza"');
      }
    }
    
    if (values.ANTHROPIC_API_KEY && values.ANTHROPIC_API_KEY !== '***') {
      if (!values.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
        validationErrors.push('❌ ANTHROPIC_API_KEY harus dimulai dengan "sk-ant-"');
      }
    }
    if (values.HUGGINGFACE_API_KEY && values.HUGGINGFACE_API_KEY !== '***') {
      if (!values.HUGGINGFACE_API_KEY.startsWith('hf_')) {
        validationErrors.push('❌ HUGGINGFACE_API_KEY harus dimulai dengan "hf_"');
      }
    }
    
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join('\n');
      alert(`⚠️ FORMAT API KEY SALAH!\n\n${errorMsg}\n\nCek kembali key yang Anda paste.`);
      setMessage(validationErrors.join(' | '));
      return;
    }

    const settingsToSave: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== '***' && value.trim() !== '') {
        settingsToSave[key] = value;
      } else if (value === '***') {
        console.log(`[Settings] Skipping ${key} - value is masked (***). User needs to edit this field or click "Show Secrets" first.`);
      }
    });
    // Add background settings - always save them even if not changed
    settingsToSave['GLOBAL_BG_MODE'] = bgMode;
    if (bgMode === 'color' && bgColor) settingsToSave['GLOBAL_BG_COLOR'] = bgColor;
    if (bgMode === 'gradient' && bgGradient) settingsToSave['GLOBAL_BG_GRADIENT'] = bgGradient;
    if (bgMode === 'image') {
      settingsToSave['GLOBAL_BG_IMAGE_OVERLAY_OPACITY'] = String(bgOpacity);
    }
    if (bgPages.length > 0) {
      settingsToSave['GLOBAL_BG_SCOPE'] = bgPages.includes('all') ? 'all-pages' : 'selected-pages';
      settingsToSave['GLOBAL_BG_SELECTED_PAGES'] = JSON.stringify(bgPages.filter(p => p !== 'all').map(p => `/${p === 'home' ? '' : p}`));
    } else {
      settingsToSave['GLOBAL_BG_SCOPE'] = 'all-pages';
      settingsToSave['GLOBAL_BG_SELECTED_PAGES'] = JSON.stringify([]);
    }

    if (Object.keys(settingsToSave).length === 0) {
      setMessage('⚠️ Tidak ada perubahan untuk disimpan.');
      return;
    }

    const confirmed = confirm(`Simpan ${Object.keys(settingsToSave).length} perubahan?\n\nIni akan update database settings.`);
    if (!confirmed) {
      setMessage('⚠️ Penyimpanan dibatalkan.');
      return;
    }

    setSaving(true);
    setMessage(null);
    setUploadProgress('');
    
    try {
      let uploadedUrl: string | undefined;
      
      // Upload image if present
      if (bgImageFile) {
        try {
          setUploadProgress('📤 Mengupload gambar...');
          const formData = new FormData();
          formData.append('file', bgImageFile);
          formData.append('bucket', 'backgrounds');
          formData.append('folder', 'admin-bg');
          
          console.log('[Settings] Uploading image:', { name: bgImageFile.name, size: bgImageFile.size, type: bgImageFile.type });
          
          const uploadRes = await apiFetch('/api/upload', { method: 'POST', body: formData });
          const uploadJson = await safeJson(uploadRes, { url: '/api/upload', method: 'POST' }).catch(err => {
            console.error('[Settings] JSON parse error:', err);
            return {};
          });
          
          console.log('[Settings] Upload response:', { ok: uploadRes.ok, status: uploadRes.status, data: uploadJson });
          
          if (uploadRes.ok && uploadJson.url) {
            uploadedUrl = uploadJson.url;
            if (uploadedUrl) settingsToSave['GLOBAL_BG_IMAGE'] = uploadedUrl;
            setUploadProgress('✅ Gambar berhasil diupload!');
          } else {
            const errorMsg = uploadJson.error || uploadJson.details?.message || 'Unknown error';
            setUploadProgress('');
            setMessage(`❌ Upload gagal: ${errorMsg}`);
            setSaving(false);
            return;
          }
        } catch (uploadError: any) {
          console.error('[Settings] Upload exception:', uploadError);
          setUploadProgress('');
          setMessage(`❌ Upload error: ${uploadError.message}`);
          setSaving(false);
          return;
        }
      }
      
      // Save settings
      console.log('[Settings] Saving settings:', { count: Object.keys(settingsToSave).length, keys: Object.keys(settingsToSave) });
      
      const res = await apiFetch('/api/admin/settings', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ settings: settingsToSave, secrets }) 
      });
      const json = await safeJson(res, { url: '/api/admin/settings', method: 'POST' }).catch(err => {
        console.error('[Settings] Settings JSON parse error:', err);
        return { __exception: true, error: err?.message || String(err) };
      });

      console.log('[Settings] Save response:', { ok: res.ok, status: res.status, data: json });

      // Handle fallback objects from safeJson
      if ((json as any).__nonJson) {
        setMessage(`⚠️ Gateway 502 / non-JSON response. Server/tunnel mungkin down. Snippet: "${(json as any).snippet}"`);
        setSaving(false);
        return;
      }
      if ((json as any).__parseError) {
        setMessage(`❌ Parse error (status ${json.status}): ${(json as any).error}`);
        setSaving(false);
        return;
      }
      if ((json as any).__exception) {
        setMessage(`❌ Exception saat membaca response: ${(json as any).error}`);
        setSaving(false);
        return;
      }

      if (res.ok) {
        const savedCount = json.updated || json.inserted || Object.keys(settingsToSave).length;
        setMessage(`✅ Settings tersimpan! ${savedCount} key diupdate.`);
        setValues({});
        setBgImageFile(null);
        setUploadProgress('');

        // Refresh page after 1.5s to show new background
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorMsg = json.error || json.details || 'Unknown error';
        setMessage(`❌ Gagal menyimpan: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('[Settings] Save exception:', error);
      setMessage(`❌ Error: ${error.message}`);
      setUploadProgress('');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    try {
      const res = await apiFetch('/api/admin/ops/generate-token', { method: 'POST' });
      const json = await safeJson(res, { url: '/api/admin/ops/generate-token', method: 'POST' });
      
      if (res.ok && json.token) {
        setGeneratedToken(json.token);
        setMessage(`✅ ${json.message}`);
      } else {
        setMessage(`❌ Gagal generate token: ${json.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setMessage('✅ Token berhasil dicopy ke clipboard!');
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      setSaving(true);
      const res = await apiFetch('/api/admin/theme/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, applyToBoth: true }),
      });
      const json = await safeJson(res, { url: '/api/admin/theme/apply-template', method: 'POST' });
      
      if (res.ok) {
        setMessage(`✅ ${json.message}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(`❌ Gagal apply template: ${json.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await apiFetch('/api/admin/theme/apply-template');
      const json = await safeJson(res, { url: '/api/admin/theme/apply-template', method: 'GET' });
      if (res.ok && json.templates) {
        setTemplates(json.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadSettings = async () => {
    try {
      console.log('[Settings] Loading initial settings from database...');
      const res = await apiFetch('/api/admin/settings', { method: 'GET' });
      const json = await safeJson(res, { url: '/api/admin/settings', method: 'GET' });
      
      if (res.ok && json.settings) {
        console.log('[Settings] Loaded settings:', Object.keys(json.settings).length, 'keys');
        
        // Debug: Show API keys mapping
        console.log('[Settings] API Keys check:', {
          'OPENAI_API_KEY': json.settings.OPENAI_API_KEY?.substring(0, 15) + '...',
          'GEMINI_API_KEY': json.settings.GEMINI_API_KEY?.substring(0, 15) + '...',
          'ANTHROPIC_API_KEY': json.settings.ANTHROPIC_API_KEY?.substring(0, 15) + '...',
          'HUGGINGFACE_API_KEY': json.settings.HUGGINGFACE_API_KEY?.substring(0, 15) + '...',
        });
        
        // Set all loaded values (they will be masked with *** for secrets)
        setValues(json.settings);
        
        // Load background settings
        if (json.settings.GLOBAL_BG_MODE) {
          setBgMode(json.settings.GLOBAL_BG_MODE as any);
        }
        if (json.settings.GLOBAL_BG_COLOR) {
          setBgColor(json.settings.GLOBAL_BG_COLOR);
        }
        if (json.settings.GLOBAL_BG_GRADIENT) {
          setBgGradient(json.settings.GLOBAL_BG_GRADIENT);
        }
        if (json.settings.GLOBAL_BG_IMAGE) {
          setBgImage(json.settings.GLOBAL_BG_IMAGE);
        }
        if (json.settings.GLOBAL_BG_IMAGE_OVERLAY_OPACITY) {
          setBgOpacity(parseFloat(json.settings.GLOBAL_BG_IMAGE_OVERLAY_OPACITY) || 0.3);
        }
        
        console.log('[Settings] Initial load complete');
      } else {
        console.error('[Settings] Failed to load settings:', json.error || 'Unknown error');
      }
    } catch (error) {
      console.error('[Settings] Load exception:', error);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdminPanel) {
      redirect('/404');
      return;
    }
    if (status === 'authenticated' && canAccessAdminPanel) {
      loadTemplates();
      loadSettings();
    }
  }, [status, canAccessAdminPanel]);

  return (
    <AdminPageShell
      icon={<FaCog className="w-8 h-8" />}
      title="Pengaturan Sistem"
      subtitle="Konfigurasi AI, database, keamanan, dan tampilan website"
      gradient="from-gray-700 to-slate-800"
      actions={(
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <FaEye />
            <span>{showSecrets ? 'Hide' : 'Show'} Secrets</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-white text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <FaSave />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      )}
    >
      {message && (
        <div className={`p-4 rounded-2xl shadow-lg mb-6 ${
          message.startsWith('✅') 
            ? 'bg-green-50 border-2 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200' 
            : message.startsWith('⚠️')
            ? 'bg-yellow-50 border-2 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200'
            : 'bg-red-50 border-2 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
        }`}>
          <p className="font-semibold">{message}</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(SETTINGS_GROUPS).map(([key, group]) => (
          <div 
            key={key}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(key)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${group.color} text-white`}>
                  {group.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{group.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{group.settings.length} pengaturan</p>
                </div>
              </div>
              {expandedSections[key] ? (
                <FaChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <FaChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Section Content */}
            {expandedSections[key] && (
              <div className="p-6 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
                {/* AI Provider Info */}
                {key === 'ai' && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <FaRobot className="text-purple-600" />
                      Multi-Provider AI System
                    </h4>
                    <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                      <p className="flex items-start gap-2">
                        <span className="font-semibold min-w-[100px]">Auto-Detect:</span>
                        <span>Sistem otomatis memilih provider berdasarkan API key yang tersedia</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-semibold min-w-[100px]">Priority:</span>
                        <span>Gemini → OpenAI → Anthropic (menggunakan yang pertama tersedia)</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-semibold min-w-[100px]">Key Format:</span>
                        <span>OpenAI: <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">sk-proj-...</code> | Gemini: <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">AIza...</code> | Claude: <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">sk-ant-...</code></span>
                      </p>
                      <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-600">
                        <p className="font-semibold mb-1">💡 Cara Setup API Key:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li><strong>Klik "Show Secrets"</strong> button di pojok kanan atas</li>
                          <li>Field API key akan berubah dari <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">***</code> menjadi editable</li>
                          <li>Paste API key Anda (pilih salah satu: Gemini, OpenAI, atau Claude)</li>
                          <li>Klik <strong>"Simpan Perubahan"</strong> (pojok kanan atas)</li>
                          <li>Cek console browser untuk log: <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">[AI] Key status</code></li>
                        </ol>
                        <p className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-2">
                          ⚠️ <strong>Penting:</strong> Jika field masih <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">***</code>, klik "Show Secrets" dulu sebelum save!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Advanced background controls for theme group */}
                {key === 'theme' && (
                  <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold flex items-center gap-2">
                        <FaSave className="text-blue-600" />
                        Jangan lupa klik <strong>"Simpan Perubahan"</strong> di pojok kanan atas setelah mengatur background!
                      </p>
                    </div>

                    {/* Upload Progress Indicator */}
                    {uploadProgress && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 animate-pulse">
                        <p className="text-sm text-green-800 dark:text-green-200 font-semibold flex items-center gap-2">
                          {uploadProgress}
                        </p>
                      </div>
                    )}

                    {/* Background Mode Selector */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <FaPalette className="text-purple-600" />
                        Background Mode
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['none', 'color', 'gradient', 'image'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setBgMode(mode as any)}
                            className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                              bgMode === mode
                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Picker */}
                    {bgMode === 'color' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <FaTint className="text-blue-600" />
                          Background Color
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={e => setBgColor(e.target.value)}
                            className="h-16 w-24 rounded-xl cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                          />
                          <input
                            type="text"
                            value={bgColor}
                            onChange={e => setBgColor(e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    )}

                    {/* Gradient Presets */}
                    {bgMode === 'gradient' && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Preset Gradients</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {GRADIENT_PRESETS.map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setBgGradient(preset.value)}
                              className="h-20 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-white dark:border-gray-700 overflow-hidden"
                              style={{ background: preset.value }}
                              title={preset.name}
                            >
                              <div className="w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/0 transition-all">
                                <span className="text-white font-bold text-xs drop-shadow-lg">{preset.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Custom Gradient CSS</label>
                        <textarea
                          value={bgGradient}
                          onChange={e => setBgGradient(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Image Upload */}
                    {bgMode === 'image' && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
                        <ImageUploadField
                          label="Upload Background Image"
                          currentImage={bgImage}
                          onImageChange={(url, file) => { setBgImage(url); setBgImageFile(file); }}
                          onImageRemove={() => { setBgImage(undefined); setBgImageFile(null); }}
                          aspectRatio={16/9}
                        />
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Overlay Opacity</label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={bgOpacity}
                              onChange={e => setBgOpacity(parseFloat(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm font-mono font-bold">{(bgOpacity * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Page Selection */}
                    {bgMode !== 'none' && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Halaman yang memakai background</label>
                        {bgPages.length > 0 && (
                          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                            <p className="text-xs font-semibold text-green-800 dark:text-green-200">
                              ✅ Background akan diterapkan ke: {bgPages.includes('all') ? 'Semua Halaman Publik' : bgPages.join(', ')}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { value: 'all', label: '🌐 Semua Halaman' },
                            { value: 'home', label: '🏠 Home' },
                            { value: 'about', label: 'ℹ️ About' },
                            { value: 'posts', label: '📰 Posts' },
                            { value: 'gallery', label: '🖼️ Gallery' },
                            { value: 'events', label: '📅 Events' },
                            { value: 'sekbid', label: '👥 Sekbid' },
                            { value: 'info', label: '📢 Info' },
                          ].map(page => (
                            <button
                              key={page.value}
                              type="button"
                              onClick={() => {
                                if (page.value === 'all') {
                                  setBgPages(bgPages.includes('all') ? [] : ['all']);
                                } else {
                                  setBgPages(prev => {
                                    const without = prev.filter(p => p !== 'all' && p !== page.value);
                                    return prev.includes(page.value) ? without : [...without, page.value];
                                  });
                                }
                              }}
                              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                                bgPages.includes(page.value)
                                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-2 border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {page.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Preview */}
                    {bgMode !== 'none' && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <FaImage className="text-gray-600" />
                            Live Preview
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                          >
                            {showPreview ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {showPreview && (
                          <div
                            className="w-full h-64 rounded-xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden relative"
                            style={{
                              ...(bgMode === 'color' && bgColor ? { background: bgColor } : {}),
                              ...(bgMode === 'gradient' && bgGradient ? { background: bgGradient } : {}),
                              ...(bgMode === 'image' && bgImage ? {
                                backgroundImage: `url(${bgImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              } : {}),
                            }}
                          >
                            {bgMode === 'image' && bgImage && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundColor: 'rgba(0,0,0,' + bgOpacity + ')',
                                }}
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg">
                                <p className="text-gray-900 dark:text-white font-bold">Preview Background</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Theme Templates */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <FaMagic className="text-indigo-600" />
                          Theme Templates
                        </label>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full text-indigo-800 dark:text-indigo-200 font-semibold">
                          {templates.length} tersedia
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                        Pilih template tema untuk mengatur warna & background sekaligus
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => {
                              if (confirm(`Terapkan template "${template.name}"?\n\nIni akan mengubah semua pengaturan tema (warna, background, dll).`)) {
                                handleApplyTemplate(template.id);
                              }
                            }}
                            className="group relative bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg transform hover:scale-105"
                          >
                            <div className="text-2xl mb-2">{template.name.split(' ')[0]}</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                              {template.name.split(' ').slice(1).join(' ')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {template.description}
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaMagic className="text-indigo-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simple Theme Editor */}
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border-2 border-pink-200 dark:border-pink-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <FaPalette className="text-pink-600" />
                          Simple Theme Editor
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowThemeEditor(!showThemeEditor)}
                          className="px-3 py-1 bg-pink-200 dark:bg-pink-700 rounded-lg text-xs font-semibold hover:bg-pink-300 dark:hover:bg-pink-600 transition-all"
                        >
                          {showThemeEditor ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {showThemeEditor && (
                        <div className="space-y-4">
                          {/* Mode Toggle */}
                          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setThemeMode('light')}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                                themeMode === 'light'
                                  ? 'bg-yellow-400 text-gray-900 shadow-md'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              <FaSun />
                              Light Mode
                            </button>
                            <button
                              type="button"
                              onClick={() => setThemeMode('dark')}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                                themeMode === 'dark'
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              <FaMoon />
                              Dark Mode
                            </button>
                          </div>
                          
                          {/* Color Inputs */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { key: `THEME_${themeMode.toUpperCase()}_PRIMARY`, label: 'Primary', default: themeMode === 'light' ? '#7c3aed' : '#8b5cf6' },
                              { key: `THEME_${themeMode.toUpperCase()}_SECONDARY`, label: 'Secondary', default: themeMode === 'light' ? '#8b5cf6' : '#a78bfa' },
                              { key: `THEME_${themeMode.toUpperCase()}_ACCENT`, label: 'Accent', default: themeMode === 'light' ? '#a78bfa' : '#c4b5fd' },
                              { key: `THEME_${themeMode.toUpperCase()}_BG`, label: 'Background', default: themeMode === 'light' ? '#ffffff' : '#0f172a' },
                              { key: `THEME_${themeMode.toUpperCase()}_SURFACE`, label: 'Surface', default: themeMode === 'light' ? '#f8fafc' : '#1e293b' },
                              { key: `THEME_${themeMode.toUpperCase()}_TEXT`, label: 'Text', default: themeMode === 'light' ? '#0f172a' : '#f1f5f9' },
                              { key: `THEME_${themeMode.toUpperCase()}_TEXT_SECONDARY`, label: 'Text 2nd', default: themeMode === 'light' ? '#475569' : '#cbd5e1' },
                              { key: `THEME_${themeMode.toUpperCase()}_BORDER`, label: 'Border', default: themeMode === 'light' ? '#e2e8f0' : '#334155' },
                            ].map((colorSetting) => (
                              <div key={colorSetting.key} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                  {colorSetting.label}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={values[colorSetting.key] || colorSetting.default}
                                    onChange={(e) => handleChange(colorSetting.key, e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={values[colorSetting.key] || colorSetting.default}
                                    onChange={(e) => handleChange(colorSetting.key, e.target.value)}
                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                                    placeholder={colorSetting.default}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Admin OPS Token Generator */}
                {key === 'admin' && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-700 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <FaKey className="text-red-600" />
                          Generate Admin OPS Token
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Generate token aman untuk CI/CD dan operations
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateToken}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <FaKey />
                        Generate Token
                      </button>
                    </div>
                    
                    {generatedToken && (
                      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-red-800 dark:text-red-200">
                            🔒 Token (simpan dengan aman!)
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyToken}
                            className="flex items-center gap-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-800/50 transition-all"
                          >
                            <FaCopy />
                            Copy
                          </button>
                        </div>
                        <code className="block w-full p-3 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 text-xs font-mono break-all text-gray-900 dark:text-white">
                          {generatedToken}
                        </code>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold">
                          ⚠️ Token ini tidak akan ditampilkan lagi setelah halaman ditutup!
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {group.settings.map((setting) => {
                  const isMasked = values[setting.key] === '***';
                  const displayValue = isMasked && showSecrets ? '' : (values[setting.key] || '');
                  
                  // Validate format for API keys
                  let formatError = '';
                  if (displayValue && !isMasked) {
                    if (setting.key === 'OPENAI_API_KEY' && !displayValue.startsWith('sk-') && !displayValue.startsWith('sk-proj-')) {
                      formatError = '❌ OpenAI key harus dimulai dengan "sk-" atau "sk-proj-"';
                    } else if (setting.key === 'GEMINI_API_KEY' && !displayValue.startsWith('AIza')) {
                      formatError = '❌ Gemini key harus dimulai dengan "AIza"';
                    } else if (setting.key === 'ANTHROPIC_API_KEY' && !displayValue.startsWith('sk-ant-')) {
                      formatError = '❌ Anthropic key harus dimulai dengan "sk-ant-"';
                    } else if (setting.key === 'HUGGINGFACE_MODEL') {
                      if (displayValue.startsWith('hf_')) {
                        formatError = '❌ Field model berisi TOKEN (hf_...). Masukkan nama model seperti black-forest-labs/FLUX.1-schnell';
                      } else if (!displayValue.includes('/')) {
                        formatError = '❌ Format model harus nama-namespace/model (contoh: stabilityai/sdxl-turbo)';
                      }
                    }
                  }
                  
                  return (
                  <div key={setting.key} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {setting.label}
                        {setting.secret && <span className="ml-2 text-xs text-red-500">(Secret)</span>}
                      </label>
                      {isMasked && showSecrets && (
                        <button
                          type="button"
                          onClick={() => clearField(setting.key)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
                        >
                          <span>🗑️</span> Clear & Edit
                        </button>
                      )}
                    </div>
                    <input
                      type={(setting.secret && !showSecrets) ? 'password' : 'text'}
                      value={displayValue}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all font-mono text-sm ${
                        formatError 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={isMasked && showSecrets ? '🔑 Click "Clear & Edit" to enter new API key' : setting.description}
                    />
                    {formatError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                        {formatError}
                      </p>
                    )}
                    {isMasked && showSecrets && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">
                        ⚠️ Value is masked. Click "Clear & Edit" button above to enter new value.
                      </p>
                    )}
                    {!isMasked && !formatError && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2 text-lg">
          <FaTools />
          <span>Informasi Penting</span>
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-disc list-inside">
          <li>Settings disimpan ke database dan langsung aktif tanpa redeploy</li>
          <li>Secret values tidak akan ditampilkan setelah disimpan (gunakan Show Secrets untuk edit)</li>
          <li><strong>Background settings</strong> akan otomatis diterapkan ke semua halaman publik yang dipilih setelah save</li>
          <li>Halaman admin tidak akan terpengaruh oleh background settings untuk menjaga UI tetap jelas</li>
          <li>Admin operations settings mempengaruhi keamanan sistem - gunakan dengan hati-hati</li>
        </ul>
      </div>
    </AdminPageShell>
  );
}

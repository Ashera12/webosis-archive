"use client";

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export interface ImageUploaderProps {
  label?: string;
  bucket?: string; // default 'gallery'
  folder?: string; // optional logical folder inside bucket
  value?: string; // current image URL
  onChange?: (url: string) => void;
  disabled?: boolean;
  helperText?: string;
  accept?: string; // mime types
  maxSizeMB?: number; // default 10
  previewAspect?: string; // e.g. '16/9'
}

interface UploadState {
  progress: string;
  uploading: boolean;
  error?: string;
  fileName?: string;
  fileSize?: number;
  percent?: number;
}

// Centralized allowed mime types
const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const FALLBACK_BUCKET = 'gallery';

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Upload Gambar',
  bucket = FALLBACK_BUCKET,
  folder = '',
  value,
  onChange,
  disabled = false,
  helperText = 'Format: JPG, PNG, WEBP, GIF (max 10MB)',
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  previewAspect = 'auto'
}) => {
  const [state, setState] = useState<UploadState>({ progress: '', uploading: false, percent: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => setState({ progress: '', uploading: false });

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setState({ progress: '', uploading: false, error: `File terlalu besar. Max ${maxSizeMB}MB` });
      return;
    }
    if (!accept.split(',').some(m => file.type === m)) {
      setState({ progress: '', uploading: false, error: 'Tipe file tidak didukung' });
      return;
    }

    try {
      setState({ uploading: true, progress: 'Menyiapkan file...', fileName: file.name, fileSize: file.size, percent: 0 });
      // Use server-side upload API to bypass RLS issues
      setState(s => ({ ...s, progress: 'Mengupload ke server...', percent: 10 }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('folder', folder || '');

      // Fake progress interval (fetch doesn't provide progress natively)
      let fakeProgress = 10;
      const progressInterval = setInterval(() => {
        fakeProgress += Math.random() * 12;
        setState(s => ({ ...s, percent: Math.min(90, fakeProgress) }));
      }, 250);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Ensure cookies are sent
      });

      clearInterval(progressInterval);

      const text = await response.text();
      if (text.trim().startsWith('<')) {
        console.error('[ImageUploader] HTML response instead of JSON:', text.substring(0, 200));
        setState({ uploading: false, progress: '', error: 'Server error - received HTML instead of JSON', percent: 0 });
        toast.error('Upload gagal: Server error');
        return;
      }

      const result = JSON.parse(text);

      if (!response.ok || !result.success) {
        console.error('[ImageUploader] Upload error', result.error);
        setState({ uploading: false, progress: '', error: result.error || 'Upload gagal', percent: 0 });
        toast.error('Upload gagal: ' + (result.error || 'Unknown error'));
        return;
      }

      setState({ uploading: false, progress: '✅ Berhasil upload!', fileName: file.name, fileSize: file.size, percent: 100 });
      onChange?.(result.url);
      toast.success('Foto berhasil diupload!');
      setTimeout(() => setState(s => ({ ...s, progress: '', percent: 0 })), 1500);
    } catch (e) {
      console.error('[ImageUploader] Unexpected error', e);
      setState({ uploading: false, progress: '', error: e instanceof Error ? e.message : 'Upload gagal', percent: 0 });
      toast.error('Upload gagal: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          {/* URL input for manual override */}
          <input
            type="url"
            value={value || ''}
            onChange={e => onChange?.(e.target.value)}
            placeholder="https://..."
            disabled={disabled || state.uploading}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled || state.uploading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.uploading ? 'Uploading...' : '📁 Pilih File'}
            </button>
            {value && !state.uploading && (
              <button
                type="button"
                onClick={() => onChange?.('')}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Hapus
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
            disabled={disabled || state.uploading}
          />

          {helperText && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
          )}

          {state.error && (
            <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              ❌ {state.error}
            </div>
          )}

          {state.uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${state.percent || 10}%` }}
              ></div>
            </div>
          )}
          {state.progress && (
            <div className="mt-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300">
              {state.progress}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="w-full md:w-56">
          <div className={`relative rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 overflow-hidden aspect-[${previewAspect}] flex items-center justify-center`}> 
            {value ? (
              <img
                src={value}
                alt="Preview"
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                }}
              />
            ) : (
              <span className="text-xs text-gray-400">Tidak ada gambar</span>
            )}
          </div>
          {state.fileName && (
            <p className="mt-1 text-[10px] text-gray-500 truncate" title={state.fileName}>{state.fileName}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;

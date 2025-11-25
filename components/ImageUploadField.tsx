'use client';

import { useState, useRef } from 'react';
import { FaUpload, FaImage, FaTimes, FaCrop } from 'react-icons/fa';
import ImageCropper from './ImageCropper';

interface ImageUploadFieldProps {
  label: string;
  currentImage?: string;
  onImageChange: (imageUrl: string, file: File) => void;
  onImageRemove?: () => void;
  aspectRatio?: number;
  suggestedRatios?: { label: string; value: number }[];
  className?: string;
}

export default function ImageUploadField({
  label,
  currentImage,
  onImageChange,
  onImageRemove,
  aspectRatio = 16 / 9,
  suggestedRatios,
  className = '',
}: ImageUploadFieldProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If video, create object URL for preview and trigger upload via parent
    if (file.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(file);
      // Pass objectUrl as preview, parent will handle actual upload
      onImageChange(objectUrl, file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
    onImageChange(croppedUrl, file);
    setShowCropper(false);
    setTempImageSrc('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setTempImageSrc('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {currentImage ? (
        <div className="relative group">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
            {/(\.mp4|\.webm|\.ogg)$/i.test(currentImage || '') ? (
              <video
                src={currentImage}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTempImageSrc(currentImage);
                  setShowCropper(true);
                }}
                className="opacity-0 group-hover:opacity-100 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                <FaCrop /> Edit & Crop
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="opacity-0 group-hover:opacity-100 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                <FaUpload /> Ganti Foto
              </button>
              {onImageRemove && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="opacity-0 group-hover:opacity-100 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
                >
                  <FaTimes /> Hapus
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Hover untuk edit, crop, atau ganti foto
          </p>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <FaImage className="text-4xl mb-3" />
            <p className="text-sm font-medium">Klik untuk upload gambar / video</p>
            <p className="text-xs mt-1">atau drag & drop file di sini</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <FaCrop className="text-blue-600" />
              <span className="text-blue-600 font-semibold">Auto Crop & Resize</span>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/ogg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showCropper && tempImageSrc && (
        <ImageCropper
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          aspectRatio={aspectRatio}
          suggestedRatios={suggestedRatios}
        />
      )}
    </div>
  );
}

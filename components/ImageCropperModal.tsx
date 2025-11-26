'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FaTimes, FaCheck, FaCrop } from 'react-icons/fa';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for landscape
}

export default function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
}: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const getCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [completedCrop]);

  const handleCropComplete = async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-yellow-400 to-amber-500">
          <div className="flex items-center gap-2">
            <FaCrop className="text-slate-900 text-xl" />
            <h3 className="text-lg font-bold text-slate-900">Crop Foto Profil</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-white/20 transition-all"
          >
            <FaTimes className="text-slate-900 text-xl" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              className="max-w-full h-auto"
            />
          </ReactCrop>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleCropComplete}
            disabled={!completedCrop}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaCheck />
            Crop & Upload
          </button>
        </div>
      </div>
    </div>
  );
}

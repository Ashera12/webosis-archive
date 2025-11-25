'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FaTimes, FaCheck, FaSearchPlus, FaSearchMinus, FaRedo } from 'react-icons/fa';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  suggestedRatios?: { label: string; value: number }[];
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_RATIOS = [
  { label: '16:9 (Banner)', value: 16 / 9 },
  { label: '4:3 (Post)', value: 4 / 3 },
  { label: '1:1 (Square)', value: 1 },
  { label: '9:16 (Story)', value: 9 / 16 },
  { label: 'Free', value: 0 },
];

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9,
  suggestedRatios = DEFAULT_RATIOS,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentAspect, setCurrentAspect] = useState(aspectRatio);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onCropCompleteInternal = useCallback(
    (croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas size to match cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Draw cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const croppedImageUrl = URL.createObjectURL(blob);
          onCropComplete(blob, croppedImageUrl);
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Crop Gambar</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <FaTimes /> Batal
            </button>
            <button
              type="button"
              onClick={createCroppedImage}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <FaCheck /> Terapkan
            </button>
          </div>
        </div>

        {/* Crop Area */}
        <div className="relative bg-black/40">
          <div className="relative h-72 sm:h-80 md:h-96">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={currentAspect || undefined}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>
        </div>

        {/* Controls - compact */}
        <div className="px-4 sm:px-6 py-4 space-y-4 bg-gray-900">
          {/* Aspect ratios */}
          <div className="flex flex-wrap gap-2">
            {suggestedRatios.map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                onClick={() => setCurrentAspect(ratio.value)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentAspect === ratio.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          {/* Zoom and rotation in one row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Zoom ({Math.round(zoom * 100)}%)</label>
              <div className="flex items-center gap-2">
                <FaSearchMinus className="text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <FaSearchPlus className="text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Rotasi ({rotation}°)</label>
              <div className="flex items-center gap-2">
                <FaRedo className="text-gray-400 transform -scale-x-100" />
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <FaRedo className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to create image element
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

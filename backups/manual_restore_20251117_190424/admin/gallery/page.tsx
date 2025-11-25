'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaImage, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import ImageUploader from '@/components/admin/ImageUploader';

export default function GalleryPage() {
  return (
    <div className="p-6">
      <p>Gallery page backup</p>
    </div>
  );
}

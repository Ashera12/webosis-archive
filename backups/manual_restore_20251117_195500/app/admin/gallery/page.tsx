'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaImage, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import ImageUploader from '@/components/admin/ImageUploader';

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_id: string | null;
  sekbid_id: string | null;
  created_at: string;
}

export default function GalleryPage() {
  return (
    <div className="ds-container p-6">
      <h1 className="ds-heading">Gallery</h1>
      <p className="ds-subtle">Gallery page backup</p>
    </div>
  );
}

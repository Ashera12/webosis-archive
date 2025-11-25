-- Update Supabase Storage bucket settings to allow video uploads
-- Run this in Supabase SQL Editor

-- Update gallery bucket to allow videos and increase size limit
UPDATE storage.buckets
SET 
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ]::text[]
WHERE name = 'gallery';

-- Update posts bucket (if exists)
UPDATE storage.buckets
SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ]::text[]
WHERE name = 'posts';

-- Update events bucket (if exists)
UPDATE storage.buckets
SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ]::text[]
WHERE name = 'events';

-- Verify settings
SELECT 
  name,
  file_size_limit / 1048576 as "Size Limit (MB)",
  allowed_mime_types,
  public
FROM storage.buckets
WHERE name IN ('gallery', 'posts', 'events', 'backgrounds')
ORDER BY name;

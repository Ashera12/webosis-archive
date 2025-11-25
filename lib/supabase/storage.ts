import { supabaseAdmin } from './server';

export const GALLERY_BUCKET = 'gallery';

/**
 * Upload file to Supabase Storage
 * @param file File to upload
 * @param folder Optional folder path (e.g., 'events', 'members')
 * @returns Public URL of uploaded file
 */
export async function uploadToStorage(
  file: File,
  folder: string = ''
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: String(error) };
  }
}

/**
 * Delete file from Supabase Storage
 * @param path File path in storage
 * @param bucket Optional bucket name (default: gallery)
 */
export async function deleteFromStorage(path: string, bucket: string = GALLERY_BUCKET): Promise<{ error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Delete error:', error);
    return { error: String(error) };
  }
}

/**
 * Extract storage path from public URL
 * @param url Public URL from Supabase Storage
 * @returns Path in storage or null if not a valid storage URL
 */
export function extractStoragePath(url: string): string | null {
  try {
    // Expected format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get public URL for a file in storage
 * @param path File path in storage
 */
export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

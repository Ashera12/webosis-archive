import { supabaseAdmin } from './supabase/server';
import { getConfig } from './adminConfig';

/**
 * UNIVERSAL SIGNED URL GENERATOR
 * 
 * Generates secure, time-limited URLs for ALL storage types:
 * - Photos (user photos, biometric reference photos, selfies)
 * - Videos (gallery, events, announcements)
 * - Documents (attachments, resumes, certificates)
 * - Biometric data (fingerprint templates, face encodings)
 * - Passkeys/WebAuthn credentials (backup files)
 * - Backgrounds (custom backgrounds, themes)
 * - Any other file type in Supabase Storage
 * 
 * Security Benefits:
 * 1. URLs expire after set time (default: 24 hours)
 * 2. Cannot be shared or leaked long-term
 * 3. Automatic rotation on each request
 * 4. Prevents hotlinking and scraping
 * 5. Works across ALL storage buckets
 */

type StorageBucket = 
  | 'user-photos'       // User profile photos, selfies
  | 'biometric-data'    // Biometric reference photos, templates
  | 'gallery'           // Gallery photos and videos
  | 'backgrounds'       // Custom backgrounds
  | 'attachments'       // Documents, PDFs, etc.
  | 'videos'            // Video content
  | 'passkeys'          // WebAuthn backup data
  | string;             // Allow custom buckets

interface SignedUrlOptions {
  expiresIn?: number; // Seconds until expiration (default: 24 hours)
  download?: boolean; // Force download vs inline display
  bucket?: StorageBucket; // Storage bucket (auto-detected from path if not provided)
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * Auto-detect storage bucket from file path or URL
 */
function detectBucket(pathOrUrl: string): StorageBucket {
  const path = pathOrUrl.toLowerCase();
  
  if (path.includes('/user-photos/') || path.includes('selfie') || path.includes('profile')) {
    return 'user-photos';
  }
  if (path.includes('/biometric') || path.includes('reference_photo') || path.includes('fingerprint')) {
    return 'biometric-data';
  }
  if (path.includes('/gallery/') || path.includes('/event')) {
    return 'gallery';
  }
  if (path.includes('/background')) {
    return 'backgrounds';
  }
  if (path.includes('/video') || path.includes('.mp4') || path.includes('.webm')) {
    return 'videos';
  }
  if (path.includes('/passkey') || path.includes('/webauthn')) {
    return 'passkeys';
  }
  if (path.includes('/attachment') || path.includes('.pdf') || path.includes('.doc')) {
    return 'attachments';
  }
  
  // Default to user-photos for backward compatibility
  return 'user-photos';
}

/**
 * Generate signed URL for ANY file in Supabase Storage
 * 
 * @param filePath - Path to file in storage bucket (e.g., "user-photos/123/selfie.jpg")
 * @param options - URL generation options
 * @returns Signed URL with expiration
 */
export async function generateSignedUrl(
  filePath: string,
  options: SignedUrlOptions = {}
): Promise<{ url: string; expiresAt: Date; bucket: string } | null> {
  try {
    // Check if signed URLs are enabled in admin settings
    const signedUrlsEnabled = await getConfig('storage_signed_urls');
    
    // Auto-detect bucket if not provided
    const bucket = options.bucket || detectBucket(filePath);
    
    // Extract clean file path (remove bucket prefix if present)
    let cleanPath = filePath;
    if (cleanPath.includes(`/${bucket}/`)) {
      cleanPath = cleanPath.split(`/${bucket}/`)[1] || cleanPath;
    }
    
    if (signedUrlsEnabled === 'false') {
      // Return public URL without signing (less secure, but faster)
      const { data: publicData } = supabaseAdmin
        .storage
        .from(bucket)
        .getPublicUrl(cleanPath);
      
      return {
        url: publicData.publicUrl,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year (effectively permanent)
        bucket
      };
    }

    // Get expiry time from admin settings or use default
    const expiryHours = parseInt(await getConfig('storage_url_expiry_hours') || '24');
    const expiresIn = options.expiresIn || (expiryHours * 60 * 60); // Convert hours to seconds

    // Generate signed URL
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresIn, {
        download: options.download,
        transform: options.transform
      });

    if (error) {
      console.error('[Signed URL] Error generating signed URL:', error);
      return null;
    }

    if (!data || !data.signedUrl) {
      console.error('[Signed URL] No signed URL returned');
      return null;
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log('[Signed URL] ✅ Generated signed URL:', {
      bucket,
      path: cleanPath,
      expiresIn: `${expiresIn}s (${expiryHours}h)`,
      expiresAt: expiresAt.toISOString()
    });

    return {
      url: data.signedUrl,
      expiresAt,
      bucket
    };

  } catch (error) {
    console.error('[Signed URL] Exception:', error);
    return null;
  }
}

// Backward compatibility alias
export const generateSignedPhotoUrl = generateSignedUrl;

/**
 * Generate multiple signed URLs in batch (efficient for galleries, videos, etc.)
 */
export async function generateSignedUrls(
  filePaths: string[],
  options: SignedUrlOptions = {}
): Promise<Map<string, { url: string; expiresAt: Date; bucket: string }>> {
  const results = new Map<string, { url: string; expiresAt: Date; bucket: string }>();

  // Process in parallel for performance
  const promises = filePaths.map(async (path) => {
    const result = await generateSignedUrl(path, options);
    if (result) {
      results.set(path, result);
    }
  });

  await Promise.all(promises);

  return results;
}

// Backward compatibility alias
export const generateSignedPhotoUrls = generateSignedUrls;

/**
 * Extract photo path from full URL or return as-is
 * Handles both:
 * - Full URLs: https://...supabase.co/storage/v1/object/public/user-photos/123/photo.jpg
 * - Paths: user-photos/123/photo.jpg
 */
export function extractPhotoPath(urlOrPath: string): string {
  if (!urlOrPath) return '';

  // If it's already a path (no http), return as-is
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }

  try {
    const url = new URL(urlOrPath);
    
    // Extract path from Supabase Storage URL
    // Format: /storage/v1/object/public/bucket-name/path/to/file.jpg
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
    
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // If no match, return original (might be custom domain or different format)
    return urlOrPath;

  } catch (error) {
    console.error('[Photo Path] Invalid URL:', urlOrPath);
    return urlOrPath;
  }
}

/**
 * Convert stored URL to signed URL (for API responses)
 * 
 * Usage in API routes:
 * ```typescript
 * const biometric = await supabase.from('biometric_data').select('*').single();
 * const signedPhoto = await convertToSignedUrl(biometric.reference_photo_url);
 * 
 * return NextResponse.json({
 *   ...biometric,
 *   reference_photo_url: signedPhoto?.url || biometric.reference_photo_url,
 *   photo_expires_at: signedPhoto?.expiresAt
 * });
 * ```
 */
export async function convertToSignedUrl(
  storedUrl: string | null,
  options: SignedUrlOptions = {}
): Promise<{ url: string; expiresAt: Date; bucket: string } | null> {
  if (!storedUrl) return null;

  const path = extractPhotoPath(storedUrl);
  return await generateSignedUrl(path, options);
}

/**
 * Validate photo URL is from allowed domain (security check)
 */
export function isValidPhotoUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    
    // Allow Supabase storage URLs
    const allowedDomains = [
      '.supabase.co',
      '.supabase.in',
      'localhost',
      '127.0.0.1'
    ];

    return allowedDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );

  } catch (error) {
    // If not a valid URL, might be a path (also valid)
    return !url.startsWith('http');
  }
}

/**
 * Upload ANY file with automatic signed URL generation
 * 
 * @param file - File buffer or base64 string
 * @param userId - User ID for path organization
 * @param options - Upload options
 * @returns Signed URL for the uploaded file
 */
export async function uploadFileWithSignedUrl(
  file: Buffer | string,
  userId: string,
  options: {
    type?: 'reference' | 'selfie' | 'background' | 'video' | 'attachment' | 'passkey';
    bucket?: StorageBucket;
    contentType?: string;
    fileName?: string;
  } = {}
): Promise<{ url: string; path: string; signedUrl: string; expiresAt: Date; bucket: string } | null> {
  try {
    const timestamp = Date.now();
    const type = options.type || 'selfie';
    
    // Auto-detect file extension from contentType or fileName
    let extension = 'jpg';
    if (options.fileName) {
      extension = options.fileName.split('.').pop() || 'jpg';
    } else if (options.contentType) {
      const ext = options.contentType.split('/')[1];
      extension = ext === 'jpeg' ? 'jpg' : ext;
    }
    
    const fileName = options.fileName || `${type}_${timestamp}.${extension}`;
    const filePath = `${userId}/${fileName}`;
    
    // Auto-detect bucket based on type
    let bucket: StorageBucket = options.bucket || 'user-photos';
    if (!options.bucket) {
      if (type === 'reference' || type === 'selfie') bucket = 'user-photos';
      else if (type === 'background') bucket = 'backgrounds';
      else if (type === 'video') bucket = 'videos';
      else if (type === 'passkey') bucket = 'passkeys';
      else if (type === 'attachment') bucket = 'attachments';
    }

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    if (typeof file === 'string') {
      // Remove data:*;base64, prefix if present
      const base64Data = file.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = file;
    }

    // Auto-detect content type
    const contentType = options.contentType || 
      (extension === 'mp4' || extension === 'webm' ? `video/${extension}` :
       extension === 'pdf' ? 'application/pdf' :
       extension === 'json' ? 'application/json' :
       `image/${extension === 'jpg' ? 'jpeg' : extension}`);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[File Upload] Error:', error);
      return null;
    }

    if (!data || !data.path) {
      console.error('[File Upload] No path returned');
      return null;
    }

    // Generate signed URL
    const signedUrlData = await generateSignedUrl(data.path, { bucket });

    if (!signedUrlData) {
      console.error('[File Upload] Failed to generate signed URL');
      return null;
    }

    // Get public URL (for storage reference)
    const { data: publicData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('[File Upload] ✅ File uploaded with signed URL:', {
      bucket,
      path: data.path,
      contentType,
      expiresAt: signedUrlData.expiresAt
    });

    return {
      url: publicData.publicUrl, // Store this in database
      path: data.path,
      signedUrl: signedUrlData.url, // Return this to client
      expiresAt: signedUrlData.expiresAt,
      bucket
    };

  } catch (error) {
    console.error('[File Upload] Exception:', error);
    return null;
  }
}

// Backward compatibility alias
export const uploadPhotoWithSignedUrl = uploadFileWithSignedUrl;

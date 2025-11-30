import { supabaseAdmin } from './supabase/server';
import { getConfig } from './adminConfig';

/**
 * SIGNED URL GENERATOR
 * 
 * Generates secure, time-limited URLs for photo access
 * Prevents unauthorized access to user photos
 * 
 * Security Benefits:
 * 1. URLs expire after set time (default: 24 hours)
 * 2. Cannot be shared or leaked long-term
 * 3. Automatic rotation on each request
 * 4. Prevents hotlinking and scraping
 */

interface SignedUrlOptions {
  expiresIn?: number; // Seconds until expiration (default: 24 hours)
  download?: boolean; // Force download vs inline display
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * Generate signed URL for a photo in Supabase Storage
 * 
 * @param photoPath - Path to photo in storage bucket (e.g., "user-photos/123/selfie.jpg")
 * @param options - URL generation options
 * @returns Signed URL with expiration
 */
export async function generateSignedPhotoUrl(
  photoPath: string,
  options: SignedUrlOptions = {}
): Promise<{ url: string; expiresAt: Date } | null> {
  try {
    // Check if signed URLs are enabled in admin settings
    const signedUrlsEnabled = await getConfig('storage_signed_urls');
    
    if (signedUrlsEnabled === 'false') {
      // Return public URL without signing (less secure, but faster)
      const { data: publicData } = supabaseAdmin
        .storage
        .from('user-photos')
        .getPublicUrl(photoPath);
      
      return {
        url: publicData.publicUrl,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year (effectively permanent)
      };
    }

    // Get expiry time from admin settings or use default
    const expiryHours = parseInt(await getConfig('storage_url_expiry_hours') || '24');
    const expiresIn = options.expiresIn || (expiryHours * 60 * 60); // Convert hours to seconds

    // Extract bucket name from path or use default
    const bucket = 'user-photos'; // Could be made configurable

    // Generate signed URL
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(photoPath, expiresIn, {
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
      path: photoPath,
      expiresIn: `${expiresIn}s (${expiryHours}h)`,
      expiresAt: expiresAt.toISOString()
    });

    return {
      url: data.signedUrl,
      expiresAt
    };

  } catch (error) {
    console.error('[Signed URL] Exception:', error);
    return null;
  }
}

/**
 * Generate multiple signed URLs in batch (efficient for galleries)
 */
export async function generateSignedPhotoUrls(
  photoPaths: string[],
  options: SignedUrlOptions = {}
): Promise<Map<string, { url: string; expiresAt: Date }>> {
  const results = new Map<string, { url: string; expiresAt: Date }>();

  // Process in parallel for performance
  const promises = photoPaths.map(async (path) => {
    const result = await generateSignedPhotoUrl(path, options);
    if (result) {
      results.set(path, result);
    }
  });

  await Promise.all(promises);

  return results;
}

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
 *   reference_photo_url: signedPhoto?.url || biometric.reference_photo_url
 * });
 * ```
 */
export async function convertToSignedUrl(
  storedUrl: string | null,
  options: SignedUrlOptions = {}
): Promise<{ url: string; expiresAt: Date } | null> {
  if (!storedUrl) return null;

  const path = extractPhotoPath(storedUrl);
  return await generateSignedPhotoUrl(path, options);
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
 * Upload photo with automatic signed URL generation
 * 
 * @param file - File buffer or base64 string
 * @param userId - User ID for path organization
 * @param type - Photo type (reference, selfie, etc.)
 * @returns Signed URL for the uploaded photo
 */
export async function uploadPhotoWithSignedUrl(
  file: Buffer | string,
  userId: string,
  type: 'reference' | 'selfie' | 'background' = 'selfie'
): Promise<{ url: string; path: string; signedUrl: string; expiresAt: Date } | null> {
  try {
    const timestamp = Date.now();
    const fileName = `${type}_${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    if (typeof file === 'string') {
      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      fileBuffer = file;
    }

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin
      .storage
      .from('user-photos')
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Photo Upload] Error:', error);
      return null;
    }

    if (!data || !data.path) {
      console.error('[Photo Upload] No path returned');
      return null;
    }

    // Generate signed URL
    const signedUrlData = await generateSignedPhotoUrl(data.path);

    if (!signedUrlData) {
      console.error('[Photo Upload] Failed to generate signed URL');
      return null;
    }

    // Get public URL (for storage reference)
    const { data: publicData } = supabaseAdmin
      .storage
      .from('user-photos')
      .getPublicUrl(data.path);

    console.log('[Photo Upload] ✅ Photo uploaded with signed URL:', {
      path: data.path,
      expiresAt: signedUrlData.expiresAt
    });

    return {
      url: publicData.publicUrl, // Store this in database
      path: data.path,
      signedUrl: signedUrlData.url, // Return this to client
      expiresAt: signedUrlData.expiresAt
    };

  } catch (error) {
    console.error('[Photo Upload] Exception:', error);
    return null;
  }
}

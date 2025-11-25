/**
 * Converts Google Drive share URLs to direct download URLs
 * Supports various Google Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function convertDriveUrl(url: string): string {
  if (!url || !url.includes('drive.google.com')) {
    return url;
  }

  try {
    // Extract file ID from various Google Drive URL formats
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : null;

    if (fileId) {
      // Convert to direct download URL
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    console.warn('Could not extract file ID from Google Drive URL:', url);
    return url;
  } catch (e) {
    console.warn('Failed to parse Google Drive URL:', e);
    return url;
  }
}

/**
 * Converts Google Drive URL to thumbnail URL
 * Useful for image previews
 */
export function convertDriveUrlToThumbnail(url: string, size = 800): string {
  if (!url || !url.includes('drive.google.com')) {
    return url;
  }

  try {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : null;

    if (fileId) {
      // Return Google Drive thumbnail URL
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
    }

    return url;
  } catch (e) {
    console.warn('Failed to generate Drive thumbnail URL:', e);
    return url;
  }
}

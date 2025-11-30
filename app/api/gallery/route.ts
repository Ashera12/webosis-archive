import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { convertToSignedUrl } from '@/lib/signedUrls';

export async function GET() {
  try {
    const { data: gallery, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert all media URLs to signed URLs
    const galleryWithSignedUrls = await Promise.all(
      (gallery || []).map(async (item: any) => {
        const updatedItem = { ...item };
        
        // Convert image_url if present
        if (item.image_url) {
          const signedUrl = await convertToSignedUrl(item.image_url);
          if (signedUrl) {
            updatedItem.image_url = signedUrl.url;
            updatedItem.image_expires_at = signedUrl.expiresAt;
          }
        }
        
        // Convert video_url if present
        if (item.video_url) {
          const signedUrl = await convertToSignedUrl(item.video_url);
          if (signedUrl) {
            updatedItem.video_url = signedUrl.url;
            updatedItem.video_expires_at = signedUrl.expiresAt;
          }
        }
        
        // Convert url field if present (generic)
        if (item.url && !item.image_url && !item.video_url) {
          const signedUrl = await convertToSignedUrl(item.url);
          if (signedUrl) {
            updatedItem.url = signedUrl.url;
            updatedItem.url_expires_at = signedUrl.expiresAt;
          }
        }
        
        return updatedItem;
      })
    );

    return NextResponse.json({ gallery: galleryWithSignedUrls });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

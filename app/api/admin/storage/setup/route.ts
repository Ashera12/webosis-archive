import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List existing buckets
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const existingNames = new Set(existingBuckets?.map(b => b.name) || []);

    const bucketsToCreate = [
      { 
        name: 'backgrounds', 
        public: true, 
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      },
      { 
        name: 'gallery', 
        public: true, 
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      }
    ];

    const created = [];
    const skipped = [];
    const errors = [];

    for (const bucket of bucketsToCreate) {
      if (existingNames.has(bucket.name)) {
        skipped.push(bucket.name);
        continue;
      }

      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      });

      if (error) {
        console.error(`Failed to create bucket ${bucket.name}:`, error);
        errors.push({ bucket: bucket.name, error: error.message });
      } else {
        console.log(`Created bucket: ${bucket.name}`);
        created.push(bucket.name);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors,
      message: `Created ${created.length} buckets, skipped ${skipped.length} existing`
    });
  } catch (error: any) {
    console.error('[/api/admin/storage/setup] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Setup failed' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      buckets: buckets || [],
      count: buckets?.length || 0
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to list buckets' 
    }, { status: 500 });
  }
}

#!/usr/bin/env node

/**
 * Quick Setup Script untuk Supabase Storage Bucket
 * 
 * Script ini akan:
 * 1. Check apakah bucket 'gallery' sudah ada
 * 2. Buat bucket jika belum ada
 * 3. Setup policies untuk public read access
 * 
 * Usage: node setup-storage.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase Storage bucket...\n');

  try {
    // 1. Check if bucket exists
    console.log('1️⃣  Checking if bucket "gallery" exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const galleryBucket = buckets.find(b => b.id === 'gallery');

    if (galleryBucket) {
      console.log('   ✅ Bucket "gallery" already exists!');
    } else {
      // 2. Create bucket
      console.log('   📦 Creating bucket "gallery"...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('gallery', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log('   ✅ Bucket "gallery" created successfully!');
    }

    // 3. Test upload with a small test image (1x1 PNG)
    console.log('\n2️⃣  Testing bucket access...');
    // Tiny 1x1 transparent PNG (67 bytes)
    const testFile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const testPath = `test-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(testPath, testFile, {
        contentType: 'image/png',
      });

    if (uploadError) {
      throw new Error(`Upload test failed: ${uploadError.message}`);
    }

    console.log('   ✅ Upload test successful!');

    // 4. Get public URL
    const { data } = supabase.storage
      .from('gallery')
      .getPublicUrl(testPath);

    console.log('   ✅ Public URL generated:', data.publicUrl.substring(0, 60) + '...');

    // 5. Cleanup test file
    await supabase.storage.from('gallery').remove([testPath]);
    console.log('   ✅ Test file cleaned up');

    console.log('\n✨ SUCCESS! Storage bucket is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to admin gallery: http://localhost:3001/admin/gallery');
    console.log('   2. Click "Tambah Foto Baru"');
    console.log('   3. Click "📁 Upload File" tab');
    console.log('   4. Select an image and upload!');
    console.log('\n🎉 Your images will now be stored in Supabase Storage!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Manual setup instructions:');
    console.error('   1. Open Supabase Dashboard: https://app.supabase.com');
    console.error('   2. Go to Storage → New bucket');
    console.error('   3. Name: "gallery", Public: ON');
    console.error('   4. Create bucket');
    console.error('   5. Go to Policies → New Policy');
    console.error('   6. Select "Enable read access for all users"');
    console.error('   7. Save\n');
    process.exit(1);
  }
}

setupStorageBucket();

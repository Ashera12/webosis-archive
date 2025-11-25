/**
 * YouTube Thumbnail Downloader
 * Script untuk download thumbnails dari YouTube videos
 * 
 * Usage:
 * node scripts/downloadYoutubeThumbnails.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIG - UPDATE VIDEO IDs DI SINI
// ============================================
const YOUTUBE_VIDEOS = [
  {
    id: 'VIDEO_ID_1', // Ganti dengan video ID asli dari URL YouTube
    filename: 'video-1.jpg', // Nama file untuk disimpan
    title: 'Video Title 1', // Optional: untuk logging
  },
  {
    id: 'VIDEO_ID_2',
    filename: 'video-2.jpg',
    title: 'Video Title 2',
  },
  // Tambahkan video lainnya...
];

// ============================================
// CARA DAPAT VIDEO ID:
// ============================================
// Dari URL: https://youtube.com/watch?v=dQw4w9WgXcQ
// Video ID: dQw4w9WgXcQ (setelah v=)
//
// Atau dari URL: https://youtu.be/dQw4w9WgXcQ
// Video ID: dQw4w9WgXcQ (setelah youtu.be/)

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'social-media', 'youtube');

// Create directory if not exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadThumbnail(videoId, filename, title) {
  return new Promise((resolve, reject) => {
    // Try maxresdefault first (highest quality)
    const urls = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // Fallback
    ];

    let currentUrlIndex = 0;

    const tryDownload = () => {
      const url = urls[currentUrlIndex];
      const outputPath = path.join(OUTPUT_DIR, filename);

      console.log(`Downloading: ${title || videoId}`);
      console.log(`URL: ${url}`);

      const file = fs.createWriteStream(outputPath);

      https.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log(`✅ Saved: ${filename}\n`);
            resolve(outputPath);
          });
        } else if (response.statusCode === 404 && currentUrlIndex < urls.length - 1) {
          // Try fallback URL
          console.log(`⚠️  Maxres not available, trying HQ default...`);
          currentUrlIndex++;
          file.close();
          fs.unlinkSync(outputPath); // Delete empty file
          tryDownload();
        } else {
          file.close();
          fs.unlinkSync(outputPath);
          reject(new Error(`Failed to download: ${response.statusCode}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlinkSync(outputPath);
        reject(err);
      });
    };

    tryDownload();
  });
}

async function downloadAll() {
  console.log('===========================================');
  console.log('YouTube Thumbnail Downloader');
  console.log('===========================================\n');

  if (YOUTUBE_VIDEOS.length === 0 || YOUTUBE_VIDEOS[0].id === 'VIDEO_ID_1') {
    console.log('❌ ERROR: Please update VIDEO IDs in this script first!');
    console.log('');
    console.log('Instructions:');
    console.log('1. Open this file: scripts/downloadYoutubeThumbnails.js');
    console.log('2. Update YOUTUBE_VIDEOS array with real video IDs');
    console.log('3. Run again: node scripts/downloadYoutubeThumbnails.js');
    return;
  }

  for (const video of YOUTUBE_VIDEOS) {
    try {
      await downloadThumbnail(video.id, video.filename, video.title);
    } catch (error) {
      console.log(`❌ Error downloading ${video.filename}:`, error.message, '\n');
    }
  }

  console.log('===========================================');
  console.log('✅ Download Complete!');
  console.log('===========================================');
  console.log(`Files saved to: ${OUTPUT_DIR}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Check images in public/images/social-media/youtube/');
  console.log('2. Update lib/socialMediaData.ts with the filenames');
}

downloadAll();

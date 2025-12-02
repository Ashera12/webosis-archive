#!/usr/bin/env node

/**
 * CHECK VERCEL INTEGRATION & DEPLOYMENT
 * Verify if Vercel is receiving GitHub webhooks
 */

const https = require('https');

const PRODUCTION_URL = 'https://osissmktest.biezz.my.id';
const EXPECTED_STRINGS = [
  'SCAN BIOMETRIC ANDA',
  'Browser fingerprint is INFO ONLY',
];

console.log('================================================================================');
console.log('VERCEL INTEGRATION & DEPLOYMENT CHECK');
console.log('================================================================================\n');

// Check 1: Verify production site is accessible
console.log('📡 Step 1: Checking production site accessibility...');
https.get(`${PRODUCTION_URL}/attendance`, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`✅ Headers received: ${Object.keys(res.headers).length}`);
  
  // Check for Vercel headers
  if (res.headers['x-vercel-id']) {
    console.log(`✅ Vercel Deployment ID: ${res.headers['x-vercel-id']}`);
  } else {
    console.log('⚠️  No x-vercel-id header found (may not be Vercel)');
  }
  
  if (res.headers['x-vercel-cache']) {
    console.log(`ℹ️  Cache Status: ${res.headers['x-vercel-cache']}`);
  }
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`\n📦 Response size: ${(data.length / 1024).toFixed(2)} KB`);
    
    console.log('\n📝 Step 2: Checking for latest code...\n');
    
    let foundCount = 0;
    EXPECTED_STRINGS.forEach(str => {
      const found = data.includes(str);
      if (found) {
        console.log(`✅ FOUND: "${str.substring(0, 40)}..."`);
        foundCount++;
      } else {
        console.log(`❌ NOT FOUND: "${str.substring(0, 40)}..."`);
      }
    });
    
    console.log('\n================================================================================');
    console.log('RESULT');
    console.log('================================================================================\n');
    
    if (foundCount === EXPECTED_STRINGS.length) {
      console.log('✅ ALL LATEST CHANGES DEPLOYED!');
      console.log('   Vercel successfully deployed latest code from GitHub.');
      console.log('\n💡 Next: Hard refresh browser (Ctrl+Shift+R) and test!');
    } else {
      console.log(`❌ DEPLOYMENT INCOMPLETE (${foundCount}/${EXPECTED_STRINGS.length} found)`);
      console.log('\n🔍 Possible issues:');
      console.log('   1. Vercel build is still in progress (wait 3-5 min)');
      console.log('   2. GitHub webhook not triggered');
      console.log('   3. Vercel build failed (check dashboard)');
      console.log('   4. Branch mismatch (check Vercel is deploying correct branch)');
      console.log('\n📋 Troubleshooting steps:');
      console.log('   1. Go to: https://vercel.com/dashboard');
      console.log('   2. Select project: webosis-archive');
      console.log('   3. Check latest deployment status');
      console.log('   4. Verify branch: release/attendance-production-ready-v2');
      console.log('   5. Check build logs for errors');
      console.log('\n⚡ Manual fix:');
      console.log('   Run: vercel --prod --force');
      console.log('   (Requires Vercel CLI: npm install -g vercel)');
    }
    
    console.log('\n================================================================================\n');
  });
}).on('error', (err) => {
  console.error('❌ Error fetching production site:', err.message);
  process.exit(1);
});

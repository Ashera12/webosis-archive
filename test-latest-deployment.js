#!/usr/bin/env node

const https = require('https');

const url = 'https://webosis-archive-r1xk337iq-ashera12s-projects.vercel.app/attendance';

console.log('🔍 Testing LATEST Vercel Deployment Direct URL\n');
console.log(`URL: ${url}\n`);

https.get(url, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Vercel ID: ${res.headers['x-vercel-id'] || 'N/A'}\n`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const checks = [
      { name: 'SCAN BIOMETRIC ANDA', string: 'SCAN BIOMETRIC ANDA' },
      { name: 'Browser fingerprint INFO ONLY', string: 'Browser fingerprint is INFO ONLY' },
      { name: 'Silent mode (console.log)', string: 'console.log' },
      { name: 'OLD warning REMOVED', string: 'Browser Fingerprint Changed', shouldNotExist: true }
    ];
    
    console.log('Checking for latest code changes:\n');
    
    let passed = 0;
    checks.forEach(check => {
      const found = data.includes(check.string);
      const status = check.shouldNotExist 
        ? (!found ? '✅ REMOVED' : '❌ STILL EXISTS')
        : (found ? '✅ FOUND' : '❌ NOT FOUND');
      
      console.log(`${status} - ${check.name}`);
      
      if ((check.shouldNotExist && !found) || (!check.shouldNotExist && found)) {
        passed++;
      }
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Result: ${passed}/${checks.length} checks passed`);
    console.log('='.repeat(70));
    
    if (passed === checks.length) {
      console.log('\n✅ SUCCESS! Latest code IS deployed to this URL!');
      console.log('\n📋 NEXT STEP: Update custom domain alias');
      console.log('   Command: vercel alias set webosis-archive-r1xk337iq-ashera12s-projects.vercel.app osissmktest.biezz.my.id --scope ashera12s-projects');
    } else {
      console.log('\n❌ Latest code NOT in this deployment');
      console.log('   Need to check build logs or redeploy');
    }
    console.log('='.repeat(70) + '\n');
  });
}).on('error', (err) => {
  console.error(`❌ Error: ${err.message}`);
  if (err.message.includes('401')) {
    console.log('\n⚠️  This deployment may require authentication');
    console.log('   Try accessing via browser first, or check Vercel dashboard');
  }
});

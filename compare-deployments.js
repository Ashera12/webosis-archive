#!/usr/bin/env node

const https = require('https');

// Check both URLs
const urls = [
  {
    name: 'Custom Domain',
    url: 'https://osissmktest.biezz.my.id/attendance'
  },
  {
    name: 'Vercel Direct URL',
    url: 'https://webosis-archive-1d57j4kt9-ashera12s-projects.vercel.app/attendance'
  }
];

const checkStrings = [
  'SCAN BIOMETRIC ANDA',
  'Browser fingerprint is INFO ONLY'
];

async function checkURL(urlObj) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Checking: ${urlObj.name}`);
    console.log(`URL: ${urlObj.url}`);
    console.log('='.repeat(80));
    
    https.get(urlObj.url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Vercel ID: ${res.headers['x-vercel-id'] || 'N/A'}`);
      console.log(`Cache: ${res.headers['x-vercel-cache'] || 'N/A'}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Size: ${(data.length / 1024).toFixed(2)} KB\n`);
        
        let found = 0;
        checkStrings.forEach(str => {
          const exists = data.includes(str);
          console.log(`${exists ? '✅' : '❌'} "${str.substring(0, 35)}..."`);
          if (exists) found++;
        });
        
        console.log(`\nResult: ${found}/${checkStrings.length} found`);
        resolve({ name: urlObj.name, found, total: checkStrings.length });
      });
    }).on('error', (err) => {
      console.error(`❌ Error: ${err.message}`);
      resolve({ name: urlObj.name, found: 0, total: checkStrings.length });
    });
  });
}

(async () => {
  console.log('🔍 COMPARING DEPLOYMENT URLS\n');
  
  const results = [];
  for (const url of urls) {
    const result = await checkURL(url);
    results.push(result);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(r => {
    const status = r.found === r.total ? '✅ UP TO DATE' : '❌ OLD CODE';
    console.log(`${r.name}: ${r.found}/${r.total} - ${status}`);
  });
  
  const customDomain = results.find(r => r.name === 'Custom Domain');
  const directURL = results.find(r => r.name === 'Vercel Direct URL');
  
  if (directURL.found === directURL.total && customDomain.found === 0) {
    console.log('\n⚠️  ISSUE: Custom domain pointing to OLD deployment!');
    console.log('✅ FIX: Go to Vercel Dashboard → Domains → Update');
  } else if (directURL.found === 0 && customDomain.found === 0) {
    console.log('\n⚠️  ISSUE: Both URLs have old code - build may have failed');
    console.log('📋 CHECK: Vercel dashboard build logs');
  } else if (customDomain.found === customDomain.total) {
    console.log('\n✅ SUCCESS: Custom domain has latest code!');
  }
  
  console.log('='.repeat(80) + '\n');
})();

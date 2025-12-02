/**
 * Verify Latest Changes Deployed to Vercel
 * 
 * This checks if the latest code changes are actually running on production
 */

const https = require('https');

const BASE_URL = 'https://osissmktest.biezz.my.id';

// Expected strings in deployed code
const EXPECTED_CHANGES = [
  {
    description: 'Silent fingerprint mode (no toast warnings)',
    searchString: 'Browser fingerprint is INFO ONLY',
    shouldExist: true,
  },
  {
    description: 'WebAuthn SCAN BIOMETRIC message',
    searchString: 'SCAN BIOMETRIC ANDA',
    shouldExist: true,
  },
  {
    description: 'Multi-device support message',
    searchString: 'Total {webauthnResult.totalDevices} device terdaftar',
    shouldExist: true,
  },
  {
    description: 'OLD fingerprint warning (should be removed)',
    searchString: 'Browser Fingerprint Changed',
    shouldExist: false,
  },
  {
    description: 'OLD fingerprint success (should be removed)',
    searchString: 'Device Dikenali',
    shouldExist: false,
  },
];

async function fetchPageSource(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifyDeployment() {
  console.log('='.repeat(80));
  console.log('VERIFY LATEST CHANGES DEPLOYED TO VERCEL');
  console.log('='.repeat(80));
  console.log(`\nFetching source from: ${BASE_URL}/attendance`);
  
  try {
    const html = await fetchPageSource(`${BASE_URL}/attendance`);
    
    console.log(`\nPage size: ${(html.length / 1024).toFixed(2)} KB`);
    console.log(`\nChecking for expected changes...\n`);
    
    const results = [];
    
    for (const check of EXPECTED_CHANGES) {
      const found = html.includes(check.searchString);
      const passed = found === check.shouldExist;
      
      results.push({ check, found, passed });
      
      const status = passed ? '✅' : '❌';
      const expectedText = check.shouldExist ? 'should exist' : 'should NOT exist';
      const actualText = found ? 'FOUND' : 'NOT FOUND';
      
      console.log(`${status} ${check.description}`);
      console.log(`   Expected: ${expectedText}`);
      console.log(`   Actual: ${actualText}`);
      
      if (!passed) {
        console.log(`   ⚠️ String: "${check.searchString.substring(0, 50)}..."`);
      }
      
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    
    console.log(`\n✅ Passed: ${passedCount}/${EXPECTED_CHANGES.length}`);
    console.log(`❌ Failed: ${failedCount}/${EXPECTED_CHANGES.length}`);
    
    if (failedCount > 0) {
      console.log('\n❌ DEPLOYMENT VERIFICATION FAILED');
      console.log('Latest changes may not be deployed yet.');
      console.log('\nPossible reasons:');
      console.log('1. Vercel build is still in progress');
      console.log('2. Browser cache - try hard refresh (Ctrl+Shift+R)');
      console.log('3. Vercel deployment failed');
      console.log('\nCheck Vercel dashboard: https://vercel.com/dashboard');
    } else {
      console.log('\n✅ ALL LATEST CHANGES DEPLOYED SUCCESSFULLY!');
      console.log('Production is running the latest code.');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error fetching page:', error.message);
    process.exit(1);
  }
}

verifyDeployment();

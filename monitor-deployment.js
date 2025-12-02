#!/usr/bin/env node

/**
 * Real-Time Deployment Monitor
 * Checks deployment status every 30 seconds
 */

const https = require('https');

const BASE_URL = 'https://osissmktest.biezz.my.id';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_CHECKS = 10; // Stop after 5 minutes

let checkCount = 0;

async function fetchPageSource(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkDeployment() {
  checkCount++;
  
  const timestamp = new Date().toLocaleTimeString('id-ID');
  console.log(`\n[${ timestamp}] Check #${checkCount}/${MAX_CHECKS}`);
  console.log('='.repeat(60));
  
  try {
    const html = await fetchPageSource(`${BASE_URL}/attendance`);
    
    const checks = {
      'Silent fingerprint mode': html.includes('Browser fingerprint is INFO ONLY'),
      'SCAN BIOMETRIC message': html.includes('SCAN BIOMETRIC ANDA'),
      'Multi-device support': html.includes('Total {webauthnResult.totalDevices} device'),
      'OLD warning removed': !html.includes('Browser Fingerprint Changed'),
      'OLD success removed': !html.includes('Device Dikenali'),
    };
    
    let allPassed = true;
    
    for (const [name, passed] of Object.entries(checks)) {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${name}`);
      if (!passed) allPassed = false;
    }
    
    if (allPassed) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('✅ Latest changes successfully deployed to production!');
      console.log('\nYou can now:');
      console.log('1. Hard refresh browser (Ctrl+Shift+R)');
      console.log('2. Test /attendance page');
      console.log('3. Verify no fingerprint warnings appear');
      console.log('='.repeat(60));
      process.exit(0);
    } else {
      console.log(`\n⏳ Deployment still in progress...`);
      
      if (checkCount >= MAX_CHECKS) {
        console.log('\n' + '='.repeat(60));
        console.log('⚠️ Reached maximum check limit');
        console.log('Deployment may take longer than expected.');
        console.log('\nManual check:');
        console.log(`Visit: ${BASE_URL}/attendance`);
        console.log('Hard refresh: Ctrl+Shift+R');
        console.log('='.repeat(60));
        process.exit(1);
      } else {
        console.log(`Next check in 30 seconds...`);
        setTimeout(checkDeployment, CHECK_INTERVAL);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    if (checkCount >= MAX_CHECKS) {
      process.exit(1);
    } else {
      console.log(`Retrying in 30 seconds...`);
      setTimeout(checkDeployment, CHECK_INTERVAL);
    }
  }
}

console.log('🔍 REAL-TIME DEPLOYMENT MONITOR');
console.log('='.repeat(60));
console.log(`Target: ${BASE_URL}/attendance`);
console.log(`Interval: 30 seconds`);
console.log(`Max duration: 5 minutes`);
console.log('='.repeat(60));

checkDeployment();

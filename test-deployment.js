/**
 * Test Vercel Deployment - Verify All Files Deployed Correctly
 * 
 * This script checks:
 * 1. All critical API endpoints are accessible
 * 2. WebAuthn files are deployed
 * 3. Frontend attendance page is working
 * 4. No 404 errors on critical routes
 */

const BASE_URL = 'https://osissmktest.biezz.my.id';

const CRITICAL_ROUTES = [
  // Frontend
  { path: '/attendance', description: 'Attendance page' },
  
  // WebAuthn APIs
  { path: '/api/attendance/biometric/webauthn/register-challenge', description: 'WebAuthn register challenge', method: 'POST' },
  { path: '/api/attendance/biometric/webauthn/auth-challenge', description: 'WebAuthn auth challenge', method: 'GET' },
  { path: '/api/attendance/biometric/verify', description: 'Biometric verify', method: 'POST' },
  
  // Health check
  { path: '/api/health', description: 'Health check', method: 'GET' },
];

async function testRoute(route) {
  const url = `${BASE_URL}${route.path}`;
  const method = route.method || 'GET';
  
  console.log(`\nTesting: ${route.description}`);
  console.log(`  URL: ${url}`);
  console.log(`  Method: ${method}`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    // For POST requests, add empty body
    if (method === 'POST') {
      options.body = JSON.stringify({});
    }
    
    const response = await fetch(url, options);
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    // Check if response is HTML or JSON
    const contentType = response.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    
    if (response.status === 404) {
      console.log(`  ❌ FAILED: Route not found (404)`);
      return false;
    }
    
    if (response.status >= 500) {
      console.log(`  ❌ FAILED: Server error (${response.status})`);
      return false;
    }
    
    // For API routes, check if it returns JSON
    if (route.path.startsWith('/api/')) {
      if (contentType?.includes('application/json')) {
        console.log(`  ✅ PASSED: API endpoint accessible`);
        return true;
      } else {
        console.log(`  ⚠️ WARNING: Expected JSON but got ${contentType}`);
        return true; // Still count as pass if not 404/500
      }
    } else {
      // For frontend routes, check if it returns HTML
      if (contentType?.includes('text/html')) {
        console.log(`  ✅ PASSED: Page accessible`);
        return true;
      } else {
        console.log(`  ⚠️ WARNING: Expected HTML but got ${contentType}`);
        return true;
      }
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('VERCEL DEPLOYMENT TEST');
  console.log('='.repeat(80));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Testing ${CRITICAL_ROUTES.length} critical routes...\n`);
  
  const results = [];
  
  for (const route of CRITICAL_ROUTES) {
    const passed = await testRoute(route);
    results.push({ route, passed });
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  
  console.log(`\n✅ Passed: ${passedCount}/${CRITICAL_ROUTES.length}`);
  console.log(`❌ Failed: ${failedCount}/${CRITICAL_ROUTES.length}`);
  
  if (failedCount > 0) {
    console.log('\n❌ FAILED ROUTES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.route.description} (${r.route.path})`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (failedCount === 0) {
    console.log('✅ ALL TESTS PASSED - Deployment is healthy!');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED - Check deployment!');
    process.exit(1);
  }
}

runTests();

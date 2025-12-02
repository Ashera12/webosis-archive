console.log('🔍 Checking if latest fix (6a26a36) is deployed...');

// Test: The new code should have debug logs
// Old code: Check fails at line "if (!schoolLat || !schoolLon)"
// New code: Check should be "if (schoolLat == null || schoolLon == null)"

console.log('');
console.log('📋 Expected logs if NEW CODE deployed:');
console.log('   [Attendance] 🔍 GPS Debug: {schoolLat: -6.864733, ...}');
console.log('   [Attendance] GPS calculation with distance...');
console.log('');
console.log('❌ Current logs show OLD CODE:');
console.log('   [Attendance] School GPS not configured! ← OLD CHECK!');
console.log('');
console.log('🔧 Solution: Manual redeploy from Vercel dashboard');
console.log('   1. https://vercel.com');
console.log('   2. Project: webosis-archive');
console.log('   3. Deployments tab');
console.log('   4. Find latest deployment');
console.log('   5. Click "..." → "Redeploy"');
console.log('   6. UNCHECK "Use existing Build Cache"');
console.log('   7. Deploy');
console.log('');
console.log('⏱️ Commit 6a26a36 pushed at ~7:05 AM');
console.log('   Vercel should auto-deploy within 2-3 min');
console.log('   If not deployed by 7:10 AM → Auto-deploy BROKEN');

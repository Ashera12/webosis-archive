#!/usr/bin/env node

/**
 * Pre-Dev Check Script
 * Validates all critical files and configurations before npm run dev
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Dev Checks...\n');

let hasErrors = false;

// Check 1: Environment Variables
console.log('1️⃣  Checking environment variables...');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env.local not found!');
  console.log('   → Copy .env.example to .env.local and fill in values\n');
  hasErrors = true;
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    console.log('   ⚠️  Missing environment variables:');
    missingVars.forEach(v => console.log(`      - ${v}`));
    console.log('');
    hasErrors = true;
  } else {
    console.log('   ✅ All required environment variables found\n');
  }
}

// Check 2: Critical Files
console.log('2️⃣  Checking critical files...');
const criticalFiles = [
  'middleware.ts',
  'lib/auth.ts',
  'lib/supabase/server.ts',
  'contexts/ThemeContext.tsx',
  'contexts/LanguageContext.tsx',
  'components/Providers.tsx',
  'components/ThemeToggle.tsx',
  'components/LanguageToggle.tsx',
  'app/layout.tsx',
  'app/admin/layout.tsx',
];

const missingFiles = criticalFiles.filter(file => {
  const filePath = path.join(__dirname, '..', file);
  return !fs.existsSync(filePath);
});

if (missingFiles.length > 0) {
  console.log('   ❌ Missing critical files:');
  missingFiles.forEach(f => console.log(`      - ${f}`));
  console.log('');
  hasErrors = true;
} else {
  console.log('   ✅ All critical files exist\n');
}

// Check 3: Middleware Configuration
console.log('3️⃣  Checking middleware configuration...');
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
  
  // Check for problematic regex patterns
  if (middlewareContent.includes('(?!')) {
    console.log('   ❌ Invalid regex pattern detected in middleware!');
    console.log('   → Negative lookahead (?!) not supported in Next.js matcher\n');
    hasErrors = true;
  } else {
    console.log('   ✅ Middleware configuration valid\n');
  }
}

// Check 4: Auth Configuration
console.log('4️⃣  Checking auth configuration...');
const authPath = path.join(__dirname, '..', 'lib', 'auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf-8');
  
  if (!authContent.includes('authorized')) {
    console.log('   ⚠️  Auth callback "authorized" not found');
    console.log('   → Login page might be protected\n');
  } else {
    console.log('   ✅ Auth configuration includes authorized callback\n');
  }
}

// Check 5: Theme & Language Contexts
console.log('5️⃣  Checking Theme & Language contexts...');
const themeContextPath = path.join(__dirname, '..', 'contexts', 'ThemeContext.tsx');
const langContextPath = path.join(__dirname, '..', 'contexts', 'LanguageContext.tsx');

if (fs.existsSync(themeContextPath) && fs.existsSync(langContextPath)) {
  const themeContent = fs.readFileSync(themeContextPath, 'utf-8');
  const langContent = fs.readFileSync(langContextPath, 'utf-8');
  
  const themeHasLocalStorage = themeContent.includes('localStorage');
  const langHasLocalStorage = langContent.includes('localStorage');
  
  if (!themeHasLocalStorage || !langHasLocalStorage) {
    console.log('   ⚠️  Missing localStorage persistence');
    hasErrors = true;
  } else {
    console.log('   ✅ Theme & Language contexts configured with localStorage\n');
  }
}

// Check 6: Database Schema Files
console.log('6️⃣  Checking database schema files...');
const schemaFiles = [
  'supabase-schema.sql',
  'supabase-cms-schema.sql',
  'supabase-data-management.sql',
  'supabase-super-admin-seed.sql',
];

const existingSchemas = schemaFiles.filter(file => {
  return fs.existsSync(path.join(__dirname, '..', file));
});

console.log(`   📄 Found ${existingSchemas.length}/${schemaFiles.length} schema files:`);
existingSchemas.forEach(f => console.log(`      ✓ ${f}`));

if (existingSchemas.length < schemaFiles.length) {
  const missing = schemaFiles.filter(f => !existingSchemas.includes(f));
  console.log('   ⚠️  Missing schema files:');
  missing.forEach(f => console.log(`      - ${f}`));
}
console.log('');

// Check 7: Admin Pages
console.log('7️⃣  Checking admin pages...');
const adminPages = [
  'app/admin/page.tsx',
  'app/admin/login/page.tsx',
  'app/admin/content/page.tsx',
  'app/admin/posts/page.tsx',
  'app/admin/posts/new/page.tsx',
  'app/admin/data/sekbid/page.tsx',
  'app/admin/data/members/page.tsx',
  'app/admin/users/page.tsx',
];

const existingAdminPages = adminPages.filter(file => {
  return fs.existsSync(path.join(__dirname, '..', file));
});

console.log(`   📄 Found ${existingAdminPages.length}/${adminPages.length} admin pages\n`);

// Summary
console.log('═'.repeat(50));
if (hasErrors) {
  console.log('❌ Pre-dev checks FAILED!');
  console.log('   Please fix the errors above before running npm run dev\n');
  process.exit(1);
} else {
  console.log('✅ All pre-dev checks PASSED!');
  console.log('   Ready to run: npm run dev\n');
  
  console.log('📝 Quick Start:');
  console.log('   1. Make sure Supabase SQL migrations are run');
  console.log('   2. npm run dev');
  console.log('   3. Visit http://localhost:3001');
  console.log('   4. Login: admin@osis.sch.id / SuperAdmin123!\n');
  
  console.log('📚 Documentation:');
  console.log('   - ADMIN_CREDENTIALS.md - Login info');
  console.log('   - DATA_MANAGEMENT_GUIDE.md - Data management docs');
  console.log('   - REGISTRATION_GUIDE.md - User registration\n');
}

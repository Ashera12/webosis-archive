# ========================================
# DEPLOYMENT VERIFICATION SCRIPT
# ========================================
# Verifies all enrollment system files deployed correctly

param(
    [string]$ProductionUrl = "https://webosis-archive-62e7potv5-ashera12s-projects.vercel.app"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allPassed = $true

# ========================================
# TEST 1: Check Production URL
# ========================================
Write-Host "📡 Test 1: Production URL Accessible" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ProductionUrl -Method HEAD -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401 -or $response.StatusCode -eq 307) {
        Write-Host "  ✅ PASS - Production site is live (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  WARNING - Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ FAIL - Cannot reach production URL" -ForegroundColor Red
    $allPassed = $false
}

# ========================================
# TEST 2: Check Enrollment API Endpoints
# ========================================
Write-Host "`n📂 Test 2: Enrollment API Endpoints" -ForegroundColor Yellow
$endpoints = @(
    "/api/enroll/status",
    "/api/enroll/upload-photo",
    "/api/enroll/verify-photo",
    "/api/enroll/passkey-challenge",
    "/api/enroll/passkey-register"
)

foreach ($endpoint in $endpoints) {
    try {
        $url = "$ProductionUrl$endpoint"
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
        # 401 = Endpoint exists, needs auth (GOOD)
        # 405 = Method not allowed but endpoint exists (GOOD)
        if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 405) {
            Write-Host "  ✅ $endpoint - Deployed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $endpoint - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        # Check if error is 401 or 405 (still valid)
        if ($_.Exception.Response.StatusCode.value__ -eq 401 -or $_.Exception.Response.StatusCode.value__ -eq 405) {
            Write-Host "  ✅ $endpoint - Deployed" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $endpoint - NOT FOUND (404)" -ForegroundColor Red
            $allPassed = $false
        }
    }
}

# ========================================
# TEST 3: Check Local Files Exist
# ========================================
Write-Host "`n📁 Test 3: Local Enrollment Files" -ForegroundColor Yellow
$requiredFiles = @(
    "app\enroll\page.tsx",
    "app\api\enroll\status\route.ts",
    "app\api\enroll\upload-photo\route.ts",
    "app\api\enroll\verify-photo\route.ts",
    "app\api\enroll\passkey-challenge\route.ts",
    "app\api\enroll\passkey-register\route.ts",
    "SETUP_ENROLLMENT_SYSTEM.sql"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  ✅ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - MISSING" -ForegroundColor Red
        $allPassed = $false
    }
}

# ========================================
# TEST 4: Check Dependencies
# ========================================
Write-Host "`n📦 Test 4: WebAuthn Dependencies" -ForegroundColor Yellow
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $deps = $packageJson.dependencies
    
    if ($deps.'@simplewebauthn/server') {
        Write-Host "  ✅ @simplewebauthn/server - $($deps.'@simplewebauthn/server')" -ForegroundColor Green
    } else {
        Write-Host "  ❌ @simplewebauthn/server - NOT INSTALLED" -ForegroundColor Red
        $allPassed = $false
    }
    
    if ($deps.'@simplewebauthn/types') {
        Write-Host "  ✅ @simplewebauthn/types - $($deps.'@simplewebauthn/types')" -ForegroundColor Green
    } else {
        Write-Host "  ❌ @simplewebauthn/types - NOT INSTALLED" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ❌ Cannot read package.json" -ForegroundColor Red
    $allPassed = $false
}

# ========================================
# TEST 5: Check Git Status
# ========================================
Write-Host "`n🔄 Test 5: Git Repository Status" -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "  ⚠️  WARNING - Uncommitted changes detected:" -ForegroundColor Yellow
        git status --short
    } else {
        Write-Host "  ✅ Working tree clean - All changes committed" -ForegroundColor Green
    }
    
    # Check if main is up to date with origin
    $localCommit = git rev-parse main
    $remoteCommit = git rev-parse origin/main
    
    if ($localCommit -eq $remoteCommit) {
        Write-Host "  ✅ Local main in sync with origin/main" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  WARNING - Local main differs from origin/main" -ForegroundColor Yellow
        Write-Host "    Run: git push" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Git error: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# TEST 6: Check SQL Migration File
# ========================================
Write-Host "`n🗄️  Test 6: SQL Migration Validation" -ForegroundColor Yellow
if (Test-Path "SETUP_ENROLLMENT_SYSTEM.sql") {
    $sqlContent = Get-Content "SETUP_ENROLLMENT_SYSTEM.sql" -Raw
    
    # Check for critical tables
    $tables = @("biometric_data", "webauthn_credentials", "webauthn_challenges")
    foreach ($table in $tables) {
        if ($sqlContent -match "CREATE TABLE.*$table") {
            Write-Host "  ✅ Table definition found: $table" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Missing table: $table" -ForegroundColor Red
            $allPassed = $false
        }
    }
    
    # Check for RLS policies
    if ($sqlContent -match "ENABLE ROW LEVEL SECURITY") {
        Write-Host "  ✅ RLS policies defined" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  WARNING - No RLS policies found" -ForegroundColor Yellow
    }
    
    # Check for enrollment_dashboard view
    if ($sqlContent -match "CREATE.*VIEW.*enrollment_dashboard") {
        Write-Host "  ✅ enrollment_dashboard view defined" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing enrollment_dashboard view" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  ❌ SETUP_ENROLLMENT_SYSTEM.sql NOT FOUND" -ForegroundColor Red
    $allPassed = $false
}

# ========================================
# FINAL RESULT
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "🚀 Deployment is READY" -ForegroundColor Green
    Write-Host "`n⚠️  NEXT STEP:" -ForegroundColor Yellow
    Write-Host "  Run SQL migration in Supabase:" -ForegroundColor White
    Write-Host "  1. Open https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "  2. Go to SQL Editor" -ForegroundColor White
    Write-Host "  3. Copy & paste SETUP_ENROLLMENT_SYSTEM.sql" -ForegroundColor White
    Write-Host "  4. Click RUN`n" -ForegroundColor White
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "⚠️  Please fix the issues above before proceeding`n" -ForegroundColor Yellow
}

# ========================================
# QUICK LINKS
# ========================================
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "  - DEPLOYMENT_SUCCESS_NEXT_STEPS.md" -ForegroundColor White
Write-Host "  - ENROLLMENT_SYSTEM_PREMIUM.md" -ForegroundColor White
Write-Host "  - ENROLLMENT_SQL_MIGRATION_GUIDE.md`n" -ForegroundColor White

Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "  Production: $ProductionUrl" -ForegroundColor White
Write-Host "  Supabase: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  Vercel: https://vercel.com/dashboard`n" -ForegroundColor White

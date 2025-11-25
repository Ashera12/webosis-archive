# Restore NEXTAUTH_URL to localhost
# Usage: .\restore-localhost.ps1

Write-Host "🔄 Restoring NEXTAUTH_URL to localhost..." -ForegroundColor Cyan

$envFile = ".env.local"
$backupFile = ".env.local.backup"

# Check if backup exists
if (Test-Path $backupFile) {
    Write-Host "💾 Found backup file, restoring..." -ForegroundColor Green
    Copy-Item $backupFile $envFile -Force
    Write-Host "✅ Restored from backup" -ForegroundColor Green
} else {
    Write-Host "⚠️  No backup found, updating manually..." -ForegroundColor Yellow
    
    if (-not (Test-Path $envFile)) {
        Write-Host "❌ .env.local not found!" -ForegroundColor Red
        exit 1
    }
    
    # Read and update
    $content = Get-Content $envFile -Raw
    
    if ($content -match 'NEXTAUTH_URL=') {
        $content = $content -replace 'NEXTAUTH_URL=.*', "NEXTAUTH_URL=http://localhost:3000"
        Set-Content $envFile $content -NoNewline
        Write-Host "✅ Updated NEXTAUTH_URL to localhost" -ForegroundColor Green
    } else {
        Write-Host "⚠️  NEXTAUTH_URL not found in .env.local" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✨ NEXTAUTH_URL restored to:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⚠️  Don't forget to restart Next.js server!" -ForegroundColor Yellow
Write-Host "   Ctrl+C in Next.js terminal, then: npm run dev" -ForegroundColor White
Write-Host ""
